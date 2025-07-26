
'use client';

import { useDraggable } from '@dnd-kit/core';
import { useLanguage } from '@/contexts/language-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  AlertTriangle, 
  Target, 
  GripVertical,
  Calendar
} from 'lucide-react';
import { Action, Workline } from '@prisma/client';

interface ActionWithWorkline extends Action {
  workline?: Workline;
}

interface ActionsSidebarProps {
  worklines: Workline[];
  unscheduledActions: ActionWithWorkline[];
  criticalActions: ActionWithWorkline[];
  upcomingDeadlines: ActionWithWorkline[];
}

function DraggableAction({ action }: { action: ActionWithWorkline }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: action.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="neo-action-item cursor-move hover:shadow-md transition-all"
    >
      <div className="flex items-start gap-3">
        <GripVertical className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {action.workline && (
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: action.workline.color }}
              />
            )}
            <h4 className="font-medium text-sm truncate">{action.title}</h4>
          </div>
          
          {action.description && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
              {action.description}
            </p>
          )}
          
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{action.estimatedHours}h</span>
            </div>
            
            <Badge className={`neo-status-${action.status} text-xs`}>
              Priority {action.priority}
            </Badge>
            
            {action.endDate && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{new Date(action.endDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ActionsSidebar({
  worklines,
  unscheduledActions,
  criticalActions,
  upcomingDeadlines,
}: ActionsSidebarProps) {
  const { t } = useLanguage();

  const actionsByWorkline = worklines.reduce((acc, workline) => {
    acc[workline.id] = unscheduledActions.filter(action => action.worklineId === workline.id);
    return acc;
  }, {} as { [key: string]: ActionWithWorkline[] });

  const actionsWithoutWorkline = unscheduledActions.filter(action => !action.worklineId);

  return (
    <div className="space-y-4">
      {/* Daily Limit Info */}
      <Card className="neo-card border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 neo-text-gold" />
            <span className="font-medium">{t('calendar.dailyLimit')}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t('calendar.dragToSchedule')}
          </p>
        </CardContent>
      </Card>

      {/* Critical Actions */}
      {criticalActions.length > 0 && (
        <Card className="neo-card border-red-500/20 bg-red-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Critical Actions ({criticalActions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {criticalActions.map((action) => (
                  <DraggableAction key={action.id} action={action} />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Deadlines */}
      {upcomingDeadlines.length > 0 && (
        <Card className="neo-card border-yellow-500/20 bg-yellow-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="w-4 h-4 text-yellow-500" />
              {t('calendar.deadlines')} ({upcomingDeadlines.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {upcomingDeadlines.map((action) => (
                  <DraggableAction key={action.id} action={action} />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Actions Repository */}
      <Card className="neo-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <GripVertical className="w-4 h-4" />
            {t('calendar.actionsRepository')}
          </CardTitle>
          <CardDescription className="text-xs">
            {unscheduledActions.length} {t('common.actions').toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <ScrollArea className="h-96 neo-scrollbar">
            <div className="space-y-4">
              {/* Actions by Workline */}
              {worklines.map((workline) => {
                const worklineActions = actionsByWorkline[workline.id] || [];
                
                if (worklineActions.length === 0) return null;
                
                return (
                  <div key={workline.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: workline.color }}
                      />
                      <h4 className="font-medium text-sm">{workline.name}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {worklineActions.length}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 ml-5">
                      {worklineActions.map((action) => (
                        <DraggableAction key={action.id} action={action} />
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Actions without Workline */}
              {actionsWithoutWorkline.length > 0 && (
                <>
                  {worklines.length > 0 && <Separator />}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground">
                      Unassigned
                    </h4>
                    <div className="space-y-2">
                      {actionsWithoutWorkline.map((action) => (
                        <DraggableAction key={action.id} action={action} />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Empty State */}
              {unscheduledActions.length === 0 && (
                <div className="text-center py-8">
                  <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    All actions are scheduled
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
