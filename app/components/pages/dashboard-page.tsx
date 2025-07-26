
'use client';

import { useState, useEffect } from 'react';
import { useProject } from '@/contexts/project-context';
import { useLanguage } from '@/contexts/language-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  PieChart, 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Users, 
  Target,
  AlertTriangle,
  CheckCircle,
  Activity,
  Calendar
} from 'lucide-react';
import { 
  PieChart as RechartsPieChart, 
  Pie,
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { Action, Workline, Project } from '@prisma/client';

interface ActionWithWorkline extends Action {
  workline?: Workline;
}

interface DashboardStats {
  totalActions: number;
  completedActions: number;
  pendingActions: number;
  criticalActions: number;
  overdueTasks: number;
  totalEstimatedHours: number;
  totalActualHours: number;
  averageCompletionTime: number;
  productivityScore: number;
  projectProgress: number;
}

export function DashboardPage() {
  const { activeProject } = useProject();
  const { t } = useLanguage();
  const [actions, setActions] = useState<ActionWithWorkline[]>([]);
  const [worklines, setWorklines] = useState<Workline[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'all'>('month');

  // Load data and calculate stats
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
          calculateStats(actionsData);
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
  }, [activeProject, timeRange]);

  const calculateStats = (actionsData: ActionWithWorkline[]) => {
    const now = new Date();
    let filteredActions = actionsData;

    // Filter by time range
    if (timeRange !== 'all') {
      const cutoffDate = new Date();
      if (timeRange === 'week') {
        cutoffDate.setDate(cutoffDate.getDate() - 7);
      } else if (timeRange === 'month') {
        cutoffDate.setMonth(cutoffDate.getMonth() - 1);
      } else if (timeRange === 'quarter') {
        cutoffDate.setMonth(cutoffDate.getMonth() - 3);
      }
      
      filteredActions = actionsData.filter(action => 
        !action.createdAt || new Date(action.createdAt) >= cutoffDate
      );
    }

    const totalActions = filteredActions.length;
    const completedActions = filteredActions.filter(a => a.status === 'completed').length;
    const pendingActions = filteredActions.filter(a => a.status === 'pending').length;
    const criticalActions = filteredActions.filter(a => a.status === 'critical').length;
    const overdueTasks = filteredActions.filter(a => {
      if (!a.endDate || a.status === 'completed') return false;
      return new Date(a.endDate) < now;
    }).length;

    const totalEstimatedHours = filteredActions.reduce((sum, a) => sum + a.estimatedHours, 0);
    const totalActualHours = filteredActions.reduce((sum, a) => sum + (a.actualHours || 0), 0);

    // Calculate average completion time
    const completedWithTimes = filteredActions.filter(a => 
      a.status === 'completed' && a.startDate && a.completedAt
    );
    const averageCompletionTime = completedWithTimes.length > 0 
      ? completedWithTimes.reduce((sum, a) => {
          const start = new Date(a.startDate!).getTime();
          const end = new Date(a.completedAt!).getTime();
          return sum + (end - start) / (1000 * 60 * 60 * 24); // days
        }, 0) / completedWithTimes.length
      : 0;

    // Calculate productivity score (completed hours vs estimated hours)
    const completedActualHours = filteredActions
      .filter(a => a.status === 'completed')
      .reduce((sum, a) => sum + (a.actualHours || a.estimatedHours), 0);
    const completedEstimatedHours = filteredActions
      .filter(a => a.status === 'completed')
      .reduce((sum, a) => sum + a.estimatedHours, 0);
    
    const productivityScore = completedEstimatedHours > 0 
      ? Math.round((completedEstimatedHours / completedActualHours) * 100) || 100
      : 100;

    const projectProgress = totalActions > 0 
      ? Math.round((completedActions / totalActions) * 100)
      : 0;

    setStats({
      totalActions,
      completedActions,
      pendingActions,
      criticalActions,
      overdueTasks,
      totalEstimatedHours,
      totalActualHours,
      averageCompletionTime,
      productivityScore,
      projectProgress,
    });
  };

  const getStatusChartData = () => {
    if (!stats) return [];
    
    return [
      { name: t('dashboard.completedActions'), value: stats.completedActions, color: '#22c55e' },
      { name: t('dashboard.pendingActions'), value: stats.pendingActions, color: '#eab308' },
      { name: t('dashboard.criticalActions'), value: stats.criticalActions, color: '#ef4444' },
    ].filter(item => item.value > 0);
  };

  const getWorklineProgressData = () => {
    return worklines.map(workline => {
      const worklineActions = actions.filter(a => a.worklineId === workline.id);
      const completed = worklineActions.filter(a => a.status === 'completed').length;
      const total = worklineActions.length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      return {
        name: workline.name,
        completed,
        total,
        progress,
        color: workline.color,
      };
    }).filter(item => item.total > 0);
  };

  const getTimelineData = () => {
    const days = 30;
    const data = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const completedOnDay = actions.filter(a => 
        a.completedAt && 
        new Date(a.completedAt).toISOString().split('T')[0] === dateStr
      ).length;
      
      const createdOnDay = actions.filter(a => 
        a.createdAt && 
        new Date(a.createdAt).toISOString().split('T')[0] === dateStr
      ).length;
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        completed: completedOnDay,
        created: createdOnDay,
      });
    }
    
    return data;
  };

  if (!activeProject) {
    return (
      <div className="text-center py-12">
        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t('home.selectProject')}</h3>
        <p className="text-muted-foreground">{t('dashboard.subtitle')}</p>
      </div>
    );
  }

  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <div className="neo-loading h-8 w-64 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="neo-card neo-loading h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="neo-card neo-loading h-80" />
          ))}
        </div>
      </div>
    );
  }

  const statusChartData = getStatusChartData();
  const worklineProgressData = getWorklineProgressData();
  const timelineData = getTimelineData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="neo-title">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('dashboard.subtitle')}</p>
        </div>
        
        <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last Week</SelectItem>
            <SelectItem value="month">Last Month</SelectItem>
            <SelectItem value="quarter">Last Quarter</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="neo-stats-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('dashboard.totalActions')}
                </p>
                <p className="text-3xl font-bold neo-text-gold neo-animate-countUp">
                  {stats.totalActions}
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <BarChart3 className="w-6 h-6 neo-text-gold" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="neo-stats-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('dashboard.completedActions')}
                </p>
                <p className="text-3xl font-bold text-green-500 neo-animate-countUp">
                  {stats.completedActions}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Progress value={stats.projectProgress} className="w-12 h-2" />
                  <span className="text-xs text-muted-foreground">
                    {stats.projectProgress}%
                  </span>
                </div>
              </div>
              <div className="p-3 bg-green-500/10 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="neo-stats-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('dashboard.criticalActions')}
                </p>
                <p className="text-3xl font-bold text-red-500 neo-animate-countUp">
                  {stats.criticalActions}
                </p>
                {stats.overdueTasks > 0 && (
                  <Badge variant="destructive" className="mt-2">
                    {stats.overdueTasks} overdue
                  </Badge>
                )}
              </div>
              <div className="p-3 bg-red-500/10 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="neo-stats-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('dashboard.productivity')}
                </p>
                <p className="text-3xl font-bold neo-text-gold neo-animate-countUp">
                  {stats.productivityScore}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.totalEstimatedHours}h planned • {stats.totalActualHours}h actual
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <TrendingUp className="w-6 h-6 neo-text-gold" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card className="neo-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 neo-text-gold" />
              Action Status Distribution
            </CardTitle>
            <CardDescription>
              Breakdown of actions by current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value, percent }) => 
                    `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                  }
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Workline Progress */}
        <Card className="neo-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 neo-text-gold" />
              Progress by Work Line
            </CardTitle>
            <CardDescription>
              Completion status for each work line
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={worklineProgressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip 
                  formatter={(value, name) => [value, name]}
                  labelFormatter={(label) => `Work Line: ${label}`}
                />
                <Bar dataKey="completed" name="Completed" radius={[4, 4, 0, 0]}>
                  {worklineProgressData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
                <Bar dataKey="total" name="Total" radius={[4, 4, 0, 0]} opacity={0.3}>
                  {worklineProgressData.map((entry, index) => (
                    <Cell key={`cell-total-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Timeline Activity */}
        <Card className="neo-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 neo-text-gold" />
              Activity Timeline
            </CardTitle>
            <CardDescription>
              Daily actions created vs completed (last 30 days)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="completed" 
                  stackId="1"
                  stroke="#22c55e" 
                  fill="#22c55e" 
                  fillOpacity={0.6}
                  name="Completed"
                />
                <Area 
                  type="monotone" 
                  dataKey="created" 
                  stackId="2"
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.6}
                  name="Created"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Project Health */}
        <Card className="neo-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 neo-text-gold" />
              Project Health
            </CardTitle>
            <CardDescription>
              Key project metrics and indicators
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm font-bold neo-text-gold">
                  {stats.projectProgress}%
                </span>
              </div>
              <Progress value={stats.projectProgress} className="w-full" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Average Completion Time</span>
                <span className="text-sm font-bold">
                  {stats.averageCompletionTime.toFixed(1)} days
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Efficiency Rate</span>
                <span className="text-sm font-bold text-green-500">
                  {stats.productivityScore}%
                </span>
              </div>
              <Progress value={Math.min(stats.productivityScore, 100)} className="w-full" />
            </div>

            {stats.overdueTasks > 0 && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-red-500">
                    {stats.overdueTasks} overdue task{stats.overdueTasks > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold neo-text-gold">
                  {stats.totalEstimatedHours}h
                </p>
                <p className="text-xs text-muted-foreground">Estimated</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {stats.totalActualHours}h
                </p>
                <p className="text-xs text-muted-foreground">Actual</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
