
'use client';

import { useState, useEffect } from 'react';
import { useProject } from '@/contexts/project-context';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight,
  CalendarDays,
  Filter,
  Target,
  FileText,
  Save
} from 'lucide-react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDroppable } from '@dnd-kit/core';
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
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'day'>('week');
  const [isLoading, setIsLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedAction, setDraggedAction] = useState<ActionWithWorkline | null>(null);
  const [scheduledActions, setScheduledActions] = useState<{ [key: string]: ActionWithWorkline[] }>({});
  const [dailyHours, setDailyHours] = useState<{ [key: string]: number }>({});
  const [actionNotes, setActionNotes] = useState<{ [key: string]: string }>({});
  const [selectedDayNotes, setSelectedDayNotes] = useState<string>('');

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
      } else if (viewMode === 'day') {
        newDate.setDate(newDate.getDate() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() - 1);
      }
      setCurrentDate(newDate);
    } else if (direction === 'next') {
      const newDate = new Date(currentDate);
      if (viewMode === 'week') {
        newDate.setDate(newDate.getDate() + 7);
      } else if (viewMode === 'day') {
        newDate.setDate(newDate.getDate() + 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      setCurrentDate(newDate);
    }
  };

  const handleSaveActionNote = async (actionId: string, note: string) => {
    try {
      const response = await fetch(`/api/actions/${actionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: note }),
      });

      if (response.ok) {
        setActionNotes(prev => ({ ...prev, [actionId]: note }));
      }
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const handleSaveDayNotes = async (date: Date, notes: string) => {
    try {
      const dateKey = date.toDateString();
      // This would need a new API endpoint for daily notes
      console.log('Saving day notes for', dateKey, ':', notes);
      setSelectedDayNotes(notes);
    } catch (error) {
      console.error('Error saving day notes:', error);
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
              <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      Day
                    </div>
                  </SelectItem>
                  <SelectItem value="week">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4" />
                      Week
                    </div>
                  </SelectItem>
                  <SelectItem value="month">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      Month
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
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

          {/* Calendar Content */}
          {viewMode === 'day' ? (
            <div className="flex gap-6">
              {/* Day View */}
              <div className="flex-1">
                <DayView
                  currentDate={currentDate}
                  scheduledActions={scheduledActions}
                  dailyHours={dailyHours}
                  actionNotes={actionNotes}
                  onSaveActionNote={handleSaveActionNote}
                />
              </div>
              
              {/* Day Notes Sidebar */}
              <Card className="w-80 neo-card">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Day Notes
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {currentDate.toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Add notes for this day..."
                      value={selectedDayNotes}
                      onChange={(e) => setSelectedDayNotes(e.target.value)}
                      className="min-h-32"
                    />
                    <Button
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => handleSaveDayNotes(currentDate, selectedDayNotes)}
                    >
                      <Save className="w-4 h-4" />
                      Save Notes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : viewMode === 'week' ? (
            <WeekView
              currentDate={currentDate}
              scheduledActions={scheduledActions}
              dailyHours={dailyHours}
            />
          ) : (
            <CalendarGrid
              currentDate={currentDate}
              viewMode={viewMode}
              scheduledActions={scheduledActions}
              dailyHours={dailyHours}
            />
          )}
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

// Day View Component with hourly schedule
function DayView({
  currentDate,
  scheduledActions,
  dailyHours,
  actionNotes,
  onSaveActionNote,
}: {
  currentDate: Date;
  scheduledActions: { [key: string]: ActionWithWorkline[] };
  dailyHours: { [key: string]: number };
  actionNotes: { [key: string]: string };
  onSaveActionNote: (actionId: string, note: string) => void;
}) {
  const { t } = useLanguage();
  const dateKey = currentDate.toDateString();
  const dayActions = scheduledActions[dateKey] || [];
  const hours = dailyHours[dateKey] || 0;

  // Generate hourly slots from 9:00 to 18:30
  const timeSlots: string[] = [];
  for (let hour = 9; hour <= 18; hour++) {
    timeSlots.push(`${hour}:00`);
    if (hour < 18) {
      timeSlots.push(`${hour}:30`);
    }
  }

  const { isOver, setNodeRef } = useDroppable({
    id: `day-${dateKey}`,
  });

  return (
    <Card className="neo-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 neo-text-gold" />
            {currentDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            {hours}h / 8h scheduled
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          ref={setNodeRef}
          className={`space-y-2 ${isOver ? 'bg-primary/5 rounded-lg p-2' : ''}`}
        >
          {timeSlots.map((time, index) => {
            const isHalfHour = time.includes(':30');
            return (
              <div
                key={time}
                className={`flex items-center min-h-8 border-l-2 border-border pl-4 ${
                  isHalfHour ? 'border-dashed opacity-60' : ''
                }`}
              >
                <div className="w-16 text-sm text-muted-foreground font-mono">
                  {time}
                </div>
                <div className="flex-1 ml-4">
                  {/* This would show actions scheduled for this time slot */}
                  <div className="min-h-6"></div>
                </div>
              </div>
            );
          })}
          
          {/* Actions for the day */}
          <div className="mt-6 space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Target className="w-4 h-4" />
              Actions for Today ({dayActions.length})
            </h4>
            {dayActions.map((action) => (
              <div key={action.id} className="neo-action-item border rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: action.workline?.color || '#FFD700' }}
                      />
                      <h5 className="font-medium">{action.title}</h5>
                      <Badge className={`neo-status-${action.status} text-xs`}>
                        {action.status}
                      </Badge>
                    </div>
                    
                    {action.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {action.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {action.estimatedHours}h
                      </span>
                      <span>Priority {action.priority}</span>
                    </div>
                    
                    {/* Action Notes */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Notes:</label>
                      <Textarea
                        placeholder="Add notes for this action..."
                        value={actionNotes[action.id] || ''}
                        onChange={(e) => onSaveActionNote(action.id, e.target.value)}
                        className="text-sm min-h-16"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {dayActions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No actions scheduled for today</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Week View Component with vertical hour bars
function WeekView({
  currentDate,
  scheduledActions,
  dailyHours,
}: {
  currentDate: Date;
  scheduledActions: { [key: string]: ActionWithWorkline[] };
  dailyHours: { [key: string]: number };
}) {
  const { t } = useLanguage();

  // Get week dates starting from Monday
  const getWeekDates = () => {
    const dates: Date[] = [];
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();
  const timeSlots: string[] = [];
  
  // Generate hourly slots from 9:00 to 18:30
  for (let hour = 9; hour <= 18; hour++) {
    timeSlots.push(`${hour}:00`);
    if (hour < 18) {
      timeSlots.push(`${hour}:30`);
    }
  }

  return (
    <Card className="neo-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 neo-text-gold" />
          Week of {weekDates[0].toLocaleDateString()} - {weekDates[6].toLocaleDateString()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex">
          {/* Time column */}
          <div className="w-20 pr-4">
            <div className="h-12"></div> {/* Header space */}
            {timeSlots.map((time, index) => {
              const isHalfHour = time.includes(':30');
              return (
                <div
                  key={time}
                  className={`h-12 flex items-center text-sm text-muted-foreground font-mono ${
                    isHalfHour ? 'opacity-60' : ''
                  }`}
                >
                  {time}
                </div>
              );
            })}
          </div>
          
          {/* Days columns */}
          <div className="flex-1 grid grid-cols-7 gap-1">
            {weekDates.map((date) => {
              const dateKey = date.toDateString();
              const dayActions = scheduledActions[dateKey] || [];
              const hours = dailyHours[dateKey] || 0;
              const isToday = new Date().toDateString() === dateKey;
              
              const { isOver, setNodeRef } = useDroppable({
                id: `day-${dateKey}`,
              });
              
              return (
                <div key={dateKey} className="border-r border-border last:border-r-0">
                  {/* Day header */}
                  <div className={`h-12 p-2 border-b border-border ${
                    isToday ? 'bg-primary/10' : ''
                  }`}>
                    <div className="text-center">
                      <div className={`text-sm font-medium ${
                        isToday ? 'neo-text-gold' : ''
                      }`}>
                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className={`text-lg font-bold ${
                        isToday ? 'neo-text-gold' : ''
                      }`}>
                        {date.getDate()}
                      </div>
                      {hours > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {hours}h
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Time slots */}
                  <div 
                    ref={setNodeRef}
                    className={`${isOver ? 'bg-primary/5' : ''}`}
                  >
                    {timeSlots.map((time, index) => {
                      const isHalfHour = time.includes(':30');
                      return (
                        <div
                          key={`${dateKey}-${time}`}
                          className={`h-12 border-b border-border/50 p-1 ${
                            isHalfHour ? 'border-dashed' : ''
                          }`}
                        >
                          {/* Actions would be positioned here based on time */}
                        </div>
                      );
                    })}
                    
                    {/* Show actions for the day at the bottom */}
                    <div className="p-2 space-y-1">
                      {dayActions.slice(0, 3).map((action) => (
                        <div
                          key={action.id}
                          className="text-xs p-1 rounded border-l-2 bg-card hover:bg-accent/50"
                          style={{ borderLeftColor: action.workline?.color || '#FFD700' }}
                        >
                          <div className="font-medium truncate">{action.title}</div>
                          <div className="text-muted-foreground">
                            {action.estimatedHours}h
                          </div>
                        </div>
                      ))}
                      {dayActions.length > 3 && (
                        <div className="text-xs text-muted-foreground text-center">
                          +{dayActions.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
