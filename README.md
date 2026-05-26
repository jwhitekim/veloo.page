# veloo

A unified research assistant portal for academic lab workflows.
All tools share a single FastAPI backend and a React/TypeScript frontend served as an SPA.

---

## Tools

| Tool | Path | Description |
|------|------|-------------|
| **Paper Analyzer** | `/paper` | Upload a PDF or search by title — extracts metadata, runs Claude analysis (problem / method / conclusion), fetches author profiles from Semantic Scholar, and scores journal quality. |
| **Translation Studio** | `/translate` | Auto-translates English text (terms or paragraphs) via Claude. Short terms return a structured result with explanation and related keywords; right-click any selection to look it up in Naver Dictionary. |
| **Architecture Trainer** | `/arch-trainer` | Upload a paper architecture diagram → Claude describes it in detail → you write your own explanation → Claude grades and gives feedback. Builds intuition for reading deep-learning papers. |
| **Todo** | `/todo` | Research task manager backed by Supabase. Claude can decompose a task into timed steps and generate a one-line priority strategy based on your current todo list. |

---

## Tech Stack

- **Backend** — FastAPI (sub-apps mounted at `/paper`, `/translate`, `/arch-trainer`, `/todo`), Python 3.11+
- **Frontend** — React 18 + TypeScript + Vite, dark/light theme via CSS custom properties
- **AI** — Anthropic Claude API (`claude-haiku-4-5` for fast tasks, `claude-sonnet-4-6` for vision/reasoning)
- **Data** — Supabase (Todo), Semantic Scholar API (paper metadata), Naver Dictionary API (translation)
- **Deploy** — Docker + SSH via GitHub Actions (`appleboy/ssh-action`)

---

## Local Development

**Backend**
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_KEY, S2_API_KEY
python main.py         # serves on http://localhost:9000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev            # Vite dev server on :5173, proxies API calls to :9000
```

---

## Deployment

Deployment is handled automatically by `.github/workflows/deploy.yml` on every push to `main`.
The workflow SSHes into the server, pulls the latest code, and rebuilds the Docker image.

**Required secrets** (GitHub → Settings → Secrets):

| Secret | Description |
|--------|-------------|
| `SERVER_HOST` | Server IP or hostname |
| `SERVER_USER` | SSH username |
| `SERVER_PASSWORD` | SSH password |
