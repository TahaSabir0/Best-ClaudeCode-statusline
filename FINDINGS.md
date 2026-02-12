# Claude Code `/usage` Reverse Engineering Findings

> **Date:** 2026-02-03
> **Claude Code version analyzed:** 2.1.29 (npm package `@anthropic-ai/claude-code`)
> **Platform:** Windows 11, Pro plan, OAuth authentication

---

## 1. Executive Summary

The `/usage` command in Claude Code does **not** call a dedicated usage API endpoint. It sends a minimal 1-token API request to the standard messages endpoint and reads rate limit data from **HTTP response headers** returned by Anthropic's servers. The OAuth access token used by Pro plan users is **server-side restricted** to only work from within the Claude Code binary -- direct `curl` requests with the same token are rejected. The rate limit utilization data is cached in memory only and is **not** included in the statusline JSON schema, nor written to disk anywhere.

---

## 2. How `/usage` Actually Works

### The "Quota Ping" Function

From the deobfuscated source (`cli.js` line ~1602), the function that powers `/usage`:

```js
// Deobfuscated from cli.js
async function checkQuota() {
  let model = getCurrentModel();
  let client = await getClient({ maxRetries: 0, model });
  let messages = [{ role: "user", content: "quota" }];
  let betas = getBetas(model); // includes "claude-code-20250219", "oauth-2025-04-20"

  return client.beta.messages.create({
    model,
    max_tokens: 1,
    messages,
    metadata: { user_id: `user_${sessionHash}_account_${accountUuid}_session_${sessionId}` },
    ...(betas.length > 0 ? { betas } : {})
  }).asResponse(); // returns raw HTTP response object to read headers
}
```

Key observations:
- Sends a real API request (costs tokens, though minimal)
- Message content is literally the string `"quota"` with `max_tokens: 1`
- Returns the raw response (not parsed message) specifically to access headers
- Called by `Y34()` which then passes `response.headers` to `z0A()` for parsing

### Response Header Parsing

The function `z34()` extracts rate limit state from headers:

```js
// Deobfuscated from cli.js
function parseRateLimitHeaders(headers) {
  let status = headers.get("anthropic-ratelimit-unified-status") || "allowed";
  let reset = headers.get("anthropic-ratelimit-unified-reset");
  let resetsAt = reset ? Number(reset) : undefined;
  let fallbackAvailable = headers.get("anthropic-ratelimit-unified-fallback") === "available";
  let representativeClaim = headers.get("anthropic-ratelimit-unified-representative-claim");

  // Overage fields
  let overageStatus = headers.get("anthropic-ratelimit-unified-overage-status");
  let overageReset = headers.get("anthropic-ratelimit-unified-overage-reset");
  let overageResetsAt = overageReset ? Number(overageReset) : undefined;
  let overageDisabledReason = headers.get("anthropic-ratelimit-unified-overage-disabled-reason");

  let isUsingOverage = status === "rejected" && (overageStatus === "allowed" || overageStatus === "allowed_warning");

  // Check per-window utilization thresholds
  let warningState = checkWarningThresholds(headers, fallbackAvailable);
  if (warningState) return warningState;

  return {
    status,
    resetsAt,
    unifiedRateLimitFallbackAvailable: fallbackAvailable,
    ...(representativeClaim && { rateLimitType: representativeClaim }),
    ...(overageStatus && { overageStatus }),
    ...(overageResetsAt && { overageResetsAt }),
    ...(overageDisabledReason && { overageDisabledReason }),
    isUsingOverage,
  };
}
```

### Per-Window Utilization Headers

The code reads per-window utilization via dynamic header names:

```js
// Template: anthropic-ratelimit-unified-{abbrev}-utilization
// Template: anthropic-ratelimit-unified-{abbrev}-reset
// Template: anthropic-ratelimit-unified-{abbrev}-surpassed-threshold

// Known abbreviations:
// "5h" -> five_hour window
// "7d" -> seven_day window
// "overage" -> overage tracking
```

The function `MF9()` reads per-window data:

```js
function checkWindowUtilization(headers, windowConfig, fallbackAvailable) {
  let { rateLimitType, claimAbbrev, windowSeconds, thresholds } = windowConfig;
  let utilization = headers.get(`anthropic-ratelimit-unified-${claimAbbrev}-utilization`);
  let reset = headers.get(`anthropic-ratelimit-unified-${claimAbbrev}-reset`);

  if (utilization === null || reset === null) return null;

  let util = Number(utilization);   // 0.0 to 1.0
  let resetEpoch = Number(reset);   // Unix epoch seconds
  let timePct = calcTimeElapsedPct(resetEpoch, windowSeconds);

  // Only warn if utilization exceeds threshold for current time position
  if (!thresholds.some(t => util >= t.utilization && timePct <= t.timePct)) return null;

  return {
    status: "allowed_warning",
    resetsAt: resetEpoch,
    rateLimitType,
    utilization: util,
    unifiedRateLimitFallbackAvailable: fallbackAvailable,
    isUsingOverage: false,
  };
}
```

---

## 3. Complete Header Reference

### Headers present on every API response

| Header | Type | Description |
|--------|------|-------------|
| `anthropic-ratelimit-unified-status` | string | `"allowed"`, `"allowed_warning"`, or `"rejected"` |
| `anthropic-ratelimit-unified-reset` | number | Unix epoch seconds -- when the current limit resets |
| `anthropic-ratelimit-unified-fallback` | string | `"available"` if fallback model is available when limited |
| `anthropic-ratelimit-unified-representative-claim` | string | Which limit type is most relevant: `"five_hour"`, `"seven_day"`, `"seven_day_opus"`, `"seven_day_sonnet"` |

### Per-window utilization headers (templated)

| Header pattern | Type | Description |
|---------------|------|-------------|
| `anthropic-ratelimit-unified-{abbrev}-utilization` | float | 0.0 - 1.0, percentage of window used |
| `anthropic-ratelimit-unified-{abbrev}-reset` | number | Unix epoch seconds for this window's reset |
| `anthropic-ratelimit-unified-{abbrev}-surpassed-threshold` | number | Threshold that was crossed (triggers warning) |

Where `{abbrev}` is one of: `5h`, `7d`

### Overage headers

| Header | Type | Description |
|--------|------|-------------|
| `anthropic-ratelimit-unified-overage-status` | string | `"allowed"`, `"allowed_warning"`, `"rejected"` |
| `anthropic-ratelimit-unified-overage-reset` | number | Unix epoch seconds |
| `anthropic-ratelimit-unified-overage-disabled-reason` | string | e.g., `"out_of_credits"` |

---

## 4. Warning Threshold Configuration

Hardcoded in the source:

```js
const windowConfigs = [
  {
    rateLimitType: "five_hour",
    claimAbbrev: "5h",
    windowSeconds: 18000,  // 5 hours = 18,000 seconds
    thresholds: [
      { utilization: 0.9, timePct: 0.72 }  // Warn at 90% used if <72% of time elapsed
    ]
  },
  {
    rateLimitType: "seven_day",
    claimAbbrev: "7d",
    windowSeconds: 604800,  // 7 days
    thresholds: [
      { utilization: 0.75, timePct: 0.6 },   // 75% used, <60% time elapsed
      { utilization: 0.5, timePct: 0.35 },    // 50% used, <35% time elapsed
      { utilization: 0.25, timePct: 0.15 }    // 25% used, <15% time elapsed
    ]
  }
];

const abbreviationMap = {
  "5h": "five_hour",
  "7d": "seven_day",
  "overage": "overage"
};
```

---

## 5. Display Logic

### Rate limit messages shown to users

From the `OF9()` function:

```
"You've used {X}% of your {limit_type} · resets {time} · {action}"
```

Where:
- `{X}` = `Math.floor(utilization * 100)`
- `{limit_type}` = `"session limit"` (5h), `"weekly limit"` (7d), `"Opus limit"`, `"Sonnet limit"`
- `{time}` = relative time like `"in 2 hours"` (from `KO1()`)
- `{action}` = upgrade/extra usage suggestion

### Rate limit types and labels

| `rateLimitType` value | User-facing label (Pro) | User-facing label (Team/Enterprise) |
|----------------------|------------------------|-----------------------------------|
| `five_hour` | "session limit" | "session limit" |
| `seven_day` | "weekly limit" | "weekly limit" |
| `seven_day_opus` | "Opus limit" | "Opus limit" |
| `seven_day_sonnet` | "weekly limit" (Pro/Enterprise) / "Sonnet limit" (others) | "weekly limit" |
| `overage` | "extra usage" | "extra usage" |

---

## 6. Authentication Details

### OAuth flow for Pro plan users

Credentials stored at: `~/.claude/.credentials.json`

```json
{
  "claudeAiOauth": {
    "accessToken": "sk-ant-oat01-...",
    "refreshToken": "sk-ant-ort01-...",
    "expiresAt": 1770110901313,
    "scopes": ["user:inference", "user:mcp_servers", "user:profile", "user:sessions:claude_code"],
    "subscriptionType": "pro",
    "rateLimitTier": "default_claude_ai"
  },
  "organizationUuid": "..."
}
```

### Required headers for API calls (from source)

| Header | Value |
|--------|-------|
| `Authorization` | `Bearer {accessToken}` |
| `anthropic-beta` | `claude-code-20250219,oauth-2025-04-20` |
| `anthropic-version` | `2023-06-01` |
| `x-app` | `cli` |
| `User-Agent` | `claude-cli/2.1.29 (external, cli)` |

### Beta flags by context

| Flag | When added |
|------|-----------|
| `claude-code-20250219` | Always (except Haiku) |
| `oauth-2025-04-20` | When authenticated via OAuth (Pro/Max plan users) |
| `interleaved-thinking-2025-01-24` | When interleaved thinking is not disabled |
| `context-1m-2025-08-07` | For models supporting >200k context |

### Server-side restriction

Even with all correct headers, the server returns:

```json
{
  "type": "error",
  "error": {
    "type": "invalid_request_error",
    "message": "This credential is only authorized for use with Claude Code and cannot be used for other API requests."
  }
}
```

This was tested with:
- Correct `Authorization: Bearer` header
- Correct `anthropic-beta: claude-code-20250219,oauth-2025-04-20`
- Correct `User-Agent: claude-cli/2.1.29 (external, cli)`
- Correct `x-app: cli`

The server enforces that OAuth tokens with `user:inference` + `user:sessions:claude_code` scopes can only be used from within the actual Claude Code process. The validation mechanism is unknown (possibly binary signing, session-level tokens established at startup, or TLS fingerprinting).

---

## 7. Statusline JSON Schema (What IS Available)

The `vqz()` function builds the statusline payload. This is what gets piped to the statusline command via stdin:

```json
{
  "session_id": "uuid",
  "transcript_path": "path/to/session.jsonl",
  "cwd": "C:\\Users\\tahas",
  "model": {
    "id": "claude-opus-4-5-20251101",
    "display_name": "Opus 4.5"
  },
  "workspace": {
    "current_dir": "C:\\Users\\tahas",
    "project_dir": "C:\\Users\\tahas"
  },
  "version": "2.1.29",
  "output_style": { "name": "default" },
  "cost": {
    "total_cost_usd": 0.94,
    "total_duration_ms": 1186072,
    "total_api_duration_ms": 273140,
    "total_lines_added": 12,
    "total_lines_removed": 4
  },
  "context_window": {
    "total_input_tokens": 10222,
    "total_output_tokens": 10470,
    "context_window_size": 200000,
    "current_usage": {
      "input_tokens": 10,
      "output_tokens": 3,
      "cache_creation_input_tokens": 5,
      "cache_read_input_tokens": 42262
    },
    "used_percentage": 21,
    "remaining_percentage": 79
  },
  "exceeds_200k_tokens": false,
  "vim": { "mode": "INSERT" },
  "agent": { "name": "agent-name" }
}
```

### What is NOT in the statusline JSON

The rate limit state object (`HN`) contains these fields but they are **not passed** to the statusline:

```js
// In-memory state, never written to disk or statusline
{
  status: "allowed" | "allowed_warning" | "rejected",
  resetsAt: 1706961600,        // Unix epoch seconds
  rateLimitType: "five_hour",  // which limit is active
  utilization: 0.48,           // 0.0 - 1.0
  unifiedRateLimitFallbackAvailable: false,
  isUsingOverage: false,
  overageStatus: "allowed",
  overageResetsAt: undefined,
  overageDisabledReason: undefined,
  surpassedThreshold: 0.9
}
```

Adding these fields to the statusline JSON would be a ~5 line change in the `vqz()` function:

```js
// Hypothetical change needed in cli.js vqz() function:
return {
  ...existingFields,
  // ADD THIS:
  rate_limit: getCurrentRateLimitState()  // returns HN object
};
```

---

## 8. Rate Limit State Lifecycle

```
API Response received
       │
       ▼
z0A(headers)  ──── parses anthropic-ratelimit-unified-* headers
       │
       ▼
z34(headers)  ──── builds rate limit state object
       │
       ▼
AO6(newState) ──── updates in-memory cache (HN variable)
       │              │
       │              ├── notifies all UI subscribers (Y0A set)
       │              └── logs telemetry event (tengu_claudeai_limits_status_changed)
       │
       ▼
  So() React hook ── UI components read state via React hook
       │
       ▼
  /usage display ── renders progress bar and percentage
```

The state is:
- Updated on every API response (not just `/usage`)
- Stored only in the `HN` variable (module-level, in-memory)
- Never persisted to disk
- Never included in statusline JSON
- Logged to telemetry (Anthropic's servers, not local)

---

## 9. The 5-Hour Window Question

### What the source reveals

The source defines `windowSeconds: 18000` (exactly 5 hours) for the `five_hour` rate limit type. The `XF9()` function calculates time elapsed as a percentage:

```js
function calcTimeElapsedPct(resetEpoch, windowSeconds) {
  let now = Date.now() / 1000;
  let windowStart = resetEpoch - windowSeconds;
  let elapsed = now - windowStart;
  return Math.max(0, Math.min(1, elapsed / windowSeconds));
}
```

This formula: `windowStart = resetEpoch - windowSeconds`

This means: if `reset` is at epoch X, the window started at `X - 18000`. This is consistent with **both** fixed boundaries and rolling windows. Without observing actual header values across multiple sessions, the window type cannot be determined from source alone.

### What is known

- Window is exactly 5 hours (18,000 seconds)
- Reset time is provided as a Unix epoch in the header
- The utilization is a 0.0-1.0 float from the server (authoritative)
- Claude Code's source does NOT assume fixed UTC boundaries for the 5h window -- it reads the reset time from the header

### What remains unknown

- Whether the window is fixed (aligned to UTC hours) or rolling (based on first usage)
- Whether the $18 cost limit is exact or approximate
- Whether internal pricing exactly matches the public pricing table

---

## 10. All API Endpoints Found in Source

| Endpoint | Purpose |
|----------|---------|
| `https://api.anthropic.com/v1/messages` | Standard messages API (used for all conversations and quota checks) |
| `https://api.anthropic.com/api/claude_cli_feedback` | Feedback submission |
| `https://api.anthropic.com/api/claude_code/link_vcs_account` | Link GitHub/VCS account |
| `https://api.anthropic.com/api/claude_code/metrics` | Usage metrics |
| `https://api.anthropic.com/api/claude_code/organizations/metrics_enabled` | Check if org metrics are enabled |
| `https://api.anthropic.com/api/hello` | Health check |
| `https://api.anthropic.com/api/oauth/claude_cli/create_api_key` | Create API key from OAuth token (Console auth only) |
| `https://api.anthropic.com/api/oauth/claude_cli/roles` | Get user roles |
| `https://api.anthropic.com/api/oauth/profile` | Get OAuth profile |
| `https://api.anthropic.com/api/claude_cli_profile` | Get CLI profile |
| `https://api.anthropic.com/api/organization/` | Organization info |
| `https://api.anthropic.com/api/web/domain_info` | Domain info lookup |
| `https://api.anthropic.com/api/claude_code/user_settings` | User settings sync |

### OAuth endpoints

| Endpoint | Purpose |
|----------|---------|
| `https://claude.ai/oauth/authorize` | OAuth authorization (Claude.ai users) |
| `https://platform.claude.com/oauth/authorize` | OAuth authorization (Console users) |
| `https://platform.claude.com/v1/oauth/token` | Token exchange/refresh |

### Web URLs (not API)

| URL | Purpose |
|-----|---------|
| `https://claude.ai/settings/usage` | Usage settings page |
| `https://claude.ai/admin-settings/usage` | Admin usage page |
| `https://claude.ai/upgrade/max` | Upgrade to Max plan |
| `https://platform.claude.com/settings/billing` | Billing settings |

---

## 11. Recommendations

### Best approach: Feature request

File a GitHub issue or feature request asking Anthropic to include rate limit data in the statusline JSON. The change is minimal -- the `vqz()` function already has access to the `HN` state object via `So()` (the React hook) or by directly importing the module state. Adding a `rate_limit` field with `utilization`, `resetsAt`, and `rateLimitType` would solve the problem completely.

### Current best workaround: JSONL cost calculation

The existing approach of reading `~/.claude/projects/**/*.jsonl` files, calculating cost per model using the public pricing table, and comparing against the $18 limit remains the most practical method. It requires no external dependencies, no proxy setup, no security compromises, and runs with ~90% accuracy.

### Potential improvements to JSONL approach

1. **Don't assume fixed UTC windows.** Instead, find the earliest entry in the most recent cluster of activity and use that as the window start. Or simply use `hours_back=5` as a rolling window (which is what the current `usage-calculator.py` already does via `load_usage_entries(hours_back=5)`).

2. **Cache the Python calculation.** Spawn the Python process once every 60 seconds instead of on every statusline update. Write the result to a temp file; have the Node.js statusline read the cached file.

3. **Cross-reference with `cost.total_cost_usd`.** The statusline JSON's `cost.total_cost_usd` field gives the current session's cost. If the session started within the current 5-hour window, this is a useful data point (though it only covers one session, not all sessions in the window).

---

## 12. Source Analysis Methodology

1. Downloaded the npm package: `npm pack @anthropic-ai/claude-code` (v2.1.29)
2. Extracted `cli.js` -- an 11MB bundled/minified JavaScript file (6,428 lines)
3. Used `grep`, `awk`, and pattern matching to identify:
   - All URLs (`https?://` patterns)
   - All rate limit header names (`anthropic-ratelimit-*`)
   - Authentication flow (`apiKey`, `authToken`, `bearerAuth`)
   - Beta flags (`anthropic-beta` values)
   - Statusline JSON construction (`vqz()` function)
   - Rate limit parsing (`z34()`, `MF9()`, `jF9()` functions)
4. Verified findings by making actual curl requests with the OAuth token
5. Cross-referenced with the statusline debug JSON (`~/.claude/statusline-debug.json`)
