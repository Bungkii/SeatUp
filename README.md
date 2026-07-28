# 🪑 JongTee (SeatUp) - Classroom Seat Booking System

ระบบจองที่นั่งและจัดแผนผังห้องเรียนออนไลน์ในรูปแบบการ์ด 2D Interactive พร้อมระบบห้องรอคิวอัตโนมัติ (Virtual Waiting Room) และการเชื่อมต่อฐานข้อมูล **Neon DB (Serverless PostgreSQL)**

---

## 🌟 ฟีเจอร์หลัก (Features)

- 🎨 **Interactive Classroom Layout Editor**: แอดมินสามารถออกแบบและจัดวางพิกัดโต๊ะเรียนได้ด้วย Drag & Drop บน Interactive Canvas
- ⏳ **Virtual Waiting Room & Queue System**: ระบบจัดการคิวจองที่นั่งเมื่อผู้ใช้เข้าพร้อมกันหลายคน ป้องกันระบบล่มด้วยการคำนวณคิวเรียลไทม์
- 🎟️ **Instant Booking & Ticket Export**: ผู้เรียนสามารถเลือกโต๊ะ ว่าง/จองแล้ว ยืนยันการจอง และดาวน์โหลดตั๋วหลักฐานเป็นไฟล์รูปภาพ (PNG)
- 📊 **Admin Dashboard & CSV Export**: แอดมินสามารถดูแผนผังการจองสด รายชื่อผู้จอง ส่งออกข้อมูลเป็นไฟล์ CSV และตั้งเวลาเปิด-ปิดการจอง
- 🏷️ **Zone & Condition Management**: กำหนดโซนพิเศษในห้องเรียนพร้อมข้อความอธิบายเงื่อนไขก่อนกดจอง
- 🚀 **Smooth Micro-Animations**: ขับเคลื่อนด้วย Framer Motion เพื่อมอบประสบการณ์การใช้งานที่ลื่นไหลและทันสมัย

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) + React 19
- **Database**: [Neon DB](https://neon.tech/) (Serverless PostgreSQL) ผ่าน `@neondatabase/serverless`
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Canvas Rendering**: [Konva](https://konvajs.org/) / `react-konva`
- **Image Generation**: `html2canvas`
- **Styling**: Tailwind CSS + Styled Components

---

## 📂 โครงสร้างโปรเจกต์ (Project Structure)

```text
SeatUp/
├── neon_schema.sql             # ไฟล์ DDL สกิลเลเอาต์ฐานข้อมูล Neon DB
├── .env.example                # ตัวอย่างการตั้งค่า Environment Variables
├── src/
│   ├── app/
│   │   ├── api/                # Next.js API Routes สำหรับติดต่อ Neon DB
│   │   │   ├── rooms/          # จัดการข้อมูลห้องและแผนผัง
│   │   │   ├── bookings/       # จัดการการจองโต๊ะ
│   │   │   ├── zones/          # จัดการโซนและเงื่อนไข
│   │   │   ├── queues/         # จัดการคิว Virtual Waiting Room
│   │   │   ├── feedbacks/      # จัดการข้อความ Feedback
│   │   │   └── init-db/        # Endpoint สร้างตารางฐานข้อมูลอัตโนมัติ
│   │   ├── room/[id]/          # หน้าเลือกจองที่นั่งสำหรับนักเรียน
│   │   ├── page.tsx            # หน้าหลัก (Landing Page & Host Controls)
│   │   └── layout.tsx
│   ├── components/
│   │   ├── AdminPanel.tsx      # ส่วนสร้างห้องใหม่
│   │   ├── RoomEditor.tsx      # ส่วนแก้ไขแผนผังและ Dashboard ผู้ดูแล
│   │   ├── ClassroomCanvas.tsx # Canvas แผนผังห้องเรียน (Konva)
│   │   └── DialogContext.tsx   # Custom Dialog / Alert System
│   └── lib/
│       └── db.ts               # Neon DB client helper และ schema auto-initializer
```

---

## ⚙️ การตั้งค่า Environment Variables (`.env.local`)

สร้างไฟล์ `.env.local` ในโฟลเดอร์หลักของโปรเจกต์ และใส่ตัวแปรการเชื่อมต่อฐานข้อมูล Neon DB:

```env
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@YOUR_NEON_HOST/neondb?sslmode=require"
```

---

## 🚀 ขั้นตอนการติดตั้งและรันโปรเจกต์ (Getting Started)

1. **ติดตั้ง Dependencies**:
   ```bash
   npm install
   ```

2. **รันเซิร์ฟเวอร์ในโหมดพัฒนา**:
   ```bash
   npm run dev
   ```

3. **เข้าใช้งานผ่านเบราว์เซอร์**:
   เปิด [http://localhost:3000](http://localhost:3000)

4. **สร้างตารางในฐานข้อมูล (Auto-init)**:
   สามารถเข้าถึง `http://localhost:3000/api/init-db` ในเบราว์เซอร์เพื่อรันคำสั่งสร้างตารางบน Neon DB ได้โดยอัตโนมัติ

---

## 📜 ฐานข้อมูล (Database Schema)

ตารางหลักใน Neon DB:
1. `rooms` — เก็บข้อมูลชื่อห้อง, รหัสลับ (join_code), พิกัดโต๊ะ (layout_config), เวลาเปิด-ปิดจอง
2. `bookings` — เก็บข้อมูลการจองโต๊ะ (`room_id`, `desk_id`, `user_name`, `confirmation_name`)
3. `room_zones` — เก็บข้อมูลแบ่งโซนและเงื่อนไข
4. `room_queues` — เก็บข้อมูลคิวนักเรียนใน Virtual Waiting Room
5. `feedbacks` — เก็บข้อความข้อเสนอแนะจากผู้ใช้

---

## 🛠️ คำสั่งสำหรับบิลด์และตรวจทาน (Commands)

```bash
# พัฒนา (Development)
npm run dev

# บิลด์สำหรับการผลิต (Production Build)
npm run build

# ตรวจสอบโค้ด (Linting)
npm run lint
```
