import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polygon, Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Layers, 
  Eye,
  EyeOff,
  MapPin
} from 'lucide-react';

interface SplitMapComponentProps {
  beforeData?: any;
  afterData?: any;
  beforeClusters?: any[];
  afterClusters?: any[];
  selectedCluster?: number | null;
  onFeatureClick?: (feature: any) => void;
}

// Fix for default Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const getClusterColor = (cluster: number | null | undefined, highlight = false) => {
  if (cluster === null || cluster === undefined) return '#6b7280';
  
  const colors = [
    '#0891b2', '#059669', '#dc2626', '#7c3aed', '#ea580c', '#f59e42',
    '#b91c1c', '#6366f1', '#10b981', '#f43f5e', '#8b5cf6', '#06b6d4',
    '#84cc16', '#f97316', '#ec4899'
  ];
  
  const color = colors[cluster % colors.length];
  return highlight ? color : color;
};

const getClusterIcon = (cluster: number | null | undefined) => {
  return L.divIcon({
    className: 'custom-cluster-icon',
    html: `<div style="
      background-color: ${getClusterColor(cluster)};
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 10px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">${cluster || '?'}</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

const renderPolygonsWithMarkers = (features: any[], clustersVisible: boolean, selectedCluster: number | null, onFeatureClick: ((feature: any) => void) | undefined, mapType: 'before' | 'after') => {
  if (!features || !Array.isArray(features)) {
    return null;
  }
  
  return features.map((feature, idx) => {
    if (!feature || !feature.geometry) {
      return null;
    }
    
    const geometry = feature.geometry;
    const cluster = feature.cluster;
    const highlight = clustersVisible && selectedCluster !== null && cluster === selectedCluster;
    const color = getClusterColor(cluster, highlight);
    
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
          key={`poly-${mapType}-${idx}`}
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
                  {mapType === 'before' ? 'Before' : 'After'}
                </div>
              </div>
            </Tooltip>
          )}
        </Polygon>
      );
    }
    
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
            key={`marker-${mapType}-${idx}`}
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
                  {mapType === 'before' ? 'Before' : 'After'}
                </div>
              </div>
            </Tooltip>
          </Marker>
        );
      }
    }
    
    if ((clustersVisible && cluster !== null && cluster !== undefined) || (!clustersVisible && (cluster === null || cluster === undefined))) {
      const elements = [polygonEl, markerEl].filter(Boolean);
      if (elements.length > 0) {
        return <div key={`feat-${mapType}-${idx}`}>{elements}</div>;
      }
      return null;
    }
    return null;
  });
};

export const SplitMapComponent = ({ 
  beforeData, 
  afterData, 
  beforeClusters, 
  afterClusters, 
  selectedCluster, 
  onFeatureClick 
}: SplitMapComponentProps) => {
  const center: [number, number] = [23.5937, 78.9629]; // India center
  const zoom = 5;

  return (
    <div className="grid grid-cols-2 gap-4 h-96">
      {/* Before Scenario Map */}
      <Card className="relative">
        <div className="absolute top-2 left-2 z-[1000]">
          <Badge variant="secondary" className="bg-blue-500 text-white">
            Before Scenario
          </Badge>
        </div>
        <MapContainer
          center={center}
          zoom={zoom}
          className="w-full h-full rounded-lg"
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {beforeData && beforeData.features && Array.isArray(beforeData.features) && 
            renderPolygonsWithMarkers(beforeData.features, true, selectedCluster, onFeatureClick, 'before')}
        </MapContainer>
      </Card>

      {/* After Scenario Map */}
      <Card className="relative">
        <div className="absolute top-2 left-2 z-[1000]">
          <Badge variant="secondary" className="bg-red-500 text-white">
            After Scenario
          </Badge>
        </div>
        <MapContainer
          center={center}
          zoom={zoom}
          className="w-full h-full rounded-lg"
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {afterData && afterData.features && Array.isArray(afterData.features) && 
            renderPolygonsWithMarkers(afterData.features, true, selectedCluster, onFeatureClick, 'after')}
        </MapContainer>
      </Card>
    </div>
  );
};

export default SplitMapComponent; 