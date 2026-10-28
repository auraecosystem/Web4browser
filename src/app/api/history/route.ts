import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const sessions = await prisma.searchSession.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  return NextResponse.json(sessions);
}
