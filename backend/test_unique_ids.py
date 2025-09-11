import requests
import json

def test_unique_ids():
    """Test that unique IDs are generated for polygons and clusters"""
    url_normalize = "http://localhost:5000/api/normalize-score"
    url_cluster = "http://localhost:5000/api/cluster"
    
    # Sample data
    test_polygons = [
        {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [77.2090, 28.6139]},
            "properties": {"total_population": 1000, "total_hhd": 200, "is_bank_available": 1, "is_atm_available": 1}
        },
        {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [72.8777, 19.0760]},
            "properties": {"total_population": 1500, "total_hhd": 300, "is_bank_available": 1, "is_atm_available": 1}
        },
        {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [73.8567, 18.5204]},
            "properties": {"total_population": 800, "total_hhd": 150, "is_bank_available": 0, "is_atm_available": 0}
        },
        {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [75.7873, 26.9124]},
            "properties": {"total_population": 1200, "total_hhd": 250, "is_bank_available": 1, "is_atm_available": 0}
        },
        {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [78.4867, 17.3850]},
            "properties": {"total_population": 900, "total_hhd": 180, "is_bank_available": 0, "is_atm_available": 0}
        }
    ]
    
    features = ["total_population", "total_hhd", "is_bank_available", "is_atm_available"]
    weights = [1, 1, 1, 1]
    
    print("=== Testing Unique IDs ===\n")
    
    # Step 1: Test normalization and scoring
    print("Step 1: Testing normalization and scoring...")
    normalize_data = {
        "polygons": test_polygons,
        "features": features,
        "weights": weights
    }
    
    try:
        normalize_response = requests.post(url_normalize, json=normalize_data, timeout=30)
        print(f"  Status Code: {normalize_response.status_code}")
        
        if normalize_response.status_code == 200:
            scored_polygons = normalize_response.json()['polygons']
            print(f"  ✅ Normalization successful! Processed {len(scored_polygons)} polygons")
            
            # Check for unique IDs in scored polygons
            polygon_ids = [p.get('id') for p in scored_polygons if p.get('id')]
            unique_polygon_ids = set(polygon_ids)
            print(f"  📊 Polygon IDs: {len(polygon_ids)} total, {len(unique_polygon_ids)} unique")
            
            if len(polygon_ids) == len(unique_polygon_ids):
                print("  ✅ All polygons have unique IDs")
            else:
                print("  ❌ Duplicate polygon IDs found!")
                
            # Check for suitability scores
            scored_count = sum(1 for p in scored_polygons if 'suitabilityScore' in p['properties'])
            print(f"  📊 Polygons with suitability scores: {scored_count}/{len(scored_polygons)}")
            
        else:
            print(f"  ❌ Normalization failed: {normalize_response.text}")
            return
            
    except Exception as e:
        print(f"  ❌ Error during normalization: {e}")
        return
    
    print()
    
    # Step 2: Test clustering with scored data
    print("Step 2: Testing clustering with scored data...")
    cluster_data = {
        "algorithm": "kmeans",
        "params": {
            "n_clusters": 3,
            "max_polygons_per_cluster": 10,
            "min_polygons_per_cluster": 1
        },
        "polygons": scored_polygons,
        "include_ai_insights": False
    }
    
    try:
        cluster_response = requests.post(url_cluster, json=cluster_data, timeout=30)
        print(f"  Status Code: {cluster_response.status_code}")
        
        if cluster_response.status_code == 200:
            result = cluster_response.json()
            clusters = result.get('clusters', [])
            output_polygons = result.get('polygons', [])
            
            print(f"  ✅ Clustering successful! Found {len(clusters)} clusters, {len(output_polygons)} polygons returned")
            
            # Check cluster IDs
            cluster_ids = [c.get('cluster_id') for c in clusters if c.get('cluster_id')]
            unique_cluster_ids = set(cluster_ids)
            print(f"  📊 Cluster IDs: {len(cluster_ids)} total, {len(unique_cluster_ids)} unique")
            
            if len(cluster_ids) == len(unique_cluster_ids):
                print("  ✅ All clusters have unique IDs")
            else:
                print("  ❌ Duplicate cluster IDs found!")
            
            # Check polygon IDs in clusters
            all_polygon_ids_in_clusters = []
            for cluster in clusters:
                polygon_ids_in_cluster = cluster.get('polygon_ids', [])
                all_polygon_ids_in_clusters.extend(polygon_ids_in_cluster)
                print(f"    Cluster {cluster.get('cluster_number')}: {len(polygon_ids_in_cluster)} polygons")
            
            unique_polygon_ids_in_clusters = set(all_polygon_ids_in_clusters)
            print(f"  📊 Polygon IDs in clusters: {len(all_polygon_ids_in_clusters)} total, {len(unique_polygon_ids_in_clusters)} unique")
            
            # Check output polygons have cluster assignments
            clustered_polygons = [p for p in output_polygons if 'cluster' in p]
            print(f"  📊 Output polygons with cluster assignments: {len(clustered_polygons)}/{len(output_polygons)}")
            
            # Show cluster details
            for i, cluster in enumerate(clusters[:3]):
                cluster_id = cluster.get('cluster_id', 'N/A')
                if isinstance(cluster_id, int):
                    cluster_id_str = str(cluster_id)
                else:
                    cluster_id_str = str(cluster_id)[:8] if cluster_id else 'N/A'
                print(f"    Cluster {i+1}: ID={cluster_id_str}, Score={cluster.get('avg_suitability_score', 'N/A'):.2f}, Count={cluster.get('count', 'N/A')}")
                
        else:
            print(f"  ❌ Clustering failed: {cluster_response.text}")
            
    except Exception as e:
        print(f"  ❌ Error during clustering: {e}")

if __name__ == "__main__":
    test_unique_ids() 