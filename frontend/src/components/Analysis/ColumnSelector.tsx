import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Settings2, 
  Weight, 
  TrendingUp,
  Database,
  Trash2,
  Plus,
  Info,
  BookOpen
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import axios from "axios";

interface ColumnConfig {
  name: string;
  selected: boolean;
  weight: number;
  type: 'numeric' | 'categorical';
  influence: 'positive' | 'negative';
}

interface ColumnSelectorProps {
  columns: string[];
  onConfigChange: (config: { features: ColumnConfig[]; centroidLngCol?: string; centroidLatCol?: string }) => void;
  centroidLngCol?: string;
  centroidLatCol?: string;
}

export const ColumnSelector = ({ columns, onConfigChange }: ColumnSelectorProps) => {
  // Load from localStorage if available
  const getInitialConfigs = () => {
    const saved = localStorage.getItem('featureSelectorConfig');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge with current columns
        return columns.map(col => {
          const prev = parsed.find((c: any) => c.name === col);
          return prev || {
            name: col,
            selected: false,
            weight: 1,
            type: 'numeric',
            influence: 'positive'
          };
        });
      } catch {
        // Fallback to default
      }
    }
    return columns.map(col => ({
      name: col,
      selected: false,
      weight: 1,
      type: 'numeric' as const,
      influence: 'positive' as const
    }));
  };
  const [configs, setConfigs] = useState<ColumnConfig[]>(getInitialConfigs());
  const [featureDescriptions, setFeatureDescriptions] = useState<{[key: string]: any}>({});
  const [loadingDescriptions, setLoadingDescriptions] = useState(false);

  // Save to localStorage whenever configs change
  useEffect(() => {
    localStorage.setItem('featureSelectorConfig', JSON.stringify(configs));
  }, [configs]);

  // Load feature descriptions
  useEffect(() => {
    const loadFeatureDescriptions = async () => {
      setLoadingDescriptions(true);
      try {
        const response = await axios.get('http://127.0.0.1:5000/api/feature-descriptions');
        if (response.data && response.data.all_descriptions) {
          // Auto-map descriptions for all available features
          const descriptions: {[key: string]: any} = {};
          for (const column of columns) {
            // Check if feature exists in our descriptions
            if (response.data.all_descriptions[column]) {
              descriptions[column] = response.data.all_descriptions[column];
            } else {
              // Feature not found in descriptions, use default
              descriptions[column] = {
                name: column,
                description: "Feature description not available",
                category: "Other",
                unit: "Unknown",
                positive_impact: true,
                explanation: "Impact assessment not available"
              };
            }
          }
          setFeatureDescriptions(descriptions);
        }
      } catch (error) {
        console.error('Failed to load feature descriptions:', error);
        // Set default descriptions for all features
        const defaultDescriptions: {[key: string]: any} = {};
        columns.forEach(column => {
          defaultDescriptions[column] = {
            name: column,
            description: "Feature description not available",
            category: "Other",
            unit: "Unknown",
            positive_impact: true,
            explanation: "Impact assessment not available"
          };
        });
        setFeatureDescriptions(defaultDescriptions);
      } finally {
        setLoadingDescriptions(false);
      }
    };

    if (columns.length > 0) {
      loadFeatureDescriptions();
    }
  }, [columns]);

  const updateConfig = (index: number, updates: Partial<ColumnConfig>) => {
    const newConfigs = [...configs];
    newConfigs[index] = { ...newConfigs[index], ...updates };
    setConfigs(newConfigs);
    onConfigChange({
      features: newConfigs.filter(c => c.selected),
      centroidLngCol: undefined,
      centroidLatCol: undefined
    });
  };

  const handleReset = () => {
    localStorage.removeItem('featureSelectorConfig');
    setConfigs(columns.map(col => ({
      name: col,
      selected: false,
      weight: 1,
      type: 'numeric' as const,
      influence: 'positive' as const
    })));
  };

  const selectedConfigs = configs.filter(c => c.selected);
  const totalWeight = selectedConfigs.reduce((sum, c) => sum + c.weight, 0);

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="w-5 h-5" />
          Feature Configuration
          {loadingDescriptions && (
            <Badge variant="outline" className="text-xs">
              Loading descriptions...
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Select columns and assign weights for suitability analysis. Hover over the info icon for detailed feature descriptions.
        </CardDescription>
        <Button size="sm" variant="outline" className="mt-2" onClick={handleReset}>
          Reset Feature Selection
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Available Columns</h4>
            <Badge variant="outline" className="gap-1">
              <Database className="w-3 h-3" />
              {columns.length} columns
            </Badge>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {configs.map((config, index) => (
              <div 
                key={config.name} 
                className={`p-4 border rounded-lg transition-colors flex flex-col gap-2 min-w-0 ${
                  config.selected ? 'border-primary bg-primary/5' : 'border-border'
                }`}
                style={{ minWidth: 0 }}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <Checkbox
                    checked={config.selected}
                    onCheckedChange={(checked) => 
                      updateConfig(index, { selected: !!checked })
                    }
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="text-sm font-medium whitespace-normal break-words" style={{ minWidth: 180, maxWidth: 400 }}>
                        {featureDescriptions[config.name]?.name || config.name}
                      </p>
                      {featureDescriptions[config.name] && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <Info className="w-3 h-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-lg whitespace-normal break-words">
                              <div className="space-y-2">
                                <div>
                                  <p className="font-medium whitespace-normal break-words">{featureDescriptions[config.name].name}</p>
                                  <p className="text-sm text-muted-foreground whitespace-normal break-words">{featureDescriptions[config.name].description}</p>
                                </div>
                                <div className="flex gap-2 text-xs">
                                  <Badge variant="outline">{featureDescriptions[config.name].category}</Badge>
                                  <Badge variant="outline">{featureDescriptions[config.name].unit}</Badge>
                                </div>
                                <div>
                                  <p className="text-xs font-medium">Impact:</p>
                                  <p className="text-xs text-muted-foreground whitespace-normal break-words">{featureDescriptions[config.name].explanation}</p>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    <div className="flex gap-2 mt-1">
                      <Badge 
                        variant={config.type === 'numeric' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {config.type}
                      </Badge>
                      <Badge 
                        variant={config.influence === 'positive' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {config.influence}
                      </Badge>
                      {featureDescriptions[config.name]?.category && (
                        <Badge variant="outline" className="text-xs">
                          {featureDescriptions[config.name].category}
                        </Badge>
                      )}
                    </div>
                    {featureDescriptions[config.name]?.description && (
                      <p className="text-xs text-muted-foreground mt-1 whitespace-normal break-words" style={{ maxWidth: 400 }}>
                        {featureDescriptions[config.name].description}
                      </p>
                    )}
                  </div>
                </div>

                {config.selected && (
                  <div className="mt-4 space-y-3 pl-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Weight: {config.weight}</Label>
                        <Weight className="w-3 h-3 text-muted-foreground" />
                      </div>
                      <Slider
                        value={[config.weight]}
                        onValueChange={([value]) => updateConfig(index, { weight: value })}
                        max={5}
                        min={0.1}
                        step={0.1}
                        className="w-full"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={config.type === 'numeric' ? 'default' : 'outline'}
                        onClick={() => updateConfig(index, { type: 'numeric' })}
                      >
                        Numeric
                      </Button>
                      <Button
                        size="sm"
                        variant={config.type === 'categorical' ? 'default' : 'outline'}
                        onClick={() => updateConfig(index, { type: 'categorical' })}
                      >
                        Categorical
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={config.influence === 'positive' ? 'default' : 'outline'}
                        onClick={() => updateConfig(index, { influence: 'positive' })}
                        className="gap-1"
                      >
                        <TrendingUp className="w-3 h-3" />
                        Positive
                      </Button>
                      <Button
                        size="sm"
                        variant={config.influence === 'negative' ? 'destructive' : 'outline'}
                        onClick={() => updateConfig(index, { influence: 'negative' })}
                        className="gap-1"
                      >
                        <TrendingUp className="w-3 h-3 rotate-180" />
                        Negative
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {selectedConfigs.length > 0 && (
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Weight className="w-4 h-4" />
              Weight Summary
            </h4>
            <div className="space-y-2">
              {selectedConfigs.map((config) => (
                <div key={config.name} className="flex justify-between text-sm">
                  <span className="truncate flex-1">{config.name}</span>
                  <span className="font-medium">
                    {totalWeight > 0 ? ((config.weight / totalWeight) * 100).toFixed(1) : '0.0'}%
                  </span>
                </div>
              ))}
              <div className="pt-2 border-t">
                <div className="flex justify-between text-sm font-medium">
                  <span>Total Features</span>
                  <span>{selectedConfigs.length}</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span>Total Weight</span>
                  <span>{totalWeight.toFixed(1)} ({totalWeight > 0 ? '100.0%' : '0.0%'})</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};