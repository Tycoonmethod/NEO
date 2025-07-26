
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const projectId = formData.get('projectId') as string;
    const files = formData.getAll('files') as File[];

    if (!projectId || files.length === 0) {
      return NextResponse.json(
        { error: 'Project ID and files are required' },
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

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    const uploadedFiles = [];
    let processingResult = null;

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = `${Date.now()}-${file.name}`;
      const filepath = join(uploadsDir, filename);
      
      await writeFile(filepath, buffer);

      // Determine file type
      let fileType = 'other';
      if (file.name.endsWith('.csv')) {
        fileType = 'csv';
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        fileType = 'excel';
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
          processed: false,
          projectId: projectId,
        },
      });

      uploadedFiles.push(fileRecord);

      // Auto-process the first file for demo
      if (uploadedFiles.length === 1) {
        processingResult = await processFileData(buffer, fileType, projectId);
      }
    }

    return NextResponse.json({ 
      message: 'Files uploaded successfully',
      files: uploadedFiles,
      processingResult 
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processFileData(buffer: Buffer, fileType: string, projectId: string) {
  try {
    let data: any[] = [];
    let errors: string[] = [];

    if (fileType === 'csv') {
      const csvText = buffer.toString('utf-8');
      const parseResult = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
      });
      
      data = parseResult.data;
      if (parseResult.errors.length > 0) {
        errors = parseResult.errors.map(err => err.message);
      }
    } else if (fileType === 'excel') {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      data = XLSX.utils.sheet_to_json(worksheet);
    }

    // Validate required fields
    const requiredFields = ['action', 'description', 'start_date', 'end_date', 'status'];
    const normalizedFields = ['title', 'description', 'startDate', 'endDate', 'status'];
    
    let actionsCreated = 0;
    const preview = data.slice(0, 5);

    for (const row of data) {
      try {
        // Normalize field names (case insensitive)
        const normalizedRow: any = {};
        Object.keys(row).forEach(key => {
          const lowerKey = key.toLowerCase().replace(/[^a-z]/g, '');
          if (lowerKey.includes('action') || lowerKey.includes('title')) {
            normalizedRow.title = row[key];
          } else if (lowerKey.includes('description')) {
            normalizedRow.description = row[key];
          } else if (lowerKey.includes('startdate') || lowerKey.includes('start')) {
            normalizedRow.startDate = row[key];
          } else if (lowerKey.includes('enddate') || lowerKey.includes('end')) {
            normalizedRow.endDate = row[key];
          } else if (lowerKey.includes('status')) {
            normalizedRow.status = row[key];
          }
        });

        if (!normalizedRow.title) {
          errors.push(`Row missing action/title: ${JSON.stringify(row)}`);
          continue;
        }

        // Create action
        await prisma.action.create({
          data: {
            title: normalizedRow.title,
            description: normalizedRow.description || null,
            startDate: normalizedRow.startDate ? new Date(normalizedRow.startDate) : null,
            endDate: normalizedRow.endDate ? new Date(normalizedRow.endDate) : null,
            status: normalizedRow.status || 'pending',
            estimatedHours: 1,
            priority: 1,
            projectId: projectId,
          },
        });
        
        actionsCreated++;
      } catch (err) {
        errors.push(`Error processing row: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    return {
      success: errors.length === 0 || actionsCreated > 0,
      actionsCreated,
      errors,
      preview,
    };
  } catch (error) {
    return {
      success: false,
      actionsCreated: 0,
      errors: [error instanceof Error ? error.message : 'Unknown processing error'],
      preview: [],
    };
  }
}
