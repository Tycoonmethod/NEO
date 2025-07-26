
'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';
import { Action, Workline } from '@prisma/client';

interface ActionWithWorkline extends Action {
  workline?: Workline;
}

interface GanttChartProps {
  worklines: Workline[];
  actionsByWorkline: { [key: string]: ActionWithWorkline[] };
  currentDate: Date;
  timeRange: 'week' | 'month' | 'quarter' | 'year' | 'full';
}

interface ChartDataItem {
  name: string;
  worklineId: string;
  color: string;
  actions: ActionWithWorkline[];
  totalHours: number;
  completedHours: number;
  progress: number;
}

export function GanttChart({
  worklines,
  actionsByWorkline,
  currentDate,
  timeRange,
}: GanttChartProps) {
  const chartData = useMemo(() => {
    return worklines.map((workline): ChartDataItem => {
      const actions = actionsByWorkline[workline.id] || [];
      const totalHours = actions.reduce((sum, action) => sum + action.estimatedHours, 0);
      const completedHours = actions
        .filter(action => action.status === 'completed')
        .reduce((sum, action) => sum + (action.actualHours || action.estimatedHours), 0);
      
      return {
        name: workline.name,
        worklineId: workline.id,
        color: workline.color,
        actions,
        totalHours,
        completedHours,
        progress: totalHours > 0 ? Math.round((completedHours / totalHours) * 100) : 0,
      };
    });
  }, [worklines, actionsByWorkline]);

  const getTimelineDates = () => {
    const dates: Date[] = [];
    const start = new Date(currentDate);
    
    if (timeRange === 'week') {
      start.setDate(start.getDate() - start.getDay());
      for (let i = 0; i < 7; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        dates.push(date);
      }
    } else if (timeRange === 'month') {
      start.setDate(1);
      const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
      for (let i = 0; i < daysInMonth; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        dates.push(date);
      }
    } else if (timeRange === 'quarter') {
      start.setMonth(Math.floor(start.getMonth() / 3) * 3, 1);
      for (let i = 0; i < 90; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        dates.push(date);
      }
    } else if (timeRange === 'year') {
      start.setMonth(0, 1);
      for (let month = 0; month < 12; month++) {
        const date = new Date(start.getFullYear(), month, 1);
        dates.push(date);
      }
    } else if (timeRange === 'full') {
      // Get the full project range from all actions
      const allActions = Object.values(actionsByWorkline).flat();
      const actionDates: Date[] = [];
      
      allActions.forEach(action => {
        if (action.startDate) {
          actionDates.push(new Date(action.startDate));
        }
        if (action.endDate) {
          actionDates.push(new Date(action.endDate));
        }
      });
      
      if (actionDates.length > 0) {
        actionDates.sort((a, b) => a.getTime() - b.getTime());
        const earliestDate = actionDates[0];
        const latestDate = actionDates[actionDates.length - 1];
        
        const current = new Date(earliestDate);
        current.setDate(1); // Start from first day of month
        
        while (current.getTime() <= latestDate.getTime()) {
          dates.push(new Date(current));
          current.setMonth(current.getMonth() + 1);
        }
      }
    }
    
    return dates;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartDataItem;
      
      return (
        <div className="neo-card p-3 shadow-lg border">
          <h4 className="font-medium mb-2">{data.name}</h4>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: data.color }}
              />
              <span>{data.actions.length} actions</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              <span>{data.totalHours}h total</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>{data.completedHours}h completed ({data.progress}%)</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No timeline data</h3>
        <p className="text-muted-foreground">Add actions with dates to see the Gantt chart</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="grid gap-4">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              tick={{ fontSize: 10 }}
              label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="totalHours" name="Total Hours" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
            <Bar dataKey="completedHours" name="Completed Hours" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-completed-${index}`} fill={`${entry.color}80`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Timeline View */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Timeline View</h3>
        
        {/* Time Header */}
        <div className="flex text-xs text-muted-foreground border-b border-border pb-2">
          <div className="w-48">Workline</div>
          <div className="flex-1 overflow-x-auto">
            <div className="flex min-w-full">
              {getTimelineDates().map((date, i) => {
                let displayText = '';
                if (timeRange === 'week') {
                  displayText = date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
                } else if (timeRange === 'month') {
                  displayText = date.getDate().toString();
                } else if (timeRange === 'quarter') {
                  displayText = `${date.getMonth() + 1}/${date.getDate()}`;
                } else if (timeRange === 'year') {
                  displayText = date.toLocaleDateString('en-US', { month: 'short' });
                } else if (timeRange === 'full') {
                  displayText = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                }
                
                return (
                  <div 
                    key={i} 
                    className="text-center px-2 border-r border-border/30 last:border-r-0 flex-shrink-0"
                    style={{ 
                      minWidth: timeRange === 'week' ? '100px' : 
                               timeRange === 'month' ? '40px' : 
                               timeRange === 'quarter' ? '30px' : 
                               timeRange === 'year' ? '80px' : '60px'
                    }}
                  >
                    {displayText}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Worklines with Actions */}
        <div className="space-y-3">
          {chartData.map((worklineData) => (
            <div key={worklineData.worklineId} className="flex items-center">
              {/* Workline Info */}
              <div className="w-48 pr-4">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: worklineData.color }}
                  />
                  <span className="font-medium text-sm">{worklineData.name}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {worklineData.actions.length} actions • {worklineData.totalHours}h
                </div>
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div 
                    className="h-2 rounded-full"
                    style={{ 
                      width: `${worklineData.progress}%`,
                      backgroundColor: worklineData.color 
                    }}
                  />
                </div>
              </div>

              {/* Timeline */}
              <div className="flex-1 overflow-x-auto">
                <div className="relative h-16 bg-muted/10 rounded min-w-full">
                  {worklineData.actions
                    .filter(action => action.startDate && action.endDate)
                    .map((action, actionIndex) => {
                      const startDate = new Date(action.startDate!);
                      const endDate = new Date(action.endDate!);
                      const timelineDates = getTimelineDates();
                      
                      if (timelineDates.length === 0) return null;
                      
                      // Calculate position and width based on time range
                      let leftPercent = 0;
                      let widthPercent = 0;
                      
                      if (timeRange === 'week' || timeRange === 'month' || timeRange === 'quarter') {
                        const timelineStart = timelineDates[0];
                        const timelineEnd = timelineDates[timelineDates.length - 1];
                        const totalMs = timelineEnd.getTime() - timelineStart.getTime();
                        
                        const startOffset = Math.max(0, startDate.getTime() - timelineStart.getTime());
                        const duration = endDate.getTime() - startDate.getTime();
                        
                        leftPercent = (startOffset / totalMs) * 100;
                        widthPercent = Math.min((duration / totalMs) * 100, 100 - leftPercent);
                      } else if (timeRange === 'year' || timeRange === 'full') {
                        // For year/full view, calculate based on months
                        const timelineStart = timelineDates[0];
                        const timelineEnd = new Date(timelineDates[timelineDates.length - 1]);
                        timelineEnd.setMonth(timelineEnd.getMonth() + 1, 0); // End of last month
                        
                        const totalMs = timelineEnd.getTime() - timelineStart.getTime();
                        const startOffset = Math.max(0, startDate.getTime() - timelineStart.getTime());
                        const duration = endDate.getTime() - startDate.getTime();
                        
                        leftPercent = (startOffset / totalMs) * 100;
                        widthPercent = Math.min((duration / totalMs) * 100, 100 - leftPercent);
                      }
                      
                      if (widthPercent <= 0) return null;
                      
                      const statusColors = {
                        pending: '#6B7280',
                        in_progress: '#3B82F6',
                        completed: '#10B981',
                        critical: '#EF4444',
                      };
                      
                      return (
                        <div
                          key={action.id}
                          className="absolute rounded-md flex items-center px-2 text-xs font-medium cursor-pointer group shadow-sm hover:shadow-md transition-all"
                          style={{
                            left: `${leftPercent}%`,
                            width: `${Math.max(widthPercent, 5)}%`, // Minimum width for visibility
                            top: `${4 + actionIndex * 20}px`,
                            height: '16px',
                            backgroundColor: statusColors[action.status as keyof typeof statusColors] || worklineData.color,
                            opacity: action.status === 'completed' ? 0.7 : 0.9,
                          }}
                          title={`${action.title} (${action.estimatedHours}h) - ${action.status}`}
                        >
                          <span className="truncate text-white text-xs">
                            {widthPercent > 15 ? action.title : action.title.substring(0, 10) + '...'}
                          </span>
                          {widthPercent > 25 && (
                            <div className="ml-auto flex items-center gap-1 text-white/80">
                              <span className="text-xs">{action.estimatedHours}h</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  
                  {/* Show consecutive actions indicator */}
                  <div className="absolute top-0 right-2 text-xs text-muted-foreground">
                    {worklineData.actions.filter(a => a.startDate && a.endDate).length} tasks
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
