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
      SELECT * FROM room_zones 
      WHERE room_id = ${roomId} 
      ORDER BY created_at ASC
    `;

    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching zones' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseSchema();
    const body = await req.json();
    const { room_id, zone_name, condition_text } = body;

    if (!room_id || !zone_name) {
      return NextResponse.json({ error: 'room_id and zone_name are required' }, { status: 400 });
    }

    const rows = await sql`
      INSERT INTO room_zones (room_id, zone_name, condition_text)
      VALUES (${room_id}, ${zone_name}, ${condition_text || null})
      RETURNING *
    `;

    return NextResponse.json(rows[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error creating zone' }, { status: 500 });
  }
}
