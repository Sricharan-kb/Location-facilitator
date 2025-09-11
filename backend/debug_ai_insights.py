import requests
import json

def test_ai_insights():
    print("Testing AI insights endpoint...")
    
    # Test payload
    payload = {
        'clusters': [
            {
                'cluster': 1,
                'avg_suitability_score': 8.5,
                'count': 10,
                'centroid': [78.9629, 20.5937]  # India coordinates
            },
            {
                'cluster': 2,
                'avg_suitability_score': 7.8,
                'count': 8,
                'centroid': [77.2090, 28.6139]  # Delhi coordinates
            }
        ],
        'features': ['test_feature1', 'test_feature2'],
        'algorithm': 'buffer',
        'scenario_clusters': [
            {
                'cluster': 1,
                'avg_suitability_score': 9.2,
                'count': 10,
                'centroid': [78.9629, 20.5937]
            },
            {
                'cluster': 2,
                'avg_suitability_score': 8.1,
                'count': 8,
                'centroid': [77.2090, 28.6139]
            }
        ]
    }
    
    try:
        print("Sending request to AI insights endpoint...")
        response = requests.post('http://127.0.0.1:5000/api/generate-ai-insights', json=payload, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {response.headers}")
        
        if response.status_code == 200:
            data = response.json()
            print("Success! Response data:")
            print(json.dumps(data, indent=2))
        else:
            print(f"Error! Response text: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("Connection Error: Backend server is not running")
    except requests.exceptions.Timeout:
        print("Timeout Error: Request took too long")
    except Exception as e:
        print(f"Unexpected error: {e}")

if __name__ == "__main__":
    test_ai_insights() 