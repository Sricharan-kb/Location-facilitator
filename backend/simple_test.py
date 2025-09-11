import requests

# Simple test
try:
    print("Testing basic AI insights...")
    payload = {
        'clusters': [{'cluster': 1, 'avg_suitability_score': 0.8, 'count': 10}],
        'features': ['test_feature'],
        'algorithm': 'buffer'
    }
    
    response = requests.post('http://127.0.0.1:5000/api/generate-ai-insights', json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text[:500]}")
    
except Exception as e:
    print(f"Error: {e}") 