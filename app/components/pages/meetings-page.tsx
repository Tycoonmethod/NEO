
'use client';

import { useState, useEffect } from 'react';
import { useProject } from '@/contexts/project-context';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Upload, 
  FileText, 
  Mic, 
  Brain, 
  CheckCircle, 
  Clock, 
  Calendar,
  Users, 
  Zap,
  Download,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { Meeting, Action, Workline, File as FileRecord } from '@prisma/client';

interface MeetingWithFiles extends Meeting {
  files: FileRecord[];
  actions: Action[];
}

export function MeetingsPage() {
  const { activeProject } = useProject();
  const { t } = useLanguage();
  const [meetings, setMeetings] = useState<MeetingWithFiles[]>([]);
  const [worklines, setWorklines] = useState<Workline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingWithFiles | null>(null);
  const [extractedActions, setExtractedActions] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    duration: '',
  });

  // Load meetings and worklines
  useEffect(() => {
    const loadData = async () => {
      if (!activeProject) {
        setIsLoading(false);
        return;
      }
      
      try {
        const [meetingsRes, worklinesRes] = await Promise.all([
          fetch(`/api/meetings?projectId=${activeProject.id}`),
          fetch(`/api/worklines?projectId=${activeProject.id}`)
        ]);
        
        if (meetingsRes.ok) {
          const meetingsData = await meetingsRes.json();
          setMeetings(meetingsData);
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

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !formData.title.trim()) return;

    try {
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          date: new Date(formData.date),
          duration: formData.duration ? parseInt(formData.duration) : null,
          projectId: activeProject.id,
        }),
      });

      if (response.ok) {
        const newMeeting = await response.json();
        setMeetings([newMeeting, ...meetings]);
        setIsCreateModalOpen(false);
        setFormData({ title: '', date: '', duration: '' });
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
    }
  };

  const handleFileUpload = async (meetingId: string, files: FileList) => {
    const formData = new FormData();
    formData.append('meetingId', meetingId);
    
    Array.from(files).forEach((file) => {
      formData.append('files', file);
    });

    try {
      setIsProcessing(meetingId);
      
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        // Reload meetings to show new files
        const updatedMeetingsRes = await fetch(`/api/meetings?projectId=${activeProject?.id}`);
        if (updatedMeetingsRes.ok) {
          const updatedMeetings = await updatedMeetingsRes.json();
          setMeetings(updatedMeetings);
        }
      }
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleGenerateSummary = async (meetingId: string) => {
    try {
      setIsProcessing(meetingId);
      
      const response = await fetch(`/api/meetings/${meetingId}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_summary' }),
      });

      if (response.ok) {
        const result = await response.json();
        // Update meeting with summary
        setMeetings(meetings.map(m => 
          m.id === meetingId ? { ...m, summary: result.summary } : m
        ));
      }
    } catch (error) {
      console.error('Error generating summary:', error);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleExtractActions = async (meetingId: string) => {
    try {
      setIsProcessing(meetingId);
      
      const response = await fetch(`/api/meetings/${meetingId}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'extract_actions' }),
      });

      if (response.ok) {
        const result = await response.json();
        setExtractedActions(result.actions || []);
        
        // Find and set selected meeting
        const meeting = meetings.find(m => m.id === meetingId);
        if (meeting) {
          setSelectedMeeting(meeting);
        }
      }
    } catch (error) {
      console.error('Error extracting actions:', error);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleAddActionToRepository = async (action: any, worklineId: string) => {
    if (!activeProject || !selectedMeeting) return;

    try {
      const response = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: action.title,
          description: action.description,
          startDate: action.startDate ? new Date(action.startDate) : null,
          endDate: action.endDate ? new Date(action.endDate) : null,
          estimatedHours: action.estimatedHours || 1,
          priority: action.priority || 1,
          projectId: activeProject.id,
          worklineId: worklineId,
          meetingId: selectedMeeting.id,
        }),
      });

      if (response.ok) {
        // Remove action from extracted list
        setExtractedActions(prev => prev.filter(a => a !== action));
      }
    } catch (error) {
      console.error('Error adding action to repository:', error);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'word': return <FileText className="w-4 h-4" />;
      case 'audio': return <Mic className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / (1024 * 1024)) + ' MB';
  };

  if (!activeProject) {
    return (
      <div className="text-center py-12">
        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t('home.selectProject')}</h3>
        <p className="text-muted-foreground">{t('meetings.subtitle')}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="neo-loading h-8 w-64 rounded" />
        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="neo-card neo-loading h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="neo-title">{t('meetings.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('meetings.subtitle')}</p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="neo-button-primary gap-2">
              <Plus className="w-4 h-4" />
              {t('meetings.newMeeting')}
            </Button>
          </DialogTrigger>
          <DialogContent className="neo-modal">
            <DialogHeader>
              <DialogTitle className="neo-text-gold">{t('meetings.newMeeting')}</DialogTitle>
              <DialogDescription>
                {t('meetings.subtitle')}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateMeeting} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">{t('meetings.meetingTitle')}</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">{t('meetings.meetingDate')}</Label>
                  <Input
                    id="date"
                    type="datetime-local"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="duration">{t('meetings.duration')}</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="60"
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit" className="neo-button-primary">
                  {t('common.create')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Meetings List */}
      {meetings.length === 0 ? (
        <Card className="neo-card">
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('meetings.title')}</h3>
            <p className="text-muted-foreground mb-4">{t('meetings.subtitle')}</p>
            <Button 
              className="neo-button-primary gap-2"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="w-4 h-4" />
              {t('meetings.newMeeting')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {meetings.map((meeting) => (
            <Card key={meeting.id} className="neo-card">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 neo-text-gold" />
                      {meeting.title}
                    </CardTitle>
                    <CardDescription className="mt-2 flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(meeting.date).toLocaleString()}
                      </span>
                      {meeting.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {meeting.duration} min
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => handleGenerateSummary(meeting.id)}
                      disabled={isProcessing === meeting.id}
                    >
                      <Brain className="w-4 h-4" />
                      {t('meetings.generateSummary')}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => handleExtractActions(meeting.id)}
                      disabled={isProcessing === meeting.id}
                    >
                      <Zap className="w-4 h-4" />
                      {t('meetings.extractActions')}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* File Upload */}
                <div className="neo-upload-zone">
                  <input
                    type="file"
                    multiple
                    accept=".doc,.docx,.txt,.mp3,.wav,.m4a"
                    onChange={(e) => {
                      if (e.target.files?.length) {
                        handleFileUpload(meeting.id, e.target.files);
                      }
                    }}
                    className="hidden"
                    id={`file-upload-${meeting.id}`}
                  />
                  <label
                    htmlFor={`file-upload-${meeting.id}`}
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <p className="font-medium">{t('meetings.uploadFiles')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('meetings.supportedFiles')}
                    </p>
                  </label>
                </div>

                {/* Processing Progress */}
                {isProcessing === meeting.id && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 neo-text-gold animate-pulse" />
                      <span className="text-sm">{t('meetings.processing')}</span>
                    </div>
                    <Progress value={65} className="w-full" />
                  </div>
                )}

                {/* Files */}
                {meeting.files.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {t('meetings.files')}
                    </h4>
                    <div className="grid gap-2">
                      {meeting.files.map((file) => (
                        <div key={file.id} className="neo-file-item">
                          {getFileIcon(file.type)}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{file.originalName}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatFileSize(file.size)} • {file.type}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {file.processed && (
                              <Badge className="neo-status-completed">
                                <CheckCircle className="w-3 h-3" />
                                {t('meetings.processed')}
                              </Badge>
                            )}
                            <Button variant="ghost" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary */}
                {meeting.summary && (
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Brain className="w-4 h-4 neo-text-gold" />
                      {t('meetings.summary')}
                    </h4>
                    <div className="neo-card p-4 bg-primary/5">
                      <p className="text-sm whitespace-pre-wrap">{meeting.summary}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                {meeting.actions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      {t('common.actions')} ({meeting.actions.length})
                    </h4>
                    <div className="grid gap-2">
                      {meeting.actions.map((action) => (
                        <div key={action.id} className="neo-action-item">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium">{action.title}</h5>
                              {action.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {action.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2">
                                {action.startDate && (
                                  <span className="text-xs">
                                    {new Date(action.startDate).toLocaleDateString()}
                                  </span>
                                )}
                                <span className="text-xs">
                                  {action.estimatedHours}h • Priority {action.priority}
                                </span>
                              </div>
                            </div>
                            <Badge className={`neo-status-${action.status}`}>
                              {t(`actions.${action.status}`)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Extracted Actions Section - Now shown inline below meeting */}
      {extractedActions.length > 0 && selectedMeeting && (
        <Card className="neo-card mt-6">
          <CardHeader>
            <CardTitle className="neo-text-gold flex items-center gap-2">
              <Zap className="w-5 h-5" />
              {t('meetings.extractActions')} - {selectedMeeting.title}
            </CardTitle>
            <CardDescription>
              {t('meetings.addToRepository')} ({extractedActions.length} actions found)
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-3">
              {extractedActions.map((action, index) => (
                <div key={index} className="neo-action-item border rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div>
                        <h4 className="font-medium">{action.title}</h4>
                        {action.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {action.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {action.startDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(action.startDate).toLocaleDateString()}
                          </span>
                        )}
                        {action.endDate && (
                          <span>→ {new Date(action.endDate).toLocaleDateString()}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {action.estimatedHours || 1}h
                        </span>
                        {action.priority && (
                          <Badge className={`neo-priority-${action.priority}`}>
                            P{action.priority}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Select onValueChange={(value) => handleAddActionToRepository(action, value)}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder={t('worklines.selectWorkline')} />
                        </SelectTrigger>
                        <SelectContent>
                          {worklines.map((workline) => (
                            <SelectItem key={workline.id} value={workline.id}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: workline.color }}
                                />
                                {workline.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Button
                        size="sm"
                        className="neo-button-primary gap-2"
                        onClick={() => {
                          // If there's a default workline, add to it
                          if (worklines.length > 0) {
                            handleAddActionToRepository(action, worklines[0].id);
                          }
                        }}
                      >
                        <Plus className="w-4 h-4" />
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setExtractedActions([]);
                  setSelectedMeeting(null);
                }}
              >
                {t('common.close')}
              </Button>
              <Button
                className="neo-button-primary gap-2"
                onClick={() => {
                  // Add all actions to first workline
                  if (worklines.length > 0) {
                    extractedActions.forEach(action => {
                      handleAddActionToRepository(action, worklines[0].id);
                    });
                  }
                }}
              >
                <Plus className="w-4 h-4" />
                Add All Actions
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
