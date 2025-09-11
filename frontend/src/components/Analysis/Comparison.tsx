import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { matchClustersByCentroid } from '@/utils/clusterUtils';
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart as RechartsLineChart,
  Line,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Zap, 
  Target, 
  BarChart3, 
  Info,
  Lightbulb,
  MapPin,
  Users,
  Building2,
  GitCompare,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Search,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Calculator,
  BarChart
} from 'lucide-react';

interface ComparisonProps {
  originalClusters: any[];
  scenarioClusters: any[];
  featureChanges: {[key: string]: number};
  scenarioConfig: {
    villagePercentage: number;
    randomnessFactor: number;
  };
  onGenerateInsights: () => void;
  comparisonInsights: string | { insights: string };
  isGeneratingInsights: boolean;
  productInfo?: {
    name: string;
    description: string;
    targetAudience: string;
    budget: string;
    productType: string;
  };
  selectedFeatures?: string[]; // Add selected features prop
}

// Error boundary component for charts
class ChartErrorBoundary extends React.Component<{ children: React.ReactNode, fallback?: React.ReactNode }, { hasError: boolean, errorMessage: string }> {
  constructor(props: { children: React.ReactNode, fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Chart rendering error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || (
        <div className="text-center py-8 text-muted-foreground">
          <p>Chart could not be displayed</p>
          <p className="text-sm">Data may be invalid or missing</p>
          {this.state.errorMessage && (
            <p className="text-xs mt-2 text-red-500">{this.state.errorMessage}</p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}


export const Comparison = ({
  originalClusters,
  scenarioClusters,
  featureChanges,
  scenarioConfig,
  onGenerateInsights,
  comparisonInsights,
  isGeneratingInsights,
  productInfo,
  selectedFeatures = []
}: ComparisonProps) => {
  const [selectedFeatureForCorrelation, setSelectedFeatureForCorrelation] = useState<string>('');
  const [featureAnalysisData, setFeatureAnalysisData] = useState<any>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch feature analysis data when component mounts or data changes
  useEffect(() => {
    console.log('useEffect triggered with:', {
      originalClustersLength: originalClusters.length,
      scenarioClustersLength: scenarioClusters.length,
      featureChangesKeys: Object.keys(featureChanges).length,
      shouldFetch: originalClusters.length > 0 && scenarioClusters.length > 0 && Object.keys(featureChanges).length > 0
    });
    
    if (originalClusters.length > 0 && scenarioClusters.length > 0 && Object.keys(featureChanges).length > 0) {
      console.log('Auto-fetching feature analysis');
      fetchFeatureAnalysis();
    }
  }, [originalClusters, scenarioClusters, featureChanges]);

  const fetchFeatureAnalysis = async () => {
    setIsLoadingAnalysis(true);
    try {
      const matchedScenarioClusters = matchClustersByCentroid(originalClusters, scenarioClusters);
      const formattedFeatureChanges = Object.entries(featureChanges).map(([feature, change]) => ({
        feature,
        percentChange: change,
      }));

      const requestBody = {
        original_clusters: originalClusters,
        scenario_clusters: matchedScenarioClusters,
        features: selectedFeatures.length > 0 ? selectedFeatures : Object.keys(featureChanges),
        feature_changes: formattedFeatureChanges,
      };

      console.log('Feature Analysis Request:', {
        originalClustersCount: originalClusters.length,
        scenarioClustersCount: matchedScenarioClusters.length,
        features: requestBody.features,
        featureChanges: formattedFeatureChanges
      });

      const response = await fetch('http://localhost:5000/api/feature-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Feature Analysis Response:', data);
        console.log('Sensitivity Analysis Data:', data.sensitivity_analysis);
        console.log('Correlation Analysis Data:', data.correlation_analysis);
        setFeatureAnalysisData(data);
        
        // Force a re-render by updating state
        setTimeout(() => {
          console.log('After setting data - featureAnalysisData:', data);
          console.log('Sensitivity data length:', Object.keys(data.sensitivity_analysis || {}).length);
        }, 100);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch feature analysis:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error fetching feature analysis:', error);
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  // Enhanced data processing functions with better statistics
  const getComparisonStats = () => {
    if (originalClusters.length === 0 || scenarioClusters.length === 0) {
      return {
        originalAvg: 'N/A',
        scenarioAvg: 'N/A',
        improvement: 'N/A',
        totalClusters: 0,
        improvedClusters: 0,
        declinedClusters: 0,
        unchangedClusters: 0,
        originalMedian: 'N/A',
        scenarioMedian: 'N/A',
        originalStdDev: 'N/A',
        scenarioStdDev: 'N/A'
      };
    }

    const matchedScenarioClusters = matchClustersByCentroid(originalClusters, scenarioClusters);

    const originalScores = originalClusters.map(c => c.avg_suitability_score || 0);
    const scenarioScores = matchedScenarioClusters.map(c => c.avg_suitability_score || 0);
    
    const originalAvg = originalScores.reduce((sum, score) => sum + score, 0) / originalScores.length;
    const scenarioAvg = scenarioScores.reduce((sum, score) => sum + score, 0) / scenarioScores.length;
    
    // Calculate median
    const originalMedian = calculateMedian(originalScores);
    const scenarioMedian = calculateMedian(scenarioScores);
    
    // Calculate standard deviation
    const originalStdDev = calculateStandardDeviation(originalScores);
    const scenarioStdDev = calculateStandardDeviation(scenarioScores);
    
    // Prevent division by zero
    const improvement = originalAvg > 0 ? ((scenarioAvg - originalAvg) / originalAvg) * 100 : 0;

    return {
      originalAvg: originalAvg.toFixed(2),
      scenarioAvg: scenarioAvg.toFixed(2),
      improvement: improvement.toFixed(1),
      totalClusters: originalClusters.length,
      improvedClusters: matchedScenarioClusters.filter((c, index) => {
        const originalCluster = originalClusters[index];
        return (c.avg_suitability_score || 0) > (originalCluster?.avg_suitability_score || 0);
      }).length,
      declinedClusters: matchedScenarioClusters.filter((c, index) => {
        const originalCluster = originalClusters[index];
        return (c.avg_suitability_score || 0) < (originalCluster?.avg_suitability_score || 0);
      }).length,
      unchangedClusters: matchedScenarioClusters.filter((c, index) => {
        const originalCluster = originalClusters[index];
        return Math.abs((c.avg_suitability_score || 0) - (originalCluster?.avg_suitability_score || 0)) < 0.01;
      }).length,
      originalMedian: originalMedian.toFixed(2),
      scenarioMedian: scenarioMedian.toFixed(2),
      originalStdDev: originalStdDev.toFixed(2),
      scenarioStdDev: scenarioStdDev.toFixed(2)
    };
  };

  const calculateMedian = (values: number[]) => {
    const sorted = values.slice().sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    }
    return sorted[middle];
  };

  const calculateStandardDeviation = (values: number[]) => {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(variance);
  };

  const getClusterComparisonData = () => {
    if (originalClusters.length === 0 || scenarioClusters.length === 0) {
      return [];
    }

    const matchedScenarioClusters = matchClustersByCentroid(originalClusters, scenarioClusters);

    const comparisonData = [];
    // Use cluster_number or cluster_id for mapping
    const originalMap = new Map(originalClusters.map(c => [
      c.cluster_number || c.cluster_id || c.cluster || 0, 
      c
    ]));
    
    for (const scenarioCluster of matchedScenarioClusters) {
      const clusterKey = scenarioCluster.cluster_number || scenarioCluster.cluster_id || scenarioCluster.cluster || 0;
      const originalCluster = originalMap.get(clusterKey);
      if (originalCluster) {
        const originalScore = Number(originalCluster.avg_suitability_score) || 0;
        const scenarioScore = Number(scenarioCluster.avg_suitability_score) || 0;
        
        // Prevent division by zero and ensure valid numbers
        let improvement = 0;
        if (originalScore > 0 && !isNaN(originalScore) && !isNaN(scenarioScore)) {
          improvement = ((scenarioScore - originalScore) / originalScore) * 100;
        }
        
        // Ensure all values are valid numbers and not NaN
        const validOriginal = !isNaN(originalScore) ? originalScore : 0;
        const validScenario = !isNaN(scenarioScore) ? scenarioScore : 0;
        const validImprovement = !isNaN(improvement) ? improvement : 0;
        
        comparisonData.push({
          cluster: clusterKey,
          original: validOriginal,
          scenario: validScenario,
          improvement: validImprovement,
          status: validImprovement > 0 ? 'improved' : validImprovement < 0 ? 'declined' : 'unchanged',
          statusText: validImprovement > 0 ? 'Improved' : validImprovement < 0 ? 'Declined' : 'Unchanged'
        });
      }
    }
    
    return comparisonData.sort((a, b) => b.improvement - a.improvement);
  };

  const getSensitivityAnalysis = () => {
    console.log('getSensitivityAnalysis called with:', {
      featureAnalysisData: featureAnalysisData,
      hasSensitivityAnalysis: !!featureAnalysisData?.sensitivity_analysis,
      selectedFeatures,
      featureChanges
    });

    if (featureAnalysisData?.sensitivity_analysis) {
      console.log('Using backend sensitivity analysis data');
      return Object.entries(featureAnalysisData.sensitivity_analysis)
        .filter(([feature, data]: [string, any]) => data && (data.sensitivity_ratio !== undefined || data.sensitivity !== undefined))
        .map(([feature, data]: [string, any]) => {
          // Handle both old and new data structures
          const sensitivity = data.sensitivity_ratio !== undefined ? data.sensitivity_ratio * 100 : 
                            data.sensitivity !== undefined ? Number(data.sensitivity) : 0;
          
          const avgScoreChange = data.avg_score_change || 0;
          const direction = avgScoreChange > 0 ? 'Positive' : avgScoreChange < 0 ? 'Negative' : 'No Change';
          const magnitude = data.sensitivity_level || 'Medium';
          const featureChange = data.percent_change !== undefined ? Math.abs(data.percent_change) * 100 : 0;
          
          return {
            feature,
            sensitivity: !isNaN(sensitivity) ? sensitivity : 0,
            direction: direction,
            magnitude: magnitude,
            featureChange: !isNaN(featureChange) ? featureChange : 0,
            color: direction === 'Positive' ? '#10b981' : direction === 'Negative' ? '#ef4444' : '#6b7280'
          };
        })
        .sort((a, b) => b.sensitivity - a.sensitivity);
    }
    
    console.log('Using fallback sensitivity analysis data');
    // Enhanced fallback to mock data with better range calculation
    const features = selectedFeatures.length > 0 ? selectedFeatures : Object.keys(featureChanges);
    console.log('Features for fallback:', features);
    
    const sensitivityData = features.map(feature => {
      const change = Number(featureChanges[feature]) || 0;
      const impact = Math.abs(change);
      
      // Calculate sensitivity based on actual data range
      const changes = Object.values(featureChanges)
        .map(v => Math.abs(Number(v)))
        .filter(v => !isNaN(v));
      const maxChange = changes.length > 0 ? Math.max(...changes) : 1;
      const normalizedSensitivity = maxChange > 0 ? (impact / maxChange) * 100 : 0;
      
      const result = {
        feature,
        sensitivity: !isNaN(normalizedSensitivity) ? normalizedSensitivity : 0,
        direction: change > 0 ? 'Positive' : change < 0 ? 'Negative' : 'No Change',
        magnitude: impact > 0.3 ? 'High' : impact > 0.1 ? 'Medium' : impact > 0 ? 'Low' : 'No Change',
        featureChange: !isNaN(impact) ? impact * 100 : 0,
        color: change > 0 ? '#10b981' : change < 0 ? '#ef4444' : '#6b7280'
      };
      
      console.log(`Feature ${feature}:`, result);
      return result;
    }).sort((a, b) => b.sensitivity - a.sensitivity);
    
    console.log('Final sensitivity data:', sensitivityData);
    return sensitivityData;
  };

  const getSelectedFeatureCorrelations = () => {
    if (!selectedFeatureForCorrelation || !featureAnalysisData?.correlation_analysis) {
      return [];
    }
    
    const correlations = featureAnalysisData.correlation_analysis[selectedFeatureForCorrelation];
    if (!correlations) return [];
    
    return Object.entries(correlations)
      .map(([feature, data]: [string, any]) => ({
        feature,
        correlation: typeof data.correlation === 'number' && !isNaN(data.correlation) ? data.correlation : 0,
        direction: data.direction || 'No Correlation',
        strength: data.strength || 'None',
        change: data.change || 0
      }))
      .filter(item => item.correlation !== undefined && !isNaN(item.correlation))
      .sort((a, b) => b.correlation - a.correlation);
  };

  const getCorrelationHeatmapData = () => {
    if (!featureAnalysisData?.correlation_analysis) {
      return [];
    }
    
    const features = Object.keys(featureAnalysisData.correlation_analysis);
    const heatmapData = [];
    
    for (let i = 0; i < features.length; i++) {
      for (let j = 0; j < features.length; j++) {
        const feature1 = features[i];
        const feature2 = features[j];
        
        if (feature1 === feature2) {
          // Self-correlation is always 100%
          heatmapData.push({
            x: feature1,
            y: feature2,
            value: 100,
            correlation: 100,
            direction: 'Positive',
            strength: 'Strong'
          });
        } else {
          const correlations = featureAnalysisData.correlation_analysis[feature1];
          const correlationData = correlations[feature2];
          
          if (correlationData && typeof correlationData.correlation === 'number' && !isNaN(correlationData.correlation)) {
            heatmapData.push({
              x: feature1,
              y: feature2,
              value: correlationData.correlation,
              correlation: correlationData.correlation,
              direction: correlationData.direction || 'No Correlation',
              strength: correlationData.strength || 'None'
            });
          } else {
            // Handle missing or invalid correlation data
            heatmapData.push({
              x: feature1,
              y: feature2,
              value: 0,
              correlation: 0,
              direction: 'No Correlation',
              strength: 'None'
            });
          }
        }
      }
    }
    
    return heatmapData;
  };

  const getCorrelationColor = (value: number, direction: string) => {
    if (value === 0) return '#f3f4f6'; // Gray for no correlation
    
    if (direction === 'Positive') {
      // Green gradient for positive correlations
      if (value >= 70) return '#059669'; // Strong positive
      if (value >= 40) return '#10b981'; // Moderate positive
      return '#34d399'; // Weak positive
    } else {
      // Red gradient for negative correlations
      if (value >= 70) return '#dc2626'; // Strong negative
      if (value >= 40) return '#ef4444'; // Moderate negative
      return '#f87171'; // Weak negative
    }
  };

  const getFeatureImpactBreakdown = () => {
    try {
      if (featureAnalysisData?.impact_breakdown) {
        const data = Object.values(featureAnalysisData.impact_breakdown).map((data: any) => ({
          feature: data.feature || 'Unknown',
          positiveImpact: Number(data.positiveImpact) || 0,
          negativeImpact: Number(data.negativeImpact) || 0,
          noChange: Number(data.noChange) || 0,
          totalImpact: Number(data.totalImpact) || 0
        }));
        return data.filter(item => !isNaN(item.totalImpact));
      }
      
      // Enhanced fallback to mock data
      const features = selectedFeatures.length > 0 ? selectedFeatures : Object.keys(featureChanges);
      return features.map(feature => {
        const change = Number(featureChanges[feature]) || 0;
        const impact = Math.abs(change);
        
        return {
          feature,
          positiveImpact: change > 0 ? impact * 100 : 0,
          negativeImpact: change < 0 ? impact * 100 : 0,
          noChange: change === 0 ? 100 : 0,
          totalImpact: impact * 100
        };
      });
    } catch (error) {
      console.error('Error in getFeatureImpactBreakdown:', error);
      return [{ feature: 'Error', positiveImpact: 0, negativeImpact: 0, noChange: 100, totalImpact: 0 }];
    }
  };

  const getFeatureChangeSummary = () => {
    const features = selectedFeatures.length > 0 ? selectedFeatures : Object.keys(featureChanges);
    return features.map(feature => {
      const change = featureChanges[feature] || 0;
      
      return {
        feature,
        change: change * 100,
        changeType: change > 0 ? 'Increased' : change < 0 ? 'Decreased' : 'No Change',
        magnitude: Math.abs(change) * 100
      };
    });
  };

  const getImprovementData = () => {
    const comparisonData = getClusterComparisonData();
    const improving = comparisonData.filter(d => d.improvement > 0);
    const declining = comparisonData.filter(d => d.improvement < 0);
    const stable = comparisonData.filter(d => Math.abs(d.improvement) < 5);

    return [
      { name: 'Improving', value: improving.length, color: '#10b981' },
      { name: 'Declining', value: declining.length, color: '#ef4444' },
      { name: 'Stable', value: stable.length, color: '#6b7280' }
    ];
  };


  // Add a safe chart data validator
  const validateChartData = (data: any[]) => {
    if (!Array.isArray(data)) return [];
    return data.filter(item => {
      // Check if all numeric values are valid
      const numericFields = ['original', 'scenario', 'improvement', 'sensitivity', 'featureChange'];
      return numericFields.every(field => {
        const value = item[field];
        return value === undefined || value === null || (!isNaN(Number(value)) && isFinite(Number(value)));
      });
    });
  };

  // Get validated chart data with additional safety checks
  const getValidatedClusterComparisonData = () => {
    try {
      const data = getClusterComparisonData();
      const validated = validateChartData(data);
      // Ensure we have at least some data to prevent chart errors
      if (validated.length === 0) {
        return [{ cluster: 'No Data', original: 0, scenario: 0, improvement: 0 }];
      }
      return validated;
    } catch (error) {
      console.error('Error validating cluster comparison data:', error);
      return [{ cluster: 'Error', original: 0, scenario: 0, improvement: 0 }];
    }
  };

  const getValidatedSensitivityAnalysis = () => {
    try {
      const data = getSensitivityAnalysis();
      const validated = validateChartData(data);
      // Ensure we have at least some data to prevent chart errors
      if (validated.length === 0) {
        return [{ feature: 'No Data', sensitivity: 0, featureChange: 0, direction: 'No Change', magnitude: 'No Change' }];
      }
      return validated;
    } catch (error) {
      console.error('Error validating sensitivity analysis data:', error);
      return [{ feature: 'Error', sensitivity: 0, featureChange: 0, direction: 'Error', magnitude: 'Error' }];
    }
  };

  // Get processed data
  const stats = getComparisonStats();
  const comparisonData = getClusterComparisonData();
  const improvementData = getImprovementData();
  const sensitivityData = getSensitivityAnalysis();
  const impactBreakdown = getFeatureImpactBreakdown();
  const selectedFeatureCorrelations = getSelectedFeatureCorrelations();
  const featureChangeSummary = getFeatureChangeSummary();

  // Debug logging
  console.log('Component render - sensitivityData length:', sensitivityData.length);
  console.log('Component render - featureAnalysisData available:', !!featureAnalysisData);
  console.log('Component render - sensitivityData sample:', sensitivityData.slice(0, 2));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      {/* Product Information Header */}
      {productInfo && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Info className="w-5 h-5" />
              Product Analysis: {productInfo.name}
            </CardTitle>
            <CardDescription className="text-blue-700">
              {productInfo.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className="text-sm font-medium text-gray-600">Target Audience</div>
                <div className="text-lg font-semibold text-blue-800">{productInfo.targetAudience}</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className="text-sm font-medium text-gray-600">Budget Category</div>
                <div className="text-lg font-semibold text-blue-800">{productInfo.budget}</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className="text-sm font-medium text-gray-600">Product Type</div>
                <div className="text-lg font-semibold text-blue-800">{productInfo.productType}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Original Avg Score</p>
                <p className="text-2xl font-bold">{stats?.originalAvg || 'N/A'}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Scenario Avg Score</p>
                <p className="text-2xl font-bold">{stats?.scenarioAvg || 'N/A'}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <Target className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Improvement</p>
                <p className={`text-2xl font-bold ${parseFloat(stats?.improvement || '0') >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats?.improvement ? `${stats.improvement}%` : 'N/A'}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                {parseFloat(stats?.improvement || '0') >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Improved Clusters</p>
                <p className="text-2xl font-bold text-green-600">{stats?.improvedClusters || 0}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Declined Clusters</p>
                <p className="text-2xl font-bold text-red-600">{stats?.declinedClusters || 0}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unchanged Clusters</p>
                <p className="text-2xl font-bold text-gray-600">{stats?.unchangedClusters || 0}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                <Minus className="h-4 w-4 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analysis Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Info className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Features
          </TabsTrigger>
          <TabsTrigger value="clusters" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Clusters
          </TabsTrigger>
          <TabsTrigger value="charts" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Charts
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Statistics
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Improvement Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitCompare className="w-5 h-5" />
                  Cluster Improvement Distribution
                </CardTitle>
                <CardDescription>
                  How clusters performed after scenario changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartErrorBoundary>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={improvementData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {improvementData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </ChartErrorBoundary>
              </CardContent>
            </Card>

            {/* Top Performing Clusters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Top Performing Clusters
                </CardTitle>
                <CardDescription>
                  Clusters with the highest improvement scores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {comparisonData.slice(0, 5).map((cluster, index) => (
                    <div key={cluster.cluster || index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">Cluster {cluster.cluster}</p>
                          <p className="text-sm text-muted-foreground">
                            {cluster.original.toFixed(2)} → {cluster.scenario.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={cluster.improvement > 0 ? 'default' : 'destructive'}>
                          {cluster.improvement > 0 ? '+' : ''}{cluster.improvement.toFixed(1)}%
                        </Badge>
                        {cluster.improvement > 0 ? (
                          <ArrowUpRight className="w-4 h-4 text-green-600" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Feature Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Detailed analysis of feature sensitivity and correlations using {selectedFeatures.length > 0 ? selectedFeatures.length : Object.keys(featureChanges).length} selected features
              </p>
            </div>
            <Button 
              onClick={fetchFeatureAnalysis} 
              disabled={isLoadingAnalysis}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingAnalysis ? 'animate-spin' : ''}`} />
              {isLoadingAnalysis ? 'Analyzing...' : 'Refresh Analysis'}
            </Button>
          </div>
          
          {isLoadingAnalysis && (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Calculating feature sensitivity and correlations...</p>
                </div>
              </CardContent>
            </Card>
          )}
          
          {!isLoadingAnalysis && (
            <div className="space-y-6">
              {/* Feature Sensitivity Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Feature Sensitivity Analysis
                    {featureAnalysisData && (
                      <Badge variant="secondary" className="ml-2">Real Data</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    How much each feature change resulted in score changes
                  </CardDescription>
                  <div className="flex gap-2 mt-2">
                    <Button 
                      size="sm" 
                      onClick={fetchFeatureAnalysis}
                      disabled={isLoadingAnalysis}
                    >
                      {isLoadingAnalysis ? 'Loading...' : 'Refresh Analysis'}
                    </Button>
                    {!featureAnalysisData && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => console.log('Debug: Feature Analysis Data:', featureAnalysisData)}
                      >
                        Debug Data
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {sensitivityData.length > 0 ? (
                    <>
                      {/* Double Bar Chart for Sensitivity Analysis */}
                      <ChartErrorBoundary>
                        <ResponsiveContainer width="100%" height={300}>
                          <RechartsBarChart data={getValidatedSensitivityAnalysis()} layout="horizontal">
                            <CartesianGrid strokeDasharray="3 3" />
                                                          <XAxis 
                                type="number" 
                                domain={[0, (data: any) => {
                                  // Ensure data is an array and has valid values
                                  if (!Array.isArray(data) || data.length === 0) {
                                    return 100; // Default max value
                                  }
                                  const validData = data.filter(d => d && typeof d === 'object' && !isNaN(Number(d.sensitivity)));
                                  if (validData.length === 0) {
                                    return 100; // Default max value
                                  }
                                  const maxSensitivity = Math.max(...validData.map(d => Number(d.sensitivity) || 0));
                                  return Math.max(maxSensitivity, 100);
                                }]}
                                tickFormatter={(value) => `${Number(value).toFixed(0)}%`}
                              />
                            <YAxis dataKey="feature" type="category" width={100} />
                            <Tooltip 
                              formatter={(value: any, name: string) => [
                                `${Number(value).toFixed(2)}%`, 
                                name === 'sensitivity' ? 'Sensitivity' : 'Feature Change'
                              ]}
                              labelFormatter={(label) => `Feature: ${label}`}
                            />
                            <Bar dataKey="sensitivity" fill="#3b82f6" name="Sensitivity" />
                            <Bar dataKey="featureChange" fill="#10b981" name="Feature Change" />
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      </ChartErrorBoundary>
                      
                      {/* Sensitivity Summary Table */}
                      <div className="mt-6">
                        <h4 className="text-sm font-semibold mb-3">Sensitivity Summary</h4>
                        <div className="space-y-2">
                          {getValidatedSensitivityAnalysis()
                            .slice(0, 5)
                            .map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                  <span className="text-xs font-bold text-blue-600">{index + 1}</span>
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{item.feature}</p>
                                  <p className="text-xs text-muted-foreground">{item.direction} • {item.magnitude}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {Number(item.sensitivity).toFixed(1)}%
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {Number(item.featureChange).toFixed(1)}%
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No sensitivity data available</p>
                      <p className="text-sm">Run scenario analysis to see feature sensitivity</p>
                      <div className="mt-4 p-4 bg-gray-100 rounded text-left text-xs">
                        <p><strong>Debug Info:</strong></p>
                        <p>Feature Changes: {JSON.stringify(featureChanges)}</p>
                        <p>Selected Features: {JSON.stringify(selectedFeatures)}</p>
                        <p>Feature Analysis Data: {featureAnalysisData ? 'Available' : 'Not Available'}</p>
                        <p>Sensitivity Data Length: {sensitivityData.length}</p>
                        <p>Raw Sensitivity Data: {JSON.stringify(featureAnalysisData?.sensitivity_analysis || {}, null, 2)}</p>
                        <p>Processed Sensitivity Data: {JSON.stringify(sensitivityData.slice(0, 2), null, 2)}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Feature Correlation Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Feature Correlation Analysis
                    {featureAnalysisData && (
                      <Badge variant="secondary" className="ml-2">Real Data</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Correlation between features using actual cluster data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <Label htmlFor="feature-select" className="text-sm font-medium">
                      Select Feature for Analysis
                    </Label>
                    <Select value={selectedFeatureForCorrelation} onValueChange={setSelectedFeatureForCorrelation}>
                      <SelectTrigger id="feature-select" className="mt-2">
                        <SelectValue placeholder="Choose a feature to analyze correlations" />
                      </SelectTrigger>
                      <SelectContent>
                        {(selectedFeatures.length > 0 ? selectedFeatures : Object.keys(featureChanges)).map((feature) => (
                          <SelectItem key={feature} value={feature}>
                            {feature}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedFeatureForCorrelation ? (
                    <>
                      {/* Correlation Heatmap */}
                      <div className="mb-6">
                        <h4 className="font-medium mb-3">Correlation Heatmap</h4>
                        <div className="overflow-x-auto">
                          <div className="inline-block min-w-full">
                            <div className="grid grid-cols-1 gap-4">
                              {/* Heatmap Grid */}
                              <div className="grid gap-1" style={{
                                gridTemplateColumns: `repeat(${selectedFeatureCorrelations.length + 1}, minmax(120px, 1fr))`
                              }}>
                                {/* Header row */}
                                <div className="p-2 text-xs font-medium text-center bg-muted rounded">Feature</div>
                                {selectedFeatureCorrelations.map((item, index) => (
                                  <div key={index} className="p-2 text-xs font-medium text-center bg-muted rounded truncate">
                                    {item.feature}
                                  </div>
                                ))}
                                
                                {/* Data rows */}
                                {selectedFeatureCorrelations.map((rowItem, rowIndex) => (
                                  <>
                                    <div key={`label-${rowIndex}`} className="p-2 text-xs font-medium bg-muted rounded truncate">
                                      {rowItem.feature}
                                    </div>
                                    {selectedFeatureCorrelations.map((colItem, colIndex) => {
                                      const correlation = rowIndex === colIndex ? 100 : 
                                        selectedFeatureCorrelations.find(item => item.feature === colItem.feature)?.correlation || 0;
                                      const direction = rowIndex === colIndex ? 'Positive' : 
                                        selectedFeatureCorrelations.find(item => item.feature === colItem.feature)?.direction || 'No Change';
                                      
                                      return (
                                        <div
                                          key={`cell-${rowIndex}-${colIndex}`}
                                          className="p-2 text-xs text-center rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                          style={{
                                            backgroundColor: getCorrelationColor(correlation, direction),
                                            color: correlation > 50 ? 'white' : 'black'
                                          }}
                                          title={`${rowItem.feature} vs ${colItem.feature}: ${correlation.toFixed(1)}% ${direction}`}
                                        >
                                          {correlation.toFixed(0)}%
                                        </div>
                                      );
                                    })}
                                  </>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Legend */}
                        <div className="mt-4 flex flex-wrap gap-4 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-green-600"></div>
                            <span>Strong Positive (70%+)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-green-400"></div>
                            <span>Moderate Positive (40-69%)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-green-200"></div>
                            <span>Weak Positive (1-39%)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-red-600"></div>
                            <span>Strong Negative (70%+)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-red-400"></div>
                            <span>Moderate Negative (40-69%)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-gray-200"></div>
                            <span>No Correlation (0%)</span>
                          </div>
                        </div>
                      </div>

                      {/* Individual Feature Correlation Chart */}
                      <ChartErrorBoundary>
                        <ResponsiveContainer width="100%" height={300}>
                          <RechartsBarChart data={selectedFeatureCorrelations} layout="horizontal">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              type="number" 
                              domain={[0, Math.max(...selectedFeatureCorrelations.map(d => d.correlation), 100)]}
                              tickFormatter={(value) => `${value.toFixed(0)}%`}
                            />
                            <YAxis dataKey="feature" type="category" width={80} />
                            <Tooltip formatter={(value: any) => [`${Number(value).toFixed(1)}%`, 'Correlation Strength']} />
                            <Bar 
                              dataKey="correlation" 
                              fill="#8884d8"
                            />
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      </ChartErrorBoundary>
                      
                      <div className="mt-4 space-y-2">
                        <h4 className="font-medium">Correlations with "{selectedFeatureForCorrelation}":</h4>
                        {selectedFeatureCorrelations.slice(0, 5).map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                            <span className="text-sm font-medium">{item.feature}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant={item.direction === 'Positive' ? 'default' : 'destructive'}>
                                {item.direction}
                              </Badge>
                              <Badge variant="outline">{item.strength}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {item.correlation.toFixed(1)}% correlation
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Select a feature to analyze its correlations</p>
                      <p className="text-sm">This will show how the selected feature correlates with other features</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Clusters Tab */}
        <TabsContent value="clusters" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cluster Comparison Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Cluster Score Comparison
                </CardTitle>
                <CardDescription>
                  Before vs After scenario scores for each cluster
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartErrorBoundary>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsBarChart data={getValidatedClusterComparisonData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="cluster" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: any, name: string) => [
                          `${Number(value).toFixed(2)}`, 
                          name === 'original' ? 'Original Score' : name === 'scenario' ? 'Scenario Score' : 'Improvement %'
                        ]}
                      />
                      <Bar dataKey="original" fill="#8884d8" name="Original Score" />
                      <Bar dataKey="scenario" fill="#82ca9d" name="Scenario Score" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </ChartErrorBoundary>
              </CardContent>
            </Card>

            {/* Improvement Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Improvement Trend
                </CardTitle>
                <CardDescription>
                  Improvement percentage across clusters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartErrorBoundary>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsLineChart data={getValidatedClusterComparisonData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="cluster" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="improvement" stroke="#8884d8" name="Improvement %" />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </ChartErrorBoundary>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Charts Tab */}
        <TabsContent value="charts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Feature Impact Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Feature Impact Breakdown
                  {featureAnalysisData && (
                    <Badge variant="secondary" className="ml-2">Real Data</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  How each feature contributed to score changes across clusters
                </CardDescription>
              </CardHeader>
                            <CardContent>
                <ChartErrorBoundary>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsBarChart data={impactBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="feature" />
                      <YAxis 
                        domain={[0, (data: any) => {
                          if (!Array.isArray(data) || data.length === 0) {
                            return 100; // Default max value
                          }
                          const validData = data.filter(d => d && typeof d === 'object' && !isNaN(Number(d.totalImpact)));
                          if (validData.length === 0) {
                            return 100; // Default max value
                          }
                          const maxImpact = Math.max(...validData.map(d => Number(d.totalImpact) || 0));
                          return Math.max(maxImpact, 100);
                        }]}
                        tickFormatter={(value) => `${Number(value).toFixed(0)}%`}
                      />
                      <Tooltip formatter={(value: any) => [`${Number(value).toFixed(1)}%`, 'Impact']} />
                      <Bar dataKey="positiveImpact" stackId="a" fill="#10b981" name="Positive" />
                      <Bar dataKey="negativeImpact" stackId="a" fill="#ef4444" name="Negative" />
                      <Bar dataKey="noChange" stackId="a" fill="#6b7280" name="No Change" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </ChartErrorBoundary>
              </CardContent>
            </Card>

            {/* Feature Change Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Feature Change Summary
                  {featureAnalysisData && (
                    <Badge variant="secondary" className="ml-2">Real Data</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Summary of feature changes and their magnitudes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {featureChangeSummary.map((feature, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{feature.feature}</span>
                        <div className="flex items-center gap-2">
                          {feature.changeType === 'Increased' ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : feature.changeType === 'Decreased' ? (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          ) : (
                            <Minus className="w-4 h-4 text-gray-600" />
                          )}
                          <Badge variant={feature.changeType === 'Increased' ? 'default' : feature.changeType === 'Decreased' ? 'destructive' : 'outline'}>
                            {feature.changeType}
                          </Badge>
                          <Badge variant="outline">{feature.magnitude.toFixed(1)}%</Badge>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${feature.changeType === 'Increased' ? 'bg-green-600' : feature.changeType === 'Decreased' ? 'bg-red-600' : 'bg-gray-600'}`}
                          style={{ width: `${Math.min(feature.magnitude, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Original Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Original Clusters Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats?.originalAvg || 'N/A'}
                    </div>
                    <div className="text-sm text-muted-foreground">Mean</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {stats?.originalMedian || 'N/A'}
                    </div>
                    <div className="text-sm text-muted-foreground">Median</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {stats?.originalStdDev || 'N/A'}
                    </div>
                    <div className="text-sm text-muted-foreground">Std Dev</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Scenario Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="w-5 h-5" />
                  Scenario Clusters Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats?.scenarioAvg || 'N/A'}
                    </div>
                    <div className="text-sm text-muted-foreground">Mean</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {stats?.scenarioMedian || 'N/A'}
                    </div>
                    <div className="text-sm text-muted-foreground">Median</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {stats?.scenarioStdDev || 'N/A'}
                    </div>
                    <div className="text-sm text-muted-foreground">Std Dev</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistical Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitCompare className="w-5 h-5" />
                Statistical Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded">
                    <div className="text-sm font-medium">Mean Difference</div>
                    <div className={`text-xl font-bold ${parseFloat(stats?.improvement || '0') >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats?.improvement || 'N/A'}%
                    </div>
                  </div>
                  <div className="p-4 bg-muted rounded">
                    <div className="text-sm font-medium">Total Clusters</div>
                    <div className="text-xl font-bold">
                      {stats?.totalClusters || 'N/A'}
                    </div>
                  </div>
                  <div className="p-4 bg-muted rounded">
                    <div className="text-sm font-medium">Improved Clusters</div>
                    <div className="text-xl font-bold text-green-600">
                      {stats?.improvedClusters || 'N/A'}
                    </div>
                  </div>
                  <div className="p-4 bg-muted rounded">
                    <div className="text-sm font-medium">Improvement Rate</div>
                    <div className="text-xl font-bold">
                      {stats?.totalClusters && stats?.improvedClusters ? 
                        `${((stats.improvedClusters / stats.totalClusters) * 100).toFixed(1)}%` : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                AI-Generated Insights
              </CardTitle>
              <CardDescription>
                Comprehensive business analysis and recommendations based on the scenario comparison
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isGeneratingInsights ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Generating comprehensive insights...</p>
                </div>
              ) : comparisonInsights ? (
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {typeof comparisonInsights === 'string' ? comparisonInsights : (comparisonInsights as any).insights}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Lightbulb className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">No insights generated yet</p>
                  <Button onClick={onGenerateInsights} disabled={isGeneratingInsights}>
                    Generate Comprehensive Insights
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 