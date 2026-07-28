import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not defined.');
}

export const sql = neon(databaseUrl);

let initialized = false;

export async function ensureDatabaseSchema() {
  if (initialized) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS rooms (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          layout_config JSONB DEFAULT '[]'::jsonb,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          join_code TEXT UNIQUE,
          start_time TIMESTAMPTZ,
          end_time TIMESTAMPTZ
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS bookings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
          desk_id TEXT NOT NULL,
          user_name TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          confirmation_name TEXT,
          CONSTRAINT unique_room_desk UNIQUE(room_id, desk_id)
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS room_zones (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
          zone_name TEXT NOT NULL,
          condition_text TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS room_queues (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
          user_name TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS feedbacks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          message TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    initialized = true;
  } catch (err) {
    console.error('Failed to initialize database schema:', err);
  }
}
