
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Hash password for test user
  const hashedPassword = await bcrypt.hash('johndoe123', 12);

  // Create test user
  const user = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      name: 'John Doe',
      password: hashedPassword,
      language: 'es',
    },
  });

  console.log('✅ Created user:', user.email);

  // Create sample projects
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        name: 'Digital Transformation Initiative',
        description: 'Complete digital overhaul of legacy systems and processes',
        color: '#FFD700',
        status: 'active',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-12-31'),
        userId: user.id,
      },
    }),
    prisma.project.create({
      data: {
        name: 'Process Optimization Project',
        description: 'Streamline operational processes to increase efficiency',
        color: '#FFA500',
        status: 'active',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-08-30'),
        userId: user.id,
      },
    }),
    prisma.project.create({
      data: {
        name: 'Customer Experience Enhancement',
        description: 'Improve customer journey and satisfaction metrics',
        color: '#FF8C00',
        status: 'completed',
        startDate: new Date('2023-10-01'),
        endDate: new Date('2024-01-31'),
        userId: user.id,
      },
    }),
  ]);

  console.log('✅ Created projects:', projects.length);

  // Create worklines for each project
  const worklines = [];
  
  // Digital Transformation worklines
  const dtWorklines = await Promise.all([
    prisma.workline.create({
      data: {
        name: 'Infrastructure & Technology',
        color: '#FFD700',
        order: 1,
        projectId: projects[0].id,
      },
    }),
    prisma.workline.create({
      data: {
        name: 'Change Management',
        color: '#FFA500',
        order: 2,
        projectId: projects[0].id,
      },
    }),
    prisma.workline.create({
      data: {
        name: 'Training & Development',
        color: '#FF8C00',
        order: 3,
        projectId: projects[0].id,
      },
    }),
  ]);

  // Process Optimization worklines
  const poWorklines = await Promise.all([
    prisma.workline.create({
      data: {
        name: 'Process Analysis',
        color: '#32CD32',
        order: 1,
        projectId: projects[1].id,
      },
    }),
    prisma.workline.create({
      data: {
        name: 'Implementation',
        color: '#228B22',
        order: 2,
        projectId: projects[1].id,
      },
    }),
  ]);

  // Customer Experience worklines
  const ceWorklines = await Promise.all([
    prisma.workline.create({
      data: {
        name: 'Research & Analytics',
        color: '#4169E1',
        order: 1,
        projectId: projects[2].id,
      },
    }),
    prisma.workline.create({
      data: {
        name: 'UX/UI Improvements',
        color: '#6495ED',
        order: 2,
        projectId: projects[2].id,
      },
    }),
  ]);

  worklines.push(...dtWorklines, ...poWorklines, ...ceWorklines);
  console.log('✅ Created worklines:', worklines.length);

  // Create sample meetings
  const meetings = await Promise.all([
    prisma.meeting.create({
      data: {
        title: 'Project Kickoff - Digital Transformation',
        summary: 'Initial meeting to define scope, objectives, and timeline for the digital transformation initiative. Key stakeholders identified and roles assigned.',
        date: new Date('2024-01-16T10:00:00'),
        duration: 120,
        projectId: projects[0].id,
      },
    }),
    prisma.meeting.create({
      data: {
        title: 'Process Mapping Workshop',
        summary: 'Detailed analysis of current processes with department heads. Identified bottlenecks and improvement opportunities.',
        date: new Date('2024-02-05T14:00:00'),
        duration: 180,
        projectId: projects[1].id,
      },
    }),
    prisma.meeting.create({
      data: {
        title: 'Customer Feedback Review',
        summary: 'Analysis of customer satisfaction surveys and feedback. Prioritized improvement areas based on impact and feasibility.',
        date: new Date('2023-11-15T09:00:00'),
        duration: 90,
        projectId: projects[2].id,
      },
    }),
  ]);

  console.log('✅ Created meetings:', meetings.length);

  // Create sample actions
  const actions = await Promise.all([
    // Digital Transformation actions
    prisma.action.create({
      data: {
        title: 'Infrastructure Assessment',
        description: 'Complete assessment of current IT infrastructure and identify upgrade requirements',
        startDate: new Date('2024-01-20'),
        endDate: new Date('2024-02-15'),
        estimatedHours: 2,
        status: 'completed',
        priority: 5,
        actualHours: 48,
        completedAt: new Date('2024-02-14'),
        projectId: projects[0].id,
        worklineId: dtWorklines[0].id,
        meetingId: meetings[0].id,
      },
    }),
    prisma.action.create({
      data: {
        title: 'Stakeholder Communication Plan',
        description: 'Develop comprehensive communication strategy for all stakeholders',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-28'),
        estimatedHours: 1,
        status: 'in_progress',
        priority: 4,
        projectId: projects[0].id,
        worklineId: dtWorklines[1].id,
        meetingId: meetings[0].id,
      },
    }),
    prisma.action.create({
      data: {
        title: 'Training Material Development',
        description: 'Create training materials for new systems and processes',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-04-30'),
        estimatedHours: 3,
        status: 'pending',
        priority: 3,
        projectId: projects[0].id,
        worklineId: dtWorklines[2].id,
      },
    }),
    // Process Optimization actions
    prisma.action.create({
      data: {
        title: 'Current Process Documentation',
        description: 'Document all existing processes with detailed flowcharts',
        startDate: new Date('2024-02-05'),
        endDate: new Date('2024-03-05'),
        estimatedHours: 2,
        status: 'critical',
        priority: 5,
        projectId: projects[1].id,
        worklineId: poWorklines[0].id,
        meetingId: meetings[1].id,
      },
    }),
    prisma.action.create({
      data: {
        title: 'Process Improvement Implementation',
        description: 'Implement identified process improvements across departments',
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-06-30'),
        estimatedHours: 3,
        status: 'pending',
        priority: 4,
        projectId: projects[1].id,
        worklineId: poWorklines[1].id,
      },
    }),
    // Customer Experience actions
    prisma.action.create({
      data: {
        title: 'Customer Journey Mapping',
        description: 'Map complete customer journey and identify pain points',
        startDate: new Date('2023-10-15'),
        endDate: new Date('2023-11-30'),
        estimatedHours: 2,
        status: 'completed',
        priority: 5,
        actualHours: 32,
        completedAt: new Date('2023-11-28'),
        projectId: projects[2].id,
        worklineId: ceWorklines[0].id,
        meetingId: meetings[2].id,
      },
    }),
    prisma.action.create({
      data: {
        title: 'Website UX Improvements',
        description: 'Implement user experience improvements on main website',
        startDate: new Date('2023-12-01'),
        endDate: new Date('2024-01-31'),
        estimatedHours: 3,
        status: 'completed',
        priority: 4,
        actualHours: 56,
        completedAt: new Date('2024-01-30'),
        projectId: projects[2].id,
        worklineId: ceWorklines[1].id,
      },
    }),
  ]);

  console.log('✅ Created actions:', actions.length);

  // Create sample files
  const files = await Promise.all([
    prisma.file.create({
      data: {
        name: 'meeting_notes_kickoff.docx',
        originalName: 'Digital Transformation Kickoff Notes.docx',
        path: '/uploads/meeting_notes_kickoff.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 25600,
        type: 'word',
        processed: true,
        projectId: projects[0].id,
        meetingId: meetings[0].id,
      },
    }),
    prisma.file.create({
      data: {
        name: 'process_analysis.xlsx',
        originalName: 'Current Process Analysis.xlsx',
        path: '/uploads/process_analysis.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 45300,
        type: 'excel',
        processed: false,
        projectId: projects[1].id,
        meetingId: meetings[1].id,
      },
    }),
    prisma.file.create({
      data: {
        name: 'customer_feedback_audio.mp3',
        originalName: 'Customer Interview Session 1.mp3',
        path: '/uploads/customer_feedback_audio.mp3',
        mimeType: 'audio/mpeg',
        size: 15600000,
        type: 'audio',
        processed: true,
        projectId: projects[2].id,
        meetingId: meetings[2].id,
      },
    }),
  ]);

  console.log('✅ Created files:', files.length);

  console.log('🎉 Database seeded successfully!');
  console.log(`
📊 Summary:
- Users: 1
- Projects: 3
- Worklines: 7
- Actions: 7
- Meetings: 3
- Files: 3

🔐 Test Account:
Email: john@doe.com
Password: johndoe123
  `);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
