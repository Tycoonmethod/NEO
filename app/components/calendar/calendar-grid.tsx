
'use client';

import { useDroppable } from '@dnd-kit/core';
import { useLanguage } from '@/contexts/language-context';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, AlertCircle } from 'lucide-react';
import { Action, Workline } from '@prisma/client';

interface ActionWithWorkline extends Action {
  workline?: Workline;
}

interface CalendarGridProps {
  currentDate: Date;
  viewMode: 'week' | 'month';
  scheduledActions: { [key: string]: ActionWithWorkline[] };
  dailyHours: { [key: string]: number };
}

function DroppableDay({ 
  date, 
  actions = [], 
  hours = 0 
}: { 
  date: Date; 
  actions?: ActionWithWorkline[]; 
  hours?: number; 
}) {
  const { t } = useLanguage();
  const dateKey = date.toDateString();
  const { isOver, setNodeRef } = useDroppable({
    id: `day-${dateKey}`,
  });

  const isToday = new Date().toDateString() === dateKey;
  const isOverLimit = hours > 8;
  const progressValue = Math.min((hours / 8) * 100, 100);

  return (
    <div
      ref={setNodeRef}
      className={`neo-calendar-day min-h-32 transition-colors ${
        isOver ? 'border-primary bg-primary/10' : ''
      } ${isToday ? 'ring-2 ring-primary/50' : ''} ${
        isOverLimit ? 'border-red-500/50 bg-red-500/5' : ''
      }`}
    >
      {/* Day Header */}
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-medium ${isToday ? 'neo-text-gold' : ''}`}>
          {date.getDate()}
        </span>
        
        <div className="flex items-center gap-1">
          {hours > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <Clock className="w-3 h-3" />
              <span className={isOverLimit ? 'text-red-500' : ''}>{hours}h</span>
            </div>
          )}
          {isOverLimit && <AlertCircle className="w-3 h-3 text-red-500" />}
        </div>
      </div>

      {/* Hours Progress */}
      {hours > 0 && (
        <div className="mb-2">
          <Progress 
            value={progressValue} 
            className={`h-1 ${isOverLimit ? 'bg-red-500/20' : ''}`}
          />
        </div>
      )}

      {/* Actions */}
      <div className="space-y-1">
        {actions.map((action) => (
          <div
            key={action.id}
            className="neo-calendar-action bg-card border-l-2 hover:bg-accent/50 transition-colors"
            style={{ borderLeftColor: action.workline?.color || '#FFD700' }}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium truncate flex-1">{action.title}</span>
              <div className="flex items-center gap-1 ml-2">
                <Clock className="w-3 h-3" />
                <span>{action.estimatedHours}h</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`neo-status-${action.status} text-xs`}>
                {action.status}
              </Badge>
              {action.priority > 3 && (
                <Badge variant="destructive" className="text-xs">
                  P{action.priority}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Drop Indicator */}
      {isOver && (
        <div className="absolute inset-0 border-2 border-dashed border-primary bg-primary/5 rounded-md flex items-center justify-center">
          <span className="text-sm font-medium neo-text-gold">
            {t('calendar.dragToSchedule')}
          </span>
        </div>
      )}
    </div>
  );
}

export function CalendarGrid({
  currentDate,
  viewMode,
  scheduledActions,
  dailyHours,
}: CalendarGridProps) {
  const { t } = useLanguage();

  const getDatesForView = () => {
    const dates: Date[] = [];
    
    if (viewMode === 'week') {
      // Get week starting from Monday
      const startOfWeek = new Date(currentDate);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        dates.push(date);
      }
    } else {
      // Get month view (6 weeks)
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      // Start from the Monday of the week containing the first day
      const startDate = new Date(firstDay);
      const startDay = startDate.getDay();
      const diff = startDate.getDate() - startDay + (startDay === 0 ? -6 : 1);
      startDate.setDate(diff);
      
      // Add 42 days (6 weeks)
      for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        dates.push(date);
      }
    }
    
    return dates;
  };

  const dates = getDatesForView();
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <Card className="neo-card">
      <CardContent className="p-4">
        {/* Calendar Header */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">
            {currentDate.toLocaleDateString('en-US', { 
              month: 'long', 
              year: 'numeric' 
            })}
          </h2>
          
          {/* Week Days Header */}
          <div className={`grid gap-2 mb-2 ${
            viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-7'
          }`}>
            {weekDays.map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                {day}
              </div>
            ))}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className={`grid gap-2 ${
          viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-7'
        }`}>
          {dates.map((date) => {
            const dateKey = date.toDateString();
            const actions = scheduledActions[dateKey] || [];
            const hours = dailyHours[dateKey] || 0;
            
            return (
              <DroppableDay
                key={dateKey}
                date={date}
                actions={actions}
                hours={hours}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary rounded-full" />
              <span>{t('calendar.estimatedTime')}</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span>Over 8h limit</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-ring rounded-full ring-2 ring-primary/50" />
              <span>{t('calendar.today')}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
