
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // Verify action ownership through project
    const existingAction = await prisma.action.findFirst({
      where: {
        id: params.id,
        project: {
          userId: session.user.id,
        },
      },
    });

    if (!existingAction) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    const action = await prisma.action.update({
      where: { id: params.id },
      data: {
        ...(data.title && { title: data.title.trim() }),
        ...(data.description !== undefined && { description: data.description?.trim() || null }),
        ...(data.startDate !== undefined && { startDate: data.startDate ? new Date(data.startDate) : null }),
        ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
        ...(data.estimatedHours && { estimatedHours: data.estimatedHours }),
        ...(data.actualHours !== undefined && { actualHours: data.actualHours }),
        ...(data.status && { status: data.status }),
        ...(data.priority && { priority: data.priority }),
        ...(data.worklineId !== undefined && { worklineId: data.worklineId }),
        ...(data.completedAt !== undefined && { completedAt: data.completedAt ? new Date(data.completedAt) : null }),
      },
      include: {
        workline: true,
        meeting: true,
      },
    });

    return NextResponse.json(action);
  } catch (error) {
    console.error('Error updating action:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify action ownership through project
    const existingAction = await prisma.action.findFirst({
      where: {
        id: params.id,
        project: {
          userId: session.user.id,
        },
      },
    });

    if (!existingAction) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    await prisma.action.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Action deleted successfully' });
  } catch (error) {
    console.error('Error deleting action:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
