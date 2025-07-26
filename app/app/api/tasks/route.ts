

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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '40');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const owner = searchParams.get('owner');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

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

    // Build where clause for filtering
    const whereClause: any = {
      projectId: projectId,
    };

    if (owner) {
      whereClause.owner = {
        contains: owner,
        mode: 'insensitive'
      };
    }

    if (status) {
      whereClause.status = status;
    }

    if (priority) {
      whereClause.priority = parseInt(priority);
    }

    // Build orderBy clause
    const orderByClause: any = {};
    if (sortBy === 'alphabetical') {
      orderByClause.title = sortOrder;
    } else if (sortBy === 'owner') {
      orderByClause.owner = sortOrder;
    } else if (sortBy === 'estimatedHours') {
      orderByClause.estimatedHours = sortOrder;
    } else if (sortBy === 'priority') {
      orderByClause.priority = sortOrder;
    } else if (sortBy === 'startDate') {
      orderByClause.startDate = sortOrder;
    } else if (sortBy === 'endDate') {
      orderByClause.endDate = sortOrder;
    } else {
      orderByClause.createdAt = sortOrder;
    }

    const skip = (page - 1) * limit;

    const [tasks, totalCount] = await Promise.all([
      prisma.action.findMany({
        where: whereClause,
        include: {
          workline: true,
          meeting: true,
        },
        orderBy: orderByClause,
        skip,
        take: limit,
      }),
      prisma.action.count({
        where: whereClause,
      }),
    ]);

    return NextResponse.json({
      tasks,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
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

    const { 
      title, 
      description, 
      owner,
      startDate, 
      endDate, 
      estimatedHours, 
      priority, 
      status,
      projectId,
      worklineId 
    } = await request.json();

    if (!title?.trim() || !projectId) {
      return NextResponse.json(
        { error: 'Title and project ID are required' },
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

    const task = await prisma.action.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        owner: owner?.trim() || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        estimatedHours: estimatedHours || 1,
        priority: priority || 1,
        status: status || 'pending',
        projectId: projectId,
        worklineId: worklineId || null,
      },
      include: {
        workline: true,
        meeting: true,
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
