import requests
import json

def enhanced_test():
    print("🚀 Testing Enhanced AI Analysis with Marketing Strategies")
    print("=" * 60)
    
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
        },
        {
            "cluster": 229,
            "avg_suitability_score": 8.88,
            "count": 3,
            "centroid": [80.9259, 16.2073],
            "predicted_location": "Andhra Pradesh Province",
            "nearest_city": "Hyderabad (120.5 km)"
        },
        {
            "cluster": 1,
            "avg_suitability_score": 8.87,
            "count": 5,
            "centroid": [76.9119, 8.6716],
            "predicted_location": "Kerala Province",
            "nearest_city": "Kochi (25.8 km)"
        }
    ]
    
    payload = {
        "clusters": test_clusters,
        "features": ["total_hhd_having_piped_water_con", "is_bank_available", "telephone_services"],
        "algorithm": "buffer",
        "scenario_clusters": [],
        "include_ai_insights": True,
        "product_info": test_product_info
    }
    
    print("📤 Testing Enhanced Analysis for: Affordable Western Toilets")
    print("🎯 Includes: Marketing Strategies, Pricing, Business Interventions")
    print("🔄 Model fallback system with comprehensive business analysis...")
    print()
    
    try:
        response = requests.post(
            "http://127.0.0.1:5000/api/generate-ai-insights",
            json=payload,
            timeout=120
        )
        
        print(f"📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Success! Enhanced AI Analysis Generated!")
            print()
            
            if 'ai_insights' in result:
                insights = result['ai_insights']
                print("🤖 Enhanced AI Business Insights:")
                print("=" * 50)
                print(insights)
            
            if 'error' in result:
                print("⚠️  Note: Used enhanced fallback analysis")
                
        else:
            print(f"❌ API Error: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Test Error: {str(e)}")

if __name__ == "__main__":
    enhanced_test() 