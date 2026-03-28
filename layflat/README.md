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

1. Create a Vercel project pointing at `layflat/`
2. Add env vars from `.env.example`
3. Ensure `NEXT_PUBLIC_APP_URL` matches your deployed domain (needed for webhooks)
