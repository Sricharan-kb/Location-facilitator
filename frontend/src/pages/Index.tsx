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
  EyeOff
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
  algorithm: 'kmeans' | 'dbscan' | 'hierarchical' | 'buffer' | 'archimedean_spiral';
  numClusters: number;
  radius: number;
  minPoints: number;
  maxPolygonsPerCluster: number;
  minPolygonsPerCluster: number;
  spiralRadius: number; // for archimedean spiral
  spiralSpacing: number; // for archimedean spiral
}

const Index = () => {
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
  const [scenarioFeatureChanges, setScenarioFeatureChanges] = useState<{[key: string]: number}>({});
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

  const handleFileProcessed = (data: any, fileColumns: string[]) => {
    setSpatialData(data);
    setColumns(fileColumns);
    setIsDataLoaded(true);
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
                dbscan_eps: config.radius, // radius in km
                dbscan_min_samples: config.minPoints
              };
            case 'buffer':
              return {
                ...baseParams,
                radius: config.radius // radius in km
              };
            case 'archimedean_spiral':
              return {
                ...baseParams,
        n_clusters: config.numClusters,
                spiral_radius: config.spiralRadius,
                spiral_spacing: config.spiralSpacing
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
        localStorage.setItem('lastClusteringConfig', JSON.stringify(config));
        
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
      
      // Get the last clustering config from localStorage
      const lastClusteringConfig = JSON.parse(localStorage.getItem('lastClusteringConfig') || '{}');
      
      // Use the new cluster insights endpoint
      const requestData = {
        cluster: cluster,
        features: selectedFeatures,
        algorithm: lastClusteringConfig.algorithm || 'kmeans',
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

  const handleScenarioConfigChange = (config: {villagePercentage?: number, randomnessFactor?: number}) => {
    setScenarioConfig(prev => ({
      ...prev,
      ...config
    }));
  };

  const createScenarioData = () => {
    if (!spatialData || !spatialData.features) return null;

    const modifiedFeatures = spatialData.features.map((feature: any) => {
      const modifiedFeature = { ...feature };
      
      // Apply feature changes
      if (feature.properties) {
        Object.keys(scenarioFeatureChanges).forEach(featureName => {
          if (feature.properties[featureName] !== undefined) {
            const originalValue = feature.properties[featureName];
            const changeValue = scenarioFeatureChanges[featureName];
            const randomFactor = 1 + (Math.random() - 0.5) * scenarioConfig.randomnessFactor;
            const villageFactor = Math.random() < scenarioConfig.villagePercentage / 100 ? 1.2 : 1;
            
            modifiedFeature.properties[featureName] = originalValue * (1 + changeValue) * randomFactor * villageFactor;
          }
        });
      }
      
      return modifiedFeature;
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

      // Use the dedicated normalize-score endpoint
      const requestData = {
        polygons: scenarioData.features,
        features: selectedFeatures,
        weights: weights
      };

      const response = await axios.post('http://localhost:5000/api/normalize-score', requestData);
      
      if (response.data.polygons) {
        setScenarioData({ ...scenarioData, features: response.data.polygons });
        setIsScenarioScored(true);
        toast.success("Scenario data normalized and scored successfully! Now run scenario clustering.");
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

  const handleScenarioClustering = async () => {
    if (!scenarioData || !scenarioData.features || !columnConfigs.length) {
      toast.error("Please ensure scenario data is scored and features are configured");
      return;
    }

    // Check if scenario data has features
    if (!scenarioData.features || scenarioData.features.length === 0) {
      toast.error("No scenario data available. Please normalize and score scenario data first.");
      return;
    }

    try {
      const selectedFeatures = columnConfigs.filter(c => c.selected).map(c => c.name);
      const weights = columnConfigs.filter(c => c.selected).map(c => c.weight);

      if (selectedFeatures.length === 0) {
        toast.error("Please select at least one feature for clustering");
        return;
      }
      
      // Use the same clustering parameters as the original clustering
      const lastClusteringConfig = JSON.parse(localStorage.getItem('lastClusteringConfig') || '{}');
      
      const requestData = {
        algorithm: lastClusteringConfig.algorithm || 'kmeans',
        params: (() => {
          // Algorithm-specific parameters
          const baseParams = {
            max_polygons_per_cluster: lastClusteringConfig.maxPolygonsPerCluster || 100,
            min_polygons_per_cluster: lastClusteringConfig.minPolygonsPerCluster || 1
          };
          
          switch (lastClusteringConfig.algorithm) {
            case 'kmeans':
              return {
                ...baseParams,
                n_clusters: lastClusteringConfig.numClusters || 5
              };
            case 'hierarchical':
              return {
                ...baseParams,
                n_clusters: lastClusteringConfig.numClusters || 5
              };
            case 'dbscan':
              return {
                ...baseParams,
                dbscan_eps: lastClusteringConfig.radius || 5, // radius in km
                dbscan_min_samples: lastClusteringConfig.minPoints || 3
              };
            case 'buffer':
              return {
                ...baseParams,
                radius: lastClusteringConfig.radius || 5 // radius in km
              };
            case 'archimedean_spiral':
              return {
                ...baseParams,
                n_clusters: lastClusteringConfig.numClusters || 5,
                spiral_radius: (lastClusteringConfig.radius || 5) / 100, // Convert km to degrees
                spiral_spacing: (lastClusteringConfig.radius || 5) / 200
              };
            default:
              return baseParams;
          }
        })(),
        polygons: scenarioData.features,
        features: selectedFeatures,
        weights: weights,
        include_ai_insights: true,
        product_info: productInfo
      };

      console.log('Scenario clustering request:', requestData);

      const response = await axios.post('http://localhost:5000/api/cluster', requestData);
      
      if (response.data.clusters) {
        const matchedScenarioClusters = matchClustersByCentroid(clusters, response.data.clusters);
        setScenarioClusters(matchedScenarioClusters);
        setSpatialData(prev => ({ ...prev, features: response.data.polygons }));
        
        toast.success(`Scenario clustering completed! Found ${response.data.clusters.length} clusters.`);
        
        if (response.data.ai_insights) {
          setComparisonInsights(response.data.ai_insights);
            toast.success("Comparison insights generated successfully!");
        }
      } else {
        toast.error("Scenario clustering failed: No clusters returned.");
      }
    } catch (error) {
      console.error('Scenario clustering error:', error);
      if (error.response && error.response.data && error.response.data.error) {
        toast.error(`Scenario clustering failed: ${error.response.data.error}`);
      } else {
      toast.error("Scenario clustering failed. Check console for details.");
      }
    }
  };

  const generateComparisonInsights = async () => {
    if (!clusters.length || !scenarioClusters.length) {
      toast.error("Both original and scenario clusters are required for comparison");
      return;
    }

    setIsGeneratingComparisonInsights(true);
    setComparisonInsights("");

    try {
      // Since comparison insights are now generated within the clustering endpoint,
      // we need to re-run clustering with scenario config to get comparison insights
      const selectedFeatures = columnConfigs.filter(c => c.selected).map(c => c.name);
      const weights = columnConfigs.filter(c => c.selected).map(c => c.weight);
      
      // Convert scenarioFeatureChanges to the format expected by the backend
      const featureChanges = Object.entries(scenarioFeatureChanges).map(([feature, change]) => ({
        feature: feature,
        percentChange: change
      }));
      
      const requestData = {
        algorithm: 'kmeans',
        params: {
          n_clusters: 1,
          max_polygons_per_cluster: 1000,
          min_polygons_per_cluster: 1
        },
        polygons: spatialData.features,
        features: selectedFeatures,
        weights: weights,
        include_ai_insights: true,
        product_info: productInfo,
        scenarioConfig: {
          featureChanges: featureChanges,
          villagePercentage: scenarioConfig.villagePercentage,
          randomnessFactor: scenarioConfig.randomnessFactor
        }
      };

      const response = await axios.post('http://localhost:5000/api/cluster', requestData);
      
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
      <Header onExport={() => {}} onSettings={() => {}} />
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
              <ColumnSelector columns={columns} onConfigChange={(config) => setColumnConfigs(config.features)} />
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
                  data={spatialData}
                  clusters={clusters}
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
                        onRunClustering={handleScenarioClustering}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI Analysis for Cluster {selectedClusterForDialog?.cluster}</DialogTitle>
          </DialogHeader>
          {isGeneratingInsights ? (
            <div className="flex items-center justify-center p-8">
              <p>Generating insights...</p>
            </div>
          ) : (
            <div className="p-4">
              {typeof currentAiInsights === 'string' ? (
                <p className="whitespace-pre-wrap">{currentAiInsights}</p>
              ) : currentAiInsights && typeof currentAiInsights === 'object' ? (
                <div>
                  {(currentAiInsights as any).insights ? (
                    <p className="whitespace-pre-wrap">{(currentAiInsights as any).insights}</p>
                  ) : (
                    <p className="text-muted-foreground">Invalid insights format</p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No insights available</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
