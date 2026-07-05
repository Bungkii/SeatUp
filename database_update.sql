-- 1. เพิ่มคอลัมน์ end_time ในตาราง rooms
ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS end_time timestamptz;

-- 2. สร้างตาราง room_queues สำหรับระบบคิว
CREATE TABLE IF NOT EXISTS public.room_queues (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id uuid REFERENCES public.rooms(id) ON DELETE CASCADE,
    user_name text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- เปิดใช้งาน RLS (ถ้าจำเป็น) หรือปล่อยผ่านได้ถ้าปิด RLS ไว้
-- อนุญาตให้ทุกคน insert และ select ได้
ALTER TABLE public.room_queues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous select room_queues" ON public.room_queues FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert room_queues" ON public.room_queues FOR INSERT WITH CHECK (true);
