
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Project } from '@prisma/client';

interface ProjectContextType {
  activeProject: Project | null;
  setActiveProject: (project: Project | null) => void;
  projects: Project[];
  setProjects: (projects: Project[]) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedProjectId = localStorage.getItem('neo-active-project');
    if (savedProjectId && projects.length > 0) {
      const project = projects.find(p => p.id === savedProjectId);
      if (project) {
        setActiveProject(project);
      }
    }
  }, [projects]);

  const changeActiveProject = (project: Project | null) => {
    setActiveProject(project);
    if (project) {
      localStorage.setItem('neo-active-project', project.id);
    } else {
      localStorage.removeItem('neo-active-project');
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <ProjectContext.Provider value={{
      activeProject,
      setActiveProject: changeActiveProject,
      projects,
      setProjects
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
