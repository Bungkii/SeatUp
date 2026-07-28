import { NextRequest, NextResponse } from 'next/server';
import { sql, ensureDatabaseSchema } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    await ensureDatabaseSchema();
    const body = await req.json();
    const { message } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const rows = await sql`
      INSERT INTO feedbacks (message)
      VALUES (${message.trim()})
      RETURNING *
    `;

    return NextResponse.json(rows[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error submitting feedback' }, { status: 500 });
  }
}
