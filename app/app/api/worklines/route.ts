
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const worklines = await prisma.workline.findMany({
      where: {
        projectId: projectId,
      },
      orderBy: {
        order: 'asc',
      },
    });

    return NextResponse.json(worklines);
  } catch (error) {
    console.error('Error fetching worklines:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, color, projectId } = await request.json();

    if (!name?.trim() || !projectId) {
      return NextResponse.json(
        { error: 'Name and project ID are required' },
        { status: 400 }
      );
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get next order
    const lastWorkline = await prisma.workline.findFirst({
      where: { projectId },
      orderBy: { order: 'desc' },
    });

    const workline = await prisma.workline.create({
      data: {
        name: name.trim(),
        color: color || '#FFD700',
        projectId: projectId,
        order: (lastWorkline?.order ?? 0) + 1,
      },
    });

    return NextResponse.json(workline);
  } catch (error) {
    console.error('Error creating workline:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
