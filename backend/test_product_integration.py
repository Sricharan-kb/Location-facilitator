import requests
import json
import time

# Test the product information integration
def test_product_integration():
    print("🧪 Testing Product Information Integration")
    print("=" * 50)
    
    # Test data
    test_product_info = {
        "name": "Affordable Western Toilets",
        "description": "Modern, affordable western-style toilet solutions for rural areas",
        "category": "Sanitation",
        "price_range": "Affordable",
        "target_market": "Rural households"
    }
    
    # Test clusters data
    test_clusters = [
        {
            "cluster": 233,
            "avg_suitability_score": 8.90,
            "count": 3,
            "centroid": [77.2866, 20.9045],
            "predicted_location": "Maharashtra/Gujarat Province",
            "nearest_city": "Mumbai (45.2 km)"
        },
        {
            "cluster": 229,
            "avg_suitability_score": 8.88,
            "count": 3,
            "centroid": [80.9259, 16.2073],
            "predicted_location": "Andhra Pradesh Province",
            "nearest_city": "Hyderabad (120.5 km)"
        }
    ]
    
    # Test API call
    payload = {
        "clusters": test_clusters,
        "features": ["total_hhd_having_piped_water_con", "is_bank_available"],
        "algorithm": "buffer",
        "scenario_clusters": [],
        "include_ai_insights": True,
        "product_info": test_product_info
    }
    
    print("📤 Sending request with product information:")
    print(f"   Product: {test_product_info['name']}")
    print(f"   Category: {test_product_info['category']}")
    print(f"   Target Market: {test_product_info['target_market']}")
    print()
    
    try:
        print("🔄 Making API request...")
        response = requests.post(
            "http://127.0.0.1:5000/api/generate-ai-insights",
            json=payload,
            timeout=60
        )
        
        print(f"📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ API Response Received Successfully!")
            print("📊 Response Keys:", list(result.keys()))
            
            if 'ai_insights' in result:
                if isinstance(result['ai_insights'], str):
                    print("🤖 AI Insights Generated:")
                    print("-" * 30)
                    insights = result['ai_insights']
                    if len(insights) > 500:
                        print(insights[:500] + "...")
                    else:
                        print(insights)
                else:
                    print("🤖 AI Insights Object:", result['ai_insights'])
            
            if 'error' in result:
                print("⚠️  Error in response:", result['error'])
                
        else:
            print(f"❌ API Error: {response.status_code}")
            print("Response text:", response.text)
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Backend server not running")
        print("   Please start the backend with: python cluster_api.py")
    except requests.exceptions.Timeout:
        print("❌ Timeout Error: Request took too long")
    except Exception as e:
        print(f"❌ Test Error: {str(e)}")

def test_backend_health():
    print("\n🏥 Testing Backend Health")
    print("=" * 30)
    
    try:
        response = requests.get("http://127.0.0.1:5000/api/debug-models", timeout=10)
        print(f"Health Check Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Backend is running and healthy!")
            return True
        else:
            print("❌ Backend responded with error")
            return False
    except Exception as e:
        print(f"❌ Backend health check failed: {str(e)}")
        return False

if __name__ == "__main__":
    # First check if backend is running
    if test_backend_health():
        # Wait a moment for backend to be ready
        time.sleep(2)
        test_product_integration()
    else:
        print("\n💡 Please start the backend first:")
        print("   cd geo-suitability-solver-main/backend")
        print("   python cluster_api.py") 