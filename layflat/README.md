## LayFlat (MVP)

Modern SaaS scaffold for virtual try-on:

- OTP auth via Resend
- Neon Postgres + Drizzle ORM
- Replicate prediction + webhook completion
- Dashboard: create jobs, view status, browse outputs

## Getting Started

### 1) Create `.env.local`

Copy `.env.example` to `.env.local` and fill in values.

### 2) Database migrations (Neon)

Generate and apply migrations:

```bash
npm run db:generate
npm run db:migrate
```

### 3) Run dev server

```bash
npm run dev
```

```bash
npm run dev
```

Open `http://localhost:3000`.

## Replicate setup notes

- Uses `openai/gpt-image-1.5` on Replicate.
- The app sends two input images (`garment`, `model`) and requests `number_of_images=6`.
- Replicate must be able to reach your `NEXT_PUBLIC_APP_URL` to deliver the webhook.

## Deploy (Vercel)

The Git repository root is **one folder above** the Next.js app. In Vercel go to **Project → Settings → General → Root Directory**, set it to **`layflat`**, save, and **redeploy**. Leave the framework preset as **Next.js** (auto-detected from `layflat/package.json`). Do **not** leave root directory as `.` — there is no `package.json` at the repo root.

Then:

1. Add all env vars from **`.env.example`** (Production + Preview as needed).
2. Set **`NEXT_PUBLIC_APP_URL`** to your real site URL (e.g. `https://your-app.vercel.app` or `https://sameduck.com`) — no trailing slash.
3. Link **Vercel Blob** so **`BLOB_READ_WRITE_TOKEN`** exists in production.
4. Run **`npm run db:migrate`** against your production `DATABASE_URL` once.
5. Open the **Deployment** URL from the Vercel dashboard (Production). A generic **404 NOT_FOUND** with an `syd1::` id usually means a **wrong or expired URL**, or the **last deploy failed** — check **Deployments → Build Logs**.
