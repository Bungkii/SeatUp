import { NextRequest, NextResponse } from 'next/server';
import { sql, ensureDatabaseSchema } from '@/lib/db';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseSchema();
    const { id } = await params;
    await sql`DELETE FROM bookings WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error deleting booking' }, { status: 500 });
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
    const { confirmation_name } = body;

    const rows = await sql`
      UPDATE bookings 
      SET confirmation_name = ${confirmation_name} 
      WHERE id = ${id} 
      RETURNING *
    `;

    return NextResponse.json(rows[0] || null);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error updating booking' }, { status: 500 });
  }
}
