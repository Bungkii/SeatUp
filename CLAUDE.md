# CLAUDE.md - Agent Guidance for JongTee (SeatUp)

This document provides context, conventions, and operational guidelines for AI agents working on the **JongTee (SeatUp)** repository.

---

## 📌 Project Architecture Overview

**JongTee (SeatUp)** is a real-time interactive classroom seat reservation system built with Next.js 16 (App Router) and Neon Serverless PostgreSQL.

- **Frontend**: Next.js App Router (`src/app`), React 19, Styled Components, Framer Motion, React-Konva for canvas map rendering.
- **Backend/API**: Next.js Server API Routes (`src/app/api/...`) connecting to Neon DB via `@neondatabase/serverless`.
- **Database**: Neon DB (Serverless PostgreSQL). Client browser code NEVER connects directly to PostgreSQL; all queries pass through `/api/*` endpoints.
- **Realtime Strategy**: High-frequency polling (2.5s interval) from client components to `/api/bookings` and `/api/queues`.

---

## 🚀 Common Commands

```bash
# Start local development server
npm run dev

# Build production bundle
npm run build

# Run linter
npm run lint
```

---

## 🗄️ Database Schema & Architecture (`src/lib/db.ts` / `neon_schema.sql`)

1. **`rooms`**:
   - `id`: UUID (Primary Key)
   - `name`: TEXT
   - `join_code`: TEXT UNIQUE (6-character uppercase code)
   - `layout_config`: JSONB (Array of desk objects `{ id, x, y, label }`)
   - `start_time`, `end_time`: TIMESTAMPTZ (Optional reservation schedule)

2. **`bookings`**:
   - `id`: UUID
   - `room_id`: UUID (FK rooms)
   - `desk_id`: TEXT
   - `user_name`: TEXT
   - `confirmation_name`: TEXT (Optional admin confirmation note)
   - Unique Constraint: `(room_id, desk_id)` (Enforces 1 booking per desk)

3. **`room_zones`**:
   - `id`: UUID
   - `room_id`: UUID (FK rooms)
   - `zone_name`: TEXT
   - `condition_text`: TEXT

4. **`room_queues`**:
   - `id`: UUID
   - `room_id`: UUID (FK rooms)
   - `user_name`: TEXT
   - `created_at`: TIMESTAMPTZ (Used for calculating virtual waiting room rank)

5. **`feedbacks`**:
   - `id`: UUID
   - `message`: TEXT

---

## 🎨 UI/UX & Code Conventions

1. **Database Access Pattern**:
   - Use `sql` tagged template literal from `@neondatabase/serverless` inside `/src/app/api/...` endpoints.
   - Always call `await ensureDatabaseSchema();` at the beginning of API route handlers to guarantee table existence.

2. **Framer Motion Animations**:
   - Wrap view transitions with `AnimatePresence` and `motion.div`.
   - Use interactive props on buttons (`whileHover={{ scale: 1.02 }}`, `whileTap={{ scale: 0.98 }}`).
   - Modal overlays use backdrop blur and spring scale transitions.

3. **Canvas Operations**:
   - `ClassroomCanvas` is dynamically imported with `ssr: false` because Konva requires `window` and `document` DOM objects.

4. **Environment Variables**:
   - `DATABASE_URL`: Primary PostgreSQL connection string for Neon DB. Store in `.env.local`. Never expose in `NEXT_PUBLIC_` variables.

---

## 🔒 Safety & Conventions for Agents

- **DO NOT** commit raw passwords or database credentials in `.env.local`. Keep `.env.example` as reference template.
- **DO NOT** use `@supabase/supabase-js` for new queries. All data access must use the Next.js API Routes + Neon DB pattern.
- Always run `npm run build` to verify type checking and page static generation before completing tasks.
