import { NextResponse } from 'next/server';
import { ensureDatabaseSchema } from '@/lib/db';

export async function GET() {
  try {
    await ensureDatabaseSchema();
    return NextResponse.json({ success: true, message: 'Database schema initialized successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to initialize database' }, { status: 500 });
  }
}
