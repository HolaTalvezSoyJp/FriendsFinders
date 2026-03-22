# 📍 Nearby Friends

A serverless backend system enabling real-time location sharing between friends on a mobile app. Opted-in users share their location and see a list of friends (and optionally strangers) who are geographically within a configurable radius. Built on AWS with Terraform and TypeScript.

> **Note:** This project is built for academic purposes. The architecture is designed to be correct and well-structured but does not target production-scale traffic.

---

## 🎯 Features

- Real-time location sharing via persistent WebSocket connections
- Nearby friends list with distance and last-updated timestamp
- Nearby strangers discovery — find and connect with non-friends who opted in
- Friend requests — send, accept, or decline
- User profiles with display name and profile picture (S3)
- Configurable radius, TTL, friend limits via SSM Parameter Store
- Location history persistence for future ML/analytics
- Automatic inactivity cleanup via Redis TTL (10-minute timeout)

---

## 🏗️ Architecture

```
Mobile Client
     │
     ├── WebSocket ──► API Gateway v2 (WebSocket API)
     │                    ├── $connect         → websocket-connect Lambda
     │                    ├── $disconnect      → websocket-disconnect Lambda
     │                    ├── location.update   → websocket-location-update Lambda
     │                    ├── friend.subscribe  → websocket-subscribe-friend Lambda
     │                    └── friend.unsubscribe→ websocket-unsubscribe-friend Lambda
     │
     └── HTTPS ──────► API Gateway v2 (HTTP API)
                         ├── POST/DELETE /friends/{friendId}  → rest-friend-add/remove Lambda
                         ├── GET/PUT /users/{userId}/profile  → rest-user-profile Lambda
                         ├── GET /users/{userId}/profile-picture-upload-url → rest-profile-picture-upload Lambda
                         ├── GET /nearby-strangers             → rest-nearby-strangers Lambda
                         └── POST/GET/PUT /friend-requests     → rest-friend-request Lambda

Redis Pub/Sub ──────► pubsub-fanout Lambda ──► PostToConnection (push to clients)
```

### AWS Services

| Service | Purpose |
|---|---|
| API Gateway v2 (WebSocket) | Persistent bidirectional connections for real-time updates |
| API Gateway v2 (HTTP) | REST endpoints for friends, profiles, strangers, requests |
| AWS Lambda (12 handlers) | All business logic, VPC-deployed |
| Amazon DynamoDB (5 tables) | Users, Friendships, Connections, Location History, FriendRequests |
| Amazon ElastiCache (Redis) | Location Cache (TTL) + Pub/Sub for real-time fan-out |
| Amazon S3 | Profile picture storage with server-side encryption |
| AWS SSM Parameter Store | Runtime-configurable parameters |
| CloudWatch | Log groups and alarms per Lambda |

### DynamoDB Tables

| Table | PK | SK | GSI |
|---|---|---|---|
| Users | userId | — | — |
| Friendships | userId | friendId | friendId (reverse lookup) |
| Connections | connectionId | — | userId |
| Location History | userId | timestamp | — |
| FriendRequests | requestId | — | toUserId, fromUserId |

---

## 🔧 Tech Stack

- **Runtime:** Node.js + TypeScript (ESNext, CommonJS)
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
│       ├── api-gateway/    ├── lambda/       ├── elasticache/
│       ├── dynamodb/       ├── vpc/          ├── iam/
│       ├── ssm/            ├── s3/           └── monitoring/
├── src/
│   ├── handlers/           # 12 Lambda handlers
│   ├── utils/              # Haversine, Redis/DynamoDB/S3/APIGW clients, SSM config
│   └── types/index.ts      # Shared TypeScript interfaces
├── tests/
│   ├── unit/               # Jest unit tests
│   └── property/           # fast-check property-based tests
├── package.json
├── tsconfig.json
└── README.md
```

---

## ⚙️ Configuration (SSM Parameters)

| Parameter | Default | Description |
|---|---|---|
| `/nearby-friends/search-radius-miles` | 5 | Nearby radius in miles |
| `/nearby-friends/inactivity-ttl-seconds` | 600 | Redis cache TTL (10 min) |
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

- **WebSocket + Redis Pub/Sub** — push-based, low-latency location delivery with efficient fan-out
- **ElastiCache Redis for Location Cache** — sub-millisecond reads with native TTL for inactivity handling
- **DynamoDB for persistent state** — on-demand billing, automatic scaling, TTL for connection cleanup
- **Dual-write on location update** — Location History (DynamoDB, permanent) for ML + Location Cache (Redis, TTL) for real-time
- **S3 pre-signed URLs** — client uploads profile pictures directly to S3, avoiding Lambda payload limits
- **Haversine formula** — straight-line great-circle distance; no routing APIs
- **Bidirectional friendship records** — O(1) lookup in both directions
- **Terraform only** — declarative infrastructure, no CDK/SAM/Serverless Framework

---

## 📚 References

- *System Design Interview – An Insider's Guide, Volume 2* — Chapter 18: Nearby Friends
- [Amazon API Gateway WebSocket APIs](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api.html)
- [Amazon ElastiCache for Redis](https://docs.aws.amazon.com/AmazonElastiCache/latest/red-ug/WhatIs.html)
- [Amazon DynamoDB TTL](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
