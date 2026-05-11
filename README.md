# Cloud Analytics Platform

Simple local CSV analytics app with a FastAPI backend and a polished Next.js dashboard.

This version is intentionally simple for a project demo:

- No AWS setup
- No worker process
- No external database
- Upload CSV files and get charts immediately

## Local Development

Start the backend:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Start the frontend in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

API docs are available at `http://localhost:8000/docs`.

## Docker Option

```bash
docker-compose up --build
```

## Local Flow

1. Upload a `.csv` file from the frontend.
2. The backend saves it under `backend/uploads/`.
3. The backend analyzes it immediately with pandas.
4. The dataset status becomes `completed`.
5. The dashboard loads results from `GET /datasets/{id}/download`.

## Project Structure

```
.
├── backend/           # FastAPI backend
│   ├── main.py       # API endpoints
│   ├── Dockerfile    # Container config
│   └── requirements.txt
├── frontend/          # Next.js frontend
│   ├── src/
│   │   ├── app/     # Next.js app router
│   │   └── components/
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml # Optional local Docker setup
└── .env.example       # Environment template
```

## Features

- **Dataset Upload**: CSV file upload via web interface
- **Instant Analysis**: Backend analyzes files immediately with pandas
- **Interactive Dashboard**: Summary cards and charts with Recharts
- **Local Storage**: Uploaded files and analysis stay on your machine

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React, TypeScript |
| Backend | FastAPI (Python) |
| Analysis | pandas |
| Database | SQLite |
| Containerization | Docker |

## Architecture

```
User → Next.js Frontend → FastAPI Backend → SQLite + local uploads
                              ↓
                         pandas analysis
```

## Environment Variables

```env
DATABASE_URL=sqlite:///./analytics.db
FRONTEND_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/upload` | Upload CSV file |
| GET | `/datasets` | List all datasets |
| GET | `/datasets/{id}` | Get dataset details |
| DELETE | `/datasets/{id}` | Delete dataset |
| GET | `/datasets/{id}/download` | Download results |
