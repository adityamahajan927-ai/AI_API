# AI Image & Video Generation API

Sell access to AI image and video generation with monthly subscription plans.

---

## Step 1 — Get your AI provider API keys (free to sign up)

### For Images (Stability AI)
1. Go to https://platform.stability.ai
2. Sign up for a free account
3. Click "API Keys" → "Create API Key"
4. Copy the key — it looks like: `sk-abc123...`

### For Videos (Runway)
1. Go to https://app.runwayml.com
2. Sign up for a free account
3. Go to Settings → API → "Create new key"
4. Copy the key

---

## Step 2 — Set up the project on your computer

You need Node.js installed. Download from: https://nodejs.org (click "LTS" version)

Then open Terminal (Mac) or Command Prompt (Windows) and run:

```bash
# 1. Go into the project folder
cd ai-api

# 2. Install dependencies
npm install

# 3. Copy the environment file
cp .env.example .env
```

Open the `.env` file in any text editor and paste your API keys:
```
STABILITY_API_KEY=sk-your-key-here
RUNWAY_API_KEY=your-runway-key-here
```

---

## Step 3 — Run the server

```bash
npm start
```

You should see: `✅ AI API server running on port 3000`

---

## Step 4 — Test it works

Open a new terminal and run:

```bash
# Register a test account
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "plan": "starter"}'
```

You'll get back an API key. Copy it, then test image generation:

```bash
curl -X POST http://localhost:3000/v1/generate/image \
  -H "Authorization: Bearer YOUR_API_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "a golden retriever on the beach at sunset"}'
```

---

## Step 5 — Deploy online (so anyone can use it)

### Option A: Railway (easiest, free to start)
1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Upload this folder to GitHub first, then connect it
4. Add your environment variables in Railway dashboard
5. Railway gives you a public URL like: `https://ai-api-xyz.railway.app`

### Option B: Render (also free to start)
1. Go to https://render.com
2. Click "New Web Service" → connect your GitHub repo
3. Set Start Command to: `npm start`
4. Add environment variables
5. Deploy!

---

## API Endpoints

| Method | URL | What it does |
|--------|-----|--------------|
| POST | /auth/register | Create an account, get API key |
| GET  | /auth/usage | Check how many images/videos you've used |
| POST | /v1/generate/image | Generate an image from text |
| POST | /v1/generate/video | Generate a video from text |
| GET  | /v1/status/:job_id | Check if a video is ready |

---

## Plans & Pricing (you set this, it's your business!)

| Plan | Price | Images/mo | Videos/mo |
|------|-------|-----------|-----------|
| Starter | $19 | 200 | 10 |
| Pro | $49 | 1,000 | 60 |
| Business | $149 | 5,000 | 300 |

To change prices, edit the `PLANS` object in `src/db.js`.

---

## Where to sell your API

1. **RapidAPI** — https://rapidapi.com/provider — largest API marketplace
2. **API Layer** — https://apilayer.com
3. **Your own website** — build a landing page with Stripe payments

---

## How to collect money

The easiest way: use **Stripe** (https://stripe.com)
- Create a Stripe account
- Set up 3 subscription products (Starter/Pro/Business)
- When someone pays, register them via `/auth/register` with their plan
- Stripe handles all the billing, renewals, and cancellations
