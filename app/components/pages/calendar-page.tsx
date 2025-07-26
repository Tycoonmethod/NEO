
'use client';

import { useState, useEffect } from 'react';
import { useProject } from '@/contexts/project-context';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight,
  CalendarDays,
  Filter,
  Target
} from 'lucide-react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { CalendarGrid } from '@/components/calendar/calendar-grid';
import { ActionsSidebar } from '@/components/calendar/actions-sidebar';
import { Action, Workline } from '@prisma/client';

interface ActionWithWorkline extends Action {
  workline?: Workline;
}

export function CalendarPage() {
  const { activeProject } = useProject();
  const { t } = useLanguage();
  const [actions, setActions] = useState<ActionWithWorkline[]>([]);
  const [worklines, setWorklines] = useState<Workline[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [isLoading, setIsLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedAction, setDraggedAction] = useState<ActionWithWorkline | null>(null);
  const [scheduledActions, setScheduledActions] = useState<{ [key: string]: ActionWithWorkline[] }>({});
  const [dailyHours, setDailyHours] = useState<{ [key: string]: number }>({});

  // Load actions and worklines
  useEffect(() => {
    const loadData = async () => {
      if (!activeProject) {
        setIsLoading(false);
        return;
      }
      
      try {
        const [actionsRes, worklinesRes] = await Promise.all([
          fetch(`/api/actions?projectId=${activeProject.id}`),
          fetch(`/api/worklines?projectId=${activeProject.id}`)
        ]);
        
        if (actionsRes.ok) {
          const actionsData = await actionsRes.json();
          setActions(actionsData);
          
          // Initialize scheduled actions
          const scheduled: { [key: string]: ActionWithWorkline[] } = {};
          const hours: { [key: string]: number } = {};
          
          actionsData.forEach((action: ActionWithWorkline) => {
            if (action.startDate) {
              const dateKey = new Date(action.startDate).toDateString();
              if (!scheduled[dateKey]) {
                scheduled[dateKey] = [];
                hours[dateKey] = 0;
              }
              scheduled[dateKey].push(action);
              hours[dateKey] += action.estimatedHours;
            }
          });
          
          setScheduledActions(scheduled);
          setDailyHours(hours);
        }
        
        if (worklinesRes.ok) {
          const worklinesData = await worklinesRes.json();
          setWorklines(worklinesData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [activeProject]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    const action = actions.find(a => a.id === active.id);
    setDraggedAction(action || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || !draggedAction) {
      setActiveId(null);
      setDraggedAction(null);
      return;
    }

    const actionId = active.id as string;
    const targetDate = over.id as string;
    
    // Check if dropping on a valid calendar day
    if (targetDate.startsWith('day-')) {
      const dateKey = targetDate.replace('day-', '');
      const targetDateObj = new Date(dateKey);
      
      // Check daily hour limit
      const currentHours = dailyHours[dateKey] || 0;
      const actionHours = draggedAction.estimatedHours;
      
      if (currentHours + actionHours > 8) {
        alert(t('calendar.dailyLimit'));
        setActiveId(null);
        setDraggedAction(null);
        return;
      }
      
      // Update action date
      scheduleAction(actionId, targetDateObj);
    }
    
    setActiveId(null);
    setDraggedAction(null);
  };

  const scheduleAction = async (actionId: string, date: Date) => {
    try {
      const response = await fetch(`/api/actions/${actionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: date.toISOString(),
        }),
      });

      if (response.ok) {
        const updatedAction = await response.json();
        
        // Update local state
        setActions(prev => prev.map(a => a.id === actionId ? updatedAction : a));
        
        const dateKey = date.toDateString();
        setScheduledActions(prev => {
          const newScheduled = { ...prev };
          
          // Remove from old date if exists
          Object.keys(newScheduled).forEach(key => {
            newScheduled[key] = newScheduled[key].filter(a => a.id !== actionId);
          });
          
          // Add to new date
          if (!newScheduled[dateKey]) {
            newScheduled[dateKey] = [];
          }
          newScheduled[dateKey].push(updatedAction);
          
          return newScheduled;
        });
        
        // Update daily hours
        setDailyHours(prev => {
          const newHours = { ...prev };
          const actionHours = updatedAction.estimatedHours;
          
          // Remove from old dates
          Object.keys(newHours).forEach(key => {
            const actionsForDay = scheduledActions[key] || [];
            if (actionsForDay.some(a => a.id === actionId)) {
              newHours[key] = Math.max(0, newHours[key] - actionHours);
            }
          });
          
          // Add to new date
          newHours[dateKey] = (newHours[dateKey] || 0) + actionHours;
          
          return newHours;
        });
      }
    } catch (error) {
      console.error('Error scheduling action:', error);
    }
  };

  const navigateDate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setCurrentDate(new Date());
    } else if (direction === 'prev') {
      const newDate = new Date(currentDate);
      if (viewMode === 'week') {
        newDate.setDate(newDate.getDate() - 7);
      } else {
        newDate.setMonth(newDate.getMonth() - 1);
      }
      setCurrentDate(newDate);
    } else if (direction === 'next') {
      const newDate = new Date(currentDate);
      if (viewMode === 'week') {
        newDate.setDate(newDate.getDate() + 7);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      setCurrentDate(newDate);
    }
  };

  const unscheduledActions = actions.filter(action => !action.startDate && action.status === 'pending');
  const criticalActions = actions.filter(action => action.status === 'critical');
  const upcomingDeadlines = actions.filter(action => {
    if (!action.endDate) return false;
    const deadline = new Date(action.endDate);
    const today = new Date();
    const daysUntil = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 7 && daysUntil >= 0;
  });

  if (!activeProject) {
    return (
      <div className="text-center py-12">
        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t('home.selectProject')}</h3>
        <p className="text-muted-foreground">{t('calendar.subtitle')}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full">
        <div className="w-80 neo-loading" />
        <div className="flex-1 ml-6 space-y-4">
          <div className="neo-loading h-12 w-full rounded" />
          <div className="neo-loading h-96 w-full rounded" />
        </div>
      </div>
    );
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-full gap-6">
        {/* Sidebar */}
        <div className="w-80 space-y-4">
          <ActionsSidebar
            worklines={worklines}
            unscheduledActions={unscheduledActions}
            criticalActions={criticalActions}
            upcomingDeadlines={upcomingDeadlines}
          />
        </div>

        {/* Main Calendar Area */}
        <div className="flex-1 space-y-4">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="neo-title">{t('calendar.title')}</h1>
              <p className="text-muted-foreground mt-2">{t('calendar.subtitle')}</p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'week' ? 'month' : 'week')}
              >
                {t(`calendar.${viewMode === 'week' ? 'month' : 'week'}`)}
              </Button>
              
              <Separator orientation="vertical" className="h-6" />
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate('prev')}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate('today')}
                className="px-4"
              >
                <CalendarDays className="w-4 h-4 mr-2" />
                {t('calendar.today')}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate('next')}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Calendar */}
          <CalendarGrid
            currentDate={currentDate}
            viewMode={viewMode}
            scheduledActions={scheduledActions}
            dailyHours={dailyHours}
          />
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {draggedAction ? (
          <Card className="neo-card opacity-90 rotate-3">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: draggedAction.workline?.color || '#FFD700' }}
                />
                <span className="font-medium text-sm">{draggedAction.title}</span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{draggedAction.estimatedHours}h</span>
                <Badge className={`neo-status-${draggedAction.status} text-xs`}>
                  {t(`actions.${draggedAction.status}`)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
