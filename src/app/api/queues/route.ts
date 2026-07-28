import { NextRequest, NextResponse } from 'next/server';
import { sql, ensureDatabaseSchema } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    await ensureDatabaseSchema();
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId');
    const createdAt = searchParams.get('createdAt');

    if (!roomId) {
      return NextResponse.json({ error: 'roomId parameter is required' }, { status: 400 });
    }

    if (createdAt) {
      const rows = await sql`
        SELECT COUNT(*)::int AS count 
        FROM room_queues 
        WHERE room_id = ${roomId} AND created_at < ${createdAt}
      `;
      return NextResponse.json({ count: rows[0]?.count || 0 });
    }

    const rows = await sql`
      SELECT COUNT(*)::int AS count 
      FROM room_queues 
      WHERE room_id = ${roomId}
    `;
    return NextResponse.json({ count: rows[0]?.count || 0 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching queue count' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseSchema();
    const body = await req.json();
    const { room_id, user_name } = body;

    if (!room_id || !user_name) {
      return NextResponse.json({ error: 'room_id and user_name are required' }, { status: 400 });
    }

    const rows = await sql`
      INSERT INTO room_queues (room_id, user_name)
      VALUES (${room_id}, ${user_name})
      RETURNING *
    `;

    return NextResponse.json(rows[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error joining queue' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await ensureDatabaseSchema();
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId');
    const userName = searchParams.get('userName');

    if (!roomId || !userName) {
      return NextResponse.json({ error: 'roomId and userName parameters are required' }, { status: 400 });
    }

    await sql`
      DELETE FROM room_queues 
      WHERE room_id = ${roomId} AND user_name = ${userName}
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error deleting queue' }, { status: 500 });
  }
}
