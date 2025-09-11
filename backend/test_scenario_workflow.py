import requests
import json

def test_scenario_workflow():
    print("🚀 Testing Streamlined Scenario Analysis Workflow")
    print("=" * 60)
    
    # Test data
    test_product_info = {
        "name": "Affordable Western Toilets",
        "description": "Modern, affordable western-style toilet solutions for rural areas",
        "category": "Sanitation",
        "price_range": "Affordable",
        "target_market": "Rural households"
    }
    
    # Sample polygons with original data
    test_polygons = [
        {
            "properties": {
                "shrid2": "village_001",
                "total_hhd_having_piped_water_con": 50,
                "is_bank_available": 1,
                "telephone_services": 1
            },
            "geometry": {
                "type": "Point",
                "coordinates": [77.2866, 20.9045]
            }
        },
        {
            "properties": {
                "shrid2": "village_002", 
                "total_hhd_having_piped_water_con": 30,
                "is_bank_available": 0,
                "telephone_services": 1
            },
            "geometry": {
                "type": "Point",
                "coordinates": [80.9259, 16.2073]
            }
        }
    ]
    
    print("📋 Step 1: Apply Scenario Analysis (Normalize & Score)")
    print("-" * 50)
    
    # Step 1: Apply scenario changes
    scenario_payload = {
        "features": ["total_hhd_having_piped_water_con", "is_bank_available", "telephone_services"],
        "weights": [0.4, 0.3, 0.3],
        "polygons": test_polygons,
        "featureChanges": [
            {"feature": "total_hhd_having_piped_water_con", "percentChange": 20},
            {"feature": "is_bank_available", "percentChange": 10}
        ],
        "villagePercentage": 100,
        "randomnessFactor": 5
    }
    
    try:
        response = requests.post(
            "http://127.0.0.1:5000/api/scenario-scoring",
            json=scenario_payload,
            timeout=30
        )
        
        if response.status_code == 200:
            scenario_result = response.json()
            print("✅ Scenario applied successfully!")
            print(f"   Modified {len(scenario_result['polygons'])} polygons")
            
            # Show before/after comparison
            print("\n📊 Before vs After Comparison:")
            for i, (original, modified) in enumerate(zip(test_polygons, scenario_result['polygons'])):
                print(f"   Village {i+1}:")
                print(f"     Water: {original['properties']['total_hhd_having_piped_water_con']} → {modified['properties']['total_hhd_having_piped_water_con']:.1f}")
                print(f"     Bank: {original['properties']['is_bank_available']} → {modified['properties']['is_bank_available']:.1f}")
                if 'suitabilityScore' in modified['properties']:
                    print(f"     Score: N/A → {modified['properties']['suitabilityScore']:.2f}")
            
            print("\n📋 Step 2: Run Clusters (No AI Insights)")
            print("-" * 50)
            
            # Step 2: Run clustering on modified data
            cluster_payload = {
                "features": ["total_hhd_having_piped_water_con", "is_bank_available", "telephone_services"],
                "weights": [0.4, 0.3, 0.3],
                "polygons": scenario_result['polygons'],
                "algorithm": "buffer",
                "buffer_radius_km": 50,
                "min_polygons_per_cluster": 1,
                "include_ai_insights": False  # No AI insights for scenario clustering
            }
            
            cluster_response = requests.post(
                "http://127.0.0.1:5000/api/scenario-cluster",
                json=cluster_payload,
                timeout=30
            )
            
            if cluster_response.status_code == 200:
                cluster_result = cluster_response.json()
                print("✅ Clustering completed successfully!")
                print(f"   Generated {len(cluster_result['clusters'])} clusters")
                
                # Show cluster results
                print("\n📊 Cluster Results:")
                for cluster in cluster_result['clusters']:
                    print(f"   Cluster {cluster['cluster']}: {cluster['count']} villages, Score: {cluster['avg_suitability_score']:.2f}")
                
                # Verify no AI insights were generated
                if 'ai_insights' not in cluster_result:
                    print("✅ No AI insights generated (as expected)")
                else:
                    print("⚠️  AI insights were generated (unexpected)")
                    
            else:
                print(f"❌ Clustering failed: {cluster_response.status_code}")
                
        else:
            print(f"❌ Scenario application failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Test Error: {str(e)}")

if __name__ == "__main__":
    test_scenario_workflow() 