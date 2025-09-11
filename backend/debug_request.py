import requests
import json

def test_frontend_request_format():
    """Test the exact request format that the frontend sends"""
    url = "http://localhost:5000/api/cluster"
    
    # This is the exact format the frontend sends
    test_data = {
        "algorithm": "kmeans",
        "params": {
            "n_clusters": 2,  # Reduced from 5 to 2 to match data size
            "radius": 10,
            "dbscan_eps": 10,
            "dbscan_min_samples": 1,  # Reduced from 3 to 1
            "max_polygons_per_cluster": 50,
            "min_polygons_per_cluster": 1,  # Reduced from 2 to 1
            "spiral_radius": 0.1,
            "spiral_spacing": 0.05
        },
        "polygons": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [77.2090, 28.6139]  # Delhi coordinates
                },
                "properties": {
                    "total_population": 1000,
                    "total_hhd": 200,
                    "is_bank_available": 1,
                    "is_atm_available": 1
                }
            },
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [72.8777, 19.0760]  # Mumbai coordinates
                },
                "properties": {
                    "total_population": 1500,
                    "total_hhd": 300,
                    "is_bank_available": 1,
                    "is_atm_available": 1
                }
            }
        ],
        "features": ["total_population", "total_hhd", "is_bank_available", "is_atm_available"],
        "weights": [1, 1, 1, 1],
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
        print("Testing frontend request format...")
        print(f"Request data keys: {list(test_data.keys())}")
        print(f"Algorithm: {test_data['algorithm']}")
        print(f"Params keys: {list(test_data['params'].keys())}")
        print(f"Features: {test_data['features']}")
        print(f"Polygons count: {len(test_data['polygons'])}")
        
        response = requests.post(url, json=test_data, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Request successful!")
            print(f"Clusters found: {len(result.get('clusters', []))}")
            print(f"Polygons returned: {len(result.get('polygons', []))}")
            if result.get('ai_insights'):
                print("AI insights generated")
        else:
            print(f"❌ Error: {response.text}")
            try:
                error_data = response.json()
                print(f"Error details: {error_data}")
            except:
                print("Could not parse error response as JSON")
                
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to backend. Is it running on port 5000?")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_frontend_request_format() 