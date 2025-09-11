import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Download, 
  FileText, 
  Image, 
  Database,
  Map,
  BarChart3,
  Settings,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";

interface ExportItem {
  id: string;
  name: string;
  type: 'map' | 'data' | 'report' | 'chart';
  description: string;
  formats: string[];
  icon: any;
}

interface ExportPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportPanel = ({ isOpen, onClose }: ExportPanelProps) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);

  const exportItems: ExportItem[] = [
    {
      id: 'map',
      name: 'Interactive Map',
      type: 'map',
      description: 'Current map view with layers and styling',
      formats: ['PNG', 'PDF', 'SVG', 'HTML'],
      icon: Map
    },
    {
      id: 'clusters',
      name: 'Cluster Analysis',
      type: 'data',
      description: 'Clustering results and statistics',
      formats: ['CSV', 'JSON', 'Excel'],
      icon: Database
    },
    {
      id: 'suitability',
      name: 'Suitability Scores',
      type: 'data',
      description: 'Calculated suitability scores for all locations',
      formats: ['CSV', 'GeoJSON', 'KML'],
      icon: BarChart3
    },
    {
      id: 'scenario',
      name: 'Scenario Comparison',
      type: 'chart',
      description: 'Before/after scenario analysis charts',
      formats: ['PNG', 'PDF', 'SVG'],
      icon: BarChart3
    },
    {
      id: 'summary',
      name: 'Analysis Summary',
      type: 'report',
      description: 'Complete analysis report with insights',
      formats: ['PDF', 'HTML', 'Word'],
      icon: FileText
    },
    {
      id: 'weights',
      name: 'Feature Weights',
      type: 'data',
      description: 'Selected features and their weights',
      formats: ['JSON', 'CSV'],
      icon: Settings
    }
  ];

  const toggleItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleExport = async () => {
    if (selectedItems.length === 0) {
      toast.error('Please select at least one item to export');
      return;
    }

    if (!exportFormat) {
      toast.error('Please select an export format');
      return;
    }

    setIsExporting(true);

    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Here you would implement actual export logic
      selectedItems.forEach(itemId => {
        const item = exportItems.find(i => i.id === itemId);
        console.log(`Exporting ${item?.name} as ${exportFormat}`);
      });

      toast.success(`Successfully exported ${selectedItems.length} items`);
      onClose();
    } catch (error) {
      toast.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const getAvailableFormats = () => {
    if (selectedItems.length === 0) return [];
    
    const selectedExportItems = exportItems.filter(item => selectedItems.includes(item.id));
    return selectedExportItems.reduce((commonFormats, item) => {
      if (commonFormats.length === 0) return item.formats;
      return commonFormats.filter(format => item.formats.includes(format));
    }, [] as string[]);
  };

  const availableFormats = getAvailableFormats();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Analysis Results
          </CardTitle>
          <CardDescription>
            Select items to export and choose your preferred format
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Export Items */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Select Items to Export</h4>
            <div className="grid gap-3">
              {exportItems.map((item) => {
                const Icon = item.icon;
                const isSelected = selectedItems.includes(item.id);
                
                return (
                  <div
                    key={item.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      isSelected 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => toggleItem(item.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => {}}
                        className="mt-1"
                      />
                      <Icon className="w-5 h-5 text-primary mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium">{item.name}</h5>
                          <Badge variant="outline" className="text-xs">
                            {item.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.description}
                        </p>
                        <div className="flex gap-1 mt-2">
                          {item.formats.map(format => (
                            <Badge key={format} variant="secondary" className="text-xs">
                              {format}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle className="w-5 h-5 text-geo-success" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Format Selection */}
          {selectedItems.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Export Format</h4>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose export format" />
                </SelectTrigger>
                <SelectContent>
                  {availableFormats.map(format => (
                    <SelectItem key={format} value={format}>
                      {format}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableFormats.length === 0 && selectedItems.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  No common formats available for selected items. Please select compatible items.
                </p>
              )}
            </div>
          )}

          {/* Export Summary */}
          {selectedItems.length > 0 && (
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="text-sm font-medium mb-2">Export Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Selected Items:</span>
                  <span className="font-medium">{selectedItems.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Export Format:</span>
                  <span className="font-medium">{exportFormat || 'Not selected'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Size:</span>
                  <span className="font-medium">~2.5 MB</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        {/* Actions */}
        <div className="p-6 border-t bg-card">
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleExport}
              disabled={selectedItems.length === 0 || !exportFormat || isExporting}
              className="gap-2"
            >
              {isExporting ? (
                <>
                  <Download className="w-4 h-4 animate-pulse" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export ({selectedItems.length})
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};