import { NextRequest, NextResponse } from 'next/server';
import { sql, ensureDatabaseSchema } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    await ensureDatabaseSchema();
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId');

    if (!roomId) {
      return NextResponse.json({ error: 'roomId parameter is required' }, { status: 400 });
    }

    const rows = await sql`
      SELECT id, room_id, desk_id, user_name, created_at, confirmation_name 
      FROM bookings 
      WHERE room_id = ${roomId} 
      ORDER BY created_at DESC
    `;

    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching bookings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseSchema();
    const body = await req.json();
    const { room_id, desk_id, user_name } = body;

    if (!room_id || !desk_id || !user_name) {
      return NextResponse.json({ error: 'room_id, desk_id, and user_name are required' }, { status: 400 });
    }

    // Check if user already booked in this room
    const existingUserBookings = await sql`
      SELECT id FROM bookings 
      WHERE room_id = ${room_id} 
      AND LOWER(TRIM(user_name)) = LOWER(TRIM(${user_name}))
    `;

    if (existingUserBookings.length > 0) {
      return NextResponse.json({ error: '1 ท่านสามารถจองได้เพียง 1 ที่นั่งเท่านั้น' }, { status: 400 });
    }

    // Check if desk is already taken
    const existingDeskBookings = await sql`
      SELECT id FROM bookings 
      WHERE room_id = ${room_id} AND desk_id = ${desk_id}
    `;

    if (existingDeskBookings.length > 0) {
      return NextResponse.json({ code: '23505', error: 'ที่นั่งนี้ถูกจองไปแล้ว กรุณาเลือกที่นั่งอื่น' }, { status: 409 });
    }

    const rows = await sql`
      INSERT INTO bookings (room_id, desk_id, user_name)
      VALUES (${room_id}, ${desk_id}, ${user_name})
      RETURNING *
    `;

    return NextResponse.json(rows[0]);
  } catch (error: any) {
    if (error.message?.includes('unique') || error.code === '23505') {
      return NextResponse.json({ code: '23505', error: 'ที่นั่งนี้ถูกจองตัดหน้าไปแล้ว กรุณาเลือกที่นั่งอื่น' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || 'Error creating booking' }, { status: 500 });
  }
}
