
'use client';

import { useState, useEffect } from 'react';
import { useProject } from '@/contexts/project-context';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  Calendar, 
  Clock, 
  Users, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  Eye,
  EyeOff
} from 'lucide-react';
import { GanttChart } from '@/components/gantt/gantt-chart';
import { Action, Workline } from '@prisma/client';

interface ActionWithWorkline extends Action {
  workline?: Workline;
}

export function GanttPage() {
  const { activeProject } = useProject();
  const { t } = useLanguage();
  const [actions, setActions] = useState<ActionWithWorkline[]>([]);
  const [worklines, setWorklines] = useState<Workline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year' | 'full'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedWorklines, setSelectedWorklines] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');

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
        }
        
        if (worklinesRes.ok) {
          const worklinesData = await worklinesRes.json();
          setWorklines(worklinesData);
          // Initially show all worklines
          setSelectedWorklines(worklinesData.map((w: Workline) => w.id));
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [activeProject]);

  const navigateTime = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    if (timeRange === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else if (timeRange === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (timeRange === 'quarter') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 3 : -3));
    } else if (timeRange === 'year') {
      newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
    }
    // For 'full' view, navigation doesn't make sense as it shows the entire project
    
    if (timeRange !== 'full') {
      setCurrentDate(newDate);
    }
  };

  const toggleWorkline = (worklineId: string) => {
    setSelectedWorklines(prev => 
      prev.includes(worklineId) 
        ? prev.filter(id => id !== worklineId)
        : [...prev, worklineId]
    );
  };

  const filteredActions = actions.filter(action => {
    // Filter by workline
    if (!selectedWorklines.includes(action.worklineId || '')) return false;
    
    // Filter by status
    if (statusFilter !== 'all' && action.status !== statusFilter) return false;
    
    // Only show actions with dates
    return action.startDate || action.endDate;
  });

  const actionsByWorkline = worklines.reduce((acc, workline) => {
    if (selectedWorklines.includes(workline.id)) {
      acc[workline.id] = filteredActions.filter(action => action.worklineId === workline.id);
    }
    return acc;
  }, {} as { [key: string]: ActionWithWorkline[] });

  const getProjectStats = () => {
    const totalActions = actions.length;
    const completedActions = actions.filter(a => a.status === 'completed').length;
    const criticalActions = actions.filter(a => a.status === 'critical').length;
    const overdueTasks = actions.filter(a => {
      if (!a.endDate || a.status === 'completed') return false;
      return new Date(a.endDate) < new Date();
    }).length;

    return {
      totalActions,
      completedActions,
      criticalActions,
      overdueTasks,
      progress: totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0,
    };
  };

  const stats = getProjectStats();

  if (!activeProject) {
    return (
      <div className="text-center py-12">
        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t('home.selectProject')}</h3>
        <p className="text-muted-foreground">{t('gantt.subtitle')}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="neo-loading h-8 w-64 rounded" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="neo-card neo-loading h-20" />
          ))}
        </div>
        <div className="neo-loading h-96 w-full rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="neo-title">{t('gantt.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('gantt.subtitle')}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Weekly
                </div>
              </SelectItem>
              <SelectItem value="month">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Monthly
                </div>
              </SelectItem>
              <SelectItem value="quarter">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Quarterly
                </div>
              </SelectItem>
              <SelectItem value="year">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Yearly
                </div>
              </SelectItem>
              <SelectItem value="full">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Full Project
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
          
          {timeRange !== 'full' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateTime('prev')}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateTime('next')}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="neo-stats-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('dashboard.totalActions')}</p>
                <p className="text-2xl font-bold neo-text-gold">{stats.totalActions}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="neo-stats-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('dashboard.completedActions')}</p>
                <p className="text-2xl font-bold text-green-500">{stats.completedActions}</p>
              </div>
              <div className="text-sm text-muted-foreground">
                {stats.progress}%
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="neo-stats-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('dashboard.criticalActions')}</p>
                <p className="text-2xl font-bold text-red-500">{stats.criticalActions}</p>
              </div>
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="neo-stats-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-orange-500">{stats.overdueTasks}</p>
              </div>
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Worklines Filter */}
      <Card className="neo-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="w-4 h-4" />
            {t('calendar.worklines')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {worklines.map((workline) => {
              const isVisible = selectedWorklines.includes(workline.id);
              const actionCount = actions.filter(a => a.worklineId === workline.id).length;
              
              return (
                <Button
                  key={workline.id}
                  variant={isVisible ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleWorkline(workline.id)}
                  className="gap-2"
                >
                  {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: workline.color }}
                  />
                  {workline.name}
                  <Badge variant="secondary" className="text-xs">
                    {actionCount}
                  </Badge>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Gantt Chart */}
      <Card className="neo-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 neo-text-gold" />
            {t('gantt.timeline')}
          </CardTitle>
          <CardDescription>
            {currentDate.toLocaleDateString('en-US', { 
              month: 'long', 
              year: 'numeric' 
            })} - {filteredActions.length} actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GanttChart
            worklines={worklines.filter(w => selectedWorklines.includes(w.id))}
            actionsByWorkline={actionsByWorkline}
            currentDate={currentDate}
            timeRange={timeRange}
          />
        </CardContent>
      </Card>

      {/* Actions Summary by Workline */}
      <div className="grid gap-6">
        {worklines
          .filter(w => selectedWorklines.includes(w.id))
          .map((workline) => {
            const worklineActions = actionsByWorkline[workline.id] || [];
            
            if (worklineActions.length === 0) return null;
            
            return (
              <Card key={workline.id} className="neo-card">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: workline.color }}
                    />
                    {workline.name}
                    <Badge variant="secondary">
                      {worklineActions.length} actions
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {worklineActions.map((action) => (
                        <div key={action.id} className="neo-action-item">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{action.title}</h4>
                              {action.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {action.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-sm">
                                {action.startDate && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(action.startDate).toLocaleDateString()}
                                  </span>
                                )}
                                {action.endDate && (
                                  <span className="flex items-center gap-1">
                                    → {new Date(action.endDate).toLocaleDateString()}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {action.estimatedHours}h
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 items-end">
                              <Badge className={`neo-status-${action.status}`}>
                                {t(`actions.${action.status}`)}
                              </Badge>
                              <Badge className={`neo-priority-${action.priority}`}>
                                P{action.priority}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            );
          })}
      </div>
    </div>
  );
}
