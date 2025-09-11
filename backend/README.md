# Geo Suitability Solver Backend

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up Gemini API (for AI-powered insights):
   - Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Set the environment variable:
   ```bash
   export GEMINI_API_KEY="your-api-key-here"
   ```
   - Or create a `.env` file in the backend directory:
   ```
   GEMINI_API_KEY=your-api-key-here
   ```

3. Run the backend:
```bash
python cluster_api.py
```

## API Endpoints

### Core Endpoints
- `POST /api/cluster` - Perform clustering analysis
- `POST /api/scenario-scoring` - Apply scenario changes to features
- `POST /api/scenario-cluster` - Perform clustering on scenario data
- `POST /api/buffer-cluster` - Perform buffer-based clustering

### AI Insights
- `POST /api/generate-ai-insights` - Generate AI-powered cluster insights using Gemini API

## AI-Powered Insights

The system now includes AI-generated insights for clusters using Google's Gemini API. These insights provide:

1. **Why clusters formed** - Explanation of spatial and feature-based logic
2. **Business implications** - What clusters tell us about geographic areas
3. **Strategic recommendations** - Actions to take based on cluster analysis
4. **Risk assessment** - Concerns or areas needing attention
5. **Opportunity identification** - Best opportunity clusters

### How to Use AI Insights

1. **Automatic**: Set `include_ai_insights: true` in clustering requests
2. **Manual**: Call `/api/generate-ai-insights` endpoint separately
3. **Frontend**: Use the "Generate AI Insights" button in the Insights tab

### Troubleshooting

If you encounter model errors:

1. **Check available models**: Visit `http://localhost:5000/api/debug-models`
2. **Verify API key**: Ensure your Gemini API key is valid and has proper permissions
3. **Check model availability**: The system will automatically try different model versions
4. **Update API key**: Get a fresh API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Example AI Insights Response

```json
{
  "ai_insights": "**Why these specific clusters formed:**\nThe clustering algorithm identified distinct geographic patterns based on...\n\n**Business implications:**\nThese clusters represent different market segments with varying...\n\n**Strategic recommendations:**\nFocus intervention efforts on Cluster 1 due to its high suitability...",
  "clusters_analyzed": 5,
  "algorithm_used": "dbscan"
}
```

## Features

- Spatial clustering (DBSCAN, KMeans, HDBSCAN, Hierarchical, Buffer-based)
- Suitability scoring with customizable weights
- Scenario analysis with feature modifications
- AI-powered insights using Gemini API
- Comprehensive cluster statistics and comparisons 