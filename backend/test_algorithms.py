import requests
import json

def test_clustering_algorithms():
    """Test all clustering algorithms with their specific parameters"""
    url = "http://localhost:5000/api/cluster"
    
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
    
    algorithms = [
        {
            "name": "K-Means",
            "algorithm": "kmeans",
            "params": {
                "n_clusters": 3,
                "max_polygons_per_cluster": 10,
                "min_polygons_per_cluster": 1
            }
        },
        {
            "name": "DBSCAN",
            "algorithm": "dbscan",
            "params": {
                "dbscan_eps": 5.0,  # 5km radius
                "dbscan_min_samples": 2,
                "max_polygons_per_cluster": 10,
                "min_polygons_per_cluster": 1
            }
        },
        {
            "name": "Hierarchical",
            "algorithm": "hierarchical",
            "params": {
                "n_clusters": 3,
                "max_polygons_per_cluster": 10,
                "min_polygons_per_cluster": 1
            }
        },
        {
            "name": "Buffer",
            "algorithm": "buffer",
            "params": {
                "radius": 5.0,  # 5km radius
                "max_polygons_per_cluster": 10,
                "min_polygons_per_cluster": 1
            }
        }
    ]
    
    print("=== Testing Clustering Algorithms ===\n")
    
    for algo in algorithms:
        print(f"Testing {algo['name']}...")
        
        test_data = {
            "algorithm": algo["algorithm"],
            "params": algo["params"],
            "polygons": test_polygons,
            "features": features,
            "weights": weights,
            "include_ai_insights": False
        }
        
        try:
            response = requests.post(url, json=test_data, timeout=30)
            print(f"  Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                clusters = result.get('clusters', [])
                polygons = result.get('polygons', [])
                print(f"  ✅ Success! Found {len(clusters)} clusters, {len(polygons)} polygons returned")
                
                # Show cluster details
                for i, cluster in enumerate(clusters[:3]):  # Show first 3 clusters
                    print(f"    Cluster {i+1}: Score={cluster.get('avg_suitability_score', 'N/A'):.2f}, Count={cluster.get('count', 'N/A')}")
                    
            else:
                print(f"  ❌ Error: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print("  ❌ Could not connect to backend. Is it running on port 5000?")
            return
        except Exception as e:
            print(f"  ❌ Error: {e}")
        
        print()  # Empty line between algorithms

if __name__ == "__main__":
    test_clustering_algorithms() 