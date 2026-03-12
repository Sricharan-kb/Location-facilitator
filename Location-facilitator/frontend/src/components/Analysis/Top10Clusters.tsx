import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Info, 
  X,
  Users,
  Target,
  TrendingUp,
  BarChart3
} from "lucide-react";

interface Cluster {
  cluster: number;
  cluster_id?: string;
  count: number;
  avg_suitability_score: number;
  median_suitability_score: number;
  min_suitability_score: number;
  max_suitability_score: number;
  std_suitability_score: number;
  centroid: [number, number] | null;
}

interface Top10ClustersProps {
  clusters: Cluster[];
  onMapFocus: (centroid: [number, number]) => void;
  isVisible: boolean;
  clusterInsights?: {[key: number]: any};
  onClusterSelect?: (cluster: Cluster) => void;
  showComparison?: boolean;
  comparisonMode?: 'single' | 'split';
  onComparisonModeChange?: (mode: 'single' | 'split') => void;
}

export const Top10Clusters = ({ 
  clusters, 
  onMapFocus, 
  isVisible, 
  clusterInsights = {}, 
  onClusterSelect,
  showComparison = false,
  comparisonMode = 'single',
  onComparisonModeChange
}: Top10ClustersProps) => {
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [showInfoOverlay, setShowInfoOverlay] = useState(false);

  const handleMapFocus = (cluster: Cluster) => {
    if (cluster.centroid) {
      onMapFocus(cluster.centroid);
    }
  };

  const handleShowInfo = (cluster: Cluster) => {
    setSelectedCluster(cluster);
    setShowInfoOverlay(true);
  };

  const handleCloseInfo = () => {
    setShowInfoOverlay(false);
    setSelectedCluster(null);
  };

  if (!isVisible || clusters.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Top 10 Clusters
              </CardTitle>
              <CardDescription>
                Best performing clusters based on suitability scores
              </CardDescription>
            </div>
            {showComparison && onComparisonModeChange && (
              <div className="flex gap-2">
                <Button
                  variant={comparisonMode === 'single' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onComparisonModeChange('single')}
                >
                  Single Map
                </Button>
                <Button
                  variant={comparisonMode === 'split' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onComparisonModeChange('split')}
                >
                  Split Maps
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {clusters.map((cluster, index) => (
              <div
                key={cluster.cluster_id || cluster.cluster || index}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="w-8 h-8 rounded-full flex items-center justify-center">
                    #{index + 1}
                  </Badge>
                  <div>
                    <div className="font-medium">Cluster {cluster.cluster ?? 'N/A'}</div>
                    <div className="text-sm text-muted-foreground">
                      {cluster.count ?? 'N/A'} polygons • Score: {cluster.avg_suitability_score?.toFixed(2) ?? 'N/A'}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMapFocus(cluster)}
                    disabled={!cluster.centroid}
                    className="gap-1"
                  >
                    <MapPin className="w-3 h-3" />
                    Map
                  </Button>
                  {onClusterSelect && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onClusterSelect(cluster)}
                      className="gap-1"
                    >
                      <Target className="w-3 h-3" />
                      Select
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShowInfo(cluster)}
                    className="gap-1"
                  >
                    <Info className="w-3 h-3" />
                    Info
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info Overlay */}
      {showInfoOverlay && selectedCluster && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-background border rounded-t-lg w-full max-w-md mx-4 mb-4 max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Cluster {selectedCluster.cluster ?? 'N/A'} Details</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseInfo}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Polygons</div>
                    <div className="font-medium">{selectedCluster.count ?? 'N/A'}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Avg Score</div>
                    <div className="font-medium">{selectedCluster.avg_suitability_score?.toFixed(2) ?? 'N/A'}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium mb-2">Score Statistics</div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-muted-foreground">Median</div>
                      <div className="font-medium">{selectedCluster.median_suitability_score?.toFixed(2) ?? 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Min</div>
                      <div className="font-medium">{selectedCluster.min_suitability_score?.toFixed(2) ?? 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Max</div>
                      <div className="font-medium">{selectedCluster.max_suitability_score?.toFixed(2) ?? 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Std Dev</div>
                      <div className="font-medium">{selectedCluster.std_suitability_score?.toFixed(2) ?? 'N/A'}</div>
                    </div>
                  </div>
                </div>

                {selectedCluster.centroid && (
                  <div>
                    <div className="text-sm font-medium mb-2">Centroid Location</div>
                    <div className="text-sm text-muted-foreground">
                      Lat: {selectedCluster.centroid[1]?.toFixed(4) ?? 'N/A'}, 
                      Lng: {selectedCluster.centroid[0]?.toFixed(4) ?? 'N/A'}
                    </div>
                  </div>
                )}

                                 {/* AI Insights */}
                {clusterInsights[selectedCluster.cluster] && (
                  <div className="mt-6 pt-4 border-t">
                    <div className="text-sm font-semibold mb-3 flex items-center gap-2 text-blue-600">
                      <TrendingUp className="w-4 h-4" />
                      Business Intelligence
                    </div>
                    <div className="text-sm leading-relaxed bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
                      <div className="font-medium text-gray-800 mb-2">Key Insights:</div>
                      <div className="text-gray-700 space-y-2">
                        {(() => {
                          const insights = clusterInsights[selectedCluster.cluster];
                          if (typeof insights === 'string') {
                            return insights.split('\n').map((line: string, idx: number) => (
                              <div key={idx} className="flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                <span>{line.trim()}</span>
                              </div>
                            ));
                          } else if (insights && typeof insights === 'object' && (insights as any).insights) {
                            return (insights as any).insights.split('\n').map((line: string, idx: number) => (
                              <div key={idx} className="flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                <span>{line.trim()}</span>
                              </div>
                            ));
                          } else {
                            return (
                              <div className="text-muted-foreground">
                                Insights not available in expected format
                              </div>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (selectedCluster.centroid) {
                      onMapFocus(selectedCluster.centroid);
                      handleCloseInfo();
                    }
                  }}
                  disabled={!selectedCluster.centroid}
                  className="flex-1 gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  Focus on Map
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCloseInfo}
                  className="flex-1 gap-2"
                >
                  <X className="w-4 h-4" />
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}; 