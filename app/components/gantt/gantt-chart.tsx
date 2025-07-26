
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
  timeRange: 'week' | 'month' | 'quarter';
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
      for (let i = 0; i < 30; i++) {
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
          <div className="flex-1 grid grid-cols-7 gap-1">
            {getTimelineDates().slice(0, 7).map((date, i) => (
              <div key={i} className="text-center">
                {timeRange === 'week' 
                  ? date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
                  : date.getDate()
                }
              </div>
            ))}
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
              <div className="flex-1 relative h-12 bg-muted/20 rounded">
                {worklineData.actions
                  .filter(action => action.startDate && action.endDate)
                  .map((action) => {
                    const startDate = new Date(action.startDate!);
                    const endDate = new Date(action.endDate!);
                    const timelineDates = getTimelineDates();
                    
                    // Calculate position and width
                    const timelineStart = timelineDates[0];
                    const timelineEnd = timelineDates[timelineDates.length - 1];
                    const totalDays = Math.ceil((timelineEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
                    
                    const startOffset = Math.max(0, Math.ceil((startDate.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24)));
                    const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                    
                    const leftPercent = (startOffset / totalDays) * 100;
                    const widthPercent = Math.min((duration / totalDays) * 100, 100 - leftPercent);
                    
                    if (widthPercent <= 0) return null;
                    
                    return (
                      <div
                        key={action.id}
                        className="absolute top-1 h-10 rounded flex items-center px-2 text-xs font-medium cursor-pointer group"
                        style={{
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                          backgroundColor: worklineData.color,
                          color: 'white',
                        }}
                        title={`${action.title} (${action.estimatedHours}h)`}
                      >
                        <span className="truncate">{action.title}</span>
                        <Badge 
                          className={`ml-2 opacity-75 neo-status-${action.status} scale-75`}
                        >
                          {action.status}
                        </Badge>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
