import { createClient } from '@supabase/supabase-js'

// ใช้ as string แทน ! และใส่ค่า fallback เป็นสตริงว่างเพื่อป้องกันระบบล่ม
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string || ''

// เอาไว้แจ้งเตือนตัวเองใน Console ตอนที่เผลอลบตัวแปรทิ้ง
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase Environment Variables are missing")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
