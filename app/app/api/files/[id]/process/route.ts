
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { readFile } from 'fs/promises';
import { join } from 'path';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const fileId = params.id;

    // Get file record
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        project: {
          userId: session.user.id,
        },
      },
      include: {
        project: true,
      },
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    if (file.processed) {
      return NextResponse.json({ error: 'File already processed' }, { status: 400 });
    }

    // Read file from disk
    const filepath = join(process.cwd(), 'uploads', file.name);
    const buffer = await readFile(filepath);

    // Process file data
    const result = await processFileData(buffer, file.type, file.project.id);

    // Mark file as processed
    await prisma.file.update({
      where: { id: fileId },
      data: { processed: true },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing file:', error);
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
