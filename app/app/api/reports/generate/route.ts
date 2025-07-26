
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

    const { projectId, config } = await request.json();

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
      include: {
        actions: {
          include: {
            workline: true,
          },
        },
        worklines: true,
        meetings: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Generate HTML report
    const html = generateReportHTML(project, config);

    // For demo purposes, we'll return a simple PDF-like response
    // In production, you'd use puppeteer or similar to generate actual PDF
    const pdfBuffer = Buffer.from(html, 'utf8');

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${project.name}_report.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateReportHTML(project: any, config: any) {
  const stats = calculateProjectStats(project);
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${config.title || project.name + ' Report'}</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      background: white;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #FFD700;
      padding-bottom: 20px;
      margin-bottom: 40px;
    }
    .header h1 {
      color: #FFD700;
      font-size: 2.5em;
      margin: 0;
    }
    .header .subtitle {
      color: #666;
      font-size: 1.1em;
      margin-top: 10px;
    }
    .section {
      margin-bottom: 40px;
      page-break-inside: avoid;
    }
    .section h2 {
      color: #333;
      border-left: 4px solid #FFD700;
      padding-left: 15px;
      font-size: 1.5em;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }
    .kpi-card {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #FFD700;
      text-align: center;
    }
    .kpi-number {
      font-size: 2em;
      font-weight: bold;
      color: #FFD700;
      display: block;
    }
    .kpi-label {
      color: #666;
      font-size: 0.9em;
      margin-top: 5px;
    }
    .workline {
      background: #f8f9fa;
      margin: 15px 0;
      padding: 15px;
      border-radius: 8px;
    }
    .workline-name {
      font-weight: bold;
      margin-bottom: 10px;
    }
    .progress-bar {
      background: #e9ecef;
      height: 20px;
      border-radius: 10px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: #FFD700;
      transition: width 0.3s ease;
    }
    .actions-list {
      list-style: none;
      padding: 0;
    }
    .actions-list li {
      background: white;
      margin: 10px 0;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #FFD700;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .action-title {
      font-weight: bold;
      color: #333;
    }
    .action-meta {
      color: #666;
      font-size: 0.9em;
      margin-top: 5px;
    }
    .status-completed { color: #28a745; }
    .status-pending { color: #ffc107; }
    .status-critical { color: #dc3545; }
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #e9ecef;
      text-align: center;
      color: #666;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${config.title || project.name + ' Executive Report'}</h1>
    <div class="subtitle">Generated on ${new Date().toLocaleDateString()}</div>
  </div>

  <div class="section">
    <h2>Executive Summary</h2>
    <p>
      This report provides a comprehensive overview of the <strong>${project.name}</strong> project, 
      including key performance indicators, progress metrics, and actionable insights. 
      The project currently has ${stats.totalActions} total actions with a completion rate of ${stats.progressPercentage}%.
    </p>
  </div>

  ${config.includeCharts ? `
  <div class="section">
    <h2>Key Performance Indicators</h2>
    <div class="kpi-grid">
      <div class="kpi-card">
        <span class="kpi-number">${stats.totalActions}</span>
        <div class="kpi-label">Total Actions</div>
      </div>
      <div class="kpi-card">
        <span class="kpi-number">${stats.completedActions}</span>
        <div class="kpi-label">Completed Actions</div>
      </div>
      <div class="kpi-card">
        <span class="kpi-number">${stats.criticalActions}</span>
        <div class="kpi-label">Critical Actions</div>
      </div>
      <div class="kpi-card">
        <span class="kpi-number">${stats.progressPercentage}%</span>
        <div class="kpi-label">Progress</div>
      </div>
    </div>
  </div>
  ` : ''}

  ${config.includeWorklines ? `
  <div class="section">
    <h2>Worklines Progress</h2>
    ${project.worklines.map((workline: any) => {
      const worklineActions = project.actions.filter((a: any) => a.worklineId === workline.id);
      const completed = worklineActions.filter((a: any) => a.status === 'completed').length;
      const total = worklineActions.length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      return `
        <div class="workline">
          <div class="workline-name">${workline.name}</div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress}%"></div>
          </div>
          <div style="margin-top: 5px; font-size: 0.9em; color: #666;">
            ${completed}/${total} actions completed (${progress}%)
          </div>
        </div>
      `;
    }).join('')}
  </div>
  ` : ''}

  <div class="section">
    <h2>Recent Actions</h2>
    <ul class="actions-list">
      ${project.actions.slice(0, 10).map((action: any) => `
        <li>
          <div class="action-title">${action.title}</div>
          <div class="action-meta">
            Status: <span class="status-${action.status}">${action.status.toUpperCase()}</span>
            ${action.estimatedHours ? ` • ${action.estimatedHours}h estimated` : ''}
            ${action.workline ? ` • ${action.workline.name}` : ''}
          </div>
          ${action.description ? `<div style="margin-top: 8px; color: #666;">${action.description}</div>` : ''}
        </li>
      `).join('')}
    </ul>
  </div>

  ${config.customSections.map((section: string) => `
    <div class="section">
      <h2>${section}</h2>
      <p>Custom analysis and insights for ${section.toLowerCase()} will be displayed here based on the latest project data and metrics.</p>
    </div>
  `).join('')}

  <div class="footer">
    <p>Report generated by NEO Business Consulting Platform</p>
    <p>For more information, visit your project dashboard</p>
  </div>
</body>
</html>
  `;
}

function calculateProjectStats(project: any) {
  const totalActions = project.actions.length;
  const completedActions = project.actions.filter((a: any) => a.status === 'completed').length;
  const criticalActions = project.actions.filter((a: any) => a.status === 'critical').length;
  const progressPercentage = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

  return {
    totalActions,
    completedActions,
    criticalActions,
    progressPercentage,
  };
}
