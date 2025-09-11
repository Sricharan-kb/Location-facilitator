import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Workflow, 
  Zap, 
  Target,
  Layers3,
  Settings,
  Play
} from "lucide-react";

interface ClusteringConfig {
  algorithm: 'kmeans' | 'dbscan' | 'hierarchical' | 'buffer' | 'archimedean_spiral';
  numClusters: number;
  radius: number;
  minPoints: number;
  maxPolygonsPerCluster: number;
  minPolygonsPerCluster: number;
  spiralRadius: number; // for archimedean spiral
  spiralSpacing: number; // for archimedean spiral
}

interface ClusteringControlsProps {
  onRunClustering: (config: ClusteringConfig) => void;
  isProcessing?: boolean;
}

export const ClusteringControls = ({ onRunClustering, isProcessing }: ClusteringControlsProps) => {
  const [config, setConfig] = useState<ClusteringConfig>({
    algorithm: 'kmeans',
    numClusters: 5,
    radius: 5, // Default 5km radius
    minPoints: 1, // Reduced from 3 to 1 for smaller datasets
    maxPolygonsPerCluster: 100, // Increased from 50 to 100
    minPolygonsPerCluster: 1, // Reduced from 2 to 1 for smaller datasets
    spiralRadius: 0.1,
    spiralSpacing: 0.05
  });

  const algorithms = [
    {
      value: 'kmeans',
      label: 'K-Means',
      description: 'Partitions data into k clusters',
      icon: Target
    },
    {
      value: 'dbscan',
      label: 'DBSCAN',
      description: 'Density-based clustering',
      icon: Layers3
    },
    {
      value: 'hierarchical',
      label: 'Hierarchical',
      description: 'Creates cluster hierarchy',
      icon: Workflow
    },
    {
      value: 'buffer',
      label: 'Buffer',
      description: 'Groups polygons by spatial buffer',
      icon: Settings
    },
    {
      value: 'archimedean_spiral',
      label: 'Archimedean Spiral',
      description: 'Geometric spiral-based clustering',
      icon: Zap
    }
  ];

  const updateConfig = (updates: Partial<ClusteringConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const isConfigValid = () => {
    if (config.algorithm === 'buffer') {
      return config.radius > 0 && config.maxPolygonsPerCluster > 0 && config.minPolygonsPerCluster > 0;
    } else if (config.algorithm === 'dbscan') {
      return config.radius > 0 && config.minPoints > 0 && config.maxPolygonsPerCluster > 0 && config.minPolygonsPerCluster > 0;
    } else if (config.algorithm === 'kmeans') {
      return config.numClusters > 0 && config.maxPolygonsPerCluster > 0 && config.minPolygonsPerCluster > 0;
    } else if (config.algorithm === 'hierarchical') {
      return config.numClusters > 0 && config.maxPolygonsPerCluster > 0 && config.minPolygonsPerCluster > 0;
    } else if (config.algorithm === 'archimedean_spiral') {
      return config.spiralRadius > 0 && config.spiralSpacing > 0 && config.maxPolygonsPerCluster > 0 && config.minPolygonsPerCluster > 0;
    }
    return false;
  };

  const handleRunClustering = () => {
    // Validate required parameters based on algorithm
    let isValid = true;
    let errorMessage = '';

    if (config.algorithm === 'buffer') {
      if (config.radius <= 0 || config.maxPolygonsPerCluster <= 0 || config.minPolygonsPerCluster <= 0) {
        isValid = false;
        errorMessage = 'Buffer clustering requires: radius > 0, max polygons > 0, min polygons > 0';
      }
    } else if (config.algorithm === 'dbscan') {
      if (config.radius <= 0 || config.minPoints <= 0 || config.maxPolygonsPerCluster <= 0 || config.minPolygonsPerCluster <= 0) {
        isValid = false;
        errorMessage = 'DBSCAN clustering requires: radius > 0, min points > 0, max polygons > 0, min polygons > 0';
      }
    } else if (config.algorithm === 'kmeans') {
      if (config.numClusters <= 0 || config.maxPolygonsPerCluster <= 0 || config.minPolygonsPerCluster <= 0) {
        isValid = false;
        errorMessage = 'KMeans clustering requires: number of clusters > 0, max polygons > 0, min polygons > 0';
      }
    } else if (config.algorithm === 'hierarchical') {
      if (config.numClusters <= 0 || config.maxPolygonsPerCluster <= 0 || config.minPolygonsPerCluster <= 0) {
        isValid = false;
        errorMessage = 'Hierarchical clustering requires: number of clusters > 0, max polygons > 0, min polygons > 0';
      }
    } else if (config.algorithm === 'archimedean_spiral') {
      if (config.spiralRadius <= 0 || config.spiralSpacing <= 0 || config.maxPolygonsPerCluster <= 0 || config.minPolygonsPerCluster <= 0) {
        isValid = false;
        errorMessage = 'Archimedean spiral clustering requires: spiral radius > 0, spiral spacing > 0, max polygons > 0, min polygons > 0';
      }
    }

    if (!isValid) {
      alert(errorMessage);
      return;
    }

    onRunClustering(config);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Workflow className="w-5 h-5" />
          Clustering Analysis
        </CardTitle>
        <CardDescription>
          Configure clustering parameters for spatial grouping
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Algorithm Selection */}
        <div className="space-y-3">
          <Label>Clustering Algorithm</Label>
          <div className="grid gap-3">
            {algorithms.map((algo) => {
              const Icon = algo.icon;
              return (
                <div
                  key={algo.value}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    config.algorithm === algo.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => updateConfig({ algorithm: algo.value as any })}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-primary" />
                    <div>
                      <h4 className="font-medium">{algo.label}</h4>
                      <p className="text-xs text-muted-foreground">{algo.description}</p>
                    </div>
                    {config.algorithm === algo.value && (
                      <Badge className="ml-auto">Selected</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Algorithm-specific parameters */}
        <div className="space-y-4">
          {config.algorithm === 'kmeans' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Number of Clusters: {config.numClusters}</Label>
                  <Target className="w-4 h-4 text-muted-foreground" />
                </div>
                <Slider
                  value={[config.numClusters]}
                  onValueChange={([value]) => updateConfig({ numClusters: value })}
                  max={20}
                  min={2}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>2 clusters</span>
                  <span>20 clusters</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Max Polygons per Cluster: {config.maxPolygonsPerCluster}</Label>
                  <Settings className="w-4 h-4 text-muted-foreground" />
                </div>
                <Slider
                  value={[config.maxPolygonsPerCluster]}
                  onValueChange={([value]) => updateConfig({ maxPolygonsPerCluster: value })}
                  max={100}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1</span>
                  <span>100</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Min Polygons per Cluster: {config.minPolygonsPerCluster}</Label>
                  <Settings className="w-4 h-4 text-muted-foreground" />
                </div>
                <Slider
                  value={[config.minPolygonsPerCluster]}
                  onValueChange={([value]) => updateConfig({ minPolygonsPerCluster: value })}
                  max={20}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1</span>
                  <span>20</span>
                </div>
              </div>
            </div>
          )}

          {config.algorithm === 'dbscan' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Radius (kilometers): {config.radius.toFixed(1)}km</Label>
                  <Layers3 className="w-4 h-4 text-muted-foreground" />
                </div>
                <Slider
                  value={[config.radius]}
                  onValueChange={([value]) => updateConfig({ radius: value })}
                  max={200}
                  min={0.1}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0.1km</span>
                  <span>200km</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Min Points: {config.minPoints}</Label>
                  <Settings className="w-4 h-4 text-muted-foreground" />
                </div>
                <Slider
                  value={[config.minPoints]}
                  onValueChange={([value]) => updateConfig({ minPoints: value })}
                  max={20}
                  min={2}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>2 points</span>
                  <span>20 points</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Max Polygons per Cluster: {config.maxPolygonsPerCluster}</Label>
                  <Settings className="w-4 h-4 text-muted-foreground" />
                </div>
                <Slider
                  value={[config.maxPolygonsPerCluster]}
                  onValueChange={([value]) => updateConfig({ maxPolygonsPerCluster: value })}
                  max={100}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1</span>
                  <span>100</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Min Polygons per Cluster: {config.minPolygonsPerCluster}</Label>
                  <Settings className="w-4 h-4 text-muted-foreground" />
                </div>
                <Slider
                  value={[config.minPolygonsPerCluster]}
                  onValueChange={([value]) => updateConfig({ minPolygonsPerCluster: value })}
                  max={20}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1</span>
                  <span>20</span>
                </div>
              </div>
            </div>
          )}

          {config.algorithm === 'hierarchical' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Number of Clusters: {config.numClusters}</Label>
                  <Workflow className="w-4 h-4 text-muted-foreground" />
                </div>
                <Slider
                  value={[config.numClusters]}
                  onValueChange={([value]) => updateConfig({ numClusters: value })}
                  max={15}
                  min={2}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>2 clusters</span>
                  <span>15 clusters</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Max Polygons per Cluster: {config.maxPolygonsPerCluster}</Label>
                  <Settings className="w-4 h-4 text-muted-foreground" />
                </div>
                <Slider
                  value={[config.maxPolygonsPerCluster]}
                  onValueChange={([value]) => updateConfig({ maxPolygonsPerCluster: value })}
                  max={100}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1</span>
                  <span>100</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Min Polygons per Cluster: {config.minPolygonsPerCluster}</Label>
                  <Settings className="w-4 h-4 text-muted-foreground" />
                </div>
                <Slider
                  value={[config.minPolygonsPerCluster]}
                  onValueChange={([value]) => updateConfig({ minPolygonsPerCluster: value })}
                  max={20}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1</span>
                  <span>20</span>
                </div>
              </div>
            </div>
          )}

          {config.algorithm === 'buffer' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Buffer Radius: {config.radius.toFixed(1)}km</Label>
                  <Settings className="w-4 h-4 text-muted-foreground" />
                </div>
                <Slider
                  value={[config.radius]}
                  onValueChange={([value]) => updateConfig({ radius: value })}
                  max={200}
                  min={0.1}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0.1km</span>
                  <span>200km</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Max Polygons per Cluster: {config.maxPolygonsPerCluster}</Label>
                  <Settings className="w-4 h-4 text-muted-foreground" />
                </div>
                <Slider
                  value={[config.maxPolygonsPerCluster]}
                  onValueChange={([value]) => updateConfig({ maxPolygonsPerCluster: value })}
                  max={100}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1</span>
                  <span>100</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Min Polygons per Cluster: {config.minPolygonsPerCluster}</Label>
                  <Settings className="w-4 h-4 text-muted-foreground" />
                </div>
                <Slider
                  value={[config.minPolygonsPerCluster]}
                  onValueChange={([value]) => updateConfig({ minPolygonsPerCluster: value })}
                  max={20}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1</span>
                  <span>20</span>
                </div>
              </div>
            </div>
          )}

          {config.algorithm === 'archimedean_spiral' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Spiral Radius: {config.spiralRadius}°</Label>
                  <Zap className="w-4 h-4 text-muted-foreground" />
                </div>
                <Slider
                  value={[config.spiralRadius]}
                  onValueChange={([value]) => updateConfig({ spiralRadius: value })}
                  max={1.0}
                  min={0.01}
                  step={0.01}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0.01°</span>
                  <span>1.0°</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Spiral Spacing: {config.spiralSpacing}°</Label>
                  <Zap className="w-4 h-4 text-muted-foreground" />
                </div>
                <Slider
                  value={[config.spiralSpacing]}
                  onValueChange={([value]) => updateConfig({ spiralSpacing: value })}
                  max={0.5}
                  min={0.01}
                  step={0.01}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0.01°</span>
                  <span>0.5°</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Max Polygons per Cluster: {config.maxPolygonsPerCluster}</Label>
                  <Settings className="w-4 h-4 text-muted-foreground" />
                </div>
                <Slider
                  value={[config.maxPolygonsPerCluster]}
                  onValueChange={([value]) => updateConfig({ maxPolygonsPerCluster: value })}
                  max={100}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1</span>
                  <span>100</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Min Polygons per Cluster: {config.minPolygonsPerCluster}</Label>
                  <Settings className="w-4 h-4 text-muted-foreground" />
                </div>
                <Slider
                  value={[config.minPolygonsPerCluster]}
                  onValueChange={([value]) => updateConfig({ minPolygonsPerCluster: value })}
                  max={20}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1</span>
                  <span>20</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Configuration Summary */}
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configuration Summary
          </h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Algorithm:</span>
              <span className="font-medium">
                {algorithms.find(a => a.value === config.algorithm)?.label}
              </span>
            </div>
            
            {/* Algorithm-specific parameters */}
            {config.algorithm === 'kmeans' && (
              <>
                <div className="flex justify-between">
                  <span>Number of Clusters:</span>
                  <span className="font-medium">{config.numClusters}</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Polygons per Cluster:</span>
                  <span className="font-medium">{config.maxPolygonsPerCluster}</span>
                </div>
                <div className="flex justify-between">
                  <span>Min Polygons per Cluster:</span>
                  <span className="font-medium">{config.minPolygonsPerCluster}</span>
                </div>
              </>
            )}
            
            {config.algorithm === 'dbscan' && (
              <>
                <div className="flex justify-between">
                  <span>Radius:</span>
                  <span className="font-medium">{(config.radius / 1000).toFixed(1)}km (max: 200km)</span>
                </div>
                <div className="flex justify-between">
                  <span>Min Points:</span>
                  <span className="font-medium">{config.minPoints}</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Polygons per Cluster:</span>
                  <span className="font-medium">{config.maxPolygonsPerCluster}</span>
                </div>
                <div className="flex justify-between">
                  <span>Min Polygons per Cluster:</span>
                  <span className="font-medium">{config.minPolygonsPerCluster}</span>
                </div>
              </>
            )}
            
            {config.algorithm === 'hierarchical' && (
              <>
                <div className="flex justify-between">
                  <span>Number of Clusters:</span>
                  <span className="font-medium">{config.numClusters}</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Polygons per Cluster:</span>
                  <span className="font-medium">{config.maxPolygonsPerCluster}</span>
                </div>
                <div className="flex justify-between">
                  <span>Min Polygons per Cluster:</span>
                  <span className="font-medium">{config.minPolygonsPerCluster}</span>
                </div>
              </>
            )}
            
            {config.algorithm === 'buffer' && (
              <>
                <div className="flex justify-between">
                  <span>Buffer Radius:</span>
                  <span className="font-medium">{(config.radius / 1000).toFixed(1)}km (max: 200km)</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Polygons per Cluster:</span>
                  <span className="font-medium">{config.maxPolygonsPerCluster}</span>
                </div>
                <div className="flex justify-between">
                  <span>Min Polygons per Cluster:</span>
                  <span className="font-medium">{config.minPolygonsPerCluster}</span>
                </div>
              </>
            )}
            
            {config.algorithm === 'archimedean_spiral' && (
              <>
                <div className="flex justify-between">
                  <span>Spiral Radius:</span>
                  <span className="font-medium">{config.spiralRadius}°</span>
                </div>
                <div className="flex justify-between">
                  <span>Spiral Spacing:</span>
                  <span className="font-medium">{config.spiralSpacing}°</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Polygons per Cluster:</span>
                  <span className="font-medium">{config.maxPolygonsPerCluster}</span>
                </div>
                <div className="flex justify-between">
                  <span>Min Polygons per Cluster:</span>
                  <span className="font-medium">{config.minPolygonsPerCluster}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Run Button */}
        <Button 
          onClick={handleRunClustering}
          disabled={isProcessing || !isConfigValid()}
          className="w-full gap-2"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Zap className="w-4 h-4 animate-pulse" />
              Processing...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Run Clustering Analysis
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};