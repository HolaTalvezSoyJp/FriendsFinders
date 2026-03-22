from diagrams import Diagram, Cluster, Edge
from diagrams.aws.compute import Lambda
from diagrams.aws.database import Dynamodb, ElasticacheForRedis
from diagrams.aws.network import APIGateway, NATGateway, VPC
from diagrams.aws.storage import S3
from diagrams.aws.management import SystemsManagerParameterStore, Cloudwatch
from diagrams.aws.general import Client

# ── Cost Breakdown ──────────────────────────────────────────────────
# All estimates assume low/academic traffic (~100 users, light usage)
COST_LABEL = (
    "Nearby Friends — AWS Architecture  |  Estimated Monthly Cost: ~$85–$140\n"
    "─────────────────────────────────────────────────────────────────────\n"
    "NAT Gateway (1x):  ~$35–45  (fixed hourly + data processing)\n"
    "ElastiCache Redis (cache.t3.micro × 2, Multi-AZ):  ~$25–50\n"
    "Lambda × 12 (128–256 MB, VPC-attached):  ~$5–15\n"
    "DynamoDB × 5 (on-demand, pay-per-request):  ~$5–10\n"
    "API Gateway v2 (WebSocket + HTTP):  ~$3–5\n"
    "CloudWatch (logs + 2 alarms):  ~$5–10\n"
    "S3 (profile pictures, SSE-S3):  < $1\n"
    "SSM Parameter Store (standard):  free"
)

graph_attr = {
    "fontsize": "10",
    "bgcolor": "white",
    "pad": "1.0",
    "nodesep": "0.5",
    "ranksep": "0.9",
    "label": COST_LABEL,
    "labelloc": "b",
    "fontname": "Courier",
}

with Diagram(
    "",
    filename="generated-diagrams/Friend-finder_MVP",
    show=False,
    direction="TB",
    graph_attr=graph_attr,
    outformat="png",
):

    # ── External Clients ────────────────────────────────────────────
    mobile = Client("Mobile App")

    # ── API Gateway Layer (public, outside VPC) ─────────────────────
    with Cluster("API Gateway v2"):
        ws_api = APIGateway(
            "WebSocket API\n"
            "$connect  $disconnect\n"
            "location.update\n"
            "friend.subscribe\n"
            "friend.unsubscribe"
        )
        http_api = APIGateway(
            "HTTP API (REST)\n"
            "POST/DELETE /friends\n"
            "GET/PUT /users/profile\n"
            "GET /nearby-strangers\n"
            "POST/GET/PUT /friend-requests\n"
            "GET /profile-picture-upload-url"
        )

    # ── Global / Regional Services (outside VPC) ────────────────────
    ssm = SystemsManagerParameterStore(
        "SSM Parameter Store\n"
        "/nearby-friends/*\n"
        "radius · TTL · interval\n"
        "max-friends · strangers-limit"
    )
    cw = Cloudwatch(
        "CloudWatch\n"
        "12 Log Groups\n"
        "Per-Lambda Alarms"
    )
    s3 = S3(
        "S3 Bucket\n"
        "Profile Pictures\n"
        "SSE-S3 Encryption"
    )

    # ── VPC ─────────────────────────────────────────────────────────
    with Cluster("VPC  10.0.0.0/16"):

        # ── Public Subnets ──────────────────────────────────────────
        with Cluster(
            "Public Subnets\n"
            "10.0.1.0/24 (AZ-a)  ·  10.0.2.0/24 (AZ-b)\n"
            "Internet Gateway attached  |  Route: 0.0.0.0/0 → IGW"
        ):
            nat = NATGateway("NAT Gateway\n(AZ-a)\n~$35–45/mo")

        # ── Private Subnets ─────────────────────────────────────────
        with Cluster(
            "Private Subnets\n"
            "10.0.10.0/24 (AZ-a)  ·  10.0.11.0/24 (AZ-b)\n"
            "Route: 0.0.0.0/0 → NAT Gateway"
        ):

            # ── Security Group: Lambda-SG ───────────────────────────
            with Cluster(
                "SG: lambda-sg\n"
                "Outbound: TCP 6379 → redis-sg  |  TCP 443 → 0.0.0.0/0 (AWS APIs via NAT)"
            ):

                with Cluster("WebSocket Handlers"):
                    lam_connect = Lambda("ws-connect")
                    lam_disconnect = Lambda("ws-disconnect")
                    lam_location = Lambda("ws-location\nupdate")
                    lam_sub = Lambda("ws-subscribe\nfriend")
                    lam_unsub = Lambda("ws-unsubscribe\nfriend")
                    lam_fanout = Lambda("pubsub\nfanout")

                with Cluster("REST Handlers"):
                    lam_add = Lambda("rest-friend\nadd")
                    lam_remove = Lambda("rest-friend\nremove")
                    lam_profile = Lambda("rest-user\nprofile")
                    lam_strangers = Lambda("rest-nearby\nstrangers")
                    lam_request = Lambda("rest-friend\nrequest")
                    lam_upload = Lambda("rest-profile\npic-upload")

            # ── Security Group: Redis-SG ────────────────────────────
            with Cluster(
                "SG: redis-sg\n"
                "Inbound: TCP 6379 from lambda-sg only"
            ):
                with Cluster(
                    "ElastiCache Redis (cluster mode)\n"
                    "cache.t3.micro × 2  |  Multi-AZ\n"
                    "~$25–50/mo"
                ):
                    redis = ElasticacheForRedis(
                        "Location Cache\n"
                        "+ Pub/Sub\n"
                        "TTL: 600s"
                    )

    # ── DynamoDB (outside VPC, accessed via NAT → AWS endpoint) ─────
    with Cluster("DynamoDB  (on-demand)  ~$5–10/mo"):
        ddb_users = Dynamodb("Users\nPK: userId")
        ddb_friends = Dynamodb("Friendships\nPK: userId  SK: friendId\nGSI: friendId")
        ddb_conn = Dynamodb("Connections\nPK: connectionId\nGSI: userId")
        ddb_history = Dynamodb("Location History\nPK: userId  SK: timestamp")
        ddb_requests = Dynamodb("FriendRequests\nPK: requestId\nGSI: toUserId\nGSI: fromUserId")

    # ════════════════════════════════════════════════════════════════
    # EDGES
    # ════════════════════════════════════════════════════════════════

    # Client → API Gateway
    mobile >> Edge(label="wss://", color="darkblue", style="bold") >> ws_api
    mobile >> Edge(label="https://", color="darkgreen", style="bold") >> http_api

    # WebSocket API → Lambda handlers
    ws_api >> Edge(color="darkblue") >> lam_connect
    ws_api >> Edge(color="darkblue") >> lam_disconnect
    ws_api >> Edge(color="darkblue") >> lam_location
    ws_api >> Edge(color="darkblue") >> lam_sub
    ws_api >> Edge(color="darkblue") >> lam_unsub

    # HTTP API → Lambda handlers
    http_api >> Edge(color="darkgreen") >> lam_add
    http_api >> Edge(color="darkgreen") >> lam_remove
    http_api >> Edge(color="darkgreen") >> lam_profile
    http_api >> Edge(color="darkgreen") >> lam_strangers
    http_api >> Edge(color="darkgreen") >> lam_request
    http_api >> Edge(color="darkgreen") >> lam_upload

    # Lambda → Redis (via lambda-sg → redis-sg :6379)
    lam_connect >> Edge(color="red") >> redis
    lam_disconnect >> Edge(color="red") >> redis
    lam_location >> Edge(color="red") >> redis
    lam_sub >> Edge(color="red") >> redis
    lam_unsub >> Edge(color="red") >> redis
    lam_fanout >> Edge(color="red") >> redis
    lam_add >> Edge(color="red") >> redis
    lam_remove >> Edge(color="red") >> redis
    lam_strangers >> Edge(color="red") >> redis

    # Redis pub/sub → fanout → push back through WebSocket API
    redis >> Edge(label="pub/sub", style="dashed", color="orange") >> lam_fanout
    lam_fanout >> Edge(
        label="PostToConnection", style="dashed", color="purple"
    ) >> ws_api

    # Lambda → DynamoDB
    lam_connect >> Edge(color="royalblue") >> ddb_conn
    lam_connect >> Edge(color="royalblue") >> ddb_friends
    lam_disconnect >> Edge(color="royalblue") >> ddb_conn
    lam_location >> Edge(color="royalblue") >> ddb_history
    lam_add >> Edge(color="royalblue") >> ddb_friends
    lam_remove >> Edge(color="royalblue") >> ddb_friends
    lam_profile >> Edge(color="royalblue") >> ddb_users
    lam_strangers >> Edge(color="royalblue") >> ddb_users
    lam_strangers >> Edge(color="royalblue") >> ddb_friends
    lam_request >> Edge(color="royalblue") >> ddb_requests
    lam_request >> Edge(color="royalblue") >> ddb_friends

    # Lambda → S3 (pre-signed URLs)
    lam_profile >> Edge(label="pre-signed GET", color="sienna") >> s3
    lam_upload >> Edge(label="pre-signed PUT", color="sienna") >> s3

    # Lambda → SSM (config reads)
    lam_connect >> Edge(style="dotted", color="gray") >> ssm
    lam_location >> Edge(style="dotted", color="gray") >> ssm
    lam_strangers >> Edge(style="dotted", color="gray") >> ssm
    lam_fanout >> Edge(style="dotted", color="gray") >> ssm

    # Lambda → CloudWatch (all Lambdas log, shown selectively)
    lam_location >> Edge(style="dotted", color="gray") >> cw
    lam_fanout >> Edge(style="dotted", color="gray") >> cw

    # Lambda → NAT Gateway (outbound to AWS APIs: DynamoDB, S3, SSM, APIGW Mgmt)
    lam_connect >> Edge(style="dotted", color="dimgray", label="outbound\nvia NAT") >> nat
