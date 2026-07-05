-- =======================================================================================
-- JONGTEE - FULL SUPABASE DATABASE SCHEMA
-- This file contains all necessary tables, policies, and settings for the JongTee project.
-- =======================================================================================

-- 1. Create `rooms` table
CREATE TABLE IF NOT EXISTS public.rooms (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    layout_config jsonb DEFAULT '[]'::jsonb,
    created_at timestamptz DEFAULT now(),
    join_code text UNIQUE,
    start_time timestamptz,
    end_time timestamptz
);

-- 2. Create `bookings` table (updated with confirmation_name)
CREATE TABLE IF NOT EXISTS public.bookings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id uuid REFERENCES public.rooms(id) ON DELETE CASCADE,
    desk_id text NOT NULL,
    user_name text NOT NULL,
    created_at timestamptz DEFAULT now(),
    confirmation_name text, -- ชื่อการยืนยันหลังจอง
    UNIQUE(room_id, desk_id)
);

-- 3. Create `room_zones` table for custom zones and conditions
CREATE TABLE IF NOT EXISTS public.room_zones (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id uuid REFERENCES public.rooms(id) ON DELETE CASCADE,
    zone_name text NOT NULL,
    condition_text text, -- ข้อความเงื่อนไขที่ผู้ดูแลตั้งค่า
    created_at timestamptz DEFAULT now()
);

-- Enable RLS for new tables
ALTER TABLE public.room_zones ENABLE ROW LEVEL SECURITY;

-- Policies for room_zones (allow anonymous read/insert/update/delete similar to bookings)
DROP POLICY IF EXISTS "Allow anonymous select room_zones" ON public.room_zones;
CREATE POLICY "Allow anonymous select room_zones" ON public.room_zones FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow anonymous insert room_zones" ON public.room_zones;
CREATE POLICY "Allow anonymous insert room_zones" ON public.room_zones FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anonymous update room_zones" ON public.room_zones;
CREATE POLICY "Allow anonymous update room_zones" ON public.room_zones FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow anonymous delete room_zones" ON public.room_zones;
CREATE POLICY "Allow anonymous delete room_zones" ON public.room_zones FOR DELETE USING (true);

-- 3. Create `room_queues` table (Virtual Waiting Room)
CREATE TABLE IF NOT EXISTS public.room_queues (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id uuid REFERENCES public.rooms(id) ON DELETE CASCADE,
    user_name text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- =======================================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS for all tables to control access
-- =======================================================================================

-- Enable RLS
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_queues ENABLE ROW LEVEL SECURITY;

-- `rooms` policies: allow anonymous access for reading and creating rooms
DROP POLICY IF EXISTS "Allow anonymous select rooms" ON public.rooms;
CREATE POLICY "Allow anonymous select rooms" ON public.rooms FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow anonymous insert rooms" ON public.rooms;
CREATE POLICY "Allow anonymous insert rooms" ON public.rooms FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anonymous update rooms" ON public.rooms;
CREATE POLICY "Allow anonymous update rooms" ON public.rooms FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow anonymous delete rooms" ON public.rooms;
CREATE POLICY "Allow anonymous delete rooms" ON public.rooms FOR DELETE USING (true);

-- `bookings` policies: allow anonymous access for reading and booking
DROP POLICY IF EXISTS "Allow anonymous select bookings" ON public.bookings;
CREATE POLICY "Allow anonymous select bookings" ON public.bookings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow anonymous insert bookings" ON public.bookings;
CREATE POLICY "Allow anonymous insert bookings" ON public.bookings FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anonymous update bookings" ON public.bookings;
CREATE POLICY "Allow anonymous update bookings" ON public.bookings FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow anonymous delete bookings" ON public.bookings;
CREATE POLICY "Allow anonymous delete bookings" ON public.bookings FOR DELETE USING (true);

-- `room_queues` policies: allow anonymous access for waiting room queue
DROP POLICY IF EXISTS "Allow anonymous select room_queues" ON public.room_queues;
CREATE POLICY "Allow anonymous select room_queues" ON public.room_queues FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow anonymous insert room_queues" ON public.room_queues;
CREATE POLICY "Allow anonymous insert room_queues" ON public.room_queues FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anonymous update room_queues" ON public.room_queues;
CREATE POLICY "Allow anonymous update room_queues" ON public.room_queues FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow anonymous delete room_queues" ON public.room_queues;
CREATE POLICY "Allow anonymous delete room_queues" ON public.room_queues FOR DELETE USING (true);

/*
-- =======================================================================================
-- REALTIME ENABLEMENT
-- Allows Next.js frontend to receive instant updates without refreshing
-- =======================================================================================
-- Note: You may also need to configure Replication settings in Supabase Dashboard -> Database -> Replication.
-- Ensure that `rooms`, `bookings`, and `room_queues` are checked for Insert/Update/Delete events.
*/
