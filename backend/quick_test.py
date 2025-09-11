import requests
import json

def quick_test():
    print("🚀 Testing Improved Model Fallback System")
    print("=" * 50)
    
    # Test data
    test_product_info = {
        "name": "Affordable Western Toilets",
        "description": "Modern, affordable western-style toilet solutions for rural areas",
        "category": "Sanitation",
        "price_range": "Affordable",
        "target_market": "Rural households"
    }
    
    test_clusters = [
        {
            "cluster": 233,
            "avg_suitability_score": 8.90,
            "count": 3,
            "centroid": [77.2866, 20.9045],
            "predicted_location": "Maharashtra/Gujarat Province",
            "nearest_city": "Mumbai (45.2 km)"
        }
    ]
    
    payload = {
        "clusters": test_clusters,
        "features": ["total_hhd_having_piped_water_con", "is_bank_available"],
        "algorithm": "buffer",
        "scenario_clusters": [],
        "include_ai_insights": True,
        "product_info": test_product_info
    }
    
    print("📤 Testing with product: Affordable Western Toilets")
    print("🔄 Model fallback system will try multiple models...")
    print()
    
    try:
        response = requests.post(
            "http://127.0.0.1:5000/api/generate-ai-insights",
            json=payload,
            timeout=90
        )
        
        print(f"📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Success! Model fallback system worked!")
            
            if 'ai_insights' in result:
                insights = result['ai_insights']
                print("🤖 AI Insights Generated:")
                print("-" * 30)
                print(insights[:300] + "..." if len(insights) > 300 else insights)
            
            if 'error' in result:
                print("⚠️  Note: Used fallback analysis due to API issues")
                
        else:
            print(f"❌ API Error: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Test Error: {str(e)}")

if __name__ == "__main__":
    quick_test() 