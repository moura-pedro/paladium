# Paladium – AI‑Powered Rental & Booking Platform

A modern property rental platform built with Next.js (App Router) and TypeScript, featuring an AI booking agent for natural language search and booking via text or voice, and booking conflict prevention with MongoDB transactions.

---

## Contents
- Overview
- Tech Stack
- Prerequisites
- Quick Start
- Environment Variables
- Project Structure
- Core Features
- AI Agent
- Booking System
- Image Uploads (Cloudinary)
- Location System
- Key Pages & Flows
- API Reference
- Scripts
- Deployment
- Testing & QA
- Troubleshooting
- Security Notes
- License & Contributing

---

## Overview
Paladium delivers an agent-first booking experience. Guests can search and book using natural language (text or voice). Hosts can list and manage properties with multiple images. The platform enforces strong validation and transactional safety to prevent double bookings and ensures a delightful UI.

## Tech Stack
- Framework: Next.js 15 (App Router)
- Language: TypeScript
- Database: MongoDB + Mongoose
- Auth: Clerk
- AI: OpenAI (GPT-4o Tools API) + Whisper transcription
- Images: Cloudinary (+ next-cloudinary)
- Styling: Tailwind CSS 4 + glassmorphism
- Package manager: Yarn

## Prerequisites
- Node.js 18+
- Yarn
- Git
- MongoDB Atlas cluster (recommended) or local MongoDB
- Clerk account (publishable + secret keys)
- OpenAI API key
- Cloudinary account

---

## Quick Start
1) Install dependencies
```bash
yarn install
```

2) Create `.env.local` (see full list below)

3) Start dev server
```bash
yarn dev
```

4) Open `http://localhost:3000`


---

## Environment Variables
Create `.env.local` in the repo root:
```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/paladium

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# OpenAI
OPENAI_API_KEY=sk-...

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```
Tips:
- Create an unsigned upload preset named `paladium` in Cloudinary (Settings → Upload → Upload presets).
- MongoDB Atlas must be a replica set to support transactions.

---

## Project Structure
```
paladium/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── agent/                  # Conversational agent endpoint
│   │   │   ├── availability/           # Availability checks (GET/POST)
│   │   │   ├── booking/                # Booking create/list
│   │   │   ├── properties/             # Properties CRUD and bookings
│   │   │   ├── transcribe/             # Voice transcription (OpenAI Whisper)
│   │   │   ├── upload/                 # Cloudinary signed upload
│   │   │   └── user/onboard/           # User onboarding (role)
│   │   ├── chat/                       # AI chat UI
│   │   ├── host/dashboard/             # Host dashboard + add/edit
│   │   ├── property/[id]/              # Property details + booking form
│   │   ├── onboarding/                 # Role selection
│   │   ├── my-trips/                   # Guest bookings view
│   │   └── sign-in / sign-up           # Clerk auth pages
│   ├── components/                     # UI components (cards, pickers, etc.)
│   ├── lib/                            # Core logic, DB, models, agent
│   │   ├── agent/                      # Agent tools, prompts, config
│   │   ├── models/                     # Mongoose models: User, Property, Booking
│   │   ├── bookingHelpers.ts           # Validation, overlap checks, pricing
│   │   ├── locationHelpers.ts          # Structured location helpers
│   │   ├── db.ts, auth.ts, types.ts
│   └── middleware.ts                   # Clerk middleware
├── next.config.ts                      # Image domains (Cloudinary)
├── README.md                           # This file
```

---

## Core Features
- Agent‑first booking with natural language (text + voice)
- Dual roles: Guest and Host with tailored UIs
- Property management (create, edit, delete, images)
- Enhanced booking reliability with transactions and conflict prevention
- Visual date blocking and real‑time overlap detection in forms
- My Trips for guests; property bookings view for hosts

---

## AI Agent
- Tools API flow (GPT‑4o): search → prepare → confirm
- Conversation memory with TTL via `Conversation` model
- Strict prompt rules to always search fresh before booking
- Supports property cards and booking cards in chat

Key files:
- `src/app/api/agent/route.ts`
- `src/lib/agent/` (config, functions, prompts, tools, index)
- `src/app/chat/page.tsx` (chat UI, voice recorder, cards)

---

## Booking System
- Date validation: ISO format, no past, min 1 night, max 365 nights
- Explicit overlap detection: `(existing.from < requested.to) && (existing.to > requested.from)`
- MongoDB transactions for atomic booking creation
- Availability API for pre‑check (single and bulk)
- Host and guest dashboards reflect bookings

Key files:
- `src/app/api/booking/route.ts`
- `src/app/api/availability/route.ts`
- `src/app/api/properties/[id]/bookings/route.ts`
- `src/lib/bookingHelpers.ts`

---

## Image Uploads (Cloudinary)
- Signed uploads via `/api/upload` (keeps secrets server‑side)
- `next.config.ts` allows `res.cloudinary.com` images
- `next-cloudinary` widget in add/edit property forms
- Multiple images with client‑side validation and removal

Key files:
- `src/app/api/upload/route.ts`
- `src/app/host/dashboard/add/AddPropertyForm.tsx`
- `src/app/host/dashboard/edit/[id]/EditPropertyForm.tsx`


---

## Location System
- Structured Country → State/Province → City selector
- Backward compatible with legacy string locations
- Helper methods for display and search across structured fields

Key files:
- `src/components/LocationSelector.tsx`
- `src/lib/models/Property.ts` (supports structured + legacy)
- `src/lib/locationHelpers.ts`


---

## Key Pages & Flows
- Guest
  - Sign up → choose Guest role → browse → chat agent → book
  - My Trips: view upcoming/past, cancel upcoming
- Host
  - Sign up → choose Host role → dashboard → add/edit/delete properties
  - View bookings on property detail page
- Voice
  - Use chat mic → `/api/transcribe` (Whisper) → text → agent tools

---

## API Reference
Base: Next.js App Router under `/api/*`

- Agent
  - `POST /api/agent` → process chat, returns `{ message, properties?, bookings?, conversationId }`

- Booking
  - `POST /api/booking` → create booking (transactional)
    - Body: `{ propertyId, guestId, from, to, totalPrice }`
    - Errors: 400 (validation), 401/403 (auth), 404 (not found), 409 (conflict)
  - `GET /api/booking` → list current user bookings (guest)

- Availability
  - `GET /api/availability?propertyId&from&to`
  - `POST /api/availability` → bulk; `{ propertyId, dateRanges: [{from,to}] }`

- Properties
  - `GET /api/properties` → query by `location`, `maxPrice`, `minGuests`
  - `POST /api/properties` → create (host only)
  - `GET /api/properties/[id]` → single property
  - `PATCH /api/properties/[id]` → update (host + owner)
  - `DELETE /api/properties/[id]` → delete (host + owner)
  - `GET /api/properties/[id]/bookings` → non‑cancelled future bookings for date blocking

- Uploads
  - `POST /api/upload` → Cloudinary signature generation (signed uploads)

- Transcription
  - `POST /api/transcribe` → Whisper transcription (auth required)

- User
  - `POST /api/user/onboard` → create user with role after Clerk sign‑in

- Debug
  - `GET /api/debug/properties` → quick DB inspection of properties (dev aid)

---

## Scripts
```bash
yarn dev          # Start development server
yarn build        # Build for production
yarn start        # Start production server
yarn lint         # Run ESLint
yarn type-check   # Run TypeScript compiler (no emit)
```

---

## Deployment
- Recommended: Vercel
- Steps: push to GitHub → import on Vercel → set env vars → deploy
- Ensure env vars mirror `.env.local`
- Update Clerk allowed domains/redirects and MongoDB Atlas network access

---

## Testing & QA
Manual testing focus areas:
- Booking validation: past dates, invalid order, duration limits, formats
- Conflict prevention: exact/partial overlap, enclosure, adjacent dates
- Transactions: concurrent attempts → first wins, second gets 409
- Availability API: single and bulk checks
- Agent flows: prepare before confirm; cancellation via chat; property/booking cards
- Image uploads: multiple files, invalid types/sizes, removal

Performance expectations:
- Booking < 500ms, availability < 200ms under normal dev conditions

---

## Troubleshooting
- MongoDB connection: verify URI and Atlas network access
- Clerk errors: confirm publishable + secret keys and redirect URLs
- OpenAI errors: check `OPENAI_API_KEY` and credits
- Cloudinary: ensure `paladium` preset (unsigned), env vars set, and dev server restarted
- Signed upload signature errors: check `/api/upload` logs and server secrets
- Voice transcription issues: browser mic permissions, HTTPS in production

---

## Security Notes
- Clerk middleware protects routes; server validates roles and ownership
- Transactions protect data consistency under concurrency
- Secrets live in environment variables; only `NEXT_PUBLIC_*` exposed to client
- APIs validate inputs and avoid leaking sensitive details in errors

---

## License & Contributing
- License: MIT
- Contributions welcome via PRs

---
Built with ❤️ using Next.js and AI.
