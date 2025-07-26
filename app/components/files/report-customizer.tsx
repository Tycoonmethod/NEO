
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  BarChart3, 
  PieChart, 
  LineChart, 
  Calendar,
  FileText,
  Eye
} from 'lucide-react';

interface ReportConfig {
  title: string;
  includeCharts: boolean;
  includeTimeline: boolean;
  includeWorklines: boolean;
  customSections: string[];
}

interface ReportCustomizerProps {
  config: ReportConfig;
  onConfigChange: (config: ReportConfig) => void;
}

export function ReportCustomizer({ config, onConfigChange }: ReportCustomizerProps) {
  const [newSection, setNewSection] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  const addCustomSection = () => {
    if (newSection.trim()) {
      onConfigChange({
        ...config,
        customSections: [...config.customSections, newSection.trim()]
      });
      setNewSection('');
    }
  };

  const removeCustomSection = (index: number) => {
    onConfigChange({
      ...config,
      customSections: config.customSections.filter((_, i) => i !== index)
    });
  };

  const availableCharts = [
    { id: 'status-pie', name: 'Action Status Distribution', icon: PieChart },
    { id: 'workline-progress', name: 'Progress by Workline', icon: BarChart3 },
    { id: 'timeline-activity', name: 'Activity Timeline', icon: LineChart },
    { id: 'completion-trend', name: 'Completion Trends', icon: Calendar },
  ];

  const reportSections = [
    { id: 'executive-summary', name: 'Executive Summary', icon: FileText, required: true },
    { id: 'project-overview', name: 'Project Overview', icon: BarChart3, required: true },
    { id: 'kpi-metrics', name: 'KPI Metrics', icon: PieChart, enabled: config.includeCharts },
    { id: 'timeline', name: 'Project Timeline', icon: Calendar, enabled: config.includeTimeline },
    { id: 'worklines', name: 'Worklines Analysis', icon: LineChart, enabled: config.includeWorklines },
    ...config.customSections.map((section, index) => ({
      id: `custom-${index}`,
      name: section,
      icon: FileText,
      custom: true,
    }))
  ];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="structure" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="structure">Report Structure</TabsTrigger>
          <TabsTrigger value="content">Content Settings</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        {/* Report Structure */}
        <TabsContent value="structure">
          <div className="space-y-4">
            <Card className="neo-card">
              <CardHeader>
                <CardTitle className="text-sm">Report Sections</CardTitle>
                <CardDescription>
                  Customize the structure and order of your report sections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {reportSections.map((section) => {
                      const Icon = section.icon;
                      const isEnabled = (section as any).required || (section as any).enabled || (section as any).custom;
                      
                      return (
                        <div
                          key={section.id}
                          className={`flex items-center gap-3 p-3 rounded-md border ${
                            isEnabled 
                              ? 'bg-card border-border' 
                              : 'bg-muted/50 border-muted text-muted-foreground'
                          }`}
                        >
                          <GripVertical className="w-4 h-4 cursor-move" />
                          <Icon className="w-4 h-4" />
                          <span className="flex-1 font-medium">{section.name}</span>
                          
                          {(section as any).required ? (
                            <Badge variant="secondary">Required</Badge>
                          ) : (section as any).custom ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                const index = parseInt(section.id.split('-')[1]);
                                removeCustomSection(index);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          ) : (
                            <Badge className={isEnabled ? 'neo-status-completed' : 'neo-status-pending'}>
                              {isEnabled ? 'Included' : 'Disabled'}
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
                
                {/* Add Custom Section */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Custom section name..."
                      value={newSection}
                      onChange={(e) => setNewSection(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addCustomSection()}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addCustomSection}
                      disabled={!newSection.trim()}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Content Settings */}
        <TabsContent value="content">
          <div className="space-y-4">
            <Card className="neo-card">
              <CardHeader>
                <CardTitle className="text-sm">Chart Selection</CardTitle>
                <CardDescription>
                  Choose which charts and visualizations to include
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {availableCharts.map((chart) => {
                    const Icon = chart.icon;
                    return (
                      <div
                        key={chart.id}
                        className="flex items-center gap-3 p-3 rounded-md border bg-card cursor-pointer hover:bg-accent/50 transition-colors"
                      >
                        <input 
                          type="checkbox" 
                          defaultChecked 
                          className="rounded" 
                        />
                        <Icon className="w-4 h-4 neo-text-gold" />
                        <span className="text-sm font-medium">{chart.name}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="neo-card">
              <CardHeader>
                <CardTitle className="text-sm">Report Metadata</CardTitle>
                <CardDescription>
                  Configure report title and description
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="report-title">Report Title</Label>
                  <Input
                    id="report-title"
                    value={config.title}
                    onChange={(e) => onConfigChange({ ...config, title: e.target.value })}
                    placeholder="Executive Project Report"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="report-description">Report Description</Label>
                  <Textarea
                    id="report-description"
                    placeholder="Brief description of the report contents and purpose..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Preview */}
        <TabsContent value="preview">
          <Card className="neo-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Report Preview
              </CardTitle>
              <CardDescription>
                Preview how your report will be structured
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 p-4 bg-white text-black rounded-md border">
                {/* Report Header */}
                <div className="text-center border-b pb-4">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {config.title || 'Executive Project Report'}
                  </h1>
                  <p className="text-gray-600 mt-2">
                    Generated on {new Date().toLocaleDateString()}
                  </p>
                </div>

                {/* Table of Contents */}
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-gray-900">Table of Contents</h2>
                  <div className="space-y-1 text-sm">
                    {reportSections
                      .filter(section => (section as any).required || (section as any).enabled || (section as any).custom)
                      .map((section, index) => (
                        <div key={section.id} className="flex justify-between">
                          <span>{index + 1}. {section.name}</span>
                          <span className="text-gray-500">Page {index + 2}</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Sample Sections */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">
                      1. Executive Summary
                    </h2>
                    <p className="text-gray-700 text-sm">
                      This report provides a comprehensive overview of project progress, 
                      key performance indicators, and actionable insights...
                    </p>
                  </div>

                  {config.includeCharts && (
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-2">
                        2. KPI Metrics
                      </h2>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="h-32 bg-gray-100 rounded flex items-center justify-center text-sm text-gray-500">
                          Status Distribution Chart
                        </div>
                        <div className="h-32 bg-gray-100 rounded flex items-center justify-center text-sm text-gray-500">
                          Progress by Workline Chart
                        </div>
                      </div>
                    </div>
                  )}

                  {config.customSections.map((section, index) => (
                    <div key={`preview-custom-${index}`}>
                      <h2 className="text-lg font-semibold text-gray-900 mb-2">
                        {config.includeCharts ? index + 3 : index + 2}. {section}
                      </h2>
                      <p className="text-gray-700 text-sm">
                        Custom section content will be generated based on project data...
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
