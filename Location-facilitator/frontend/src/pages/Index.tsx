import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Layout/Header";
import { FileUpload } from "@/components/DataUpload/FileUpload";
import { ColumnSelector } from "@/components/Analysis/ColumnSelector";
import { ClusteringControls } from "@/components/Analysis/ClusteringControls";
import { ScenarioAnalysis } from "@/components/Analysis/ScenarioAnalysis";
import { ExportPanel } from "@/components/Export/ExportPanel";
import MapComponent from "@/components/Map/MapComponent";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Map,
  Upload,
  Settings2,
  Workflow,
  GitCompare,
  Database,
  BarChart3,
  Layers,
  TrendingUp,
  PieChart,
  LineChart,
  MapPin,
  Eye,
  EyeOff,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import axios from 'axios';
import { getDistance, matchClustersByCentroid } from "@/utils/clusterUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose
} from "@/components/ui/dialog";
import { ProductInfo } from "@/components/Analysis/ProductInfo";
import { ClusterCard } from "@/components/Analysis/ClusterCard";
import { Comparison } from "@/components/Analysis/Comparison";
import { Top10Clusters } from "@/components/Analysis/Top10Clusters";

interface ColumnConfig {
  name: string;
  selected: boolean;
  weight: number;
  type: 'numeric' | 'categorical';
  influence: 'positive' | 'negative';
}

interface ClusteringConfig {
  algorithm: 'kmeans' | 'dbscan' | 'hdbscan' | 'hierarchical' | 'buffer';
  numClusters: number;
  radius: number;
  minPoints: number;
  maxPolygonsPerCluster: number;
  minPolygonsPerCluster: number;
}

const Index = () => {
  const [lastClusteringConfig, setLastClusteringConfig] = useState<ClusteringConfig | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [spatialData, setSpatialData] = useState<any>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [columnConfigs, setColumnConfigs] = useState<ColumnConfig[]>([]);
  const [isScored, setIsScored] = useState(false);
  const [clusters, setClusters] = useState<any[]>([]);
  const [currentClusters, setCurrentClusters] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("clusters");
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [selectedClusterForDialog, setSelectedClusterForDialog] = useState<any>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [currentAiInsights, setCurrentAiInsights] = useState<string>("");
  const [mapFocusPoint, setMapFocusPoint] = useState<[number, number] | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<number | null>(null);
  const [showMap, setShowMap] = useState(true);
  const [scenarioData, setScenarioData] = useState<any>(null);
  const [scenarioClusters, setScenarioClusters] = useState<any[]>([]);
  const [isScenarioScored, setIsScenarioScored] = useState(false);
  const [scenarioFeatureChanges, setScenarioFeatureChanges] = useState<{ [key: string]: number }>({});
  const [scenarioConfig, setScenarioConfig] = useState({
    villagePercentage: 10,
    randomnessFactor: 5
  });
  const [comparisonTab, setComparisonTab] = useState("overview");
  const [comparisonInsights, setComparisonInsights] = useState("");
  const [isGeneratingComparisonInsights, setIsGeneratingComparisonInsights] = useState(false);
  const [productInfo, setProductInfo] = useState({
    name: "Business Product",
    description: "Product analysis for market expansion",
    targetAudience: "General Market",
    budget: "Medium",
    productType: "Infrastructure"
  });
  const [columnMetadata, setColumnMetadata] = useState<Record<string, string> | null>(null);
  const [baselineFeatureStats, setBaselineFeatureStats] = useState<Record<string, any> | null>(null);

  // Auto-hide map when scrolling cluster cards
  useEffect(() => {
    const handleScroll = () => {
      const clusterContent = document.querySelector('[data-tab="clusters"]');
      if (clusterContent) {
        const scrollTop = clusterContent.scrollTop;
        if (scrollTop > 50) {
          setShowMap(false);
        } else {
          setShowMap(true);
        }
      }
    };

    const clusterContent = document.querySelector('[data-tab="clusters"]');
    if (clusterContent) {
      clusterContent.addEventListener('scroll', handleScroll);
      return () => clusterContent.removeEventListener('scroll', handleScroll);
    }
  }, [activeTab, clusters]);

  const handleFileProcessed = (data: any, fileColumns: string[], metadata?: Record<string, string>) => {
    setSpatialData(data);
    setColumns(fileColumns);
    setIsDataLoaded(true);
    if (metadata) setColumnMetadata(metadata);
    toast.success("Data processed successfully!");
  };

  const handleRunClustering = async (config: ClusteringConfig) => {
    if (!spatialData.features || spatialData.features.length === 0) {
      toast.error("No spatial data available. Please upload data first.");
      return;
    }

    if (columnConfigs.length === 0) {
      toast.error("No column configurations available. Please configure columns first.");
      return;
    }

    setIsProcessing(true);
    setCurrentClusters([]);
    setCurrentAiInsights(null);

    try {
      // Step 1: Normalize and score the data (if not already done)
      let scoredPolygons = spatialData.features;

      // Check if we need to normalize and score
      const needsScoring = !spatialData.features[0]?.properties?.suitabilityScore;

      if (needsScoring) {
        console.log("Sending normalize request:", {
          featuresCount: columnConfigs.filter(c => c.selected).length,
          weightsCount: columnConfigs.filter(c => c.selected).map(c => c.weight).length,
          polygonsCount: spatialData.features.length,
          needsScoring
        });

        const normalizeRequestData = {
          polygons: spatialData.features,
          features: columnConfigs.filter(c => c.selected).map(c => c.name),
          weights: columnConfigs.filter(c => c.selected).map(c => c.weight)
        };

        const normalizeResponse = await axios.post('http://localhost:5000/api/normalize-score', normalizeRequestData);

        if (normalizeResponse.data.polygons) {
          scoredPolygons = normalizeResponse.data.polygons;
          setSpatialData(prev => ({ ...prev, features: scoredPolygons }));
          // Store baseline scaler bounds so scenario scoring uses the same scale
          if (normalizeResponse.data.feature_stats) {
            setBaselineFeatureStats(normalizeResponse.data.feature_stats);
          }
          setIsScored(true); // Set scored state to true
          toast.success("Data scored successfully!");
        }
      }

      // Step 2: Run clustering with the scored data
      const requestData = {
        algorithm: config.algorithm,
        params: (() => {
          // Algorithm-specific parameters
          const baseParams = {
            max_polygons_per_cluster: config.maxPolygonsPerCluster,
            min_polygons_per_cluster: config.minPolygonsPerCluster
          };

          switch (config.algorithm) {
            case 'kmeans':
              return {
                ...baseParams,
                n_clusters: config.numClusters
              };
            case 'hierarchical':
              return {
                ...baseParams,
                n_clusters: config.numClusters
              };
            case 'dbscan':
              return {
                ...baseParams,
                dbscan_eps: config.radius,
                dbscan_min_samples: config.minPoints
              };
            case 'buffer':
              return {
                ...baseParams,
                radius: config.radius // radius in km
              };
            default:
              return baseParams;
          }
        })(),
        polygons: scoredPolygons,
        include_ai_insights: true,
        product_info: productInfo
      };

      console.log("Sending clustering request:", {
        algorithm: config.algorithm,
        params: requestData.params,
        polygonsCount: scoredPolygons.length,
        includeAiInsights: true
      });

      const response = await axios.post('http://localhost:5000/api/cluster', requestData);

      if (response.data.clusters) {
        console.log("Received clusters from backend:", response.data.clusters);
        setCurrentClusters(response.data.clusters);
        setClusters(response.data.clusters); // Also update the main clusters state
        setSpatialData(prev => ({ ...prev, features: response.data.polygons }));

        // Store the clustering configuration for scenario analysis
        setLastClusteringConfig(config);

        toast.success(`Clustering completed! Found ${response.data.clusters.length} clusters.`);

        if (response.data.ai_insights) {
          console.log('AI Insights response structure:', response.data.ai_insights);
          console.log('AI Insights type:', typeof response.data.ai_insights);
          setCurrentAiInsights(response.data.ai_insights);
          toast.success("AI insights generated successfully!");
        }
      } else {
        toast.error("Clustering failed: No clusters returned.");
      }
    } catch (error: any) {
      console.error("Clustering error:", error);
      if (error.response?.data?.error) {
        toast.error(`Clustering failed: ${error.response.data.error}`);
      } else {
        toast.error("Clustering failed. Check console for details.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNormalizeAndScore = async () => {
    if (!spatialData || !columnConfigs.length) {
      toast.error("Please ensure data is loaded and features are configured");
      return;
    }

    // Check if spatial data has features
    if (!spatialData.features || spatialData.features.length === 0) {
      toast.error("No spatial data available. Please upload data first.");
      return;
    }

    const selectedFeatures = columnConfigs.filter(c => c.selected).map(c => c.name);
    const weights = columnConfigs.filter(c => c.selected).map(c => c.weight);

    if (selectedFeatures.length === 0) {
      toast.error("Please select at least one feature for scoring");
      return;
    }

    try {
      // Use the dedicated normalize-score endpoint
      const requestData = {
        polygons: spatialData.features,
        features: selectedFeatures,
        weights: weights
      };

      console.log('Sending normalize request:', {
        featuresCount: requestData.features.length,
        weightsCount: requestData.weights.length,
        polygonsCount: requestData.polygons.length,
        hasSpatialData: !!spatialData,
        hasFeatures: selectedFeatures.length > 0
      });

      // Validate request data before sending
      if (!requestData.polygons || requestData.polygons.length === 0) {
        toast.error("No polygon data available");
        return;
      }
      if (!requestData.features || requestData.features.length === 0) {
        toast.error("No features selected");
        return;
      }
      if (!requestData.weights || requestData.weights.length === 0) {
        toast.error("No weights configured");
        return;
      }

      const response = await axios.post('http://localhost:5000/api/normalize-score', requestData);

      if (response.data.polygons) {
        // Store the scored data in state
        setSpatialData({ ...spatialData, features: response.data.polygons });
        setIsScored(true);
        toast.success("Data normalized and scored successfully! Now choose a clustering technique.");
      }
    } catch (error) {
      console.error('Normalization error:', error);
      if (error.response && error.response.data && error.response.data.error) {
        toast.error(`Normalization failed: ${error.response.data.error}`);
      } else {
        toast.error("Normalization failed. Check console for details.");
      }
    }
  };

  const handleGetAiInsights = async (cluster: any) => {
    setSelectedClusterForDialog(cluster);
    setAiDialogOpen(true);
    setIsGeneratingInsights(true);
    setCurrentAiInsights("");

    try {
      // Get the selected features
      const selectedFeatures = columnConfigs.filter(c => c.selected).map(c => c.name);

      // Get the last clustering config from state
      const currentConfig = lastClusteringConfig || {} as Partial<ClusteringConfig>;

      // Use the new cluster insights endpoint
      const requestData = {
        cluster: cluster,
        features: selectedFeatures,
        algorithm: currentConfig.algorithm || 'kmeans',
        product_info: productInfo
      };

      const response = await axios.post('http://localhost:5000/api/cluster-insights', requestData);

      if (response.data.ai_insights) {
        // Extract the insights string from the object
        const insightsText = typeof response.data.ai_insights === 'string'
          ? response.data.ai_insights
          : (response.data.ai_insights as any)?.insights || JSON.stringify(response.data.ai_insights);
        setCurrentAiInsights(insightsText);
      } else {
        setCurrentAiInsights("AI insights not available for this cluster.");
      }
    } catch (error) {
      console.error("AI insights error:", error);
      toast.error("Failed to get AI insights for the cluster.");
      setCurrentAiInsights("Error: Could not retrieve insights.");
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const handleFocusCluster = (cluster: any) => {
    if (cluster.centroid && Array.isArray(cluster.centroid) && cluster.centroid.length >= 2) {
      setMapFocusPoint([cluster.centroid[0], cluster.centroid[1]]); // lng, lat
      setSelectedCluster(cluster.cluster_number || cluster.cluster);
      const clusterLabel = cluster.cluster_number || cluster.cluster_id || 'N/A';
      toast.success(`Focused on Cluster ${clusterLabel}`);
    } else if (cluster.centroid_lat && cluster.centroid_lng) {
      setMapFocusPoint([cluster.centroid_lng, cluster.centroid_lat]); // lng, lat
      setSelectedCluster(cluster.cluster_number || cluster.cluster);
      const clusterLabel = cluster.cluster_number || cluster.cluster_id || 'N/A';
      toast.success(`Focused on Cluster ${clusterLabel}`);
    } else {
      toast.error("Cluster centroid not available for focusing");
    }
  };

  const getTopNClusters = (clustersArr: any[], n: number) => {
    if (!Array.isArray(clustersArr)) return [];
    return [...clustersArr]
      .sort((a, b) => (b.avg_suitability_score || 0) - (a.avg_suitability_score || 0))
      .slice(0, n);
  };


  const handleScenarioFeatureChange = (featureName: string, changeValue: number) => {
    setScenarioFeatureChanges(prev => ({
      ...prev,
      [featureName]: changeValue
    }));
  };

  const handleScenarioConfigChange = (config: { villagePercentage?: number, randomnessFactor?: number }) => {
    setScenarioConfig(prev => ({
      ...prev,
      ...config
    }));
  };

  const createScenarioData = () => {
    if (!spatialData || !spatialData.features) return null;

    // 1. Identify all polygons that are part of a valid baseline cluster
    // NOTE: The backend stores cluster number at polygon.cluster (root level), NOT polygon.properties.cluster
    const clusteredIndices: number[] = [];
    spatialData.features.forEach((feature: any, idx: number) => {
      const c = feature.cluster;  // ← root-level, NOT feature.properties.cluster
      if (typeof c === 'number' && c !== -1) {
        clusteredIndices.push(idx);
      }
    });

    // 2. Select exactly 'villagePercentage' of these clustered polygons to receive the scenario changes
    const targetCount = Math.floor(clusteredIndices.length * (scenarioConfig.villagePercentage / 100));
    
    // Simple fast shuffle to pick random polygons
    const shuffled = [...clusteredIndices].sort(() => 0.5 - Math.random());
    const selectedIndices = new Set(shuffled.slice(0, targetCount));

    const modifiedFeatures = spatialData.features.map((feature: any, idx: number) => {
      // 3. ONLY modify if this polygon was chosen (in a cluster + selected by percentage)
      if (selectedIndices.has(idx) && feature.properties) {
        const modifiedFeature = { ...feature, properties: { ...feature.properties } };
        
        Object.keys(scenarioFeatureChanges).forEach(featureName => {
          if (modifiedFeature.properties[featureName] !== undefined) {
            const originalValue = modifiedFeature.properties[featureName];
            const changePercentForSlider = scenarioFeatureChanges[featureName];
            
            // Apply randomness factor (+/- wobble around the exact percent)
            const randomWobble = (Math.random() - 0.5) * 2 * (scenarioConfig.randomnessFactor / 100);
            const actualChangePercent = changePercentForSlider + (changePercentForSlider * randomWobble);

            modifiedFeature.properties[featureName] = originalValue * (1 + actualChangePercent);
          }
        });
        return modifiedFeature;
      }
      
      // Un-clustered polygons, or ones outside the percentage, remain untouched
      return feature;
    });

    return {
      ...spatialData,
      features: modifiedFeatures
    };
  };

  const handleScenarioNormalizeAndScore = async () => {
    if (!spatialData || !spatialData.features || !columnConfigs.length) {
      toast.error("Please ensure data is loaded and features are configured");
      return;
    }

    // Check if spatial data has features
    if (!spatialData.features || spatialData.features.length === 0) {
      toast.error("No spatial data available. Please upload data first.");
      return;
    }

    const selectedFeatures = columnConfigs.filter(c => c.selected).map(c => c.name);
    const weights = columnConfigs.filter(c => c.selected).map(c => c.weight);

    if (selectedFeatures.length === 0) {
      toast.error("Please select at least one feature for scoring");
      return;
    }

    try {
      // Create scenario data first
      const scenarioData = createScenarioData();
      if (!scenarioData) {
        toast.error("Failed to create scenario data");
        return;
      }

      const selectedFeatures = columnConfigs.filter(c => c.selected).map(c => c.name);
      const weights = columnConfigs.filter(c => c.selected).map(c => c.weight);

      // ── CRITICAL FIX ──────────────────────────────────────────────────────────
      // Only submit CLUSTERED polygons (cluster != -1) to the scoring API.
      // Noise/unclustered polygons must NOT influence the normalization scale.
      // NOTE: cluster is stored at polygon.cluster (root level), NOT polygon.properties.cluster
      const clusteredEntries: Array<{ globalIdx: number; feature: any }> = [];
      scenarioData.features.forEach((feature: any, idx: number) => {
        const c = spatialData.features[idx]?.cluster;  // ← root-level field
        if (typeof c === 'number' && c !== -1) {
          clusteredEntries.push({ globalIdx: idx, feature });
        }
      });

      if (clusteredEntries.length === 0) {
        toast.error("No clustered polygons found. Run baseline clustering first.");
        return;
      }

      // Use the baseline feature stats so scenario scores are on the SAME scale as baseline
      const requestData = {
        polygons: clusteredEntries.map(e => e.feature),
        features: selectedFeatures,
        weights: weights,
        ...(baselineFeatureStats ? { baseline_feature_stats: baselineFeatureStats } : {})
      };

      const response = await axios.post('http://localhost:5000/api/normalize-score', requestData);

      if (response.data.polygons) {
        // Store the baseline feature stats for future scenario runs
        if (response.data.feature_stats) {
          setBaselineFeatureStats(response.data.feature_stats);
        }
        
        const scoredClusteredPolys = response.data.polygons; // Only the clustered ones, scored

        // Map the scored polygons back to their original global positions
        const allScenarioPolys = [...scenarioData.features];
        clusteredEntries.forEach(({ globalIdx }, scoredIdx) => {
          allScenarioPolys[globalIdx] = scoredClusteredPolys[scoredIdx];
        });

        setScenarioData({ ...scenarioData, features: allScenarioPolys });
        setIsScenarioScored(true);

        // --- AUTOMATIC SCENARIO CLUSTERING AND INSIGHTS ---
        if (!clusters.length) {
          toast.success("Scenario data scored! Run baseline clustering first to see comparison.");
          return;
        }

        const baselinePolygons = spatialData.features;

        // Group scenario polygons by their existing baseline cluster number
        // NOTE: cluster is at polygon.cluster (root level), NOT polygon.properties.cluster
        const clusterGroups: Record<number, number[]> = {};
        baselinePolygons.forEach((poly: any, idx: number) => {
          const clusterNum = poly.cluster;  // ← root-level field
          if (typeof clusterNum === 'number' && clusterNum !== -1) {
            if (!clusterGroups[clusterNum]) clusterGroups[clusterNum] = [];
            clusterGroups[clusterNum].push(idx);
          }
        });

        // Compute new score stats for each cluster
        const newScenarioClusters = Object.entries(clusterGroups).map(([clusterNumStr, indices]) => {
          const clusterNum = Number(clusterNumStr);
          const scores = indices
            .map(i => allScenarioPolys[i]?.properties?.suitabilityScore)
            .filter((s): s is number => typeof s === 'number' && isFinite(s));

          if (scores.length === 0) return null;

          const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
          const sorted = [...scores].sort((a, b) => a - b);
          const median = sorted[Math.floor(sorted.length / 2)];
          const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length;
          const std = Math.sqrt(variance);

          // Inherit spatial properties from baseline cluster
          const baselineCluster = clusters.find(c => c.cluster_number === clusterNum) ?? {};

          return {
            ...baselineCluster,
            cluster_number: clusterNum,
            cluster_id: `scenario_${clusterNum}`,
            avg_suitability_score: avg,
            median_suitability_score: median,
            std_suitability_score: std,
            count: scores.length
          };
        }).filter(Boolean) as any[];

        const sortedScenarioClusters = newScenarioClusters.sort((a, b) => a.cluster_number - b.cluster_number);

        setScenarioClusters(sortedScenarioClusters);
        toast.success(`Scenario analysis complete. Generating insights...`);
        
        // Auto-generate comparison insights
        generateComparisonInsights(sortedScenarioClusters);
      }
    } catch (error) {
      console.error('Scenario normalization error:', error);
      if (error.response && error.response.data && error.response.data.error) {
        toast.error(`Scenario normalization failed: ${error.response.data.error}`);
      } else {
        toast.error("Scenario normalization failed. Check console for details.");
      }
    }
  };

  // handleScenarioClustering combined into handleScenarioNormalizeAndScore

  const generateComparisonInsights = async (customScenarioClusters?: any[]) => {
    const activeScenarioClusters = customScenarioClusters || scenarioClusters;
    
    if (!clusters.length || !activeScenarioClusters.length) {
      toast.error("Both original and scenario clusters are required for comparison");
      return;
    }

    setIsGeneratingComparisonInsights(true);
    setComparisonInsights("");

    try {
      // Since comparison insights are now generated within the clustering endpoint,
      // we need to re-run clustering with scenario config to get comparison insights
      const selectedFeatures = columnConfigs.filter(c => c.selected).map(c => c.name);

      // Convert scenarioFeatureChanges to the format expected by the backend
      const featureChanges = Object.entries(scenarioFeatureChanges).map(([feature, change]) => ({
        feature: feature,
        percentChange: change
      }));

      const requestData = {
        algorithm: 'hdbscan',
        originalClusters: clusters,
        scenarioClusters: activeScenarioClusters,
        features: selectedFeatures,
        include_ai_insights: true,
        product_info: productInfo,
        scenarioConfig: {
          featureChanges: featureChanges,
          villagePercentage: scenarioConfig.villagePercentage,
          randomnessFactor: scenarioConfig.randomnessFactor
        }
      };

      const response = await axios.post('http://localhost:5000/api/comparison-insights', requestData);

      if (response.data.ai_insights) {
        const insights = response.data.ai_insights;
        if (typeof insights === 'string') {
          setComparisonInsights(insights);
        } else if (insights && typeof insights === 'object' && (insights as any).insights) {
          setComparisonInsights((insights as any).insights);
        } else {
          setComparisonInsights("Comparison insights not available in expected format.");
        }
      } else {
        setComparisonInsights("Comparison insights not available.");
      }
    } catch (error) {
      console.error('Comparison insights error:', error);
      setComparisonInsights("Error: Could not generate comparison insights.");
    } finally {
      setIsGeneratingComparisonInsights(false);
    }
  };

  const getComparisonStats = () => {
    if (!clusters.length || !scenarioClusters.length) return null;

    const originalScores = clusters.map(c => c.avg_suitability_score || 0);
    const scenarioScores = scenarioClusters.map(c => c.avg_suitability_score || 0);

    const originalStats = {
      mean: originalScores.reduce((a, b) => a + b, 0) / originalScores.length,
      median: originalScores.sort((a, b) => a - b)[Math.floor(originalScores.length / 2)],
      std: Math.sqrt(originalScores.reduce((sq, n) => sq + Math.pow(n - originalScores.reduce((a, b) => a + b, 0) / originalScores.length, 2), 0) / originalScores.length)
    };

    const scenarioStats = {
      mean: scenarioScores.reduce((a, b) => a + b, 0) / scenarioScores.length,
      median: scenarioScores.sort((a, b) => a - b)[Math.floor(scenarioScores.length / 2)],
      std: Math.sqrt(scenarioScores.reduce((sq, n) => sq + Math.pow(n - scenarioScores.reduce((a, b) => a + b, 0) / scenarioScores.length, 2), 0) / scenarioScores.length)
    };

    return { original: originalStats, scenario: scenarioStats };
  };

  const getClusterComparisonData = () => {
    if (!clusters.length || !scenarioClusters.length) return [];

    const topOriginal = getTopNClusters(clusters, 10);
    const topScenario = getTopNClusters(scenarioClusters, 10);

    return topOriginal.map((original, index) => {
      const scenario = topScenario[index] || { avg_suitability_score: 0, count: 0 };
      return {
        clusterId: original.cluster,
        originalScore: original.avg_suitability_score || 0,
        scenarioScore: scenario.avg_suitability_score || 0,
        originalCount: original.count || 0,
        scenarioCount: scenario.count || 0,
        improvement: ((scenario.avg_suitability_score || 0) - (original.avg_suitability_score || 0)) / (original.avg_suitability_score || 1) * 100
      };
    });
  };

  if (!isDataLoaded) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome to the Geo-Suitability Solver</CardTitle>
            <CardDescription>Start by uploading your geospatial data to begin the analysis.</CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload onFileProcessed={handleFileProcessed} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col h-screen">
      <Header onExport={() => { }} onSettings={() => { }} />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[450px] border-r overflow-y-auto p-4 space-y-6">
          {/* Data Status Indicator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Data Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Data Loaded:</span>
                  <Badge variant={spatialData && spatialData.features && spatialData.features.length > 0 ? "default" : "secondary"}>
                    {spatialData && spatialData.features && spatialData.features.length > 0 ? `${spatialData.features.length} features` : "No data"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Features Selected:</span>
                  <Badge variant={columnConfigs.filter(c => c.selected).length > 0 ? "default" : "secondary"}>
                    {columnConfigs.filter(c => c.selected).length} selected
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Data Scored:</span>
                  <Badge variant={isScored ? "default" : "secondary"}>
                    {isScored ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <ProductInfo
            onProductInfoChange={setProductInfo}
          />
          <Card>
            <CardHeader>
              <CardTitle>Feature Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <ColumnSelector columns={columns} onConfigChange={(config) => setColumnConfigs(config.features)} columnMetadata={columnMetadata ?? undefined} productInfo={productInfo} />
              <Button
                onClick={handleNormalizeAndScore}
                className="w-full mt-4"
                disabled={isScored || !spatialData || !spatialData.features || spatialData.features.length === 0 || columnConfigs.filter(c => c.selected).length === 0}
              >
                {isScored ? "Data Scored ✓" : "Normalize and Score"}
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Clustering Technique</CardTitle>
            </CardHeader>
            <CardContent>
              {isScored ? (
                <ClusteringControls onRunClustering={handleRunClustering} />
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  <p>Please normalize and score your data first</p>
                  {!spatialData || !spatialData.features || spatialData.features.length === 0 ? (
                    <p className="text-sm mt-2">No data available. Please upload data first.</p>
                  ) : columnConfigs.filter(c => c.selected).length === 0 ? (
                    <p className="text-sm mt-2">No features selected. Please select features first.</p>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        </aside>

        <main className="flex-1 flex flex-col">
          {showMap && (
            <div className="flex-1 border-b min-h-[400px]">
              <MapComponent
                data={(activeTab === 'scenario' || activeTab === 'comparison') && scenarioData ? scenarioData : spatialData}
                clusters={(activeTab === 'scenario' || activeTab === 'comparison') && scenarioClusters.length > 0 ? scenarioClusters : clusters}
                selectedCluster={selectedCluster}
                mapFocusPoint={mapFocusPoint}
                onFeatureClick={(feature) => {
                  if (feature.cluster !== undefined) {
                    const cluster = clusters.find(c => c.cluster_number === feature.cluster || c.cluster === feature.cluster);
                    if (cluster) {
                      setSelectedClusterForDialog(cluster);
                      setInfoDialogOpen(true);
                    }
                  }
                }}
              />
            </div>
          )}
          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="flex-shrink-0">
                <TabsTrigger value="clusters">Clusters</TabsTrigger>
                <TabsTrigger value="scenario">Scenario Analysis</TabsTrigger>
                <TabsTrigger value="comparison">Comparison</TabsTrigger>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMap(!showMap)}
                  className="ml-auto"
                >
                  {showMap ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </TabsList>
              <div className="flex-1 overflow-hidden">
                {(isScored || clusters.length > 0) && clusters.length > 0 && (
                  <TabsContent value="clusters" className="mt-4 h-full overflow-y-auto">
                    <div className="space-y-4 pb-4">
                      {getTopNClusters(clusters, 10).map((cluster, index) => (
                        <ClusterCard
                          key={cluster.cluster_id || cluster.cluster_number || index}
                          cluster={cluster}
                          onShowInfo={() => {
                            setSelectedClusterForDialog(cluster);
                            setInfoDialogOpen(true);
                          }}
                          onFocusMap={() => {
                            handleFocusCluster(cluster);
                          }}
                          onGetAiInsights={() => handleGetAiInsights(cluster)}
                        />
                      ))}
                    </div>
                  </TabsContent>
                )}
                {(isScored || clusters.length > 0) && clusters.length === 0 && (
                  <TabsContent value="clusters" className="mt-4">
                    <div className="text-center text-muted-foreground py-8">
                      <p>Data is scored and ready for clustering</p>
                      <p className="text-sm">Choose a clustering technique from the sidebar to see results</p>
                    </div>
                  </TabsContent>
                )}
                {!isScored && clusters.length === 0 && (
                  <TabsContent value="clusters" className="mt-4">
                    <div className="text-center text-muted-foreground py-8">
                      <p>Please normalize and score your data first</p>
                    </div>
                  </TabsContent>
                )}
                <TabsContent value="scenario" className="mt-4 h-full overflow-y-auto">
                  <div className="pb-4">
                    <ScenarioAnalysis
                      originalFeatures={columnConfigs.filter(c => c.selected).map(c => c.name)}
                      scenarioFeatureChanges={scenarioFeatureChanges}
                      scenarioConfig={scenarioConfig}
                      onFeatureChange={handleScenarioFeatureChange}
                      onConfigChange={handleScenarioConfigChange}
                      onNormalizeAndScore={handleScenarioNormalizeAndScore}
                      onRunClustering={() => {}} // Legacy, kept to satisfy props interface if still required
                      isScenarioScored={isScenarioScored}
                      scenarioClusters={scenarioClusters}
                      onShowInfo={(cluster) => {
                        setSelectedClusterForDialog(cluster);
                        setInfoDialogOpen(true);
                      }}
                      onFocusMap={(cluster) => {
                        handleFocusCluster(cluster);
                      }}
                      onGetAiInsights={(cluster) => handleGetAiInsights(cluster)}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="comparison" className="mt-4 h-full overflow-y-auto">
                  <div className="pb-4">
                    <Comparison
                      originalClusters={clusters}
                      scenarioClusters={scenarioClusters}
                      featureChanges={scenarioFeatureChanges}
                      scenarioConfig={scenarioConfig}
                      onGenerateInsights={generateComparisonInsights}
                      comparisonInsights={comparisonInsights}
                      isGeneratingInsights={isGeneratingComparisonInsights}
                      selectedFeatures={columnConfigs.filter((col: ColumnConfig) => col.selected).map((col: ColumnConfig) => col.name)}
                      productInfo={{
                        name: productInfo.name || "Business Product",
                        description: productInfo.description || "Product analysis for market expansion",
                        targetAudience: productInfo.targetAudience || "General Market",
                        budget: productInfo.budget || "Medium",
                        productType: productInfo.productType || "Infrastructure"
                      }}
                    />
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </main>
      </div>

      <Dialog open={infoDialogOpen} onOpenChange={setInfoDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Cluster {selectedClusterForDialog?.cluster_number || selectedClusterForDialog?.cluster_id || selectedClusterForDialog?.cluster || 'N/A'} Information
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Mean Score</Label>
                <div className="text-lg font-semibold">{selectedClusterForDialog?.avg_suitability_score?.toFixed(2) || 'N/A'}</div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Median Score</Label>
                <div className="text-lg font-semibold">{selectedClusterForDialog?.median_suitability_score?.toFixed(2) || 'N/A'}</div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Standard Deviation</Label>
                <div className="text-lg font-semibold">{selectedClusterForDialog?.std_suitability_score?.toFixed(2) || 'N/A'}</div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Polygon Count</Label>
                <div className="text-lg font-semibold">{selectedClusterForDialog?.count || 'N/A'}</div>
              </div>
            </div>
            {selectedClusterForDialog?.centroid && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Centroid Location</Label>
                <div className="text-sm">
                  Lat: {selectedClusterForDialog.centroid[1]?.toFixed(4)},
                  Lng: {selectedClusterForDialog.centroid[0]?.toFixed(4)}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0">
          {/* Fixed header */}
          <DialogHeader className="px-6 pt-5 pb-3 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-5 h-5 text-primary" />
              AI Analysis — Cluster {selectedClusterForDialog?.cluster_number ?? selectedClusterForDialog?.cluster_id ?? selectedClusterForDialog?.cluster ?? 'N/A'}
            </DialogTitle>
            {selectedClusterForDialog && (
              <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                <span>Score: <span className="font-semibold text-foreground">{selectedClusterForDialog.avg_suitability_score?.toFixed(2) ?? 'N/A'}/10</span></span>
                <span>Polygons: <span className="font-semibold text-foreground">{selectedClusterForDialog.count ?? 'N/A'}</span></span>
                {selectedClusterForDialog.std_suitability_score != null && (
                  <span>Std Dev: <span className="font-semibold text-foreground">{selectedClusterForDialog.std_suitability_score.toFixed(2)}</span></span>
                )}
              </div>
            )}
          </DialogHeader>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {isGeneratingInsights ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-5/6" />
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-4 bg-muted rounded w-full" />
                <p className="text-center text-sm text-muted-foreground pt-2">Generating AI insights…</p>
              </div>
            ) : (() => {
              const raw: string | null =
                typeof currentAiInsights === 'string'
                  ? currentAiInsights
                  : (currentAiInsights as any)?.insights ?? null;

              if (!raw) {
                return (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                    <Sparkles className="w-8 h-8 opacity-40" />
                    <p className="text-sm">No insights available yet.</p>
                  </div>
                );
              }

              // Split on any line that starts with an emoji (section header detection)
              const sectionRegex = /^(\p{Emoji_Presentation}|\p{Extended_Pictographic})/u;
              const lines = raw.split('\n');
              const sections: { header: string; body: string[] }[] = [];
              let current: { header: string; body: string[] } | null = null;

              for (const line of lines) {
                const trimmed = line.trim();
                if (sectionRegex.test(trimmed)) {
                  if (current) sections.push(current);
                  current = { header: trimmed, body: [] };
                } else if (current) {
                  if (trimmed) current.body.push(trimmed);
                } else {
                  // preamble before first section
                  if (trimmed) {
                    if (!sections.length) sections.push({ header: '', body: [] });
                    sections[sections.length - 1].body.push(trimmed);
                  }
                }
              }
              if (current) sections.push(current);

              if (sections.length <= 1) {
                // Fallback: just render as pre-formatted text if no sections detected
                return (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{raw}</p>
                );
              }

              return (
                <div className="space-y-4">
                  {sections.map((sec, idx) => (
                    <div key={idx} className="rounded-lg border bg-card p-4 shadow-sm">
                      {sec.header && (
                        <h3 className="font-semibold text-base mb-2">{sec.header}</h3>
                      )}
                      <div className="space-y-1.5">
                        {sec.body.map((line, li) => (
                          <p key={li} className="text-sm leading-relaxed text-muted-foreground">
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Fixed footer with copy button */}
          {!isGeneratingInsights && currentAiInsights && (
            <div className="px-6 py-3 border-t shrink-0 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const text = typeof currentAiInsights === 'string'
                    ? currentAiInsights
                    : (currentAiInsights as any)?.insights ?? '';
                  navigator.clipboard.writeText(text);
                }}
              >
                Copy Analysis
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Index;
