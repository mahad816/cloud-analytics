# Cloud Analytics

A full-stack CSV analytics web app. Upload a CSV file and get instant charts — numeric statistics, missing-value summaries, and categorical distributions — powered by pandas and rendered with Recharts.

**Live deployment:** AWS EC2 (Ubuntu) with Docker Compose.

---

## Architecture

```
Browser
  │
  └── :3000  Next.js (frontend)
                │
                └── /api/* rewrite ──► FastAPI :8000 (backend)
                                              │
                                        SQLite + uploads/
                                        (Docker volumes)
```

The browser only talks to port **3000**. API calls use the same-origin path `/api/...`; Next.js rewrites them to the backend container (`http://backend:8000`) inside the Docker network — no EC2 public IP baked into the client bundle.

---

## Tech stack

| Layer          | Technology                        |
|---------------|-----------------------------------|
| Frontend       | Next.js 14, React, TypeScript     |
| Charts         | Recharts                          |
| Backend        | FastAPI, Python 3.11, Uvicorn     |
| Analysis       | pandas                            |
| Database       | SQLite (via SQLAlchemy)           |
| Containerisation | Docker + Docker Compose         |
| Cloud          | AWS EC2, VPC, Security Groups, IAM|

---

## Local development

### Without Docker

**Backend**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend** (separate terminal)

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.  
API docs: `http://localhost:8000/docs`.

### With Docker (local)

```bash
docker compose up --build
```

---

## AWS EC2 deployment

### Prerequisites

- Ubuntu EC2 instance (t2.micro or larger)
- Security group inbound rules: **22** (SSH), **3000** (app), **8000** (API, optional)
- Key pair `.pem` downloaded

### One-time server setup

```bash
# SSH in
ssh -i ~/path/to/key.pem ubuntu@<PUBLIC_IP>

# Install Docker
sudo apt-get update
sudo apt-get install -y docker.io git curl
sudo systemctl enable --now docker
sudo usermod -aG docker ubuntu
newgrp docker

# Install Compose v2 binary
sudo curl -fsSL \
  "https://github.com/docker/compose/releases/download/v2.31.0/docker-compose-linux-$(uname -m)" \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
sudo mkdir -p /usr/libexec/docker/cli-plugins
sudo ln -sf /usr/local/bin/docker-compose /usr/libexec/docker/cli-plugins/docker-compose

# Clone repo
git clone https://github.com/mahad816/cloud-analytics.git
cd cloud-analytics
```

### Deploy

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Open `http://<PUBLIC_IP>:3000`.

### Update after a code change

```bash
cd ~/cloud-analytics
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

### Useful commands

```bash
# Container status
docker compose -f docker-compose.prod.yml ps

# Logs
docker compose -f docker-compose.prod.yml logs --tail=50

# Stop
docker compose -f docker-compose.prod.yml down
```

---

## Project structure

```
.
├── backend/
│   ├── main.py              # FastAPI app — endpoints + pandas analysis
│   ├── requirements.txt
│   ├── Dockerfile
│   └── uploads/             # CSV files (volume-mounted in prod)
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js App Router (page, layout, globals.css)
│   │   ├── components/      # Dashboard, DatasetList, DatasetUploader
│   │   └── types.ts         # Shared TypeScript interfaces
│   ├── next.config.js       # /api rewrite → backend
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml       # Local dev
├── docker-compose.prod.yml  # EC2 production
├── .env.example
└── .gitignore
```

---

## API endpoints

| Method | Path                        | Description              |
|--------|-----------------------------|--------------------------|
| GET    | `/health`                   | Health check             |
| POST   | `/upload`                   | Upload & analyse CSV     |
| GET    | `/datasets`                 | List all datasets        |
| GET    | `/datasets/{id}`            | Dataset detail           |
| DELETE | `/datasets/{id}`            | Delete dataset           |
| GET    | `/datasets/{id}/download`   | Analysis JSON for charts |

---

## Environment variables

| Variable          | Default                        | Notes                      |
|------------------|--------------------------------|----------------------------|
| `DATABASE_URL`   | `sqlite:///./analytics.db`     | Override for Postgres later|
| `FRONTEND_ORIGINS` | `*`                          | CORS allowed origins        |
| `INTERNAL_API_URL` | `http://backend:8000`        | Used by Next.js rewrite     |
