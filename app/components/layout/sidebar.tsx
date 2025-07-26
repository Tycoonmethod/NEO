
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Home, 
  MessageSquare, 
  Calendar, 
  BarChart3, 
  PieChart, 
  FolderOpen,
  Settings,
  LogOut
} from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { useProject } from '@/contexts/project-context';
import { signOut } from 'next-auth/react';

const navigationItems = [
  { 
    key: 'home', 
    href: '/', 
    icon: Home,
    translationKey: 'nav.home'
  },
  { 
    key: 'meetings', 
    href: '/meetings', 
    icon: MessageSquare,
    translationKey: 'nav.meetings'
  },
  { 
    key: 'calendar', 
    href: '/calendar', 
    icon: Calendar,
    translationKey: 'nav.calendar'
  },
  { 
    key: 'gantt', 
    href: '/gantt', 
    icon: BarChart3,
    translationKey: 'nav.gantt'
  },
  { 
    key: 'dashboard', 
    href: '/dashboard', 
    icon: PieChart,
    translationKey: 'nav.dashboard'
  },
  { 
    key: 'files', 
    href: '/files', 
    icon: FolderOpen,
    translationKey: 'nav.files'
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { activeProject } = useProject();

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/auth/login' });
  };

  return (
    <div className="neo-sidebar flex flex-col h-screen w-64 fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 neo-bg-gold rounded-lg flex items-center justify-center">
            <span className="text-black font-bold text-sm">N</span>
          </div>
          <div>
            <h1 className="neo-text-gold font-bold text-xl">NEO</h1>
            <p className="text-xs text-muted-foreground">Business Consulting</p>
          </div>
        </div>
      </div>

      {/* Active Project */}
      {activeProject && (
        <div className="p-4 border-b border-border">
          <div className="neo-card p-3">
            <p className="text-xs text-muted-foreground mb-1">
              {t('home.activeProject')}
            </p>
            <p className="neo-text-gold font-medium text-sm truncate">
              {activeProject.name}
            </p>
            <div 
              className="w-full h-1 rounded-full mt-2"
              style={{ backgroundColor: activeProject.color }}
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <li key={item.key}>
                <Link 
                  href={item.href}
                  className={`neo-nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{t(item.translationKey)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-border">
        <ul className="space-y-2">
          <li>
            <Link href="/settings" className="neo-nav-item">
              <Settings className="w-5 h-5" />
              <span className="font-medium">{t('nav.settings')}</span>
            </Link>
          </li>
          <li>
            <button 
              onClick={handleLogout}
              className="neo-nav-item w-full text-left hover:text-red-400"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">{t('nav.logout')}</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
