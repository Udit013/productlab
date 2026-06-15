# ProductLab — Product Decision Intelligence Platform

> Transform raw product usage data into product strategy decisions.
> What should we build next? Why? With what expected impact?

## What Is ProductLab?

ProductLab is a self-hosted, open-source Product Decision Intelligence Platform — 100% free, no paid APIs, no subscriptions.

Combines the best of Productboard + Amplitude + Mixpanel + Optimizely + Aha!

## Features

- Decision Center — ranked initiatives with Priority Score, ROI, retention lift, revenue impact
- Product Analytics — funnels, cohort heatmaps, feature adoption, user segments
- Experimentation Intelligence — A/B/multivariate, statistical significance engine, lift analysis
- Opportunity Engine — auto-discovers high_demand_low_adoption, churn risks, satisfaction gaps
- Prioritization Engine — RICE, ICE, WSJF, composite scoring
- Roadmap Intelligence — quarterly roadmap with capacity & expected outcomes
- AI Product Advisor — Ollama (Llama/Qwen/Mistral) + deterministic fallback
- Executive Reports — weekly/monthly/quarterly with PDF export
- Event Platform — JS SDK, explorer, definitions

## Tech Stack

Next.js 16 · TypeScript · Tailwind CSS · PostgreSQL · Drizzle ORM · Ollama · jsPDF

## Quick Start

1. npm install
2. Set DATABASE_URL in .env.local
3. Run SQL: psql $DATABASE_URL < scripts/create-tables.sql
4. npm run dev
5. Click "Load Demo Data" on the Decision Center

## Demo Data

10,000 users · 100,000+ events · 25 features · 10 experiments · 8 opportunities · 6 initiatives · Quarterly roadmap

## Deployment

Vercel + Neon PostgreSQL (both free tier available)

## JavaScript SDK

ProductLab.track("feature_used", { feature: "AI Search", userId: "123" })

## License

MIT
