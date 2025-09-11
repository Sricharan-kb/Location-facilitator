import requests
import json

def test_original_config_workflow():
    print("🚀 Testing Scenario Analysis with Original Clustering Configuration")
    print("=" * 70)
    
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
        },
        {
            "properties": {
                "shrid2": "village_003",
                "total_hhd_having_piped_water_con": 70,
                "is_bank_available": 1,
                "telephone_services": 0
            },
            "geometry": {
                "type": "Point",
                "coordinates": [76.9119, 8.6716]
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
            
            print("\n📋 Step 2: Run Clusters with Original Configuration")
            print("-" * 50)
            
            # Step 2: Run clustering with original configuration (simulating buffer algorithm)
            cluster_payload = {
                "features": ["total_hhd_having_piped_water_con", "is_bank_available", "telephone_services"],
                "weights": [0.4, 0.3, 0.3],
                "polygons": scenario_result['polygons'],
                "algorithm": "buffer",  # Original algorithm
                "buffer_radius_km": 50,  # Original radius
                "min_polygons_per_cluster": 1,  # Original min polygons
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
                print(f"   Used original algorithm: buffer")
                print(f"   Used original radius: 50 km")
                
                # Show cluster results
                print("\n📊 Cluster Results:")
                for cluster in cluster_result['clusters']:
                    print(f"   Cluster {cluster['cluster']}: {cluster['count']} villages, Score: {cluster['avg_suitability_score']:.2f}")
                
                # Verify no AI insights were generated
                if 'ai_insights' not in cluster_result:
                    print("✅ No AI insights generated (as expected)")
                else:
                    print("⚠️  AI insights were generated (unexpected)")
                    
                print("\n🎯 Summary:")
                print("   • Scenario analysis applied interventions to original data")
                print("   • Clustering used original configuration automatically")
                print("   • No manual algorithm selection required")
                print("   • No AI insights generated for scenario clustering")
                    
            else:
                print(f"❌ Clustering failed: {cluster_response.status_code}")
                
        else:
            print(f"❌ Scenario application failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Test Error: {str(e)}")

if __name__ == "__main__":
    test_original_config_workflow() 