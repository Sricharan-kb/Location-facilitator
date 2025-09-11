import requests
import os
import json

def test_gemini_models():
    """
    Test which Gemini models are available and working
    """
    print("🔍 Testing Available Gemini Models")
    print("=" * 50)
    
    # Check if API key is available
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("❌ GEMINI_API_KEY not found in environment variables")
        return
    
    print(f"✅ API Key found: {api_key[:10]}...")
    
    # List of models to test
    models_to_test = [
        "gemini-1.5-flash",
        "gemini-1.5-pro", 
        "gemini-1.0-pro",
        "gemini-pro",
        "gemini-1.5-flash-exp",
        "gemini-1.5-pro-exp"
    ]
    
    print("\n📋 Testing Models:")
    print("-" * 30)
    
    working_models = []
    
    for model in models_to_test:
        try:
            print(f"Testing {model}...", end=" ")
            
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
            headers = {
                "Content-Type": "application/json",
            }
            data = {
                "contents": [{
                    "parts": [{
                        "text": "Hello, this is a test message. Please respond with 'Model working' if you can see this."
                    }]
                }],
                "generationConfig": {
                    "temperature": 0.1,
                    "topK": 1,
                    "topP": 1,
                    "maxOutputTokens": 50,
                }
            }
            
            response = requests.post(
                url,
                headers=headers,
                json=data,
                params={"key": api_key},
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                if 'candidates' in result and len(result['candidates']) > 0:
                    print("✅ WORKING")
                    working_models.append(model)
                else:
                    print("❌ No response content")
            elif response.status_code == 404:
                print("❌ Model not found")
            elif response.status_code == 403:
                print("❌ Access denied")
            elif response.status_code == 429:
                print("❌ Rate limited")
            elif response.status_code == 503:
                print("❌ Service unavailable")
            else:
                print(f"❌ Error {response.status_code}: {response.text[:100]}")
                
        except requests.exceptions.Timeout:
            print("❌ Timeout")
        except requests.exceptions.RequestException as e:
            print(f"❌ Request error: {str(e)[:50]}")
        except Exception as e:
            print(f"❌ Unexpected error: {str(e)[:50]}")
    
    print("\n📊 Results Summary:")
    print("=" * 30)
    print(f"Total models tested: {len(models_to_test)}")
    print(f"Working models: {len(working_models)}")
    
    if working_models:
        print("\n✅ Working Models:")
        for i, model in enumerate(working_models, 1):
            print(f"  {i}. {model}")
    else:
        print("\n❌ No working models found")
    
    print("\n💡 Recommendations:")
    if "gemini-1.5-flash" in working_models:
        print("• Use gemini-1.5-flash as primary model (fastest)")
    elif "gemini-1.5-pro" in working_models:
        print("• Use gemini-1.5-pro as primary model (most capable)")
    elif "gemini-1.0-pro" in working_models:
        print("• Use gemini-1.0-pro as primary model")
    else:
        print("• Check API key and permissions")
        print("• Verify billing is enabled for Gemini API")

if __name__ == "__main__":
    test_gemini_models() 