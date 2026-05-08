from diagrams import Diagram, Cluster, Edge
from diagrams.aws.compute import Lambda
from diagrams.aws.database import Dynamodb, DynamodbTable
from diagrams.aws.network import APIGateway
from diagrams.aws.storage import S3
from diagrams.aws.management import SystemsManagerParameterStore, Cloudwatch
from diagrams.aws.general import Client

# ── Cost Breakdown ──────────────────────────────────────────────────
COST_LABEL = (
    "Nearby Friends MVP — AWS Architecture  |  Estimated Monthly Cost: ~$5–10\n"
    "─────────────────────────────────────────────────────────────────────\n"
    "Lambda × 3 (128–256 MB, no VPC):  ~$1–3\n"
    "DynamoDB × 4 (on-demand, pay-per-request):  ~$2–5\n"
    "API Gateway v2 (WebSocket + HTTP):  ~$1–3\n"
    "CloudWatch (logs + alarms):  ~$1–2\n"
    "S3 (profile pictures, SSE-S3):  < $1\n"
    "SSM Parameter Store (standard):  free\n"
    "─────────────────────────────────────────────────────────────────────\n"
    "No VPC  |  No NAT Gateway  |  No ElastiCache Redis"
)

graph_attr = {
    "fontsize": "10",
    "bgcolor": "white",
    "pad": "1.0",
    "nodesep": "0.6",
    "ranksep": "1.0",
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

    # ── External Client ─────────────────────────────────────────────
    mobile = Client("Mobile App")

    # ── API Gateway Layer ───────────────────────────────────────────
    with Cluster("API Gateway v2"):
        ws_api = APIGateway(
            "WebSocket API\n"
            "$connect\n"
            "$disconnect\n"
            "location.update"
        )
        http_api = APIGateway(
            "HTTP API (REST)\n"
            "DELETE /friends/{friendId}\n"
            "GET/PUT /users/profile\n"
            "GET /nearby-strangers\n"
            "POST/GET/PUT /friend-requests\n"
            "GET /profile-picture-upload-url"
        )

    # ── Lambda Handlers (no VPC) ────────────────────────────────────
    with Cluster("Lambda Handlers (3 functions, no VPC)"):
        lam_ws = Lambda(
            "websocket-handler\n"
            "$connect · $disconnect\n"
            "location.update"
        )
        lam_rest = Lambda(
            "rest-handler\n"
            "All REST routes"
        )
        lam_fanout = Lambda(
            "fanout-handler\n"
            "DynamoDB Streams\n"
            "→ push to friends"
        )

    # ── DynamoDB Tables ─────────────────────────────────────────────
    with Cluster("DynamoDB (on-demand)  ~$2–5/mo"):
        ddb_conn = Dynamodb(
            "Connections\n"
            "PK: connectionId\n"
            "GSI: userId\n"
            "TTL: expiresAt\n"
            "+ location data\n"
            "+ DynamoDB Stream"
        )
        ddb_friends = Dynamodb(
            "Friendships\n"
            "PK: userId\n"
            "SK: friendId\n"
            "GSI: friendId"
        )
        ddb_users = Dynamodb(
            "Users\n"
            "PK: userId\n"
            "displayName\n"
            "discoverable"
        )
        ddb_requests = Dynamodb(
            "FriendRequests\n"
            "PK: requestId\n"
            "GSI: toUserId\n"
            "GSI: fromUserId"
        )

    # ── Supporting Services ─────────────────────────────────────────
    s3 = S3(
        "S3 Bucket\n"
        "Profile Pictures\n"
        "SSE-S3 Encryption"
    )
    ssm = SystemsManagerParameterStore(
        "SSM Parameter Store\n"
        "/nearby-friends/*\n"
        "radius · TTL · interval\n"
        "max-friends · strangers-limit"
    )
    cw = Cloudwatch(
        "CloudWatch\n"
        "3 Log Groups\n"
        "Per-Lambda Alarms"
    )

    # ════════════════════════════════════════════════════════════════
    # EDGES
    # ════════════════════════════════════════════════════════════════

    # Client → API Gateway
    mobile >> Edge(label="wss://", color="darkblue", style="bold") >> ws_api
    mobile >> Edge(label="https://", color="darkgreen", style="bold") >> http_api

    # API Gateway → Lambda handlers
    ws_api >> Edge(color="darkblue") >> lam_ws
    http_api >> Edge(color="darkgreen") >> lam_rest

    # DynamoDB Streams → fanout-handler
    ddb_conn >> Edge(
        label="DynamoDB Stream\n(MODIFY events)", style="dashed", color="orange"
    ) >> lam_fanout

    # fanout-handler → push back through WebSocket API
    lam_fanout >> Edge(
        label="PostToConnection", style="dashed", color="purple"
    ) >> ws_api

    # websocket-handler → DynamoDB
    lam_ws >> Edge(color="royalblue") >> ddb_conn
    lam_ws >> Edge(color="royalblue") >> ddb_friends

    # rest-handler → DynamoDB
    lam_rest >> Edge(color="royalblue") >> ddb_friends
    lam_rest >> Edge(color="royalblue") >> ddb_users
    lam_rest >> Edge(color="royalblue") >> ddb_requests
    lam_rest >> Edge(color="royalblue") >> ddb_conn

    # fanout-handler → DynamoDB
    lam_fanout >> Edge(color="royalblue") >> ddb_friends
    lam_fanout >> Edge(color="royalblue") >> ddb_conn

    # Lambda → S3 (pre-signed URLs)
    lam_rest >> Edge(label="pre-signed\nGET/PUT", color="sienna") >> s3

    # Lambda → SSM (config reads)
    lam_ws >> Edge(style="dotted", color="gray") >> ssm
    lam_rest >> Edge(style="dotted", color="gray") >> ssm
    lam_fanout >> Edge(style="dotted", color="gray") >> ssm

    # Lambda → CloudWatch (logging)
    lam_ws >> Edge(style="dotted", color="gray") >> cw
    lam_fanout >> Edge(style="dotted", color="gray") >> cw
