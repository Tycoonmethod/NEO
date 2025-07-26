

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tasks, projectId } = await request.json();

    if (!tasks || !Array.isArray(tasks) || !projectId) {
      return NextResponse.json(
        { error: 'Tasks array and project ID are required' },
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

    // Validate and process tasks
    const processedTasks = tasks.map((task: any) => {
      // Validate required fields
      if (!task.name?.trim()) {
        throw new Error(`Task name is required`);
      }

      return {
        title: task.name.trim(),
        description: task.description?.trim() || null,
        owner: task.owner?.trim() || null,
        startDate: task.startDate ? new Date(task.startDate) : null,
        endDate: task.deadline ? new Date(task.deadline) : null,
        estimatedHours: parseInt(task.estimatedHours) || 1,
        priority: parseInt(task.priority) || 1,
        status: task.status || 'pending',
        projectId: projectId,
      };
    });

    // Create tasks in batch
    const createdTasks = await prisma.$transaction(
      processedTasks.map((task: any) =>
        prisma.action.create({
          data: task,
          include: {
            workline: true,
            meeting: true,
          },
        })
      )
    );

    return NextResponse.json({
      message: `Successfully created ${createdTasks.length} tasks`,
      tasks: createdTasks,
    });
  } catch (error) {
    console.error('Error bulk uploading tasks:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
