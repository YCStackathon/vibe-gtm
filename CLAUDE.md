# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
We are building a YC hackathon project. Everything has to be simple and working, dont overengineer.

## Commands

### Backend (from `backend/` directory)
```bash
uv sync                              # Install dependencies
uv run uvicorn main:app --reload --port 8001  # Run dev server (localhost:8001)
uv run pytest                        # Run tests
uv run ruff check .                  # Lint
uv run ruff check . --fix            # Lint and fix
uv run ruff format .                 # Format
```

### Frontend (from `frontend/` directory)
```bash
npm install          # Install dependencies
npm run dev          # Run dev server (localhost:5180)
npm run build        # Build for production
npm run lint         # Lint
```

## Architecture

**Monorepo with two services:**
- `backend/` - FastAPI (Python 3.11+, uv)
- `frontend/` - React 19 + TypeScript + Vite

**API Communication:**
- Development: Vite proxy forwards `/api/*` → `localhost:8001`
- Production: Frontend uses `VITE_API_URL` env var for API base URL

**Database:**
- MongoDB with motor async driver
- Connection managed via lifespan context in `main.py`
- Access database with `get_database()` function

**Configuration:**
- Backend uses pydantic-settings with `.env` file support
- Frontend env vars must be prefixed with `VITE_`

## UI Design

**Style:** Retro-futurism / Cyberpunk Terminal

When working on frontend UI components, ALWAYS use the `frontend-design-pro` skill to generate designs that match the established aesthetic:
- Dark backgrounds (`#0a0a0f`, `#0d1117`, `#161b22`)
- Neon accents (cyan `#00fff5`, magenta `#ff00ff`, green `#39ff14`, amber `#ffb800`)
- Monospace fonts (JetBrains Mono, IBM Plex Mono)
- Terminal/CLI-inspired elements (scanlines, glowing borders, cursor blink)
- CRT effects (flicker, chromatic aberration on hover)

## Git Rules

- Never commit or push without explicit user request
- Always show changes and wait for approval before committing

## Deployment

Render Blueprint (`render.yaml`) deploys both services:
- Frontend: `gtm.useparadigm.app`
- Backend: `api.gtm.useparadigm.app`

CORS is configured for localhost:5173, Render URLs, and custom domain.

## Python rules
In python dont put file description at the top of the file.