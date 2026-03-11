# Efikishe App

Production-ready electric delivery platform for Nairobi.

## Stack
- Vite + React (JavaScript)
- Tailwind CSS
- React Router
- Supabase (Auth, Postgres, Realtime, Storage)
- Mapbox (Maps + Geocoding + Routing)
- Netlify deployment config

## Setup
1. Install dependencies:
```bash
npm install
```
2. Copy `.env.example` to `.env` and set:
```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_MAPBOX_TOKEN=...
# optional (server/functions only, never in frontend code):
SUPABASE_SERVICE_ROLE_KEY=...
```
3. In Supabase SQL editor, run:
   - `supabase/schema_v2.sql`
   - `supabase/seed_v2.sql`
4. Enable Realtime on:
   - `orders`
   - `order_status_history`
   - `rider_locations`
5. Start app:
```bash
npm run dev
```
6. If you changed `.env`, stop and restart the dev server so Vite reloads env vars.

## Routes
- `/` Landing
- `/request` Request flow + fare estimate + map route preview
- `/track/:trackingCode` Live tracking
- `/login` Auth
- `/dashboard` Customer dashboard
- `/admin` Admin operations panel

## Production Notes
- Public signup is customer-only.
- Rider creation is admin-only.
- Payments are placeholder-ready (`payment_status`, `payment_reference`, `src/services/payment.js`).
- Notification hooks are placeholder-ready (`src/services/notification.js`).
- If Mapbox token is missing, map blocks degrade gracefully without breaking order draft flow.
- If Supabase env vars are missing, app runs in local preview mode using in-memory mock data.

## Database Coverage (v2)
`schema_v2.sql` includes:
- profiles
- addresses
- services
- vehicle_types
- pricing_configs
- zones
- riders
- bikes
- orders
- order_status_history
- rider_locations
- notifications
- app_settings
- homepage_content
- admin_audit_logs

Also includes:
- indexes
- updated_at triggers
- auth profile bootstrap trigger
- RLS policies by role (customer/admin/rider)
- safe public tracking RPC (`get_public_order_tracking`)

## Netlify
- `netlify.toml` already includes SPA fallback.
- Build command: `npm run build`
- Publish directory: `dist`
