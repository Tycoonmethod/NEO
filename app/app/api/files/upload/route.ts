
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const meetingId = formData.get('meetingId') as string;
    const files = formData.getAll('files') as File[];

    if (!meetingId || files.length === 0) {
      return NextResponse.json(
        { error: 'Meeting ID and files are required' },
        { status: 400 }
      );
    }

    // Verify meeting ownership
    const meeting = await prisma.meeting.findFirst({
      where: {
        id: meetingId,
        project: {
          userId: session.user.id,
        },
      },
      include: {
        project: true,
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    const uploadedFiles = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = `${Date.now()}-${file.name}`;
      const filepath = join(uploadsDir, filename);
      
      await writeFile(filepath, buffer);

      // Determine file type
      let fileType = 'other';
      if (file.type.includes('word') || file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
        fileType = 'word';
      } else if (file.type.includes('audio') || ['.mp3', '.wav', '.m4a'].some(ext => file.name.endsWith(ext))) {
        fileType = 'audio';
      } else if (file.type.includes('text') || file.name.endsWith('.txt')) {
        fileType = 'text';
      }

      // Save file record to database
      const fileRecord = await prisma.file.create({
        data: {
          name: filename,
          originalName: file.name,
          path: `/uploads/${filename}`,
          mimeType: file.type,
          size: file.size,
          type: fileType,
          processed: false, // Will be set to true after AI processing
          projectId: meeting.project.id,
          meetingId: meetingId,
        },
      });

      uploadedFiles.push(fileRecord);
    }

    // Here you would typically trigger AI processing of the files
    // For now, we'll mark them as processed
    await prisma.file.updateMany({
      where: {
        id: { in: uploadedFiles.map(f => f.id) },
      },
      data: {
        processed: true,
      },
    });

    return NextResponse.json({ 
      message: 'Files uploaded successfully',
      files: uploadedFiles 
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
