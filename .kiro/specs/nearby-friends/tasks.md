# Implementation Plan: Nearby Friends

## Overview

Implement a serverless real-time location sharing backend using AWS API Gateway (WebSocket + HTTP), Lambda (12 handlers), DynamoDB (5 tables), ElastiCache Redis (location cache + pub/sub), S3 (profile pictures), and SSM Parameter Store (runtime config). TypeScript with Jest and fast-check for testing. Incremental approach: project setup → types → utilities → clients → handlers → integration wiring.

## Tasks

- [ ] 1. Set up project structure and dependencies
  - [ ] 1.1 Initialize Node.js/TypeScript project
    - Create `package.json` with dependencies: `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`, `@aws-sdk/client-apigatewaymanagementapi`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `@aws-sdk/client-ssm`, `ioredis`, `uuid`
    - Add dev dependencies: `typescript`, `jest`, `ts-jest`, `fast-check`, `@types/jest`, `@types/aws-lambda`, `@types/uuid`
    - Create `tsconfig.json` with strict mode, ESNext target, CommonJS module
    - Create `jest.config.ts` with ts-jest preset
    - Set up directory structure: `src/handlers/`, `src/utils/`, `src/types/`, `tests/unit/`, `tests/property/`
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

  - [ ] 1.2 Define core TypeScript interfaces and types
    - Create `src/types/index.ts` with all interfaces: `LocationUpdate`, `LocationCacheEntry`, `LocationHistoryRecord`, `UserProfile`, `Friendship`, `FriendRequest`, `WebSocketConnection`, `NearbyFriendEntry`, `NearbyStrangerEntry`, `LocationUpdateMessage`, `LocationPushMessage`, `InitResponseMessage`, `FriendSubscribeMessage`, `FriendUnsubscribeMessage`
    - _Requirements: 19.1, 19.2, 19.3_

- [ ] 2. Implement coordinate validation and Haversine distance
  - [ ] 2.1 Implement `validateCoordinates` function in `src/utils/distance.ts`
    - Accept lat, lng, and timestamp; return `{ valid: boolean, error?: string }`
    - Accept if lat ∈ [-90, 90] AND lng ∈ [-180, 180] AND both are numbers AND timestamp is present
    - Reject non-numeric, missing, NaN, Infinity values
    - _Requirements: 3.2, 3.6_

  - [ ]* 2.2 Write property test for coordinate validation
    - **Property 3: Coordinate validation**
    - Create `tests/property/validation.property.test.ts`
    - Generate random numeric pairs; assert accepted iff lat ∈ [-90, 90] and lng ∈ [-180, 180] and timestamp present
    - Generate non-numeric / missing inputs; assert all rejected
    - **Validates: Requirements 3.2, 3.6**

  - [ ] 2.3 Implement `haversine` function in `src/utils/distance.ts`
    - Pure function: `haversine(lat1, lng1, lat2, lng2) → number` (distance in miles)
    - Use Earth radius R = 3958.8 miles
    - Formula: `a = sin²(Δlat/2) + cos(lat1)·cos(lat2)·sin²(Δlng/2)`, `c = 2·atan2(√a, √(1−a))`, `distance = R·c`
    - _Requirements: 5.1, 5.5_

  - [ ] 2.4 Implement `isNearby` classification function in `src/utils/distance.ts`
    - `isNearby(lat1, lng1, lat2, lng2, radiusMiles) → boolean`
    - Return true iff haversine distance ≤ radius
    - _Requirements: 5.2, 5.3, 5.4_

  - [ ]* 2.5 Write property test for Haversine mathematical properties
    - **Property 6: Haversine distance mathematical properties**
    - Create `tests/property/distance.property.test.ts`
    - Generate random valid coordinate pairs; assert distance ≥ 0, distance(a,b) === distance(b,a), distance(a,a) === 0
    - **Validates: Requirements 5.1**

  - [ ]* 2.6 Write property test for nearby classification
    - **Property 7: Nearby classification matches distance comparison**
    - Add to `tests/property/distance.property.test.ts`
    - Generate random coordinate pairs and positive radius; assert isNearby returns true iff haversine ≤ radius
    - **Validates: Requirements 1.7, 4.3, 4.4, 5.3, 5.4**

  - [ ]* 2.7 Write unit tests for distance utilities
    - Create `tests/unit/distance.test.ts`
    - Test known distances (e.g., NYC to LA ≈ 2451 miles), same point returns 0, boundary coordinates, antipodal points
    - Test coordinate validation boundary values and invalid inputs
    - _Requirements: 3.2, 5.1, 5.5_

- [ ] 3. Implement message utilities and SSM config
  - [ ] 3.1 Implement message parsing and building utilities in `src/utils/message-utils.ts`
    - `parseLocationUpdateMessage(body: string) → LocationUpdateMessage` — parse JSON, validate required fields
    - `buildLocationPushMessage(friendId, lat, lng, lastUpdated, distanceMiles) → LocationPushMessage`
    - `buildInitResponseMessage(friends: NearbyFriendEntry[]) → InitResponseMessage`
    - _Requirements: 19.1, 19.2, 19.3_

  - [ ]* 3.2 Write property test for message serialization round-trip
    - **Property 25: Message serialization round-trip**
    - Create `tests/property/message.property.test.ts`
    - Generate random valid LocationUpdateMessage, LocationPushMessage, InitResponseMessage objects; assert JSON.parse(JSON.stringify(msg)) deep-equals msg
    - **Validates: Requirements 19.4, 19.5, 19.6**

  - [ ] 3.3 Implement SSM parameter helper in `src/utils/ssm-config.ts`
    - Read all 5 SSM parameters with defaults: search-radius-miles (5), inactivity-ttl-seconds (600), location-update-interval-seconds (30), max-friends (5000), nearby-strangers-limit (50)
    - Cache values for Lambda lifecycle
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

  - [ ]* 3.4 Write property test for SSM parameters with defaults
    - **Property 24: SSM parameters with defaults**
    - Create `tests/property/ssm-config.property.test.ts`
    - Mock SSM client; generate random parameter presence/absence + random values; assert correct value or default used
    - **Validates: Requirements 18.1, 18.2, 18.3, 18.4, 18.5**

- [ ] 4. Implement client modules (Redis, DynamoDB, API Gateway, S3)
  - [ ] 4.1 Implement Redis client in `src/utils/redis-client.ts`
    - `getLocationCache(userId) → LocationCacheEntry | null`
    - `setLocationCache(userId, entry, ttlSeconds) → void`
    - `getAllActiveLocations() → LocationCacheEntry[]`
    - `publish(channel, message) → void`
    - `subscribe(channel, connectionId) → void`
    - `unsubscribe(channel, connectionId) → void`
    - `unsubscribeAll(connectionId) → void`
    - `getSubscribers(channel) → string[]`
    - _Requirements: 3.4, 3.5, 4.1, 6.1, 6.2, 9.1, 10.1_

  - [ ] 4.2 Implement DynamoDB client in `src/utils/dynamo-client.ts`
    - Typed wrappers for all 5 tables: Users, Friendships, Connections, Location History, FriendRequests
    - Connection operations: put, delete, getByConnectionId, getByUserId
    - Friendship operations: putBidirectional, deleteBidirectional, getFriends, getFriendCount, isFriend
    - Location History operations: putRecord
    - User operations: getProfile, putProfile, updateProfile
    - FriendRequest operations: create, getByRequestId, listPendingByToUserId, delete, checkDuplicate
    - _Requirements: 1.4, 2.1, 3.3, 7.3, 8.1, 11.1, 11.3, 14.1, 15.1, 16.3, 16.4, 17.3, 20.1_

  - [ ] 4.3 Implement API Gateway Management client in `src/utils/apigw-client.ts`
    - `postToConnection(connectionId, data) → void`
    - Handle GoneException for stale connections
    - _Requirements: 1.8, 4.3, 4.5_

  - [ ] 4.4 Implement S3 client and pre-signed URL helpers in `src/utils/s3-client.ts`
    - `generateUploadUrl(userId) → { uploadUrl, s3Key }`
    - `generateDownloadUrl(s3Key) → string`
    - Use `@aws-sdk/s3-request-presigner` for pre-signed URLs
    - _Requirements: 11.2, 12.1, 12.2_

- [ ] 5. Checkpoint - Ensure all utility and client tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement WebSocket handlers
  - [ ] 6.1 Implement `websocket-connect` handler in `src/handlers/websocket-connect.ts`
    - Authenticate user from token query param; reject with 401 on failure
    - Store connectionId → userId in Connections table
    - Fetch friend list from Friendships table
    - Batch-fetch friends' locations from Redis Location Cache (skip inactive)
    - Compute Haversine distance; filter to within Search_Radius
    - Send `init.response` to client with nearby friends
    - Subscribe to all friends' Redis pub/sub channels (active and inactive)
    - Publish user's current location to own Redis pub/sub channel
    - Return 500 on connection storage failure
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11_

  - [ ]* 6.2 Write property test for connection record storage
    - **Property 1: Connection record storage**
    - Create `tests/property/connection.property.test.ts`
    - Mock DynamoDB; generate random connectionId/userId; assert stored record maps connectionId to userId
    - **Validates: Requirements 1.4**

  - [ ]* 6.3 Write property test for init response correctness
    - **Property 10: Init response contains exactly the nearby friends**
    - Create `tests/property/fanout.property.test.ts`
    - Generate user with friends at various distances; assert init.response contains exactly friends within radius with correct fields
    - **Validates: Requirements 1.7, 1.8**

  - [ ]* 6.4 Write property test for connect subscribes all friends
    - **Property 11: Connect subscribes to all friends' channels**
    - Add to `tests/property/connection.property.test.ts`
    - Generate user with N friends; assert connection subscribed to exactly N Redis channels
    - **Validates: Requirements 1.9**

  - [ ]* 6.5 Write unit tests for websocket-connect handler
    - Create `tests/unit/websocket-connect.test.ts`
    - Test successful connection with nearby friends, auth failure returns 401, storage failure returns 500, empty friend list
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.8, 1.11_

  - [ ] 6.6 Implement `websocket-disconnect` handler in `src/handlers/websocket-disconnect.ts`
    - Remove connection record from Connections table
    - Unsubscribe from all Redis pub/sub channels
    - Log errors but always return 200
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ]* 6.7 Write property test for disconnect cleanup
    - **Property 2: Disconnect removes connection and unsubscribes**
    - Add to `tests/property/connection.property.test.ts`
    - Mock pre-populated connection + N subscriptions; assert connection removed and subscribed to zero channels
    - **Validates: Requirements 2.1, 2.2**

  - [ ]* 6.8 Write unit tests for websocket-disconnect handler
    - Create `tests/unit/websocket-disconnect.test.ts`
    - Test successful disconnect, DynamoDB failure logs error and returns 200
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 6.9 Implement `websocket-location-update` handler in `src/handlers/websocket-location-update.ts`
    - Parse and validate location update message
    - On invalid: send error to client via PostToConnection
    - Write to Location History table (fire-and-forget)
    - Update Redis Location Cache with TTL refresh
    - Publish to user's Redis pub/sub channel
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 20.1, 20.2_

  - [ ]* 6.10 Write property test for location update dual-write
    - **Property 4: Location update dual-write**
    - Create `tests/property/location.property.test.ts`
    - Generate random valid location updates; assert both Location History and Location Cache contain correct values
    - **Validates: Requirements 3.3, 3.4, 20.1**

  - [ ]* 6.11 Write property test for location cache TTL refresh
    - **Property 5: Location cache TTL refresh**
    - Add to `tests/property/location.property.test.ts`
    - Generate successive location updates; assert TTL reset to Inactivity_TTL on each update
    - **Validates: Requirements 3.4, 6.2**

  - [ ]* 6.12 Write property test for inactive user exclusion
    - **Property 8: Inactive user exclusion from nearby results**
    - Add to `tests/property/location.property.test.ts`
    - Generate friend lists with mix of active/expired cache entries; assert expired users excluded from results
    - **Validates: Requirements 1.6, 6.3**

  - [ ]* 6.13 Write unit tests for websocket-location-update handler
    - Create `tests/unit/websocket-location-update.test.ts`
    - Test valid update stores to both DynamoDB and Redis, invalid coordinates send error, fire-and-forget behavior
    - _Requirements: 3.2, 3.3, 3.4, 3.6, 20.1_

  - [ ] 6.14 Implement `websocket-subscribe-friend` handler in `src/handlers/websocket-subscribe-friend.ts`
    - Parse friendId from message body
    - Verify friendship exists in Friendships table; return error if not
    - Subscribe connection to friend's Redis pub/sub channel
    - Return success acknowledgment
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ] 6.15 Implement `websocket-unsubscribe-friend` handler in `src/handlers/websocket-unsubscribe-friend.ts`
    - Parse friendId from message body
    - Unsubscribe connection from friend's Redis pub/sub channel
    - Return success acknowledgment
    - _Requirements: 10.1, 10.2_

  - [ ]* 6.16 Write property test for subscribe/unsubscribe round-trip
    - **Property 15: Subscribe/unsubscribe round-trip**
    - Create `tests/property/subscription.property.test.ts`
    - Generate random friendships + connections; assert subscribe then unsubscribe results in no messages, subscribe only succeeds if friendship exists
    - **Validates: Requirements 9.1, 9.2, 10.1**

  - [ ]* 6.17 Write unit tests for subscribe/unsubscribe handlers
    - Create `tests/unit/websocket-subscribe-friend.test.ts` and `tests/unit/websocket-unsubscribe-friend.test.ts`
    - Test successful subscribe/unsubscribe, friendship not found error
    - _Requirements: 9.1, 9.2, 9.3, 10.1, 10.2_

- [ ] 7. Implement pub/sub fan-out handler
  - [ ] 7.1 Implement `pubsub-fanout` handler in `src/handlers/pubsub-fanout.ts`
    - Receive published location from Redis pub/sub channel
    - Iterate all subscribers of the channel
    - For each subscriber: fetch subscriber's location from Redis, compute Haversine distance
    - If within Search_Radius: send `location.push` via PostToConnection
    - If outside radius: skip silently
    - On PostToConnection failure: log error, continue with remaining subscribers
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 7.2 Write property test for fan-out completeness
    - **Property 9: Fan-out processes all subscribers**
    - Add to `tests/property/fanout.property.test.ts`
    - Generate channel with N subscribers and locations; assert Haversine evaluated for all N, no extras
    - **Validates: Requirements 4.1**

  - [ ]* 7.3 Write unit tests for pubsub-fanout handler
    - Create `tests/unit/pubsub-fanout.test.ts`
    - Test fan-out to nearby subscribers, skip distant subscribers, PostToConnection failure continues
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 8. Checkpoint - Ensure all WebSocket handler and fan-out tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement REST friend management handlers
  - [ ] 9.1 Implement `rest-friend-add` handler in `src/handlers/rest-friend-add.ts`
    - Verify friend count < max_friends limit; return 409 if exceeded
    - Write two bidirectional Friendship records using TransactWriteItems
    - Subscribe requester's WebSocket connection to friend's Redis pub/sub channel
    - Return friend's cached location if active; otherwise success without location
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ]* 9.2 Write property test for friendship bidirectionality on add
    - **Property 12: Friendship bidirectionality on add**
    - Create `tests/property/friendship.property.test.ts`
    - Generate random userId pairs; assert both (A,B) and (B,A) records exist after add
    - **Validates: Requirements 7.3, 16.3**

  - [ ]* 9.3 Write property test for friend count limit enforcement
    - **Property 14: Friend count limit enforcement**
    - Add to `tests/property/friendship.property.test.ts`
    - Generate random friend counts near limit boundary; assert rejection at/above limit, success below
    - **Validates: Requirements 7.1, 7.2**

  - [ ]* 9.4 Write unit tests for rest-friend-add handler
    - Create `tests/unit/rest-friend-add.test.ts`
    - Test successful add with location, add without location, limit exceeded, DynamoDB failure
    - _Requirements: 7.1, 7.2, 7.3, 7.5, 7.6_

  - [ ] 9.5 Implement `rest-friend-remove` handler in `src/handlers/rest-friend-remove.ts`
    - Delete both bidirectional Friendship records
    - Unsubscribe from removed friend's Redis pub/sub channel
    - Return success
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ]* 9.6 Write property test for friendship bidirectionality on remove
    - **Property 13: Friendship bidirectionality on remove**
    - Add to `tests/property/friendship.property.test.ts`
    - Generate pre-existing friendship pairs; assert neither (A,B) nor (B,A) exists after remove
    - **Validates: Requirements 8.1**

  - [ ]* 9.7 Write unit tests for rest-friend-remove handler
    - Create `tests/unit/rest-friend-remove.test.ts`
    - Test successful remove, record not found
    - _Requirements: 8.1, 8.2, 8.3_

- [ ] 10. Implement REST profile and upload handlers
  - [ ] 10.1 Implement `rest-user-profile` handler in `src/handlers/rest-user-profile.ts`
    - GET: Retrieve profile from Users table; generate pre-signed GET URL for profile picture if key exists; return 404 if not found
    - PUT: Update displayName, profilePictureKey, and/or discoverable flag in Users table
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ]* 10.2 Write property test for profile update round-trip
    - **Property 16: Profile update round-trip**
    - Create `tests/property/profile.property.test.ts`
    - Generate random profile data; assert PUT then GET returns same values
    - **Validates: Requirements 11.1, 11.3**

  - [ ]* 10.3 Write property test for profile picture URL generation
    - **Property 17: Profile picture URL generation**
    - Add to `tests/property/profile.property.test.ts`
    - Generate profiles with/without profilePictureKey; assert URL present iff key present
    - **Validates: Requirements 11.2**

  - [ ]* 10.4 Write property test for discoverable flag independence
    - **Property 18: Discoverable flag independence**
    - Add to `tests/property/profile.property.test.ts`
    - Generate random profile states; assert toggling discoverable does not affect subscriptions and vice versa
    - **Validates: Requirements 11.4**

  - [ ]* 10.5 Write unit tests for rest-user-profile handler
    - Create `tests/unit/rest-user-profile.test.ts`
    - Test GET with picture, GET without picture, GET not found, PUT update fields
    - _Requirements: 11.1, 11.2, 11.3, 11.5_

  - [ ] 10.6 Implement `rest-profile-picture-upload` handler in `src/handlers/rest-profile-picture-upload.ts`
    - Generate unique S3 key for user
    - Create pre-signed PUT URL with time-limited expiration
    - Return uploadUrl and s3Key
    - _Requirements: 12.1, 12.2, 12.3_

  - [ ]* 10.7 Write property test for upload URL uniqueness
    - **Property 19: Upload URL uniqueness**
    - Add to `tests/property/profile.property.test.ts`
    - Generate multiple calls for same userId; assert all returned S3 keys are distinct
    - **Validates: Requirements 12.1**

  - [ ]* 10.8 Write unit tests for rest-profile-picture-upload handler
    - Create `tests/unit/rest-profile-picture-upload.test.ts`
    - Test URL generation returns valid uploadUrl and s3Key
    - _Requirements: 12.1, 12.2_

- [ ] 11. Implement REST nearby strangers handler
  - [ ] 11.1 Implement `rest-nearby-strangers` handler in `src/handlers/rest-nearby-strangers.ts`
    - Fetch all active locations from Redis Location Cache
    - Compute Haversine distances; filter within Search_Radius
    - Exclude requesting user and existing friends (Friendships table lookup)
    - Include only users with discoverable = true (Users table lookup)
    - Cap results to configured limit (default 50)
    - Generate pre-signed profile picture URLs for results
    - Return list of NearbyStrangerEntry objects; empty list if none found
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

  - [ ]* 11.2 Write property test for nearby strangers filtering
    - **Property 20: Nearby strangers filtering**
    - Create `tests/property/nearby-strangers.property.test.ts`
    - Generate random active users, friend lists, discoverable flags, locations; assert only qualifying users returned with correct fields
    - **Validates: Requirements 13.1, 13.2, 13.3, 13.4**

  - [ ]* 11.3 Write property test for nearby strangers result cap
    - **Property 21: Nearby strangers result cap**
    - Add to `tests/property/nearby-strangers.property.test.ts`
    - Generate large sets of qualifying strangers; assert result count ≤ configured limit
    - **Validates: Requirements 13.5**

  - [ ]* 11.4 Write unit tests for rest-nearby-strangers handler
    - Create `tests/unit/rest-nearby-strangers.test.ts`
    - Test with nearby discoverable strangers, no strangers, friends excluded, non-discoverable excluded, cap applied
    - _Requirements: 13.1, 13.2, 13.3, 13.5, 13.6_

- [ ] 12. Checkpoint - Ensure all REST handler tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Implement REST friend request handlers
  - [ ] 13.1 Implement `rest-friend-request` handler in `src/handlers/rest-friend-request.ts`
    - POST /friend-requests/{toUserId}: Check for duplicate/existing friendship → create pending request with unique requestId
    - GET /friend-requests: Query by toUserId GSI → return pending incoming requests
    - PUT /friend-requests/{requestId}/accept: Verify pending → create bidirectional Friendships → delete request → trigger subscribe flows
    - PUT /friend-requests/{requestId}/decline: Verify pending → delete request
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 15.1, 15.2, 15.3, 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 17.1, 17.2, 17.3, 17.4_

  - [ ]* 13.2 Write property test for friend request creation and listing round-trip
    - **Property 22: Friend request creation and listing round-trip**
    - Create `tests/property/friend-request.property.test.ts`
    - Generate random user pairs; assert created request appears in pending list with correct fields
    - **Validates: Requirements 14.1, 15.1, 15.2**

  - [ ]* 13.3 Write property test for friend request deletion on resolution
    - **Property 23: Friend request deletion on resolution**
    - Add to `tests/property/friend-request.property.test.ts`
    - Generate pending requests; assert accept or decline removes request from table
    - **Validates: Requirements 16.4, 17.3**

  - [ ]* 13.4 Write unit tests for rest-friend-request handler
    - Create `tests/unit/rest-friend-request.test.ts`
    - Test send request, duplicate rejection, already-friends rejection, list pending, accept creates friendships, decline deletes request, not-found errors
    - _Requirements: 14.1, 14.2, 14.3, 15.1, 15.3, 16.1, 16.2, 16.3, 17.1, 17.2_

- [ ] 14. Integration wiring and handler exports
  - [ ] 14.1 Create handler entry point exports
    - Create `src/handlers/index.ts` exporting all 12 handlers with AWS Lambda-compatible signatures
    - Verify each handler is independently importable
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 7.1, 8.1, 9.1, 10.1, 11.1, 12.1, 13.1, 14.1_

  - [ ]* 14.2 Write integration tests for end-to-end flows
    - Create `tests/unit/integration.test.ts`
    - Test full connect → location update → fan-out → disconnect flow with mocked AWS services
    - Test add friend → receive location push flow
    - Test friend request → accept → mutual subscription flow
    - _Requirements: 1.1, 1.4, 2.1, 3.3, 4.3, 7.3, 16.3_

- [ ] 15. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (Properties 1–25 from design)
- Unit tests validate specific examples and edge cases
- All DynamoDB, Redis, S3, SSM, and API Gateway interactions are mocked in tests
- DynamoDB TransactWriteItems used for atomic bidirectional friendship writes
- Property tests use fast-check with minimum 100 iterations per property
- Property test tag format: `Feature: nearby-friends, Property {number}: {text}`
