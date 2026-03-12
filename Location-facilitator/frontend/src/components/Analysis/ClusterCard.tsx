import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Info, MapPin, Sparkles } from "lucide-react";

interface ClusterCardProps {
  cluster: any;
  onShowInfo: () => void;
  onFocusMap: () => void;
  onGetAiInsights: () => void;
}

export const ClusterCard = ({ cluster, onShowInfo, onFocusMap, onGetAiInsights }: ClusterCardProps) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Cluster {cluster.cluster_number || cluster.cluster_id || 'N/A'}
          </CardTitle>
          <Badge variant="secondary" className="text-sm">
            Score: {cluster.avg_suitability_score?.toFixed(2) || 'N/A'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{cluster.count || cluster.polygonCount || 0} Polygons</span>
          <span className="text-xs">ID: {cluster.cluster_id || 'N/A'}</span>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onShowInfo}
            className="flex-1"
          >
            <Info className="h-4 w-4 mr-2" />
            Info
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onFocusMap}
            className="flex-1"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Map
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onGetAiInsights}
            className="flex-1"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            AI
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
