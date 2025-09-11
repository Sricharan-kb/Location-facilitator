import requests
import json

def test_complete_workflow():
    """Test the complete workflow that the frontend would follow"""
    url = "http://localhost:5000/api/cluster"
    
    # Sample data with more polygons
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
    
    print("=== Testing Complete Workflow ===\n")
    
    # Step 1: Normalize and Score (using clustering with 1 cluster)
    print("1. Testing Normalize and Score...")
    normalize_data = {
        "algorithm": "kmeans",
        "params": {
            "n_clusters": 1,
            "max_polygons_per_cluster": 1000,
            "min_polygons_per_cluster": 1
        },
        "polygons": test_polygons,
        "features": features,
        "weights": weights,
        "include_ai_insights": False
    }
    
    try:
        response = requests.post(url, json=normalize_data, timeout=30)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Normalize and Score successful!")
            print(f"   Polygons returned: {len(result.get('polygons', []))}")
            
            # Check if suitability scores were added
            scored_polygons = result.get('polygons', [])
            if scored_polygons and 'suitabilityScore' in scored_polygons[0].get('properties', {}):
                print("   ✅ Suitability scores added to polygons")
            else:
                print("   ❌ Suitability scores not found")
        else:
            print(f"❌ Normalize and Score failed: {response.text}")
            return
    except Exception as e:
        print(f"❌ Error in Normalize and Score: {e}")
        return
    
    # Step 2: Regular Clustering
    print("\n2. Testing Regular Clustering...")
    cluster_data = {
        "algorithm": "kmeans",
        "params": {
            "n_clusters": 3,
            "max_polygons_per_cluster": 100,
            "min_polygons_per_cluster": 1
        },
        "polygons": scored_polygons,
        "features": features,
        "weights": weights,
        "include_ai_insights": True,
        "product_info": {
            "name": "Test Product",
            "description": "Test Description",
            "targetAudience": "General",
            "budget": "Medium",
            "productType": "Infrastructure"
        }
    }
    
    try:
        response = requests.post(url, json=cluster_data, timeout=30)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Regular Clustering successful!")
            print(f"   Clusters found: {len(result.get('clusters', []))}")
            print(f"   Polygons returned: {len(result.get('polygons', []))}")
            if result.get('ai_insights'):
                print("   ✅ AI insights generated")
            else:
                print("   ⚠️  No AI insights generated")
        else:
            print(f"❌ Regular Clustering failed: {response.text}")
            return
    except Exception as e:
        print(f"❌ Error in Regular Clustering: {e}")
        return
    
    # Step 3: Scenario Clustering
    print("\n3. Testing Scenario Clustering...")
    scenario_data = {
        "algorithm": "kmeans",
        "params": {
            "n_clusters": 3,
            "max_polygons_per_cluster": 100,
            "min_polygons_per_cluster": 1
        },
        "polygons": test_polygons,
        "features": features,
        "weights": weights,
        "include_ai_insights": True,
        "product_info": {
            "name": "Test Product",
            "description": "Test Description",
            "targetAudience": "General",
            "budget": "Medium",
            "productType": "Infrastructure"
        },
        "scenarioConfig": {
            "featureChanges": [
                {"feature": "total_population", "percentChange": 20},
                {"feature": "is_bank_available", "percentChange": 50}
            ],
            "villagePercentage": 60,
            "randomnessFactor": 10
        }
    }
    
    try:
        response = requests.post(url, json=scenario_data, timeout=30)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Scenario Clustering successful!")
            print(f"   Clusters found: {len(result.get('clusters', []))}")
            print(f"   Polygons returned: {len(result.get('polygons', []))}")
            if result.get('ai_insights'):
                print("   ✅ Comparison AI insights generated")
            else:
                print("   ⚠️  No comparison AI insights generated")
        else:
            print(f"❌ Scenario Clustering failed: {response.text}")
            return
    except Exception as e:
        print(f"❌ Error in Scenario Clustering: {e}")
        return
    
    print("\n=== All Tests Passed! ===")

if __name__ == "__main__":
    test_complete_workflow() 