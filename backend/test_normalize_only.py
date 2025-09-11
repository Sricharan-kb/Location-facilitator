import requests
import json

def test_normalize_score_only():
    """Test the new normalize-score endpoint that only does normalization without clustering"""
    url = "http://localhost:5000/api/normalize-score"
    
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
        }
    ]
    
    features = ["total_population", "total_hhd", "is_bank_available", "is_atm_available"]
    weights = [1, 1, 1, 1]
    
    test_data = {
        "polygons": test_polygons,
        "features": features,
        "weights": weights
    }
    
    try:
        print("Testing normalize-score endpoint...")
        print(f"Input polygons: {len(test_polygons)}")
        print(f"Features: {features}")
        print(f"Weights: {weights}")
        
        response = requests.post(url, json=test_data, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Normalize-score successful!")
            print(f"Output polygons: {len(result.get('polygons', []))}")
            
            # Check if suitability scores were added
            scored_polygons = result.get('polygons', [])
            if scored_polygons and 'suitabilityScore' in scored_polygons[0].get('properties', {}):
                print("✅ Suitability scores added to polygons")
                
                # Show some sample scores
                for i, polygon in enumerate(scored_polygons[:3]):
                    score = polygon.get('properties', {}).get('suitabilityScore', 'N/A')
                    print(f"   Polygon {i+1}: Score = {score}")
            else:
                print("❌ Suitability scores not found")
                
            print(f"Message: {result.get('message', 'No message')}")
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
    test_normalize_score_only() 