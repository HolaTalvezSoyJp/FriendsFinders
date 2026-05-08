# 📍 Nearby Friends

A serverless backend system enabling real-time location sharing between friends on a mobile app. Opted-in users share their location and see a list of friends (and optionally strangers) who are geographically within a configurable radius. Built on AWS with Terraform and TypeScript.

> **Note:** This project is built for academic purposes. The architecture is designed to be correct and well-structured but does not target production-scale traffic.

---

## 🎯 Features

- Real-time location sharing via persistent WebSocket connections
- Nearby friends list with distance and last-updated timestamp
- Nearby strangers discovery — find and connect with non-friends who opted in (ordered by proximity)
- Friend requests — send, accept, or decline
- User profiles with display name and profile picture (S3)
- Configurable radius, TTL, friend limits via SSM Parameter Store
- Automatic inactivity cleanup via DynamoDB TTL (10-minute timeout)

---

## 🏗️ Architecture

```
Mobile Client
     │
     ├── WebSocket ──► API Gateway v2 (WebSocket API)
     │                    ├── $connect         ┐
     │                    ├── $disconnect      ├── websocket-handler Lambda
     │                    └── location.update  ┘
     │
     └── HTTPS ──────► API Gateway v2 (HTTP API)
                         ├── DELETE /friends/{friendId}
                         ├── GET/PUT /users/{userId}/profile
                         ├── GET /users/{userId}/profile-picture-upload-url
                         ├── GET /nearby-strangers              ├── rest-handler Lambda
                         ├── POST /friend-requests/{toUserId}
                         ├── GET /friend-requests
                         └── PUT /friend-requests/{requestId}/accept|decline

DynamoDB Streams (Connections table) ──► fanout-handler Lambda ──► PostToConnection (push to clients)
```

### AWS Services

| Service | Purpose |
|---|---|
| API Gateway v2 (WebSocket) | Persistent bidirectional connections for real-time updates |
| API Gateway v2 (HTTP) | REST endpoints for friends, profiles, strangers, requests |
| AWS Lambda (3 handlers) | All business logic — no VPC required |
| Amazon DynamoDB (4 tables) | Users, Friendships, Connections (with location + TTL), FriendRequests |
| DynamoDB Streams | Triggers fan-out on location updates |
| Amazon S3 | Profile picture storage with server-side encryption |
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

## 🔧 Tech Stack

- **Runtime:** Node.js + TypeScript (strict mode, ESNext, CommonJS)
- **Infrastructure:** Terraform (no CDK, SAM, or Serverless Framework)
- **Testing:** Jest + ts-jest, fast-check (property-based testing)
- **AWS SDK:** v3 modular (`@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`, `@aws-sdk/client-apigatewaymanagementapi`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`)

---

## 📁 Project Structure

```
/
├── terraform/
│   ├── main.tf, variables.tf, outputs.tf
│   └── modules/
│       ├── api-gateway/    ├── lambda/       ├── dynamodb/
│       ├── iam/            ├── ssm/          ├── s3/
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

# Run unit tests only
npx jest tests/unit

# Run property tests only
npx jest tests/property

# Deploy infrastructure
cd terraform && terraform init && terraform plan && terraform apply
```

---

## 📐 Key Design Decisions

- **3 consolidated Lambdas** — reduces cold starts, simplifies deployment, lowers cost; internal routing by routeKey or HTTP method+path
- **DynamoDB Streams for fan-out** — replaces Redis pub/sub; stream triggers on location writes, fanout-handler computes distances and pushes to friends
- **No VPC / No NAT Gateway** — all services accessed via public AWS endpoints with IAM auth; saves ~$32+/month
- **No ElastiCache Redis** — DynamoDB Connections table with TTL replaces Redis location cache; eliminates ~$13-50+/month
- **DynamoDB TTL for inactivity** — expired records automatically cleaned up; queries filter by expiresAt > now
- **S3 pre-signed URLs** — client uploads profile pictures directly to S3, avoiding Lambda payload limits
- **Haversine formula** — straight-line great-circle distance; no routing APIs
- **Bidirectional friendship records** — O(1) lookup in both directions
- **Friend requests only** — no direct add-friend endpoint; friends are added exclusively through the request/accept flow
- **Terraform only** — declarative infrastructure, no CDK/SAM/Serverless Framework

---

## 💰 Cost Estimate (MVP)

At low traffic (academic project), estimated monthly cost is under $5-10:
- Lambda: pay-per-invocation, negligible at low volume
- DynamoDB: on-demand billing, minimal reads/writes
- API Gateway: pay-per-message/request
- S3: pennies for storage + requests
- SSM: free tier covers parameter reads
- No VPC, no NAT Gateway, no Redis = no fixed monthly costs

---

## 📚 References

- *System Design Interview – An Insider's Guide, Volume 2* — Chapter 18: Nearby Friends
- [Amazon API Gateway WebSocket APIs](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api.html)
- [Amazon DynamoDB Streams](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.html)
- [Amazon DynamoDB TTL](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
