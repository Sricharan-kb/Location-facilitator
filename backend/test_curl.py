import requests
import json

def test_ai_insights_endpoint():
    """Test the AI insights endpoint directly"""
    
    # Test payload
    payload = {
        'clusters': [
            {
                'cluster': 1, 
                'avg_suitability_score': 0.8, 
                'count': 10,
                'centroid': [78.9629, 20.5937]
            }
        ],
        'features': ['test_feature'],
        'algorithm': 'buffer',
        'scenario_clusters': None
    }
    
    try:
        print("Testing AI insights endpoint...")
        print(f"Server URL: http://127.0.0.1:5000/api/generate-ai-insights")
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(
            'http://127.0.0.1:5000/api/generate-ai-insights', 
            json=payload,
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ SUCCESS!")
            print(f"Response: {json.dumps(data, indent=2)}")
        else:
            print(f"❌ Error: {response.text}")
            
    except requests.exceptions.ConnectionError as e:
        print(f"❌ Connection Error: {e}")
    except requests.exceptions.Timeout as e:
        print(f"❌ Timeout Error: {e}")
    except Exception as e:
        print(f"❌ Exception: {e}")

if __name__ == "__main__":
    test_ai_insights_endpoint() 