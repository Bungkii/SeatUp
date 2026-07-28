import { NextRequest, NextResponse } from 'next/server';
import { sql, ensureDatabaseSchema } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseSchema();
    const body = await req.json();
    const { name, join_code, layout_config } = body;

    if (!name || !join_code) {
      return NextResponse.json({ error: 'Name and join_code are required' }, { status: 400 });
    }

    const layoutJson = JSON.stringify(layout_config || []);

    const rows = await sql`
      INSERT INTO rooms (name, join_code, layout_config)
      VALUES (${name}, ${join_code}, ${layoutJson}::jsonb)
      RETURNING *
    `;

    return NextResponse.json(rows[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error creating room' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureDatabaseSchema();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const joinCode = searchParams.get('join_code');

    if (id) {
      const rows = await sql`SELECT * FROM rooms WHERE id = ${id}`;
      return NextResponse.json(rows[0] || null);
    }

    if (joinCode) {
      const rows = await sql`SELECT * FROM rooms WHERE join_code = ${joinCode.toUpperCase()}`;
      return NextResponse.json(rows[0] || null);
    }

    const rows = await sql`SELECT * FROM rooms ORDER BY created_at DESC`;
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching rooms' }, { status: 500 });
  }
}
