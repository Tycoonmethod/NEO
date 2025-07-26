

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Plus, 
  Upload, 
  Filter, 
  Search, 
  Edit, 
  Save, 
  X, 
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Zap,
  FileText,
  Download,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Action } from '@prisma/client';

interface TaskWithRelations extends Action {
  workline?: any;
  meeting?: any;
}

interface TaskFormData {
  title: string;
  description: string;
  owner: string;
  startDate: string;
  endDate: string;
  estimatedHours: number;
  priority: number;
  status: string;
  worklineId: string;
}

export function TasksPage() {
  const { activeProject } = useProject();
  const { t } = useLanguage();
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [worklines, setWorklines] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);
  
  // Filters
  const [filters, setFilters] = useState({
    sortBy: 'createdAt',
    sortOrder: 'desc',
    owner: '',
    status: '',
    priority: '',
    search: ''
  });

  // Form data
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    owner: '',
    startDate: '',
    endDate: '',
    estimatedHours: 1,
    priority: 1,
    status: 'pending',
    worklineId: ''
  });

  // CSV upload state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvValidation, setCsvValidation] = useState<any>(null);
  const [isValidatingCsv, setIsValidatingCsv] = useState(false);
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);

  // Load tasks
  const loadTasks = async () => {
    if (!activeProject?.id) {
      // Clear data and stop loading when no project is selected
      setTasks([]);
      setTotalPages(1);
      setTotalTasks(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        projectId: activeProject.id,
        page: currentPage.toString(),
        limit: '40',
        ...filters
      });

      const response = await fetch(`/api/tasks?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalTasks(data.pagination?.total || 0);
      } else {
        // Handle API errors gracefully
        console.error('API Error:', response.status, response.statusText);
        setTasks([]);
        setTotalPages(1);
        setTotalTasks(0);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      // Ensure we have clean state on error
      setTasks([]);
      setTotalPages(1);
      setTotalTasks(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Load worklines
  const loadWorklines = async () => {
    if (!activeProject?.id) {
      setWorklines([]);
      return;
    }

    try {
      const response = await fetch(`/api/worklines?projectId=${activeProject.id}`);
      if (response.ok) {
        const data = await response.json();
        setWorklines(data || []);
      } else {
        console.error('Worklines API Error:', response.status, response.statusText);
        setWorklines([]);
      }
    } catch (error) {
      console.error('Error loading worklines:', error);
      setWorklines([]);
    }
  };

  useEffect(() => {
    // Always call load functions to handle both cases: with and without project
    loadTasks();
    loadWorklines();
  }, [activeProject?.id, currentPage, filters]);

  // Handle create task
  const handleCreateTask = async () => {
    if (!activeProject?.id || !formData.title.trim()) return;

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          projectId: activeProject.id,
          worklineId: formData.worklineId || null
        }),
      });

      if (response.ok) {
        setIsCreateModalOpen(false);
        setFormData({
          title: '',
          description: '',
          owner: '',
          startDate: '',
          endDate: '',
          estimatedHours: 1,
          priority: 1,
          status: 'pending',
          worklineId: ''
        });
        loadTasks();
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  // Handle update task
  const handleUpdateTask = async (taskId: string, updatedData: Partial<TaskFormData>) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });

      if (response.ok) {
        setEditingTaskId(null);
        loadTasks();
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // Handle delete task
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm(t('common.confirm'))) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadTasks();
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // Handle CSV file upload
  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    setIsValidatingCsv(true);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const csvArray = lines.map(line => line.split(',').map(cell => cell.trim().replace(/"/g, '')));
      
      setCsvData(csvArray);

      // Validate CSV
      const response = await fetch('/api/tasks/validate-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvData: csvArray }),
      });

      if (response.ok) {
        const validation = await response.json();
        setCsvValidation(validation);
      }
    } catch (error) {
      console.error('Error processing CSV:', error);
    } finally {
      setIsValidatingCsv(false);
    }
  };

  // Handle CSV bulk upload
  const handleBulkUpload = async () => {
    if (!activeProject?.id || !csvValidation?.isValid) return;

    setIsUploadingCsv(true);

    try {
      const response = await fetch('/api/tasks/bulk-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: csvValidation.previewRows,
          projectId: activeProject.id
        }),
      });

      if (response.ok) {
        setIsCsvModalOpen(false);
        setCsvFile(null);
        setCsvData([]);
        setCsvValidation(null);
        loadTasks();
      }
    } catch (error) {
      console.error('Error bulk uploading tasks:', error);
    } finally {
      setIsUploadingCsv(false);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Get priority label
  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return t('actions.low');
      case 2: return t('actions.medium');
      case 3: return t('actions.high');
      case 4: 
      case 5: return t('actions.urgent');
      default: return t('actions.low');
    }
  };

  if (!activeProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t('home.selectProject')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold neo-text-gold">{t('tasks.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('tasks.subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={isCsvModalOpen} onOpenChange={setIsCsvModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="neo-button-secondary">
                <Upload className="w-4 h-4 mr-2" />
                {t('tasks.bulkUpload')}
              </Button>
            </DialogTrigger>
          </Dialog>
          
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="neo-button-primary">
                <Plus className="w-4 h-4 mr-2" />
                {t('tasks.newTask')}
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="neo-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            {t('tasks.filters')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            <div>
              <Label>{t('common.search')}</Label>
              <Input
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder={t('tasks.taskName')}
              />
            </div>
            <div>
              <Label>{t('tasks.byOwner')}</Label>
              <Input
                value={filters.owner}
                onChange={(e) => setFilters(prev => ({ ...prev, owner: e.target.value }))}
                placeholder={t('tasks.owner')}
              />
            </div>
            <div>
              <Label>{t('common.status')}</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t('common.status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('common.noData')}</SelectItem>
                  <SelectItem value="pending">{t('actions.pending')}</SelectItem>
                  <SelectItem value="in_progress">{t('actions.inProgress')}</SelectItem>
                  <SelectItem value="completed">{t('actions.completed')}</SelectItem>
                  <SelectItem value="critical">{t('actions.critical')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('common.priority')}</Label>
              <Select value={filters.priority} onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t('common.priority')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('common.noData')}</SelectItem>
                  <SelectItem value="1">{t('actions.low')}</SelectItem>
                  <SelectItem value="2">{t('actions.medium')}</SelectItem>
                  <SelectItem value="3">{t('actions.high')}</SelectItem>
                  <SelectItem value="4">{t('actions.urgent')}</SelectItem>
                  <SelectItem value="5">{t('actions.urgent')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('tasks.filters')}</Label>
              <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t('tasks.alphabetical')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alphabetical">{t('tasks.alphabetical')}</SelectItem>
                  <SelectItem value="owner">{t('tasks.byOwner')}</SelectItem>
                  <SelectItem value="estimatedHours">{t('tasks.byEstimatedHours')}</SelectItem>
                  <SelectItem value="priority">{t('tasks.byPriority')}</SelectItem>
                  <SelectItem value="startDate">{t('tasks.byDates')}</SelectItem>
                  <SelectItem value="createdAt">Fecha de creación</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Orden</Label>
              <Select value={filters.sortOrder} onValueChange={(value) => setFilters(prev => ({ ...prev, sortOrder: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascendente</SelectItem>
                  <SelectItem value="desc">Descendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <Card className="neo-card">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">
              {t('nav.tasks')} ({totalTasks})
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              40 {t('tasks.tasksPerPage')}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="neo-loading w-8 h-8 rounded-full" />
            </div>
          ) : tasks.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('tasks.taskName')}</TableHead>
                      <TableHead>{t('tasks.taskDescription')}</TableHead>
                      <TableHead>{t('tasks.owner')}</TableHead>
                      <TableHead>{t('common.status')}</TableHead>
                      <TableHead>{t('common.priority')}</TableHead>
                      <TableHead>{t('tasks.startDate')}</TableHead>
                      <TableHead>{t('tasks.deadline')}</TableHead>
                      <TableHead>{t('tasks.estimatedHours')}</TableHead>
                      <TableHead className="text-right">{t('common.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        isEditing={editingTaskId === task.id}
                        worklines={worklines}
                        onEdit={() => setEditingTaskId(task.id)}
                        onSave={(data) => handleUpdateTask(task.id, data)}
                        onCancel={() => setEditingTaskId(null)}
                        onDelete={() => handleDeleteTask(task.id)}
                        getStatusColor={getStatusColor}
                        getPriorityLabel={getPriorityLabel}
                        t={t}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-amber-500" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {t('tasks.noTasksTitle')}
                </h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {t('tasks.noTasksDescription')}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="neo-button-primary"
                    size="lg"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    {t('tasks.createFirstTask')}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setIsCsvModalOpen(true)}
                    className="neo-button-secondary"
                    size="lg"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    {t('tasks.importTasks')}
                  </Button>
                </div>
                <div className="mt-6 text-sm text-muted-foreground">
                  <p>{t('tasks.helpText')}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Task Dialog */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('tasks.newTask')}</DialogTitle>
            <DialogDescription>
              {t('tasks.subtitle')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">{t('tasks.taskName')}</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={t('tasks.taskName')}
                />
              </div>
              <div>
                <Label htmlFor="owner">{t('tasks.owner')}</Label>
                <Input
                  id="owner"
                  value={formData.owner}
                  onChange={(e) => setFormData(prev => ({ ...prev, owner: e.target.value }))}
                  placeholder={t('tasks.owner')}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">{t('tasks.taskDescription')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('tasks.taskDescription')}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">{t('tasks.startDate')}</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="endDate">{t('tasks.deadline')}</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="estimatedHours">{t('tasks.estimatedHours')}</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  min="1"
                  max="24"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div>
                <Label htmlFor="priority">{t('common.priority')}</Label>
                <Select value={formData.priority.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: parseInt(value) }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">{t('actions.low')}</SelectItem>
                    <SelectItem value="2">{t('actions.medium')}</SelectItem>
                    <SelectItem value="3">{t('actions.high')}</SelectItem>
                    <SelectItem value="4">{t('actions.urgent')}</SelectItem>
                    <SelectItem value="5">{t('actions.urgent')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">{t('common.status')}</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">{t('actions.pending')}</SelectItem>
                    <SelectItem value="in_progress">{t('actions.inProgress')}</SelectItem>
                    <SelectItem value="completed">{t('actions.completed')}</SelectItem>
                    <SelectItem value="critical">{t('actions.critical')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {worklines.length > 0 && (
              <div>
                <Label htmlFor="worklineId">{t('actions.workline')}</Label>
                <Select value={formData.worklineId} onValueChange={(value) => setFormData(prev => ({ ...prev, worklineId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar línea de trabajo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t('common.noData')}</SelectItem>
                    {worklines.map((workline) => (
                      <SelectItem key={workline.id} value={workline.id}>
                        {workline.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleCreateTask}
              disabled={!formData.title.trim()}
              className="neo-button-primary"
            >
              {t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Upload Dialog */}
      <Dialog open={isCsvModalOpen} onOpenChange={setIsCsvModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{t('tasks.bulkUpload')}</DialogTitle>
            <DialogDescription>
              {t('tasks.csvHeaders')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="csv-file">{t('tasks.csvUpload')}</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
              />
            </div>

            {isValidatingCsv && (
              <div className="flex items-center gap-2">
                <div className="neo-loading w-4 h-4 rounded-full" />
                <span>{t('tasks.validateCsv')}...</span>
              </div>
            )}

            {csvValidation && (
              <div className="space-y-4">
                {csvValidation.errors?.length > 0 && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">Errores:</h4>
                    <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                      {csvValidation.errors.map((error: string, index: number) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {csvValidation.warnings?.length > 0 && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Advertencias:</h4>
                    <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                      {csvValidation.warnings.map((warning: string, index: number) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {csvValidation.isValid && csvValidation.previewRows?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">
                      {t('tasks.previewTasks')} ({csvValidation.previewRows.length}/{csvValidation.totalRows})
                    </h4>
                    <div className="overflow-auto max-h-60">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead>Responsable</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Prioridad</TableHead>
                            <TableHead>Horas</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {csvValidation.previewRows.slice(0, 10).map((row: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell>{row.name}</TableCell>
                              <TableCell>{row.description}</TableCell>
                              <TableCell>{row.owner}</TableCell>
                              <TableCell>{row.status}</TableCell>
                              <TableCell>{row.priority}</TableCell>
                              <TableCell>{row.estimatedHours}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCsvModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            {csvValidation?.isValid && (
              <Button 
                onClick={handleBulkUpload}
                disabled={isUploadingCsv}
                className="neo-button-primary"
              >
                {isUploadingCsv ? t('common.loading') : t('tasks.confirmUpload')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Task Row Component for inline editing
interface TaskRowProps {
  task: TaskWithRelations;
  isEditing: boolean;
  worklines: any[];
  onEdit: () => void;
  onSave: (data: Partial<TaskFormData>) => void;
  onCancel: () => void;
  onDelete: () => void;
  getStatusColor: (status: string) => string;
  getPriorityLabel: (priority: number) => string;
  t: (key: string) => string;
}

function TaskRow({ 
  task, 
  isEditing, 
  worklines, 
  onEdit, 
  onSave, 
  onCancel, 
  onDelete, 
  getStatusColor, 
  getPriorityLabel, 
  t 
}: TaskRowProps) {
  const [editData, setEditData] = useState<Partial<TaskFormData>>({
    title: task.title,
    description: task.description || '',
    owner: task.owner || '',
    startDate: task.startDate ? task.startDate.toISOString().split('T')[0] : '',
    endDate: task.endDate ? task.endDate.toISOString().split('T')[0] : '',
    estimatedHours: task.estimatedHours,
    priority: task.priority,
    status: task.status,
    worklineId: task.worklineId || ''
  });

  const handleSave = () => {
    onSave(editData);
  };

  if (isEditing) {
    return (
      <TableRow>
        <TableCell>
          <Input
            value={editData.title || ''}
            onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
            className="min-w-[120px]"
          />
        </TableCell>
        <TableCell>
          <Textarea
            value={editData.description || ''}
            onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
            rows={2}
            className="min-w-[150px]"
          />
        </TableCell>
        <TableCell>
          <Input
            value={editData.owner || ''}
            onChange={(e) => setEditData(prev => ({ ...prev, owner: e.target.value }))}
            className="min-w-[100px]"
          />
        </TableCell>
        <TableCell>
          <Select value={editData.status} onValueChange={(value) => setEditData(prev => ({ ...prev, status: value }))}>
            <SelectTrigger className="min-w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">{t('actions.pending')}</SelectItem>
              <SelectItem value="in_progress">{t('actions.inProgress')}</SelectItem>
              <SelectItem value="completed">{t('actions.completed')}</SelectItem>
              <SelectItem value="critical">{t('actions.critical')}</SelectItem>
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell>
          <Select value={editData.priority?.toString()} onValueChange={(value) => setEditData(prev => ({ ...prev, priority: parseInt(value) }))}>
            <SelectTrigger className="min-w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">{t('actions.low')}</SelectItem>
              <SelectItem value="2">{t('actions.medium')}</SelectItem>
              <SelectItem value="3">{t('actions.high')}</SelectItem>
              <SelectItem value="4">{t('actions.urgent')}</SelectItem>
              <SelectItem value="5">{t('actions.urgent')}</SelectItem>
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell>
          <Input
            type="date"
            value={editData.startDate || ''}
            onChange={(e) => setEditData(prev => ({ ...prev, startDate: e.target.value }))}
            className="min-w-[140px]"
          />
        </TableCell>
        <TableCell>
          <Input
            type="date"
            value={editData.endDate || ''}
            onChange={(e) => setEditData(prev => ({ ...prev, endDate: e.target.value }))}
            className="min-w-[140px]"
          />
        </TableCell>
        <TableCell>
          <Input
            type="number"
            min="1"
            max="24"
            value={editData.estimatedHours || 1}
            onChange={(e) => setEditData(prev => ({ ...prev, estimatedHours: parseInt(e.target.value) || 1 }))}
            className="min-w-[80px]"
          />
        </TableCell>
        <TableCell className="text-right">
          <div className="flex gap-2 justify-end">
            <Button size="sm" onClick={handleSave} className="neo-button-primary">
              <Save className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{task.title}</TableCell>
      <TableCell>
        <div className="max-w-xs">
          <p className="text-sm text-muted-foreground truncate">
            {task.description || '-'}
          </p>
        </div>
      </TableCell>
      <TableCell>{task.owner || '-'}</TableCell>
      <TableCell>
        <Badge className={`${getStatusColor(task.status)} text-white`}>
          {t(`actions.${task.status.replace('_', '')}`)}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant="secondary">
          {getPriorityLabel(task.priority)}
        </Badge>
      </TableCell>
      <TableCell>
        {task.startDate ? new Date(task.startDate).toLocaleDateString() : '-'}
      </TableCell>
      <TableCell>
        {task.endDate ? new Date(task.endDate).toLocaleDateString() : '-'}
      </TableCell>
      <TableCell>{task.estimatedHours}h</TableCell>
      <TableCell className="text-right">
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={onDelete} className="text-red-600 hover:text-red-700">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
