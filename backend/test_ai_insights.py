import requests
import json

def test_ai_insights():
    # Simple test payload
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
        'scenario_clusters': [
            {
                'cluster': 1, 
                'avg_suitability_score': 0.9, 
                'count': 10,
                'centroid': [78.9629, 20.5937]
            }
        ]
    }
    
    try:
        print("Testing AI insights generation...")
        response = requests.post('http://127.0.0.1:5000/api/generate-ai-insights', json=payload)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Success!")
            print(f"Algorithm: {data.get('algorithm_used')}")
            print(f"Clusters analyzed: {data.get('clusters_analyzed')}")
            print(f"Enhanced clusters: {len(data.get('enhanced_clusters', []))}")
            print(f"Enhanced scenario clusters: {len(data.get('enhanced_scenario_clusters', []))}")
            print(f"AI insights length: {len(data.get('ai_insights', ''))}")
        else:
            print(f"❌ Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Exception: {str(e)}")

if __name__ == "__main__":
    test_ai_insights() 