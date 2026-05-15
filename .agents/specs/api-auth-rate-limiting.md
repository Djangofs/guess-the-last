# API Key Authentication and Rate Limiting

## What it does

Protects admin API routes with a static Bearer token and guards all routes against abuse with IP-based rate limiting.

- `requireApiKey` middleware validates an `Authorization: Bearer <token>` header against the `API_SECRET` environment variable using `crypto.timingSafeEqual` (constant-time comparison). Returns 401 if the header is absent, malformed, or the token does not match. Also returns 401 if `API_SECRET` is not set at runtime (fail-safe).
- A global rate limiter (100 requests / 15 min per IP) is applied to all routes via `standardLimiter`.
- A stricter rate limiter (10 requests / 15 min per IP) is exported as `strictLimiter` for use on write/admin endpoints such as `POST /api/replays/import`.
- The server logs a startup warning if `API_SECRET` is not configured.

## Scope

| File | Role |
|---|---|
| `apps/api/src/app/middleware/require-api-key.ts` | `requireApiKey` Express middleware |
| `apps/api/src/app/middleware/rate-limit.ts` | `standardLimiter`, `strictLimiter`, and their exported option objects |
| `apps/api/src/main.ts` | Mounts `standardLimiter` globally; emits startup warning if `API_SECRET` unset |
| `.env.example` | Documents `API_SECRET` variable |

## API contract

No new routes. `requireApiKey` is a middleware to be applied per-route on admin endpoints:

```typescript
import { requireApiKey } from './middleware/require-api-key';
import { strictLimiter } from './middleware/rate-limit';

router.post('/replays/import', strictLimiter, requireApiKey, handler);
```

**401 response** (missing/wrong token):
```json
{ "error": "Unauthorized" }
```

**429 response** (rate limit exceeded):
```json
{ "error": "Too many requests, please try again later." }
```

Rate limit headers (`RateLimit-*`, draft-7 standard) are included in all responses.

## Pending wiring

`requireApiKey` is not yet applied to any route — there are no admin routes in the current API. It must be wired up when implementing the first admin route (`POST /api/replays/import`, issue #9). The pattern is:

```typescript
router.post('/replays/import', strictLimiter, requireApiKey, handler);
```

`strictLimiter` is similarly unused until then.

## Edge cases

- If `API_SECRET` is not set, `requireApiKey` rejects all requests — it never silently allows through.
- `timingSafeEqual` requires equal-length buffers; a length mismatch short-circuits to 401 before the comparison, which is safe for a token of variable user-controlled length.
- `strictLimiter` is exported but not automatically applied — it must be explicitly added to each admin route alongside `requireApiKey`.
