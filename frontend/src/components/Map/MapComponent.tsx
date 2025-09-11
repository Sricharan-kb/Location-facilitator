import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Polygon, Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

interface MapComponentProps {
  data?: any;
  clusters?: any[];
  selectedCluster?: number | null;
  onFeatureClick?: (feature: any) => void;
  scenarioData?: any;
  showComparison?: boolean;
  forceShowClusters?: boolean;
  mapFocusPoint?: [number, number] | null;
}

// Fix for default Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Map Controls Component
const MapControls = ({ layersVisible, toggleLayer }: { 
  layersVisible: { data: boolean; clusters: boolean; scenario: boolean };
  toggleLayer: (layerType: 'data' | 'clusters' | 'scenario') => void;
}) => {
  const map = useMap();
  
  return (
    <Card className="absolute top-4 left-4 z-[1000] p-2">
      <div className="flex flex-col gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => map.zoomIn()}
          className="h-8 w-8 p-0"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => map.zoomOut()}
          className="h-8 w-8 p-0"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => map.setView([0, 0], 2)}
          className="h-8 w-8 p-0"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};

// Layer Controls Component
const LayerControls = ({ layersVisible, toggleLayer }: { 
  layersVisible: { data: boolean; clusters: boolean; scenario: boolean };
  toggleLayer: (layerType: 'data' | 'clusters' | 'scenario') => void;
}) => {
  return (
    <Card className="absolute top-4 right-4 z-[1000] p-3">
      <div className="space-y-2">
        <div className="text-sm font-semibold mb-2">View</div>
        <div className="flex flex-col gap-1">
          <Button
            size="sm"
            variant={layersVisible.data ? "default" : "outline"}
            onClick={() => toggleLayer('data')}
            className="h-8 text-xs justify-start"
          >
            <Eye className={`w-3 h-3 mr-2 ${layersVisible.data ? '' : 'opacity-50'}`} />
            All Polygons
          </Button>
          <Button
            size="sm"
            variant={layersVisible.clusters ? "default" : "outline"}
            onClick={() => toggleLayer('clusters')}
            className="h-8 text-xs justify-start"
          >
            <Layers className={`w-3 h-3 mr-2 ${layersVisible.clusters ? '' : 'opacity-50'}`} />
            Clustered Only
          </Button>
        </div>
      </div>
    </Card>
  );
};

// Cluster Legend Component
const ClusterLegend = ({ clusters }: { clusters?: any[] }) => {
  if (!clusters || clusters.length === 0) return null;
  
  const colors = [
    '#0891b2', '#059669', '#dc2626', '#7c3aed', '#ea580c', '#f59e42', 
    '#b91c1c', '#6366f1', '#10b981', '#f43f5e', '#8b5cf6', '#06b6d4', 
    '#84cc16', '#f97316', '#ec4899'
  ];

  // Show only top 10 clusters
  const top10Clusters = clusters.slice(0, 10);

  return (
    <Card className="absolute bottom-4 left-4 z-[1000] p-3 max-w-xs">
      <div className="text-sm font-semibold mb-2">Top 10 Clusters</div>
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {top10Clusters.map((cluster, index) => {
          const clusterId = cluster.cluster_number || cluster.cluster_id || cluster.cluster || index;
          const color = colors[clusterId % colors.length];
          return (
            <div key={`${cluster.cluster_id}-${index}`} className="flex items-center gap-2 text-xs">
              <div 
                className="w-3 h-3 rounded-full border border-white shadow-sm"
                style={{ backgroundColor: color }}
              />
              <span className="font-medium">Cluster {clusterId}</span>
              <span className="text-muted-foreground">
                ({cluster.count || 0} polygons)
              </span>
              <span className="text-muted-foreground">
                Score: {cluster.avg_suitability_score?.toFixed(1) || 'N/A'}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

const ClusterZoomer = ({ clusters, selectedCluster }: { clusters: any[]; selectedCluster: number | null }) => {
  const map = useMap();
  useEffect(() => {
    if (selectedCluster !== null && clusters) {
      // Find cluster by cluster ID, not by index
      const cluster = clusters.find(c => 
        c.cluster_number === selectedCluster || 
        c.cluster_id === selectedCluster || 
        c.cluster === selectedCluster
      );
      if (cluster) {
        // Try to use centroid if available, else use centroid_lat/lng
        let center = cluster.centroid;
        if (!center && cluster.centroid_lat && cluster.centroid_lng) {
          center = [cluster.centroid_lng, cluster.centroid_lat];
        }
        if (!center && cluster.features && cluster.features.length > 0) {
          const coords = cluster.features.map((f: any) => f.geometry.coordinates);
          const avg = coords.reduce((acc: any, cur: any) => [acc[0] + cur[0], acc[1] + cur[1]], [0, 0]);
          center = [avg[0] / coords.length, avg[1] / coords.length];
        }
        if (
          center &&
          Array.isArray(center) &&
          center.length === 2 &&
          typeof center[0] === 'number' &&
          typeof center[1] === 'number' &&
          isFinite(center[0]) &&
          isFinite(center[1])
        ) {
          map.setView([center[1], center[0]], 12, { animate: true });
        }
      }
    }
  }, [selectedCluster, clusters, map]);
  
  return null;
};

const MapFocusHandler = ({ mapFocusPoint }: { mapFocusPoint: [number, number] | null }) => {
  const map = useMap();
  
  useEffect(() => {
    if (mapFocusPoint && Array.isArray(mapFocusPoint) && mapFocusPoint.length === 2) {
      const [lng, lat] = mapFocusPoint;
      if (typeof lng === 'number' && typeof lat === 'number' && isFinite(lng) && isFinite(lat)) {
        map.setView([lat, lng], 14, { animate: true });
      }
    }
  }, [mapFocusPoint, map]);
  
  return null;
};

const clusterColors = ['#0891b2', '#059669', '#dc2626', '#7c3aed', '#ea580c', '#f59e42', '#b91c1c', '#6366f1', '#10b981', '#f43f5e'];
const defaultColor = '#1976d2';

const getClusterColor = (cluster: number | null | undefined, highlight = false) => {
  if (cluster === null || cluster === undefined) return defaultColor;
  // Ensure cluster is a number for color calculation
  const clusterNum = typeof cluster === 'number' ? cluster : parseInt(String(cluster), 10) || 0;
  let color = clusterColors[clusterNum % clusterColors.length];
  if (highlight) color = '#FFD700';
  return color;
};

const getClusterIcon = (cluster: number | null | undefined) => {
  const color = getClusterColor(cluster);
  return L.divIcon({
    className: 'custom-cluster-icon',
    html: `<div style="background:${color};width:18px;height:18px;border-radius:50%;border:2px solid white;"></div>`
  });
};

const getDistance = (centroid1: [number, number], centroid2: [number, number]) => {
  if (!centroid1 || !centroid2) return Infinity;
  const [lon1, lat1] = centroid1;
  const [lon2, lat2] = centroid2;
  return Math.sqrt(Math.pow(lon1 - lon2, 2) + Math.pow(lat1 - lat2, 2));
};

const matchClustersByCentroid = (original: any[], scenario: any[]) => {
  if (!original.length || !scenario.length) return scenario;

  const matchedScenarioClusters = [...scenario];
  const usedOriginalIndices = new Set();

  return matchedScenarioClusters.map(sc => {
    let bestMatch: any = null;
    let minDistance = Infinity;
    let bestIndex = -1;

    original.forEach((oc, index) => {
      if (!usedOriginalIndices.has(index)) {
        const distance = getDistance(sc.centroid, oc.centroid);
        if (distance < minDistance) {
          minDistance = distance;
          bestMatch = oc;
          bestIndex = index;
        }
      }
    });

    if (bestMatch) {
      usedOriginalIndices.add(bestIndex);
      return {
        ...sc,
        cluster: bestMatch.cluster, // Use original cluster ID
        cluster_id: bestMatch.cluster_id,
        cluster_number: bestMatch.cluster_number,
      };
    }
    return sc; // Return original if no match found
  });
};

const renderPolygonsWithMarkers = (features: any[], clustersVisible: boolean, selectedCluster: number | null, onFeatureClick: ((feature: any) => void) | undefined) => {
  // Add null check for features
  if (!features || !Array.isArray(features)) {
    console.log('renderPolygonsWithMarkers: features is null, undefined, or not an array');
    return null;
  }
  
  console.log('renderPolygonsWithMarkers called with:', { features: features.length, clustersVisible, selectedCluster });
  if (clustersVisible) {
    const clusteredFeatures = features.filter(f => f.cluster !== undefined);
    console.log('Clustered features found:', clusteredFeatures.length);
  }
  
  return features.map((feature, idx) => {
    // Add comprehensive null checks
    if (!feature || !feature.geometry) {
      console.log('renderPolygonsWithMarkers: feature or geometry is null/undefined');
      return null;
    }
    
    const geometry = feature.geometry;
    const cluster = feature.cluster;
    const highlight = clustersVisible && selectedCluster !== null && cluster === selectedCluster;
    const color = getClusterColor(cluster, highlight);
    
    // Render polygon
    let polygonEl = null;
    if (geometry.type === 'Polygon' && geometry.coordinates && Array.isArray(geometry.coordinates)) {
      const rings = geometry.coordinates.map((ring: any) => {
        if (!Array.isArray(ring)) return [];
        return ring.map((coord: any) => {
          if (!Array.isArray(coord) || coord.length < 2) return [0, 0];
          return [coord[1], coord[0]]; // lat, lng
        });
      });
      polygonEl = (
        <Polygon
          key={`poly-${idx}`}
          positions={rings}
          pathOptions={{ 
            color, 
            weight: highlight ? 4 : 2, 
            fillOpacity: highlight ? 0.7 : 0.3 
          }}
          eventHandlers={{ click: () => feature && feature.properties && onFeatureClick?.(feature) }}
        >
          {clustersVisible && cluster !== null && cluster !== undefined && (
            <Tooltip 
              direction="top" 
              offset={[0, -10]} 
              opacity={1} 
              permanent={true}
              className="cluster-tooltip"
            >
              <div className="text-center">
                <div className="font-bold text-base text-yellow-300">Cluster {cluster}</div>
                <div className="text-xs text-gray-300">
                  Click for details
                </div>
              </div>
            </Tooltip>
          )}
        </Polygon>
      );
    } else if (geometry.type === 'MultiPolygon' && geometry.coordinates && Array.isArray(geometry.coordinates)) {
      polygonEl = geometry.coordinates.map((polygon: any, polyIdx: number) => {
        if (!Array.isArray(polygon)) return null;
        const rings = polygon.map((ring: any) => {
          if (!Array.isArray(ring)) return [];
          return ring.map((coord: any) => {
            if (!Array.isArray(coord) || coord.length < 2) return [0, 0];
            return [coord[1], coord[0]]; // lat, lng
          });
        });
        return (
          <Polygon
            key={`multipoly-${idx}-${polyIdx}`}
            positions={rings}
            pathOptions={{ 
              color, 
              weight: highlight ? 4 : 2, 
              fillOpacity: highlight ? 0.7 : 0.3 
            }}
            eventHandlers={{ click: () => feature && feature.properties && onFeatureClick?.(feature) }}
          >
            {clustersVisible && cluster !== null && cluster !== undefined && (
              <Tooltip 
                direction="top" 
                offset={[0, -10]} 
                opacity={1} 
                permanent={true}
                className="cluster-tooltip"
              >
                <div className="text-center">
                  <div className="font-bold text-base text-yellow-300">Cluster {cluster}</div>
                  <div className="text-xs text-gray-300">
                    Click for details
                  </div>
                </div>
              </Tooltip>
            )}
          </Polygon>
        );
      }).filter(Boolean); // Filter out null values
    }
    
    // Only render marker if cluster is not null/undefined
    let markerEl = null;
    if (cluster !== null && cluster !== undefined && geometry.type === 'Polygon' && 
        geometry.coordinates && Array.isArray(geometry.coordinates) && 
        geometry.coordinates[0] && Array.isArray(geometry.coordinates[0]) && 
        geometry.coordinates[0].length > 0) {
      const coords = geometry.coordinates[0];
      const lng = coords.reduce((sum, c) => sum + (c && Array.isArray(c) && c[0] ? c[0] : 0), 0) / coords.length;
      const lat = coords.reduce((sum, c) => sum + (c && Array.isArray(c) && c[1] ? c[1] : 0), 0) / coords.length;
      if (typeof lat === 'number' && typeof lng === 'number' && isFinite(lat) && isFinite(lng)) {
        markerEl = (
          <Marker
            key={`marker-${idx}`}
            position={[lat, lng] as [number, number]}
            icon={getClusterIcon(cluster)}
            eventHandlers={{
              click: () => onFeatureClick?.(feature)
            }}
          >
            <Tooltip 
              direction="top" 
              offset={[0, -10]} 
              opacity={1} 
              permanent={true}
              className="cluster-tooltip"
            >
              <div className="text-center">
                <div className="font-bold text-base text-yellow-300">Cluster {cluster}</div>
                <div className="text-xs text-gray-300">
                  Click for details
                </div>
              </div>
            </Tooltip>
          </Marker>
        );
      }
    }
    
    // Only show clustered polygons if clustersVisible, else only non-clustered
    if ((clustersVisible && cluster !== null && cluster !== undefined) || (!clustersVisible && (cluster === null || cluster === undefined))) {
      if (geometry.type === 'Polygon' && geometry.coordinates && Array.isArray(geometry.coordinates)) {
        const rings = geometry.coordinates.map((ring: any) => {
          if (!Array.isArray(ring)) return [];
          return ring.map((coord: any) => {
            if (!Array.isArray(coord) || coord.length < 2) return [0, 0];
            return [coord[1], coord[0]]; // lat, lng
          });
        });
        polygonEl = (
          <Polygon
            key={`poly-${idx}`}
            positions={rings}
            pathOptions={{ 
              color, 
              weight: highlight ? 4 : 2, 
              fillOpacity: highlight ? 0.7 : 0.3 
            }}
            eventHandlers={{ click: () => feature && feature.properties && onFeatureClick?.(feature) }}
          >
            {clustersVisible && cluster !== null && cluster !== undefined && (
              <Tooltip 
                direction="top" 
                offset={[0, -10]} 
                opacity={1} 
                permanent={true}
                className="cluster-tooltip"
              >
                <div className="text-center">
                  <div className="font-bold text-base text-yellow-300">Cluster {cluster}</div>
                  <div className="text-xs text-gray-300">
                    Click for details
                  </div>
                </div>
              </Tooltip>
            )}
          </Polygon>
        );
      } else if (geometry.type === 'MultiPolygon' && geometry.coordinates && Array.isArray(geometry.coordinates)) {
        polygonEl = geometry.coordinates.map((polygon: any, polyIdx: number) => {
          if (!Array.isArray(polygon)) return null;
          const rings = polygon.map((ring: any) => {
            if (!Array.isArray(ring)) return [];
            return ring.map((coord: any) => {
              if (!Array.isArray(coord) || coord.length < 2) return [0, 0];
              return [coord[1], coord[0]]; // lat, lng
            });
          });
          return (
            <Polygon
              key={`multipoly-${idx}-${polyIdx}`}
              positions={rings}
              pathOptions={{ 
                color, 
                weight: highlight ? 4 : 2, 
                fillOpacity: highlight ? 0.7 : 0.3 
              }}
              eventHandlers={{ click: () => feature && feature.properties && onFeatureClick?.(feature) }}
            >
              {clustersVisible && cluster !== null && cluster !== undefined && (
                <Tooltip 
                  direction="top" 
                  offset={[0, -10]} 
                  opacity={1} 
                  permanent={true}
                  className="cluster-tooltip"
                >
                  <div className="text-center">
                    <div className="font-bold text-base text-yellow-300">Cluster {cluster}</div>
                    <div className="text-xs text-gray-300">
                      Click for details
                    </div>
                  </div>
                </Tooltip>
              )}
            </Polygon>
          );
        }).filter(Boolean); // Filter out null values
      }
      
      // Only render marker if cluster is not null/undefined
      let markerEl = null;
      if (cluster !== null && cluster !== undefined && geometry.type === 'Polygon' && 
          geometry.coordinates && Array.isArray(geometry.coordinates) && 
          geometry.coordinates[0] && Array.isArray(geometry.coordinates[0]) && 
          geometry.coordinates[0].length > 0) {
        const coords = geometry.coordinates[0];
        const lng = coords.reduce((sum, c) => sum + (c && Array.isArray(c) && c[0] ? c[0] : 0), 0) / coords.length;
        const lat = coords.reduce((sum, c) => sum + (c && Array.isArray(c) && c[1] ? c[1] : 0), 0) / coords.length;
        if (typeof lat === 'number' && typeof lng === 'number' && isFinite(lat) && isFinite(lng)) {
          markerEl = (
            <Marker
              key={`marker-${idx}`}
              position={[lat, lng] as [number, number]}
              icon={getClusterIcon(cluster)}
            >
              <Tooltip 
                direction="top" 
                offset={[0, -10]} 
                opacity={1} 
                permanent={true}
                className="cluster-tooltip"
              >
                <div className="text-center">
                  <div className="font-bold text-base text-yellow-300">Cluster {cluster}</div>
                  <div className="text-xs text-gray-300">
                    Centroid marker
                  </div>
                </div>
              </Tooltip>
            </Marker>
          );
        }
      }
      // Only return if we have valid elements
      const elements = [polygonEl, markerEl].filter(Boolean);
      if (elements.length > 0) {
        return <div key={`feat-${idx}`}>{elements}</div>;
      }
      return null;
    }
    return null;
  });
};

export const MapComponent = ({ data, clusters, selectedCluster, onFeatureClick, scenarioData, showComparison, forceShowClusters, mapFocusPoint }: MapComponentProps) => {
  // Debug logs
  console.log('MapComponent props:', { data, clusters, scenarioData, showComparison });
  const [layersVisible, setLayersVisible] = useState({
    data: true,
    clusters: true,
    scenario: true
  });

  // Sync forceShowClusters prop to layersVisible state
  useEffect(() => {
    if (forceShowClusters) {
      setLayersVisible({ data: false, clusters: true, scenario: true });
    }
  }, [forceShowClusters]);

  // Note: Removed auto-switching to clusters - user must explicitly choose view

  // Center on India
  const center: [number, number] = [23.5937, 78.9629]; // India center coordinates
  const zoom = 5; // Closer zoom for India

  // Extract all features from data
  const allFeatures = data?.features || [];

  const getFeatureColor = (feature: any, isScenario = false, highlight = false) => {
    if (isScenario) return '#e11d48'; // red for scenario
    if (feature.cluster !== undefined) {
      // Enhanced color palette with better contrast
      const colors = [
        '#0891b2', // cyan
        '#059669', // emerald
        '#dc2626', // red
        '#7c3aed', // violet
        '#ea580c', // orange
        '#f59e42', // amber
        '#b91c1c', // red-700
        '#6366f1', // indigo
        '#10b981', // emerald-500
        '#f43f5e', // rose
        '#8b5cf6', // violet-500
        '#06b6d4', // cyan-500
        '#84cc16', // lime-500
        '#f97316', // orange-500
        '#ec4899'  // pink-500
      ];
      let color = colors[feature.cluster % colors.length];
      if (highlight) color = '#FFD700'; // gold highlight for selected cluster
      return color;
    }
    return '#0891b2'; // teal
  };

  const renderFeature = (feature: any, index: number, getFeatureColor: any, onFeatureClick: any, isScenario = false) => {
    const geometry = feature.geometry;
    const color = getFeatureColor(feature, isScenario);

    if (geometry.type === 'Point') {
      const [lng, lat] = geometry.coordinates;
      // Type guard: ensure lat/lng are finite numbers
      if (typeof lat === 'number' && typeof lng === 'number' && isFinite(lat) && isFinite(lng)) {
        const leafletCenter: [number, number] = [lat, lng];
        return (
          <CircleMarker
            key={`point-${index}`}
            center={leafletCenter}
            radius={feature.cluster !== undefined ? 8 : 6}
            pathOptions={{
              fillColor: color,
              color: 'white',
              weight: 2,
              fillOpacity: 0.8
            }}
            eventHandlers={{
              click: () => onFeatureClick?.(feature)
            }}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold mb-1">
                  {isScenario ? 'Scenario Point' : 'Data Point'}
                </div>
                {feature.properties && Object.entries(feature.properties).map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-2">
                    <span className="text-muted-foreground">{key}:</span>
                    <span>{String(value)}</span>
                  </div>
                ))}
                {feature.cluster !== undefined && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Cluster: {feature.cluster}
                  </div>
                )}
              </div>
            </Popup>
          </CircleMarker>
        );
      }
      return null;
    } else if (geometry.type === 'Polygon') {
      // Polygon: coordinates is an array of linear rings
      const rings = geometry.coordinates.map((ring: any) => ring.map(([lng, lat]: [number, number]) => [lat, lng]));
      return (
        <Polygon
          key={`polygon-${index}`}
          positions={rings}
          pathOptions={{ color, weight: 2, fillOpacity: 0.4 }}
          eventHandlers={{
            click: () => onFeatureClick?.(feature)
          }}
        >
          <Popup>
            <div className="text-sm">
              <div className="font-semibold mb-1">Polygon</div>
              {feature.properties && Object.entries(feature.properties).map(([key, value]) => (
                <div key={key} className="flex justify-between gap-2">
                  <span className="text-muted-foreground">{key}:</span>
                  <span>{String(value)}</span>
                </div>
              ))}
            </div>
          </Popup>
        </Polygon>
      );
    } else if (geometry.type === 'MultiPolygon') {
      // MultiPolygon: coordinates is an array of polygons
      return geometry.coordinates.map((polygon: any, polyIdx: number) => {
        const rings = polygon.map((ring: any) => ring.map(([lng, lat]: [number, number]) => [lat, lng]));
        return (
          <Polygon
            key={`multipolygon-${index}-${polyIdx}`}
            positions={rings}
            pathOptions={{ color, weight: 2, fillOpacity: 0.4 }}
            eventHandlers={{
              click: () => onFeatureClick?.(feature)
            }}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold mb-1">MultiPolygon</div>
                {feature.properties && Object.entries(feature.properties).map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-2">
                    <span className="text-muted-foreground">{key}:</span>
                    <span>{String(value)}</span>
                  </div>
                ))}
              </div>
            </Popup>
          </Polygon>
        );
      });
    }
    // Optionally handle other geometry types (LineString, etc.)
    return null;
  };

  const renderDataPoints = (dataSource: any, isScenario = false) => {
    if (!dataSource?.features) return null;
    return dataSource.features.map((feature: any, index: number) =>
      renderFeature(feature, index, getFeatureColor, onFeatureClick, isScenario)
    );
  };

  const renderClusters = () => {
    if (!clusters || !data || !data.features) return null;

    const matchedClusters = scenarioData ? matchClustersByCentroid(data.features, clusters) : clusters;

    // Show only top 10 clusters
    const top10Clusters = matchedClusters.slice(0, 10);
    
    // Get cluster IDs from top 10 clusters
    const topClusterIds = top10Clusters.map(cluster => cluster.cluster);
    
    // Filter data features that belong to top 10 clusters
    const clusterFeatures = data.features.filter((feature: any) => 
      feature.cluster !== undefined && topClusterIds.includes(feature.cluster)
    );
    
    return clusterFeatures.map((feature: any, index: number) => {
      const clusterId = feature.cluster;
      const clusterInfo = top10Clusters.find(c => c.cluster === clusterId);
      const highlight = selectedCluster === clusterId;
      
      const geometry = feature.geometry;
      if (geometry.type === 'Point') {
        const [lng, lat] = geometry.coordinates;
        if (typeof lat === 'number' && typeof lng === 'number' && isFinite(lat) && isFinite(lng)) {
          const leafletCenter: [number, number] = [lat, lng];
          const color = getFeatureColor({ cluster: clusterId }, false, highlight);
          
          return (
            <CircleMarker
              key={`cluster-${clusterId}-${index}`}
              center={leafletCenter}
              radius={highlight ? 14 : 10}
              pathOptions={{
                fillColor: color,
                color: highlight ? '#FFD700' : 'white',
                weight: highlight ? 4 : 2,
                fillOpacity: highlight ? 0.9 : 0.8
              }}
              eventHandlers={{
                click: () => onFeatureClick?.(feature)
              }}
            >
              <Tooltip 
                direction="top" 
                offset={[0, -10]} 
                opacity={1} 
                permanent={true}
                className="cluster-tooltip"
              >
                <div className="text-center">
                  <div className="font-bold text-base text-yellow-300">Cluster {clusterId}</div>
                  <div className="text-xs text-gray-300">
                    Score: {clusterInfo?.avg_suitability_score?.toFixed(2) || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-300">
                    Points: {clusterInfo?.count || 'N/A'}
                  </div>
                </div>
              </Tooltip>
              <Popup>
                <div className="text-sm min-w-[200px]">
                  <div className="font-semibold mb-2 text-lg border-b pb-1">
                    Cluster {clusterId}
                  </div>
                  <div className="space-y-1 mb-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg Score:</span>
                      <span className="font-medium">{clusterInfo?.avg_suitability_score?.toFixed(3) || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Points:</span>
                      <span className="font-medium">{clusterInfo?.count || 'N/A'}</span>
                    </div>
                    {clusterInfo?.avg_sanitary_gap && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sanitary Gap:</span>
                        <span className="font-medium">{clusterInfo.avg_sanitary_gap?.toFixed(2) || 'N/A'}</span>
                      </div>
                    )}
                  </div>
                  {feature.properties && (
                    <div className="border-t pt-2">
                      <div className="text-xs text-muted-foreground mb-1">Feature Properties:</div>
                      {Object.entries(feature.properties).slice(0, 5).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{key}:</span>
                      <span>{String(value)}</span>
                    </div>
                  ))}
                  </div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        }
        }
        return null;
    });
  };

  const toggleLayer = (layerType: keyof typeof layersVisible) => {
    setLayersVisible(prev => {
      // Simple toggle: only one view can be active at a time
      if (layerType === 'data') {
        return { data: true, clusters: false, scenario: prev.scenario };
      } else if (layerType === 'clusters') {
        return { data: false, clusters: true, scenario: prev.scenario };
      }
      return { ...prev, [layerType]: !prev[layerType] };
    });
  };

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full rounded-lg shadow-map"
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Render top 10 clusters */}
        {clusters && clusters.slice(0, 10).map((cluster, index) => {
          const clusterId = cluster.cluster || index;
          const color = clusterColors[clusterId % clusterColors.length];
          if (!cluster.centroid || !cluster.centroid.lat || !cluster.centroid.lng) return null;

          return (
            <CircleMarker
              key={`cluster-marker-${cluster.cluster_id || clusterId}`}
              center={[cluster.centroid.lat, cluster.centroid.lng]}
              radius={8}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.8 }}
            >
              <Tooltip>
                <span>Cluster ID: {clusterId}</span>
              </Tooltip>
            </CircleMarker>
          );
        })}

        
        {/* Data Polygons - Show all polygons colored by cluster */}
        {data && data.features && Array.isArray(data.features) && (
          <>
            {/* Show non-clustered polygons in default color when "All Polygons" is selected */}
            {layersVisible.data && data.features
              .filter((feature: any) => feature.cluster === null || feature.cluster === undefined)
              .map((feature: any, index: number) => renderFeature(feature, index, getFeatureColor, onFeatureClick, false))}
            
            {/* Show clustered polygons with cluster colors */}
            {data.features
              .filter((feature: any) => feature.cluster !== null && feature.cluster !== undefined)
              .map((feature: any, index: number) => {
                // Only show clustered polygons when "Clustered Only" is selected, or show all when "All Polygons" is selected
                if (layersVisible.clusters || layersVisible.data) {
                  return renderFeature(feature, index, getFeatureColor, onFeatureClick, false);
                }
                return null;
              })}
          </>
        )}
        
        {/* Show scored data even when not clustered - display suitability scores */}
        {data && data.features && Array.isArray(data.features) && clusters.length === 0 && (
          <div className="absolute top-4 left-4 z-[1000] bg-black/80 text-white p-2 rounded text-xs">
            <div>Data scored - {data.features.length} polygons</div>
            <div>Choose clustering technique to see clusters</div>
          </div>
        )}
        
        {/* Cluster centroids as markers */}
        {clusters && clusters.slice(0, 10).map((cluster, index) => {
          const clusterId = cluster.cluster || index;
          const color = clusterColors[clusterId % clusterColors.length];
          if (!cluster.centroid || !cluster.centroid.lat || !cluster.centroid.lng) return null;

          return (
            <CircleMarker
              key={`cluster-marker-${cluster.cluster_id || clusterId}-centroid`}
              center={[cluster.centroid.lat, cluster.centroid.lng]}
              radius={12}
              pathOptions={{ 
                color: 'white', 
                fillColor: color, 
                fillOpacity: 0.9,
                weight: 3
              }}
            >
              <Tooltip>
                <div className="text-center">
                  <div className="font-bold">Cluster {clusterId}</div>
                  <div>Score: {cluster.avg_suitability_score?.toFixed(2) || 'N/A'}</div>
                  <div>{cluster.count || 0} Polygons</div>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
        <MapControls layersVisible={layersVisible} toggleLayer={toggleLayer} />
        {/* Cluster zoomer/highlighter */}
        {clusters && selectedCluster !== null && (
          <ClusterZoomer clusters={clusters} selectedCluster={selectedCluster} />
        )}
        
        {/* Map focus handler */}
        <MapFocusHandler mapFocusPoint={mapFocusPoint} />
      </MapContainer>

      {/* Layer Controls */}
      <LayerControls layersVisible={layersVisible} toggleLayer={toggleLayer} />
      
      {/* Debug info */}
      {clusters && Array.isArray(clusters) && clusters.length > 0 && (
        <div className="absolute bottom-4 right-4 z-[1000] bg-black/80 text-white p-2 rounded text-xs">
          <div>Clusters: {clusters.length} | Data: {data?.features?.length || 0}</div>
          <button 
              onClick={() => toggleLayer('clusters')}
            className="mt-1 underline hover:text-yellow-300"
          >
            Show Clusters
          </button>
        </div>
      )}
      
      {/* Cluster Legend - show when clusters are available */}
      {clusters && Array.isArray(clusters) && clusters.length > 0 && (
        <ClusterLegend clusters={clusters} />
      )}
    </div>
  );
};

export default MapComponent;