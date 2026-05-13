# FriendsFinder — Frontend Spec (Tinder-style Web UI)

This file is the implementation guide for the FriendsFinder web frontend. It is read by Claude Code (and humans) when scaffolding or extending the UI in this directory. The backend is **fixed**: do not propose changes to Lambdas, Terraform, types, or API contracts. The UI must conform to what already exists in [`../src/`](../src/) and [`../.kiro/`](../.kiro/).

---

## 1. Project Context

FriendsFinder is a serverless AWS backend (3 Lambdas, DynamoDB, API Gateway WebSocket + HTTP, S3) that lets users:

- Share live location with friends via a persistent WebSocket.
- Discover nearby strangers (within a configurable radius, default 5 mi) and send friend requests.
- Manage profile (display name, avatar in S3, discoverable flag).

This frontend is a **mobile-first responsive Next.js web app** with a **Tinder-style swipe deck** as the primary discovery surface. The app is academic-grade — correctness and demo-ability matter more than scale.

**Authoritative backend references (read these before writing code):**

- [../README.md](../README.md) — architecture diagram, AWS services, SSM defaults.
- [../.kiro/steering/product.md](../.kiro/steering/product.md) — product requirements and full API contract list.
- [../src/types/index.ts](../src/types/index.ts) — TypeScript interfaces — mirror these exactly in `lib/types.ts`.
- [../src/handlers/](../src/handlers/) — handler source if you need to confirm a route's behavior.

---

## 2. Product Goals

1. **Discover (primary):** Tinder-style card stack of nearby strangers. Swipe right = send friend request, swipe left = pass.
2. **Friends (live):** Real-time list of friends with distance + last-updated timestamp, fed by the WebSocket.
3. **Requests:** Inbox of incoming friend requests with accept/decline.
4. **Profile:** Edit display name, upload avatar via pre-signed S3 URL, toggle discoverability.

The UI should feel like a polished consumer app — large imagery, gestural interactions, motion, dark-first palette.

---

## 3. Tech Stack (prescriptive)

| Concern | Choice | Notes |
|---|---|---|
| Framework | **Next.js 15 (App Router) + React 19** | TypeScript strict mode (matches backend) |
| Styling | **Tailwind CSS v4** | Utility-first, mobile-first |
| UI primitives | **shadcn/ui** | Sheets, dialogs, toasts, form fields |
| Gestures / motion | **framer-motion** | Drag, spring animations on the card stack |
| Server state | **@tanstack/react-query** | All REST calls (caching, retries, refetch) |
| Client state | **zustand** | Current user, WS status, live friend-locations map |
| WebSocket | **Native `WebSocket`** + custom `useNearbyFriendsSocket` hook | Backend uses raw API Gateway WebSocket — do **not** use socket.io |
| Map | **maplibre-gl** + free OSM tiles | No API key required |
| Validation | **zod** | Validate inbound WS messages and REST responses at the boundary |
| Tests | **Vitest** + **React Testing Library** + **Playwright** (1 happy-path E2E) | |
| Icons | **lucide-react** | Used by shadcn |

Do not introduce additional libraries without a clear reason. No socket.io, no redux, no MUI, no styled-components.

---

## 4. Directory Layout

Create exactly this structure:

```
frontend/
├── app/                                # Next.js App Router
│   ├── (auth)/
│   │   └── login/page.tsx              # Dev user picker
│   ├── (app)/
│   │   ├── layout.tsx                  # Bottom tab bar + WS provider + geolocation poller
│   │   ├── discover/page.tsx           # PRIMARY: swipe deck of nearby strangers
│   │   ├── friends/page.tsx            # Live friends list + map
│   │   ├── requests/page.tsx           # Incoming friend requests
│   │   └── profile/page.tsx            # Edit profile, picture upload, discoverable toggle
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── swipe/                          # SwipeDeck, SwipeCard, ActionButtons
│   ├── friends/                        # FriendListItem, DistanceBadge, LiveMap
│   ├── requests/                       # RequestCard
│   ├── profile/                        # ProfileForm, AvatarUploader, DiscoverableToggle
│   ├── nav/                            # BottomTabBar
│   └── ui/                             # shadcn primitives (button, sheet, toast, …)
├── lib/
│   ├── api/                            # Typed REST client, one fn per endpoint
│   │   ├── client.ts                   # fetch wrapper (auth header, error normalization)
│   │   ├── strangers.ts
│   │   ├── friends.ts
│   │   ├── friend-requests.ts
│   │   └── profile.ts
│   ├── ws/
│   │   ├── client.ts                   # Connect, send, reconnect with exp backoff
│   │   └── messages.ts                 # zod schemas for inbound messages
│   ├── store/
│   │   ├── auth.ts                     # Current userId
│   │   ├── ws.ts                       # WS connection status
│   │   └── friends.ts                  # Map<friendId, NearbyFriendEntry>
│   ├── types.ts                        # Re-export shapes mirrored from ../src/types/index.ts
│   └── geolocation.ts                  # navigator.geolocation wrapper, 30s update loop
├── public/
├── .env.local.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── CLAUDE.md                           # this file
```

---

## 5. API Integration Reference

All shapes below come from [../src/types/index.ts](../src/types/index.ts) and [../.kiro/steering/product.md](../.kiro/steering/product.md). Mirror these in `lib/types.ts` — do not invent variants.

### WebSocket (API Gateway WebSocket API)

Base URL: `process.env.NEXT_PUBLIC_WS_URL` (e.g. `wss://abc123.execute-api.us-east-1.amazonaws.com/prod`).

| Direction | Route / Type | Payload |
|---|---|---|
| Client → Server | `$connect` (query string `?token={userId}`) | — |
| Client → Server | `$disconnect` | — |
| Client → Server | `location.update` | `{ action: 'location.update', latitude: number, longitude: number, timestamp: ISOString }` |
| Server → Client | `init.response` | `{ type: 'init.response', friends: NearbyFriendEntry[] }` |
| Server → Client | `location.push` | `{ type: 'location.push', friendId, latitude, longitude, lastUpdated, distanceMiles }` |

### REST (API Gateway HTTP API)

Base URL: `process.env.NEXT_PUBLIC_HTTP_URL`.

| Method | Path | UI usage |
|---|---|---|
| `GET` | `/nearby-strangers` | Source of the swipe deck. Returns `NearbyStrangerEntry[]`. |
| `POST` | `/friend-requests/{toUserId}` | Right-swipe / heart button. |
| `GET` | `/friend-requests` | Requests inbox. |
| `PUT` | `/friend-requests/{requestId}/accept` | Accept button. |
| `PUT` | `/friend-requests/{requestId}/decline` | Decline button. |
| `DELETE` | `/friends/{friendId}` | Remove-friend action in friend sheet. |
| `GET` | `/users/{userId}/profile` | Profile screen + own-user header. |
| `PUT` | `/users/{userId}/profile` | Save profile changes. Body: `{ displayName?, profilePictureKey?, discoverable? }`. |
| `GET` | `/users/{userId}/profile-picture-upload-url` | Step 1 of avatar upload. |

> **There is no `POST /friends/{friendId}` endpoint.** Friends are added exclusively via the request → accept flow. Do not add a "follow" or "add friend" direct action.

---

## 6. Screen Specs

### 6.1 Login (dev) — `app/(auth)/login/page.tsx`

- Centered card with the brand wordmark and a `<select>` of seed userIds: `alice`, `bob`, `carol`.
- On submit: write `userId` to `localStorage` and the `auth` zustand store, redirect to `/discover`.
- No password, no real auth. State this clearly in a small "Dev mode" badge.

### 6.2 Discover — `app/(app)/discover/page.tsx` (PRIMARY)

- Fetch `GET /nearby-strangers` via react-query. Refetch every 30s and on tab focus.
- Render the top 3 cards as a stack using framer-motion. Only the top card is draggable.
- **Card content:** full-bleed `profilePictureUrl`, dark gradient overlay at bottom, `displayName` in display weight, `distanceMiles` formatted as `"0.8 mi away"` (1 decimal).
- **Drag behavior:**
  - Horizontal drag rotates the card ±15° proportional to offset.
  - Crossing ±100px commits the swipe; below threshold springs back.
  - Show a green heart tint on right-drag, red X tint on left-drag (opacity scaled with offset).
- **Right swipe / heart button** → `POST /friend-requests/{userId}` → toast `"Request sent to {displayName}"`. On 409/duplicate, toast `"You already requested {displayName}"`.
- **Left swipe / X button** → local-only dismiss; do not call the backend.
- Below the deck: two large circular action buttons (`X`, heart) that trigger the same actions programmatically.
- **Empty state:** centered illustration + `"No one nearby right now — check back later."` + manual refresh button.
- **Loading:** skeleton card with shimmer.
- **Error:** retry button + error message.

### 6.3 Friends — `app/(app)/friends/page.tsx`

- Data source: zustand `friends` store, populated by WS `init.response` and updated on each `location.push`.
- List view by default; toggle in header switches to map view (`maplibre-gl` with a marker per friend).
- Each list row: avatar (resolved by lazy `GET /users/{friendId}/profile`), `displayName`, `DistanceBadge` ("0.4 mi"), `"updated 12s ago"` relative timestamp that re-renders every 10s.
- Tap a row → bottom Sheet (shadcn) with a small map centered on the friend, profile metadata, and a destructive "Remove friend" button → `DELETE /friends/{friendId}` → optimistic removal from the store.
- **Empty state:** `"No friends online nearby. Open Discover to find people."`.

### 6.4 Requests — `app/(app)/requests/page.tsx`

- `GET /friend-requests` via react-query (refetch every 60s and on focus).
- Each row: `fromUserId`'s avatar + `displayName` (lazy fetch profile), "Accept" (primary) and "Decline" (ghost) buttons.
- Accept → `PUT /friend-requests/{requestId}/accept` → optimistic remove from list, toast.
- Decline → `PUT /friend-requests/{requestId}/decline` → optimistic remove from list.
- **Empty state:** `"No pending requests."`.

### 6.5 Profile — `app/(app)/profile/page.tsx`

- Load `GET /users/{currentUserId}/profile`.
- Form fields: `displayName` (text input, required), `discoverable` (switch).
- Avatar uploader:
  1. User picks an image (constrain to ≤5 MB, JPEG/PNG/WebP).
  2. `GET /users/{currentUserId}/profile-picture-upload-url` → receive pre-signed PUT URL + key.
  3. Client `PUT`s the file directly to S3 with the correct `Content-Type`.
  4. `PUT /users/{currentUserId}/profile` with `{ profilePictureKey }`.
  5. Invalidate the profile query to refresh the resolved pre-signed GET URL.
- "Sign out" button at the bottom: clears `auth` store + localStorage, redirects to `/login`.

---

## 7. Realtime / WebSocket Behavior

Implement in `lib/ws/client.ts` and a `<WSProvider>` in `app/(app)/layout.tsx`.

- **Connect** on app mount after login: `new WebSocket(\`${WS_URL}?token=${userId}\`)`.
- **Inbound messages:** parse JSON, validate with zod schema in `lib/ws/messages.ts`, dispatch:
  - `init.response` → seed `friends` store (replace map).
  - `location.push` → upsert entry in `friends` store keyed by `friendId`.
  - Drop and `console.warn` on parse failure.
- **Outbound `location.update`:** every 30s while the tab is visible, using `navigator.geolocation.getCurrentPosition`. Stop polling when the tab is hidden (`document.visibilityState`).
- **Reconnect:** exponential backoff starting at 1s, capped at 30s, with jitter. Reset on successful `init.response`. Surface connection status in the bottom tab bar (small dot: green = connected, amber = reconnecting, red = error).
- **Permissions:** if geolocation permission is denied, show a non-blocking banner explaining that nearby features won't work, but allow the rest of the UI to function.

---

## 8. Tinder-style Visual System

- **Palette (dark-first):**
  - Background: `#0B0B10`
  - Surface: `#15151C`
  - Primary gradient: `linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)`
  - Success (right-swipe tint): `#4ADE80`
  - Danger (left-swipe tint): `#F87171`
  - Text: `#F5F5F7` / muted `#9CA3AF`
- **Typography:** Geist (or Inter as fallback). Display sizes for card names, tracking-tight.
- **Card:** `rounded-3xl`, `shadow-2xl`, full-bleed image, bottom gradient `from-black/80 to-transparent`, padding `p-6`.
- **Action buttons (Discover):** circular `w-16 h-16`, white surface with colored icon (red X, gradient heart), `shadow-lg`, scale-down on press.
- **Bottom tab bar:** 4 tabs (Discover, Friends, Requests, Profile), icon over label, active tab uses primary gradient on the icon. Safe-area aware (iOS notch).
- **Motion presets:** spring `{ stiffness: 300, damping: 30 }` for card return; tween `0.2s ease-out` for tint overlays.

---

## 9. Environment & Auth Convention

`.env.local.example`:

```
NEXT_PUBLIC_WS_URL=wss://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/prod
NEXT_PUBLIC_HTTP_URL=https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com
```

**Dev "auth"** (do not bolt on Cognito — that is explicitly out of scope):

- The selected userId lives in `localStorage.userId` and the `auth` zustand store.
- WebSocket: passed as `?token={userId}` query param on `$connect`.
- REST: passed as `x-user-id: {userId}` header on every fetch from `lib/api/client.ts`. (The backend will be updated separately if it needs to read this; for now the header is harmless and matches the dev-mock convention.)
- All REST paths that include `{userId}` use the current user's id from the store.

---

## 10. Verification

Before declaring the UI done, the following must work end-to-end:

1. `cd frontend && npm install && npm run dev` boots Next on `http://localhost:3000`.
2. `npm run build` succeeds.
3. `npm run typecheck` (alias for `tsc --noEmit`) passes with strict mode.
4. `npm run test` (Vitest) passes.
5. **Manual happy path** (with backend deployed and 3 seed users):
   - Browser A: log in as `alice` → land on `/discover` → see `bob` and `carol` in the deck → swipe right on `bob`.
   - Browser B: log in as `bob` → `/requests` shows alice's request → tap Accept.
   - Both browsers: `/friends` now shows the other user with a live distance that updates as `location.update` fires.
6. **Playwright E2E** (`npm run e2e`): one spec covering login → swipe right → request appears in the other user's inbox → accept → friend appears in `/friends`. (Use a mock WS/HTTP server or test backend.)

If the backend isn't deployed, set `NEXT_PUBLIC_*` to `http://localhost:3001` and leave a `lib/api/mocks/` directory with a README pointing at MSW as the future mock layer (do not implement the mocks unless asked).

---

## 11. Out of Scope

Do not build any of the following without an explicit follow-up request:

- AWS Cognito or any real auth provider.
- Push notifications, native app wrapping, offline mode, service workers.
- Chat or messaging — the backend has no such endpoints.
- Any backend changes (Lambdas, Terraform, types, SSM parameters).
- Internationalization, accessibility audits beyond shadcn defaults, analytics.
- Caching strategies beyond react-query defaults.

---

## 12. Working Style Notes for Future Sessions

- Mirror backend types — do not redefine. If [../src/types/index.ts](../src/types/index.ts) changes, update `lib/types.ts`.
- Keep the REST client thin: one function per endpoint, returning typed data, throwing on non-2xx.
- Validate at boundaries (WS messages, REST responses) with zod. Trust internal data.
- Prefer composition over abstraction. Three similar list rows are fine; do not extract a generic `<EntityList>` until there is a fourth caller.
- Comments only where the *why* is non-obvious. Identifiers carry the *what*.
