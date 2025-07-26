

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const REQUIRED_COLUMNS = [
  'name',
  'description', 
  'owner',
  'status',
  'startDate',
  'deadline',
  'estimatedHours',
  'priority'
];

const VALID_STATUSES = ['pending', 'in_progress', 'completed', 'critical'];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { csvData } = await request.json();

    if (!csvData || !Array.isArray(csvData) || csvData.length === 0) {
      return NextResponse.json(
        { error: 'CSV data is required' },
        { status: 400 }
      );
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate headers (first row)
    const headers = csvData[0];
    const missingColumns = REQUIRED_COLUMNS.filter(col => !headers.includes(col));
    
    if (missingColumns.length > 0) {
      errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    // Validate data rows
    const dataRows = csvData.slice(1);
    const validatedRows: any[] = [];

    dataRows.forEach((row: any, index: number) => {
      const rowNum = index + 2; // +2 because of header row and 0-based index
      const taskData: any = {};

      // Map headers to data
      headers.forEach((header: string, headerIndex: number) => {
        taskData[header] = row[headerIndex];
      });

      // Validate required fields
      if (!taskData.name?.trim()) {
        errors.push(`Row ${rowNum}: Task name is required`);
      }

      // Validate status
      if (taskData.status && !VALID_STATUSES.includes(taskData.status)) {
        errors.push(`Row ${rowNum}: Invalid status "${taskData.status}". Must be one of: ${VALID_STATUSES.join(', ')}`);
      }

      // Validate dates
      if (taskData.startDate && isNaN(Date.parse(taskData.startDate))) {
        errors.push(`Row ${rowNum}: Invalid start date format`);
      }

      if (taskData.deadline && isNaN(Date.parse(taskData.deadline))) {
        errors.push(`Row ${rowNum}: Invalid deadline format`);
      }

      // Validate estimated hours
      if (taskData.estimatedHours) {
        const hours = parseInt(taskData.estimatedHours);
        if (isNaN(hours) || hours < 1 || hours > 24) {
          errors.push(`Row ${rowNum}: Estimated hours must be between 1 and 24`);
        }
      }

      // Validate priority
      if (taskData.priority) {
        const priority = parseInt(taskData.priority);
        if (isNaN(priority) || priority < 1 || priority > 5) {
          errors.push(`Row ${rowNum}: Priority must be between 1 and 5`);
        }
      }

      // Add warning for missing optional fields
      if (!taskData.description?.trim()) {
        warnings.push(`Row ${rowNum}: Description is empty`);
      }

      if (!taskData.owner?.trim()) {
        warnings.push(`Row ${rowNum}: Owner is not specified`);
      }

      validatedRows.push(taskData);
    });

    // Limit preview to 40 rows
    const previewRows = validatedRows.slice(0, 40);

    return NextResponse.json({
      isValid: errors.length === 0,
      errors,
      warnings,
      totalRows: dataRows.length,
      previewRows,
      requiredColumns: REQUIRED_COLUMNS,
      validStatuses: VALID_STATUSES,
    });
  } catch (error) {
    console.error('Error validating CSV:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
