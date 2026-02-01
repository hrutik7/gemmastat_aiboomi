Gemma Stat is an AI-powered data analytics platform that solves critical inventory management challenges in healthcare laboratories. Labs lose 15-25% of their inventory annually due to expired reagents and poor stock visibility—translating to ₹50-80 Lakhs in wastage per mid-size lab.

The Solution
We built intelligent AI agents using Google Gemini that monitor lab databases 24/7 via Model Context Protocol (MCP), delivering proactive WhatsApp alerts for expiring reagents, low stock levels, and usage anomalies. Instead of checking dashboards, lab managers receive actionable insights directly on their phones.

Technology Stack
Backend: Python, FastAPI, SQLAlchemy, PostgreSQL (Neon)
Frontend: React, Vite, TailwindCSS, Recharts
AI: Google Gemini API, MCP Protocol for auto-schema discovery
Integrations: Twilio WhatsApp, Shopify, Cloudflare R2
Infrastructure: Railway (backend), Vercel (frontend)
Key Innovation
Our embedded MCP server enables AI agents to connect to any database in 5 minutes—automatically discovering schemas and executing secure queries, making intelligent analytics accessible to labs without technical expertise.

Demo Links
Live App: app.salusgemmalabs.com
API Docs: api.salusgemmalabs.com/docs
