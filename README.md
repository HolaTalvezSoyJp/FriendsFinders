# 📍 Nearby Friends

A serverless backend system enabling real-time location sharing between friends on a mobile app. Opted-in users share their location and see a list of friends (and optionally strangers) who are geographically within a configurable radius. Built on AWS with Terraform and TypeScript.

> **Note:** This project is built for academic purposes. The architecture is designed to be correct and well-structured but does not target production-scale traffic.

---

## 🎯 Features

- User authentication via Amazon Cognito (sign up / sign in)
- Real-time location sharing via persistent WebSocket connections
- Nearby friends list with distance and last-updated timestamp
- Nearby strangers discovery — find and connect with non-friends who opted in (ordered by proximity)
- Friend requests — send, accept, or decline
- User profiles with display name and discoverability toggle
- Profile pictures uploaded directly to S3 via pre-signed URLs
- Configurable radius, TTL, friend limits via SSM Parameter Store
- Automatic inactivity cleanup via DynamoDB TTL (10-minute timeout)
- Simple web frontend served via CloudFront

---

## 🏗️ Architecture

```
Browser / Mobile Client
     │
     ├── HTTPS ──────► CloudFront ──► S3 (frontend)
     │
     ├── WebSocket ──► API Gateway v2 (WebSocket API)
     │                    ├── $connect         ┐
     │                    ├── $disconnect      ├── websocket-handler Lambda
     │                    └── location.update  ┘
     │
     └── HTTPS ──────► API Gateway v2 (HTTP API) [JWT authorizer → Cognito]
                         ├── DELETE /friends/{friendId}
                         ├── GET/PUT /users/{userId}/profile
                         ├── GET /users/{userId}/profile-picture-upload-url
                         ├── GET /nearby-strangers
                         ├── POST /friend-requests/{toUserId}      ├── rest-handler Lambda
                         ├── GET /friend-requests
                         └── PUT /friend-requests/{requestId}/accept|decline

DynamoDB Streams (Connections table) ──► fanout-handler Lambda ──► PostToConnection (push to clients)
```

### AWS Services

| Service | Purpose |
|---|---|
| Amazon Cognito | User sign-up, sign-in, JWT issuance (hosted UI + mobile SDK) |
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

- **Web frontend:** OAuth 2.0 authorization code flow via Cognito hosted UI. The browser exchanges the auth code for an `id_token`, which is sent as `Authorization: Bearer <id_token>` on REST calls and as `?token=<id_token>` on WebSocket connect.
- **Mobile:** Direct auth via Cognito SDK (`USER_SRP_AUTH` / `USER_PASSWORD_AUTH`) using the mobile client ID. Same token usage as above.
- **Identity:** The Cognito `sub` claim (a stable UUID per user) is used as `userId` throughout the system. The WebSocket handler verifies the token manually using JWKS; the HTTP API uses API Gateway's built-in JWT authorizer.

---

## 🔧 Tech Stack

- **Runtime:** Node.js + TypeScript (strict mode, ESNext, CommonJS)
- **Infrastructure:** Terraform (no CDK, SAM, or Serverless Framework)
- **Testing:** Jest + ts-jest, fast-check (property-based testing)
- **AWS SDK:** v3 modular (`@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`, `@aws-sdk/client-apigatewaymanagementapi`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`)
- **JWT verification:** `jsonwebtoken` + `jwks-rsa` (WebSocket handler)

---

## 📁 Project Structure

```
/
├── frontend/
│   └── index.html                 # Single-page web app (config injected by Terraform)
├── terraform/
│   ├── main.tf, variables.tf, outputs.tf
│   └── modules/
│       ├── api-gateway/    ├── lambda/          ├── dynamodb/
│       ├── cognito/        ├── frontend/        ├── frontend-deploy/
│       ├── iam/            ├── ssm/             ├── s3/
│       └── monitoring/
├── src/
│   ├── handlers/
│   │   ├── websocket-handler.ts   # $connect, $disconnect, location.update
│   │   ├── rest-handler.ts        # All REST routes
│   │   └── fanout-handler.ts      # DynamoDB Streams → push to friends
│   ├── utils/
│   │   ├── distance.ts            # Haversine formula
│   │   ├── validation.ts          # Coordinate validation
│   │   ├── dynamo-client.ts       # DynamoDB typed wrappers
│   │   ├── apigw-client.ts        # API Gateway Management API
│   │   ├── s3-client.ts           # S3 pre-signed URL helpers
│   │   ├── config.ts              # SSM parameter loader
│   │   └── message-utils.ts       # WebSocket message builders/parsers
│   └── types/index.ts             # Shared TypeScript interfaces
├── tests/
│   ├── unit/                      # Jest unit tests
│   └── property/                  # fast-check property-based tests
├── package.json
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
# Install dependencies
npm install

# TypeScript compilation check
npx tsc --noEmit

# Run all tests
npx jest

# Build Lambda bundles (required before deploy)
npm run build

# Deploy infrastructure
cd terraform && terraform init && terraform apply

# After deploy, get the frontend URL
terraform output frontend_url
```

---

## 🖥️ Using the App

1. Open the `frontend_url` from `terraform output` in your browser
2. Click **Sign in with Cognito** → sign up with email + password → verify email
3. Enter a display name, check **Discoverable**, click **Save profile**
4. Enter coordinates (or click **Use GPS**), click **Connect WebSocket**, then **Send location**
5. Open a second browser/incognito window, sign in as another user, repeat steps 3–4
6. On user 1: click **Refresh** under Nearby Strangers → click **Add**
7. On user 2: click **Refresh** under Friend Requests → click **Accept**
8. Both users are now friends — sending location updates pushes real-time `location.push` messages to each other

---

## 📐 Key Design Decisions

- **Cognito for auth** — hosted UI for web, direct SDK flow for mobile; both issue a JWT whose `sub` is the userId
- **JWT verified at the edge** — HTTP API uses API Gateway's built-in JWT authorizer; WebSocket `$connect` verifies the token in-Lambda via JWKS (WebSocket APIs do not support JWT authorizers natively)
- **3 consolidated Lambdas** — reduces cold starts, simplifies deployment, lowers cost; internal routing by routeKey or HTTP method+path
- **DynamoDB Streams for fan-out** — stream triggers on location writes, fanout-handler computes distances and pushes to friends
- **No VPC / No NAT Gateway** — all services accessed via public AWS endpoints with IAM auth; saves ~$32+/month
- **No ElastiCache Redis** — DynamoDB Connections table with TTL replaces Redis location cache; eliminates ~$13-50+/month
- **DynamoDB TTL for inactivity** — expired records automatically cleaned up; queries filter by expiresAt > now
- **S3 pre-signed URLs** — client uploads profile pictures directly to S3, avoiding Lambda payload limits
- **Haversine formula** — straight-line great-circle distance; no routing APIs
- **Bidirectional friendship records** — O(1) lookup in both directions
- **Friend requests only** — friends are added exclusively through the request/accept flow
- **Terraform only** — declarative infrastructure, no CDK/SAM/Serverless Framework

---

## 💰 Cost Estimate (MVP)

At low traffic (academic project), estimated monthly cost is under $5-10:
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
