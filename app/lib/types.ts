
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string;
  }
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  status: string;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface Workline {
  id: string;
  name: string;
  color: string;
  order: number;
  projectId: string;
}

export interface Action {
  id: string;
  title: string;
  description?: string;
  owner?: string;
  startDate?: Date;
  endDate?: Date;
  estimatedHours: number;
  status: string;
  priority: number;
  actualHours?: number;
  completedAt?: Date;
  projectId: string;
  worklineId?: string;
  meetingId?: string;
}

export interface Meeting {
  id: string;
  title: string;
  summary?: string;
  date: Date;
  duration?: number;
  projectId: string;
}

export interface FileRecord {
  id: string;
  name: string;
  originalName: string;
  path: string;
  mimeType: string;
  size: number;
  type: string;
  processed: boolean;
  projectId: string;
  meetingId?: string;
}
