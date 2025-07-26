
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

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

    const { action } = await request.json();
    const meetingId = params.id;

    // Get meeting with files
    const meeting = await prisma.meeting.findFirst({
      where: {
        id: meetingId,
        project: {
          userId: session.user.id,
        },
      },
      include: {
        files: true,
        project: true,
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    if (action === 'generate_summary') {
      return await generateSummary(meeting);
    } else if (action === 'extract_actions') {
      return await extractActions(meeting);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing meeting:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateSummary(meeting: any) {
  try {
    // Prepare content from files
    let content = `Meeting: ${meeting.title}\nDate: ${meeting.date}\n\n`;
    
    // For this demo, we'll use the meeting title and any existing content
    // In a real implementation, you'd process the actual file content
    if (meeting.files.length > 0) {
      content += "Files processed:\n";
      meeting.files.forEach((file: any) => {
        content += `- ${file.originalName} (${file.type})\n`;
      });
    }

    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a business consultant assistant. Generate concise meeting summaries focusing on key decisions, action items, and outcomes.'
          },
          {
            role: 'user',
            content: `Please generate a professional summary for this business meeting:\n\n${content}`
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate summary');
    }

    const data = await response.json();
    const summary = data.choices[0]?.message?.content || 'Failed to generate summary';

    // Update meeting with summary
    await prisma.meeting.update({
      where: { id: meeting.id },
      data: { summary },
    });

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error generating summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}

async function extractActions(meeting: any) {
  try {
    let content = `Meeting: ${meeting.title}\nDate: ${meeting.date}\n`;
    if (meeting.summary) {
      content += `\nSummary: ${meeting.summary}\n`;
    }

    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: `You are a business consultant assistant. Extract actionable items from meeting content and return them as JSON.
            
            Please respond in JSON format with the following structure:
            {
              "actions": [
                {
                  "title": "Action title",
                  "description": "Action description",
                  "startDate": "2024-01-15",
                  "endDate": "2024-01-30",
                  "estimatedHours": 2,
                  "priority": 3
                }
              ]
            }
            
            Respond with raw JSON only. Do not include code blocks, markdown, or any other formatting.`
          },
          {
            role: 'user',
            content: `Extract actionable items from this meeting content:\n\n${content}`
          }
        ],
        max_tokens: 1000,
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to extract actions');
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0]?.message?.content || '{"actions": []}');

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error extracting actions:', error);
    return NextResponse.json(
      { error: 'Failed to extract actions' },
      { status: 500 }
    );
  }
}
