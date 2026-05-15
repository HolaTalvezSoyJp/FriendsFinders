# 📍 Nearby Friends

A serverless backend + React frontend for real-time location sharing between friends. Opted-in users share their location and see friends (and optionally strangers) who are geographically within a configurable radius. Built on AWS with Terraform and TypeScript.

> **Note:** This project is built for academic purposes. The architecture is designed to be correct and well-structured but does not target production-scale traffic.

---

## 🎯 Features

- User authentication via Amazon Cognito (sign up / sign in)
- Real-time location sharing via persistent WebSocket connections
- Friends list with live distance and last-updated timestamp
- Nearby strangers discovery — find and connect with non-friends who opted in (ordered by proximity)
- Friend requests — send, accept, or decline
- User profiles with display name and discoverability toggle
- Profile pictures uploaded directly to S3 via pre-signed URLs
- Configurable radius, TTL, friend limits via SSM Parameter Store
- Automatic inactivity cleanup via DynamoDB TTL (10-minute timeout)
- React frontend served via CloudFront

---

## 🏗️ Architecture

```
Browser (React SPA) / Mobile Client
     │
     ├── HTTPS ──────► CloudFront ──► S3 (frontend bundle)
     │
     ├── WebSocket ──► API Gateway v2 (WebSocket API)
     │                    ├── $connect            ┐
     │                    ├── $disconnect         │
     │                    ├── location.update     ├── websocket-handler Lambda
     │                    └── friends.refresh     ┘
     │
     └── HTTPS ──────► API Gateway v2 (HTTP API) [JWT authorizer → Cognito]
                         ├── GET    /friends
                         ├── DELETE /friends/{friendId}
                         ├── GET    /nearby-friends
                         ├── GET    /nearby-strangers
                         ├── POST   /friend-requests/{toUserId}     ├── rest-handler Lambda
                         ├── GET    /friend-requests
                         ├── PUT    /friend-requests/{requestId}/accept|decline
                         ├── GET    /users/{userId}/profile
                         ├── PUT    /users/{userId}/profile
                         └── GET    /users/{userId}/profile-picture-upload-url

DynamoDB Streams (Connections table) ──► fanout-handler Lambda ──► PostToConnection (push to clients)
```

### AWS Services

| Service | Purpose |
|---|---|
| Amazon Cognito | User sign-up, sign-in, JWT issuance |
| API Gateway v2 (WebSocket) | Persistent bidirectional connections for real-time updates |
| API Gateway v2 (HTTP) | REST endpoints with Cognito JWT authorizer |
| AWS Lambda (3 handlers) | All business logic — no VPC required |
| Amazon DynamoDB (4 tables) | Users, Friendships, Connections (with location + TTL), FriendRequests |
| DynamoDB Streams | Triggers fan-out on location updates |
| Amazon S3 (2 buckets) | Profile picture storage; frontend static assets |
| Amazon CloudFront | HTTPS delivery of the web frontend |
| AWS SSM Parameter Store | Runtime-configurable parameters |
| CloudWatch | Log groups and alarms per Lambda |

### DynamoDB Tables

| Table | PK | SK | GSI | TTL |
|---|---|---|---|---|
| Users | userId | — | — | — |
| Friendships | userId | friendId | friendId (reverse lookup) | — |
| Connections | connectionId | — | userId | expiresAt |
| FriendRequests | requestId | — | toUserId, fromUserId | — |

The Connections table embeds location data (latitude, longitude, timestamp) alongside connection state. DynamoDB Streams (NEW_AND_OLD_IMAGES) on this table triggers the fanout-handler when location updates occur.

---

## 🔐 Authentication

- **Web frontend (React):** Direct sign-up / sign-in via the `amazon-cognito-identity-js` SDK. The SDK returns a JWT `id_token` that is stored client-side and sent as `Authorization: Bearer <id_token>` on REST calls and as `?token=<id_token>` on WebSocket connect.
- **Mobile:** Same flow — Cognito SDK (`USER_SRP_AUTH` / `USER_PASSWORD_AUTH`) using the mobile client ID; identical token usage.
- **Identity:** The Cognito `sub` claim (a stable UUID per user) is used as `userId` throughout the system. The WebSocket handler verifies the token manually via JWKS; the HTTP API uses API Gateway's built-in JWT authorizer.

---

## 🔧 Tech Stack

**Backend**
- Node.js + TypeScript (strict, ESNext, CommonJS)
- AWS SDK v3 modular (`@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`, `@aws-sdk/client-apigatewaymanagementapi`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `@aws-sdk/client-ssm`)
- `jsonwebtoken` + `jwks-rsa` (WebSocket JWT verification)
- `esbuild` for Lambda bundling

**Frontend**
- React 18 + TypeScript + Vite
- Leaflet + react-leaflet for the map
- `amazon-cognito-identity-js` for auth

**Infrastructure**
- Terraform (no CDK, SAM, or Serverless Framework)

---

## 📁 Project Structure

```
/
├── frontend/                       # React + Vite SPA
│   ├── src/
│   │   ├── App.tsx                 # Layout: sidebar (FriendList) + map
│   │   ├── AuthPage.tsx            # Sign in / register
│   │   ├── FriendsMap.tsx          # Leaflet map with user + friend markers
│   │   ├── FriendList.tsx          # Sidebar list with live distance
│   │   ├── useFriends.ts           # GET /friends hook
│   │   ├── useNearbyFriends.ts     # WebSocket hook (location.update / push)
│   │   ├── auth.ts                 # Cognito SDK wrapper
│   │   ├── config.ts               # Runtime config (injected by Terraform)
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── terraform/
│   ├── main.tf, variables.tf, outputs.tf
│   └── modules/
│       ├── api-gateway/    ├── lambda/          ├── dynamodb/
│       ├── cognito/        ├── frontend/        ├── frontend-deploy/
│       ├── iam/            ├── ssm/             ├── s3/
│       └── monitoring/
├── src/                            # Lambda handlers (backend)
│   ├── handlers/
│   │   ├── websocket-handler.ts    # $connect, $disconnect, location.update, friends.refresh
│   │   ├── rest-handler.ts         # All REST routes
│   │   └── fanout-handler.ts       # DynamoDB Streams → push to friends
│   ├── utils/
│   │   ├── distance.ts             # Haversine formula
│   │   ├── validation.ts           # Coordinate validation
│   │   ├── dynamo-client.ts        # DynamoDB typed wrappers
│   │   ├── apigw-client.ts         # API Gateway Management API
│   │   ├── s3-client.ts            # S3 pre-signed URL helpers
│   │   ├── config.ts               # SSM parameter loader
│   │   └── message-utils.ts        # WebSocket message builders/parsers
│   └── types/index.ts              # Shared TypeScript interfaces
├── scripts/
│   └── build.js                    # esbuild bundler → dist/<handler>.zip
├── dist/                           # Generated Lambda bundles + zips
├── package.json                    # Backend
├── tsconfig.json
└── README.md
```

---

## ⚙️ Configuration (SSM Parameters)

| Parameter | Default | Description |
|---|---|---|
| `/nearby-friends/search-radius-miles` | 5 | Nearby radius in miles |
| `/nearby-friends/inactivity-ttl-seconds` | 600 | DynamoDB TTL for connections (10 min) |
| `/nearby-friends/location-update-interval-seconds` | 30 | Client update interval |
| `/nearby-friends/max-friends` | 5000 | Hard cap on friends per user |
| `/nearby-friends/nearby-strangers-limit` | 50 | Max strangers per query |

---

## 🚀 Getting Started

```bash
# --- Backend ---
npm install
npx tsc --noEmit          # Type-check
npm run build             # Bundle Lambdas → dist/*.zip

# --- Frontend ---
cd frontend && npm install && npm run build && cd ..

# --- Deploy ---
cd terraform && terraform init && terraform apply

# After deploy, get the frontend URL
terraform output frontend_url
```

The Terraform `frontend-deploy` module uploads the built `frontend/dist` bundle to S3 and injects runtime config (Cognito IDs, API endpoints) so the SPA can talk to the deployed backend.

---

## 🖥️ Using the App

1. Open the `frontend_url` from `terraform output` in your browser.
2. Register with email + password → confirm via email → sign in.
3. Allow location access — the app starts watching your GPS and connecting to the WebSocket automatically.
4. Open a second browser/incognito window, register a different user, and sign in.
5. Use the nearby-strangers / friend-requests flow to add each other.
6. Once friends, both users see each other on the map with live distance and last-updated time; updates are pushed in real time over the WebSocket.

---

## 📐 Key Design Decisions

- **Cognito for auth** — direct SDK flow on both web and mobile; the `sub` claim is the userId.
- **JWT verified at the edge** — HTTP API uses API Gateway's built-in JWT authorizer; WebSocket `$connect` verifies the token in-Lambda via JWKS (WebSocket APIs do not support JWT authorizers natively).
- **3 consolidated Lambdas** — reduces cold starts, simplifies deployment, lowers cost; internal routing by routeKey or HTTP method+path.
- **DynamoDB Streams for fan-out** — stream triggers on location writes, fanout-handler computes distances and pushes to friends.
- **No VPC / No NAT Gateway** — all services accessed via public AWS endpoints with IAM auth; saves ~$32+/month.
- **No ElastiCache Redis** — DynamoDB Connections table with TTL replaces a Redis location cache; eliminates ~$13–50+/month.
- **DynamoDB TTL for inactivity** — expired records automatically cleaned up; queries filter by `expiresAt > now`.
- **S3 pre-signed URLs** — clients upload profile pictures directly to S3, avoiding Lambda payload limits.
- **Haversine formula** — straight-line great-circle distance; no routing APIs.
- **Bidirectional friendship records** — O(1) lookup in both directions.
- **Friend requests only** — friends are added exclusively through the request/accept flow.
- **Terraform only** — declarative infrastructure, no CDK/SAM/Serverless Framework.

---

## 💰 Cost Estimate (MVP)

At low traffic (academic project), estimated monthly cost is under $5–10:
- Lambda: pay-per-invocation, negligible at low volume
- DynamoDB: on-demand billing, minimal reads/writes
- API Gateway: pay-per-message/request
- S3: pennies for storage + requests
- Cognito: free up to 50,000 MAUs
- CloudFront: free tier covers low traffic
- SSM: free tier covers parameter reads
- No VPC, no NAT Gateway, no Redis = no fixed monthly costs

---

## 📚 References

- *System Design Interview – An Insider's Guide, Volume 2* — Chapter 18: Nearby Friends
- [Amazon API Gateway WebSocket APIs](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api.html)
- [Amazon Cognito Developer Guide](https://docs.aws.amazon.com/cognito/latest/developerguide/what-is-amazon-cognito.html)
- [Amazon DynamoDB Streams](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.html)
- [Amazon DynamoDB TTL](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
