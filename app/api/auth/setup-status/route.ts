import { NextResponse } from 'next/server';
import { countUsers } from '@/lib/server-db';

export async function GET() {
  try {
    const userCount = await countUsers();
    return NextResponse.json({
      initialized: userCount > 0,
      userCount
    });
  } catch (err) {
    console.error('[/api/auth/setup-status]', err);
    return NextResponse.json({ initialized: true, userCount: 1 });
  }
}
