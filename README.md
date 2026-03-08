# Efikishe App

Production-focused electric delivery platform for Nairobi.

## Stack
- Vite + React (JavaScript)
- Tailwind CSS
- React Router
- Supabase (Auth, Postgres, Realtime, Storage-ready)
- Google Maps (Places + Directions + Traffic)
- Netlify deployment config

## Folder Structure
```txt
.
├─ netlify/
│  └─ functions/
│     └─ health.js
├─ public/
├─ src/
│  ├─ components/
│  │  ├─ admin/
│  │  └─ common/
│  ├─ hooks/
│  ├─ layouts/
│  ├─ lib/
│  ├─ pages/
│  ├─ services/
│  ├─ styles/
│  └─ utils/
├─ supabase/
│  ├─ schema.sql
│  └─ seed.sql
├─ .env.example
├─ index.html
├─ netlify.toml
├─ package.json
└─ vite.config.js
```

## Routes
- `/` landing
- `/request` request flow + fare estimate + map preview
- `/track/:trackingCode` realtime tracking
- `/login` customer auth + password reset
- `/dashboard` customer orders/history
- `/admin` admin control center

## Setup
1. Install dependencies:
```bash
npm install
```
2. Create `.env` from `.env.example` and set Supabase keys.
3. In Supabase SQL editor, run:
   - `supabase/schema.sql`
   - `supabase/seed.sql`
4. Enable Realtime for `orders`, `order_status_history`, and `rider_locations` tables.
5. Run locally:
```bash
npm run dev
```

## Run Without Database (Demo Mode)
- Leave `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` unset.
- The app auto-starts with local mock data and demo auth.
- Use `/login` to switch demo roles (customer/admin/rider).
- Realtime uses lightweight polling in demo mode.

## Supabase Notes
- Public signup is customer-only (`role=customer`).
- Rider signup is hidden; riders are admin-provisioned.
- Roles are stored in `profiles` and enforced with RLS.
- Realtime updates:
  - Tracking page subscribes to `orders`, `order_status_history`, `rider_locations`.
  - Admin live map has rider simulation for testing.

## Admin Simulation Mode
In `/admin` -> `live map`, click `Run Rider Simulation`.
- Writes location updates into `rider_locations`
- Mirrors latest position to `bikes`
- Progresses order status until `delivered`

## Netlify Deployment
- `netlify.toml` already configured.
- Build: `npm run build`
- Publish dir: `dist`
- SPA fallback redirect to `index.html`

## Environment Variables
```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_GOOGLE_MAPS_API_KEY=...
```

## Architecture Summary
- Thin route pages, shared logic in `services/` and `utils/`
- `useAuth` centralizes session + profile role handling
- `api.js` contains Supabase queries/mutations
- `pricing.js` computes fare from admin-configurable service/rule/zone data
- `MapView` renders Google map traffic layer + route alternatives + markers
