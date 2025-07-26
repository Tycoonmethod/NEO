
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  FileText, 
  Download, 
  Users, 
  BarChart3, 
  Settings,
  Eye,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  X,
  Plus
} from 'lucide-react';
import { ReportCustomizer } from '@/components/files/report-customizer';
import { File as FileRecord } from '@prisma/client';

interface ProcessingResult {
  success: boolean;
  actionsCreated: number;
  errors: string[];
  preview: any[];
}

export function FilesPage() {
  const { activeProject } = useProject();
  const { t } = useLanguage();
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [reportConfig, setReportConfig] = useState({
    title: '',
    includeCharts: true,
    includeTimeline: true,
    includeWorklines: true,
    customSections: [] as string[],
  });
  const [showReportCustomizer, setShowReportCustomizer] = useState(false);

  // Load files
  useEffect(() => {
    const loadFiles = async () => {
      if (!activeProject) {
        setIsLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/files?projectId=${activeProject.id}`);
        if (response.ok) {
          const filesData = await response.json();
          setFiles(filesData);
        }
      } catch (error) {
        console.error('Error loading files:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFiles();
  }, [activeProject]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = file.type.includes('csv') || 
                         file.type.includes('excel') || 
                         file.type.includes('spreadsheet') ||
                         file.name.endsWith('.csv') ||
                         file.name.endsWith('.xlsx') ||
                         file.name.endsWith('.xls');
      return isValidType;
    });
    
    if (validFiles.length !== files.length) {
      alert('Some files were skipped. Only CSV and Excel files are supported.');
    }
    
    setSelectedFiles(validFiles);
  };

  const handleBulkUpload = async () => {
    if (selectedFiles.length === 0 || !activeProject) return;

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('projectId', activeProject.id);
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/files/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setFiles(prev => [...prev, ...result.files]);
        setSelectedFiles([]);
        
        // Show processing result
        if (result.processingResult) {
          setProcessingResult(result.processingResult);
        }
      }
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleProcessFile = async (fileId: string) => {
    setIsProcessing(true);
    
    try {
      const response = await fetch(`/api/files/${fileId}/process`, {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        setProcessingResult(result);
        
        // Reload files to show updated status
        const filesResponse = await fetch(`/api/files?projectId=${activeProject?.id}`);
        if (filesResponse.ok) {
          const filesData = await filesResponse.json();
          setFiles(filesData);
        }
      }
    } catch (error) {
      console.error('Error processing file:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!activeProject) return;

    setIsGeneratingReport(true);
    
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: activeProject.id,
          config: reportConfig,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${activeProject.name}_report_${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: FileRecord) => {
    if (file.type === 'csv' || file.name.endsWith('.csv')) {
      return <FileText className="w-4 h-4" />;
    }
    return <FileSpreadsheet className="w-4 h-4" />;
  };

  if (!activeProject) {
    return (
      <div className="text-center py-12">
        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t('home.selectProject')}</h3>
        <p className="text-muted-foreground">{t('files.subtitle')}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="neo-loading h-8 w-64 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="neo-card neo-loading h-64" />
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
          <h1 className="neo-title">{t('files.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('files.subtitle')}</p>
        </div>
        
        <Button 
          className="neo-button-primary gap-2"
          onClick={handleGenerateReport}
          disabled={isGeneratingReport}
        >
          <Download className="w-4 h-4" />
          {isGeneratingReport ? t('common.loading') : t('files.extractReport')}
        </Button>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">{t('files.bulkUpload')}</TabsTrigger>
          <TabsTrigger value="files">Files ({files.length})</TabsTrigger>
          <TabsTrigger value="reports">{t('files.generateReport')}</TabsTrigger>
        </TabsList>

        {/* Bulk Upload Tab */}
        <TabsContent value="upload">
          <div className="grid gap-6">
            {/* Upload Area */}
            <Card className="neo-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5 neo-text-gold" />
                  {t('files.bulkUpload')}
                </CardTitle>
                <CardDescription>
                  {t('files.supportedFormats')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="neo-upload-zone">
                  <input
                    type="file"
                    multiple
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="bulk-file-upload"
                  />
                  <label
                    htmlFor="bulk-file-upload"
                    className="cursor-pointer flex flex-col items-center gap-3"
                  >
                    <Upload className="w-12 h-12 text-muted-foreground" />
                    <div className="text-center">
                      <p className="font-medium">{t('files.uploadZone')}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('files.csvFields')}
                      </p>
                    </div>
                  </label>
                </div>

                {/* Selected Files */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Selected Files ({selectedFiles.length})</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="w-4 h-4" />
                            <span className="text-sm">{file.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {(file.size / 1024).toFixed(1)} KB
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSelectedFile(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    
                    <Button
                      className="neo-button-primary w-full"
                      onClick={handleBulkUpload}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Processing Result */}
                {processingResult && (
                  <Card className={`${processingResult.success ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {processingResult.success ? (
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium mb-2">
                            {processingResult.success ? 'Processing Completed' : 'Processing Failed'}
                          </h4>
                          
                          {processingResult.success && (
                            <p className="text-sm text-green-600 mb-2">
                              {processingResult.actionsCreated} actions were created successfully
                            </p>
                          )}
                          
                          {processingResult.errors.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-sm font-medium">Errors:</p>
                              {processingResult.errors.map((error, index) => (
                                <p key={index} className="text-sm text-red-600">• {error}</p>
                              ))}
                            </div>
                          )}
                          
                          {processingResult.preview.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm font-medium mb-2">Preview (first 3 rows):</p>
                              <div className="bg-muted rounded p-2 text-xs">
                                {processingResult.preview.slice(0, 3).map((row, index) => (
                                  <div key={index} className="font-mono">
                                    {JSON.stringify(row)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setProcessingResult(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Files List Tab */}
        <TabsContent value="files">
          <Card className="neo-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 neo-text-gold" />
                Uploaded Files
              </CardTitle>
              <CardDescription>
                Manage and process uploaded files
              </CardDescription>
            </CardHeader>
            <CardContent>
              {files.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No files uploaded</h3>
                  <p className="text-muted-foreground">{t('files.uploadZone')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {files.map((file) => (
                    <div key={file.id} className="neo-file-item">
                      <div className="flex items-center gap-3">
                        {getFileIcon(file)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{file.originalName}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{(file.size / 1024).toFixed(1)} KB</span>
                            <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                            {file.processed ? (
                              <Badge className="neo-status-completed">
                                <CheckCircle className="w-3 h-3" />
                                {t('meetings.processed')}
                              </Badge>
                            ) : (
                              <Badge className="neo-status-pending">
                                Pending
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {!file.processed && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleProcessFile(file.id)}
                              disabled={isProcessing}
                            >
                              {isProcessing ? 'Processing...' : 'Process'}
                            </Button>
                          )}
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports">
          <div className="grid gap-6">
            <Card className="neo-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 neo-text-gold" />
                  {t('files.generateReport')}
                </CardTitle>
                <CardDescription>
                  Generate executive reports with project insights
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="report-title">Report Title</Label>
                    <Input
                      id="report-title"
                      value={reportConfig.title}
                      onChange={(e) => setReportConfig({ ...reportConfig, title: e.target.value })}
                      placeholder={`${activeProject.name} Executive Report`}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label>Report Sections</Label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={reportConfig.includeCharts}
                          onChange={(e) => setReportConfig({ ...reportConfig, includeCharts: e.target.checked })}
                        />
                        <span className="text-sm">Include Charts & Analytics</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={reportConfig.includeTimeline}
                          onChange={(e) => setReportConfig({ ...reportConfig, includeTimeline: e.target.checked })}
                        />
                        <span className="text-sm">Include Project Timeline</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={reportConfig.includeWorklines}
                          onChange={(e) => setReportConfig({ ...reportConfig, includeWorklines: e.target.checked })}
                        />
                        <span className="text-sm">Include Worklines Breakdown</span>
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowReportCustomizer(true)}
                    className="gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    {t('files.customizeReport')}
                  </Button>
                  
                  <Button
                    className="neo-button-primary gap-2"
                    onClick={handleGenerateReport}
                    disabled={isGeneratingReport}
                  >
                    {isGeneratingReport ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        {t('files.downloadPdf')}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Report Customizer Modal */}
      <Dialog open={showReportCustomizer} onOpenChange={setShowReportCustomizer}>
        <DialogContent className="neo-modal max-w-4xl">
          <DialogHeader>
            <DialogTitle className="neo-text-gold">{t('files.customizeReport')}</DialogTitle>
            <DialogDescription>
              Customize your report layout and content
            </DialogDescription>
          </DialogHeader>
          
          <ReportCustomizer 
            config={reportConfig}
            onConfigChange={setReportConfig}
          />
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReportCustomizer(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              className="neo-button-primary"
              onClick={() => setShowReportCustomizer(false)}
            >
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
