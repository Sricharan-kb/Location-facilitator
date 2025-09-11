import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  GitCompare, 
  TrendingUp, 
  TrendingDown,
  Settings,
  Play,
  BarChart3
} from "lucide-react";
import { ClusterCard } from "./ClusterCard";

interface ScenarioAnalysisProps {
  originalFeatures: string[];
  scenarioFeatureChanges: {[key: string]: number};
  scenarioConfig: {
    villagePercentage: number;
    randomnessFactor: number;
  };
  onFeatureChange: (featureName: string, changeValue: number) => void;
  onConfigChange: (config: {villagePercentage?: number, randomnessFactor?: number}) => void;
  onNormalizeAndScore: () => void;
  onRunClustering: () => void;
  isScenarioScored: boolean;
  scenarioClusters: any[];
  onShowInfo: (cluster: any) => void;
  onFocusMap: (cluster: any) => void;
  onGetAiInsights: (cluster: any) => void;
}

export const ScenarioAnalysis = ({ 
  originalFeatures,
  scenarioFeatureChanges,
  scenarioConfig,
  onFeatureChange,
  onConfigChange,
  onNormalizeAndScore,
  onRunClustering,
  isScenarioScored,
  scenarioClusters,
  onShowInfo,
  onFocusMap,
  onGetAiInsights
}: ScenarioAnalysisProps) => {
  
  const getTopNClusters = (clustersArr: any[], n: number) => {
    if (!Array.isArray(clustersArr)) return [];
    return [...clustersArr]
      .sort((a, b) => (b.avg_suitability_score || 0) - (a.avg_suitability_score || 0))
      .slice(0, n);
  };

  return (
    <div className="space-y-6">
      {/* Scenario Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCompare className="w-5 h-5" />
            Scenario Configuration
          </CardTitle>
          <CardDescription>
            Modify original features and configure scenario parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Original Features with Change Sliders */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Feature Modifications</Label>
            <div className="space-y-3">
              {originalFeatures.map((feature) => (
                <div key={feature} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">{feature}</Label>
                    <Badge variant="outline">
                      {((scenarioFeatureChanges[feature] || 0) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                        <Slider
                    value={[scenarioFeatureChanges[feature] || 0]}
                    onValueChange={([value]) => onFeatureChange(feature, value)}
                    min={-0.5}
                    max={0.5}
                    step={0.01}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
                    <span>-50%</span>
                    <span>0%</span>
                    <span>+50%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scenario Parameters */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Scenario Parameters</Label>
            
            <div className="space-y-3">
              <div className="space-y-2">
            <div className="flex items-center justify-between">
                  <Label className="text-sm">Villages Affected</Label>
                  <Badge variant="outline">
                    {scenarioConfig.villagePercentage.toFixed(1)}%
                  </Badge>
            </div>
            <Slider
                  value={[scenarioConfig.villagePercentage]}
                  onValueChange={([value]) => onConfigChange({ villagePercentage: value })}
              min={0}
                  max={100}
                  step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Randomness Factor</Label>
                  <Badge variant="outline">
                    {scenarioConfig.randomnessFactor.toFixed(1)}%
                  </Badge>
                </div>
                <Slider
                  value={[scenarioConfig.randomnessFactor]}
                  onValueChange={([value]) => onConfigChange({ randomnessFactor: value })}
                  min={0}
                  max={20}
                  step={0.5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>10%</span>
                  <span>20%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={onNormalizeAndScore} 
              className="flex-1"
              disabled={originalFeatures.length === 0}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Normalize & Score Scenario
            </Button>
              <Button 
              onClick={onRunClustering} 
              className="flex-1"
              disabled={!isScenarioScored}
            >
              <Play className="w-4 h-4 mr-2" />
              Run Scenario Clustering
              </Button>
          </div>

          {/* Debug Info */}
          <div className="text-xs text-muted-foreground pt-2 border-t">
            <div>Original Features: {originalFeatures.length}</div>
            <div>Scenario Scored: {isScenarioScored ? 'Yes' : 'No'}</div>
            <div>Scenario Clusters: {scenarioClusters.length}</div>
            <div>Feature Changes: {Object.keys(scenarioFeatureChanges).length}</div>
          </div>
        </CardContent>
      </Card>

      {/* Scenario Results */}
      {scenarioClusters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
                Scenario Results
            </CardTitle>
            <CardDescription>
              Top {Math.min(10, scenarioClusters.length)} scenario clusters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getTopNClusters(scenarioClusters, 10).map((cluster, index) => (
                <ClusterCard
                  key={cluster.cluster_id || cluster.cluster || index}
                  cluster={cluster}
                  onShowInfo={() => onShowInfo(cluster)}
                  onFocusMap={() => onFocusMap(cluster)}
                  onGetAiInsights={() => onGetAiInsights(cluster)}
                />
              ))}
            </div>
          </CardContent>
                  </Card>
      )}

      {/* No Results State */}
      {!isScenarioScored && (
        <Card>
          <CardContent className="text-center py-8">
            <Settings className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Configure Scenario</h3>
            <p className="text-muted-foreground">
              Modify features and parameters, then normalize and score the scenario data.
            </p>
          </CardContent>
                  </Card>
      )}

      {isScenarioScored && scenarioClusters.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Play className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Run Scenario Clustering</h3>
            <p className="text-muted-foreground">
              Scenario data is scored. Click "Run Scenario Clustering" to see results.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};