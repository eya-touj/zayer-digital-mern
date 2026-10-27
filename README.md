# ZAYER Digital

ZAYER Digital is a React 18, Express and MongoDB agency site with an optional local JSON datastore, an authenticated CMS, a multilingual assistant endpoint, and three self-contained portfolio demos.

## Local development

Use Node.js 22.12 or newer.

1. Install and configure the API:

   ```powershell
   cd backend
   npm install
   Copy-Item .env.example .env
   npm run dev
   ```

   MongoDB is optional for development. When it is unavailable, the API uses `backend/data/local-db.json`. Set `ADMIN_INITIAL_EMAIL` and a unique `ADMIN_INITIAL_PASSWORD` of at least 12 characters in `backend/.env` to create the first CMS user. The API retries the MongoDB connection in the background. Set `GROQ_API_KEY` to enable Zaya.

2. In another terminal, start the site:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

   Vite serves the site at `http://localhost:5173` and proxies `/api` and `/uploads` to the API on port 5000.

## Docker deployment

Copy the root environment template to `.env`, then set a random `JWT_SECRET` with at least 32 characters, a public `CLIENT_URL`, and the initial admin email and password. Add `GROQ_API_KEY` to enable the assistant. Keep `.env` private.

```sh
cp .env.example .env
openssl rand -hex 32
docker compose up -d --build
```

Put the generated random value in `JWT_SECRET` before starting Compose. The public site is served on `HTTP_PORT` (port 80 by default). Only the frontend Nginx service publishes a port. MongoDB is isolated on a private network, has a 1 GB container memory cap and a 0.5 GB WiredTiger cache. The API has a 512 MB cap; Nginx has a 256 MB cap. Container logs rotate at 10 MB with three files retained. MongoDB data, uploads, and local JSON data use persistent Docker volumes.

The API starts if MongoDB is unavailable and keeps the local JSON repository active while retrying MongoDB every 30 seconds. MongoDB does not need to be available for the static site, contact forms, CMS, or portfolio data to work.

## CMS and API

Open `/admin` and sign in with the initial admin credentials. Admin sessions use an HttpOnly JWT cookie and an `X-CSRF` header for state-changing requests. The CMS supports page items, jobs, messages, settings, editable blocks and custom components. Uploaded files are restricted by extension, declared MIME type, and file signature to JPEG, PNG, WebP, GIF, MP4 and PDF, with an 8 MB limit.

The public API includes `/api/public/content`, `/api/public/message`, `/api/portfolio`, and `/api/zaya-assistant`. The portfolio demo sites are static assets under `frontend/public/portfolio/sites`; Crystal Rent Car loads its vehicle list from its local `data/cars.json` file.
