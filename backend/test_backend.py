import requests
import json

def test_cluster_endpoint():
    """Test the cluster endpoint with minimal data"""
    url = "http://localhost:5000/api/cluster"
    
    # Test data
    test_data = {
        "algorithm": "kmeans",
        "params": {
            "n_clusters": 1,
            "max_polygons_per_cluster": 1000,
            "min_polygons_per_cluster": 1
        },
        "polygons": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [0, 0]
                },
                "properties": {
                    "test": 1,
                    "feature1": 10,
                    "feature2": 20
                }
            }
        ],
        "features": ["feature1", "feature2"],
        "weights": [1, 1],
        "include_ai_insights": False
    }
    
    try:
        print("Testing cluster endpoint...")
        response = requests.post(url, json=test_data, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Cluster endpoint working!")
            print(f"Clusters found: {len(result.get('clusters', []))}")
            print(f"Polygons returned: {len(result.get('polygons', []))}")
        else:
            print(f"❌ Error: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to backend. Is it running on port 5000?")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_scenario_clustering():
    """Test scenario clustering with scenario config"""
    url = "http://localhost:5000/api/cluster"
    
    # Test data with scenario
    test_data = {
        "algorithm": "kmeans",
        "params": {
            "n_clusters": 1,
            "max_polygons_per_cluster": 1000,
            "min_polygons_per_cluster": 1
        },
        "polygons": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [0, 0]
                },
                "properties": {
                    "test": 1,
                    "feature1": 10,
                    "feature2": 20
                }
            }
        ],
        "features": ["feature1", "feature2"],
        "weights": [1, 1],
        "include_ai_insights": False,
        "scenarioConfig": {
            "featureChanges": [
                {"feature": "feature1", "percentChange": 20},
                {"feature": "feature2", "percentChange": -10}
            ],
            "villagePercentage": 50,
            "randomnessFactor": 5
        }
    }
    
    try:
        print("\nTesting scenario clustering...")
        response = requests.post(url, json=test_data, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Scenario clustering working!")
            print(f"Clusters found: {len(result.get('clusters', []))}")
        else:
            print(f"❌ Error: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to backend. Is it running on port 5000?")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_cluster_endpoint()
    test_scenario_clustering() 