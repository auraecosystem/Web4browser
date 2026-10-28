import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const sessions = await prisma.searchSession.findMany({
      where: { userId }, orderBy: { createdAt: 'desc' }, take: 10,
      select: { id: true, createdAt: true, routingParams: true, query: true, aiResponse: true }
    });
    return NextResponse.json(sessions, { headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
  } catch (error) {
    console.error('Unable to load search history:', error);
    return NextResponse.json({ error: 'History unavailable' }, { status: 500 });
  }
}
