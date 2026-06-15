# ProductLab — Product Decision Intelligence Platform

**Live demo → [productlab-platform.vercel.app](https://productlab-platform.vercel.app/)**

> Most analytics tools answer *"What happened?"*
> **ProductLab answers *"Why did it happen?"*, *"What should we build next?"*, and *"What's the expected impact?"***

ProductLab turns raw product-usage data into **roadmap decisions** — opportunity discovery, prioritization, experimentation analysis, and quarterly planning. Analytics are the input; decisions are the output. It's fully open-source, self-hostable, and runs with **zero paid APIs**.

---

## ✨ Highlights

- **Decision Center** — auto-ranked initiatives with Priority Score, expected ROI, retention lift, and revenue impact
- **Opportunity Engine** — surfaces signals like *High Demand · Low Adoption* and *High Churn · Critical Feature* from behavioral data
- **Prioritization Engine** — RICE · ICE · WSJF · composite scoring with a live model switcher
- **Product Analytics** — funnels, retention cohort heatmaps (D1–D90), feature adoption, and user segments
- **Experimentation Intelligence** — A/B + multivariate tests with a built-in statistical-significance engine (p-values, confidence intervals, winner/loser classification)
- **Roadmap Intelligence** — quarterly roadmap with capacity allocation and expected outcomes
- **AI Product Advisor** — natural-language strategy Q&A, powered by Ollama with a **deterministic fallback that always works** (no key required)
- **Executive Reports** — weekly / monthly / quarterly summaries with PDF export
- **Event Platform** — JavaScript SDK, event explorer, and definitions
- **Demo Engine** — generates 10,000 users and 100,000+ realistic events on demand

---

## 🎨 Design

ProductLab wears a distinct **"intelligence terminal"** identity — a near-black canvas (`#0a0e16`) with an electric-lime signal accent, **Space Grotesk** for UI and **JetBrains Mono** for data, hairline-bordered surfaces, a subtle grid texture, and monospace section labels. Every theme value lives in CSS variables (`src/app/globals.css`) for easy retheming.

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) · TypeScript |
| Styling | Tailwind CSS v4 · Radix UI primitives |
| Charts | Apache ECharts |
| Database | PostgreSQL · Drizzle ORM |
| AI | Ollama (Llama / Qwen / Mistral) + deterministic engine |
| Reports | jsPDF |
| Hosting | Vercel · Neon Postgres |

---

## 🚀 Quick Start (local)

```bash
git clone https://github.com/Udit013/productlab.git
cd productlab
npm install

# point at any Postgres database
echo 'DATABASE_URL=postgresql://user:pass@host/db?sslmode=require' > .env.local

npm run db:push     # create tables
npm run db:seed     # load 10k users + 100k+ events
npm run dev         # http://localhost:3000
```

Then open the app — every page is populated with realistic SaaS data.

---

## ☁️ Deploy (Vercel + Neon)

1. **Database** — create a free project at [neon.tech](https://neon.tech) and copy the connection string.
2. **Schema + data** — run locally against that string (one time):
   ```bash
   echo 'DATABASE_URL=<your-neon-string>' > .env.local
   npm run db:push && npm run db:seed
   ```
3. **Host** — import the repo at [vercel.com/new](https://vercel.com/new), add an environment variable `DATABASE_URL` = your Neon string, and deploy.

Every `git push` to `main` redeploys automatically.

> **Note:** seed locally (not via the in-app *Load Demo Data* button) when targeting a cloud DB — inserting 100k+ rows can exceed a serverless function's time limit.

---

## 🔌 JavaScript SDK

```js
const ProductLab = {
  track(event, properties = {}) {
    fetch('https://productlab-platform.vercel.app/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventName: event, properties }),
    })
  },
}

ProductLab.track('feature_used', { feature: 'AI Search', userId: '123' })
```

Supported events: `page_view`, `session_start`, `signup`, `onboarding_step`, `activation`, `login`, `purchase`, `feature_click`, `feature_use`, `conversion`, and custom events.

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx              # Decision Center (flagship)
│   ├── opportunities/        # Opportunity Engine
│   ├── prioritization/       # RICE / ICE / WSJF
│   ├── roadmap/              # Roadmap Intelligence
│   ├── analytics/            # Funnels · Cohorts · Adoption · Segments
│   ├── experiments/          # Experimentation Intelligence
│   ├── events/               # Event Explorer + SDK
│   ├── advisor/              # AI Product Advisor
│   ├── reports/              # Executive Reports (PDF)
│   └── api/                  # Route handlers (graceful when DB unseeded)
├── lib/
│   ├── db/                   # Drizzle schema + client
│   ├── analytics/            # Funnels, cohorts, adoption queries
│   ├── engines/              # Statistics, opportunity, prioritization
│   └── demo/                 # Demo data generator
└── components/               # UI primitives + layout
```

---

## 📜 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run db:push` | Create/update database tables (Drizzle) |
| `npm run db:seed` | Populate with demo data |
| `npm run db:studio` | Open Drizzle Studio |

---

## License

MIT — free to use, modify, and self-host.
