# Vibe GTM

A full-stack application with FastAPI backend and React frontend.

## Prerequisites

- Python 3.11+
- Node.js 18+
- [uv](https://docs.astral.sh/uv/) package manager

## Quickstart

### 1. Set up the Backend

```bash
cd backend

# Install dependencies
uv sync

# Start the backend server
uv run uvicorn main:app --reload
```

The backend runs at `http://localhost:8000`.

### 2. Set up the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The frontend runs at `http://localhost:5173`.

### 3. Use the App

Open `http://localhost:5173` in your browser to see the hello world message fetched from the backend.

## Project Structure

```
├── backend/
│   ├── main.py              # FastAPI app
│   └── pyproject.toml       # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── main.tsx         # React entry point
│   │   ├── App.tsx          # Main component
│   │   └── App.css          # Styles
│   ├── index.html           # HTML entry
│   ├── package.json         # NPM dependencies
│   ├── vite.config.ts       # Vite config with API proxy
│   └── tsconfig.json        # TypeScript config
└── README.md
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/hello` | GET | Returns hello world message |

## Development

### Backend

```bash
cd backend

# Install dependencies (including dev)
uv sync

# Run server with auto-reload
uv run uvicorn main:app --reload

# Linting
uv run ruff check .
uv run ruff check . --fix
uv run ruff format .
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Lint
npm run lint
```

## Deployment (Render)

### 1. Set up MongoDB Atlas

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Get your connection string (looks like `mongodb+srv://user:pass@cluster.mongodb.net/`)

### 2. Deploy to Render

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New → Blueprint
3. Connect your GitHub repo
4. Render will auto-detect `render.yaml` and create both services
5. Set the `MONGODB_URI` environment variable in the backend service

### 3. Custom Domain Setup

Add these DNS records to `useparadigm.app`:

| Type | Name | Value |
|------|------|-------|
| CNAME | `gtm` | `vibe-gtm-web.onrender.com` |
| CNAME | `api.gtm` | `vibe-gtm-api.onrender.com` |

Render will auto-provision SSL certificates.

## Environment Variables

### Backend

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `DATABASE_NAME` | Database name (default: `vibe_gtm`) |

### Frontend

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL (set in render.yaml) |
