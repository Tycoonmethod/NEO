
'use client';

import { useState } from 'react';
import { ChevronDown, Globe, User } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { useProject } from '@/contexts/project-context';
import { useSession } from 'next-auth/react';

export function Header() {
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { activeProject, projects, setActiveProject } = useProject();
  const { data: session } = useSession();

  const handleLanguageChange = (lang: 'es' | 'en') => {
    setLanguage(lang);
    setShowLanguageMenu(false);
  };

  const handleProjectChange = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    setActiveProject(project || null);
    setShowProjectMenu(false);
  };

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-30 ml-64">
      <div className="flex items-center justify-between h-full px-6">
        {/* Project Selector */}
        <div className="flex items-center gap-4">
          {projects.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowProjectMenu(!showProjectMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-md bg-background border border-border hover:bg-accent transition-colors"
              >
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: activeProject?.color || '#FFD700' }}
                />
                <span className="text-sm font-medium">
                  {activeProject?.name || t('home.selectProject')}
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showProjectMenu && (
                <div className="absolute top-full left-0 mt-2 w-64 neo-dropdown shadow-lg z-50">
                  <div className="py-2">
                    {projects.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => handleProjectChange(project.id)}
                        className="neo-dropdown-item w-full text-left flex items-center gap-3"
                      >
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: project.color }}
                        />
                        <div>
                          <p className="font-medium">{project.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {project.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-4">
          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-md bg-background border border-border hover:bg-accent transition-colors"
            >
              <Globe className="w-4 h-4" />
              <span className="text-sm font-medium uppercase">{language}</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showLanguageMenu && (
              <div className="absolute top-full right-0 mt-2 w-32 neo-dropdown shadow-lg z-50">
                <div className="py-2">
                  <button
                    onClick={() => handleLanguageChange('es')}
                    className={`neo-dropdown-item w-full text-left ${language === 'es' ? 'neo-text-gold' : ''}`}
                  >
                    Español
                  </button>
                  <button
                    onClick={() => handleLanguageChange('en')}
                    className={`neo-dropdown-item w-full text-left ${language === 'en' ? 'neo-text-gold' : ''}`}
                  >
                    English
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User info */}
          {session?.user && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-background border border-border">
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">{session.user.name}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
