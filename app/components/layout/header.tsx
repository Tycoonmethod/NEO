
'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Globe, User, Keyboard } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { useProject } from '@/contexts/project-context';
import { useSession } from 'next-auth/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function Header() {
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { activeProject, projects, setActiveProject } = useProject();
  const { data: session } = useSession();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K for project selector
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowProjectMenu(!showProjectMenu);
      }
      // Ctrl/Cmd + L for language selector
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        setShowLanguageMenu(!showLanguageMenu);
      }
      // Ctrl/Cmd + ? for shortcuts help
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setShowKeyboardShortcuts(true);
      }
      // Navigation shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
          case '1':
            e.preventDefault();
            window.location.href = '/dashboard';
            break;
          case '2':
            e.preventDefault();
            window.location.href = '/calendar';
            break;
          case '3':
            e.preventDefault();
            window.location.href = '/gantt';
            break;
          case '4':
            e.preventDefault();
            window.location.href = '/meetings';
            break;
          case '5':
            e.preventDefault();
            window.location.href = '/files';
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showProjectMenu, showLanguageMenu]);

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
    <TooltipProvider>
      <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-30 ml-64">
        <div className="flex items-center justify-between h-full px-6">
          {/* Project Selector */}
          <div className="flex items-center gap-4">
            {projects.length > 0 && (
              <div className="relative">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setShowProjectMenu(!showProjectMenu)}
                      className="flex items-center gap-2 px-3 py-2 rounded-md bg-background border border-border hover:bg-accent transition-all duration-200 hover:shadow-md"
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
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Switch project (Ctrl+K)</p>
                  </TooltipContent>
                </Tooltip>

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
          {/* Keyboard Shortcuts Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setShowKeyboardShortcuts(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-md bg-background border border-border hover:bg-accent transition-all duration-200 hover:shadow-md"
              >
                <Keyboard className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Keyboard shortcuts (Ctrl+/)</p>
            </TooltipContent>
          </Tooltip>

          {/* Language Selector */}
          <div className="relative">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md bg-background border border-border hover:bg-accent transition-all duration-200 hover:shadow-md"
                >
                  <Globe className="w-4 h-4" />
                  <span className="text-sm font-medium uppercase">{language}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Change language (Ctrl+L)</p>
              </TooltipContent>
            </Tooltip>

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
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-background border border-border">
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">{session.user.name}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Logged in as {session.user.name}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Keyboard Shortcuts Modal */}
      <Dialog open={showKeyboardShortcuts} onOpenChange={setShowKeyboardShortcuts}>
        <DialogContent className="neo-modal max-w-2xl">
          <DialogHeader>
            <DialogTitle className="neo-text-gold flex items-center gap-2">
              <Keyboard className="w-5 h-5" />
              Keyboard Shortcuts
            </DialogTitle>
            <DialogDescription>
              Use these shortcuts to navigate NEO more efficiently
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Global</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Project selector</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+K</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Language selector</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+L</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Show shortcuts</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+/</kbd>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Navigation</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Dashboard</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+1</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Calendar</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+2</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Gantt</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+3</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Meetings</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+4</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Files</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+5</kbd>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
    </TooltipProvider>
  );
}
