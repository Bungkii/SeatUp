import { NextRequest, NextResponse } from 'next/server';
import { sql, ensureDatabaseSchema } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseSchema();
    const { id } = await params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    let rows;
    if (uuidRegex.test(id)) {
      rows = await sql`SELECT * FROM rooms WHERE id = ${id}`;
    } else {
      rows = await sql`SELECT * FROM rooms WHERE join_code = ${id.toUpperCase()}`;
    }

    return NextResponse.json(rows[0] || null);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching room' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseSchema();
    const { id } = await params;
    const body = await req.json();

    if ('layout_config' in body) {
      const layoutJson = JSON.stringify(body.layout_config);
      const rows = await sql`
        UPDATE rooms 
        SET layout_config = ${layoutJson}::jsonb 
        WHERE id = ${id}
        RETURNING *
      `;
      return NextResponse.json(rows[0] || null);
    }

    if ('start_time' in body || 'end_time' in body) {
      const startTime = body.start_time || null;
      const endTime = body.end_time || null;
      const rows = await sql`
        UPDATE rooms 
        SET start_time = ${startTime}, end_time = ${endTime} 
        WHERE id = ${id}
        RETURNING *
      `;
      return NextResponse.json(rows[0] || null);
    }

    return NextResponse.json({ error: 'No valid update fields provided' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error updating room' }, { status: 500 });
  }
}
