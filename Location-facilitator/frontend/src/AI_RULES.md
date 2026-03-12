markdown_content = """
# 🧠 AI Rules for Location Suitability Web App

## 🗂️ Purpose
A web-based decision-support tool that helps identify the **best-suited locations** for deploying a product based on spatial and socioeconomic features using **user-defined criteria**. It supports **uploading spatial datasets**, **assigning feature weights (via AHP)**, **clustering**, **scenario analysis**, and **exportable insights**.

---

## 🔄 Workflow

### 1. **Data Upload & Ingestion**
- Accept file formats: `.geojson`, `.parquet`, `.csv`, `.shp`
- Auto-read uploaded file and preview columns
- Detect spatial geometry columns (Point/Polygon)
- Sanitize and cache user session

### 2. **Feature Selection & Weight Assignment**
- User selects relevant features (categorical or numerical)
- **Use Analytic Hierarchy Process (AHP)** to:
  - Let users do pairwise comparisons (feature importance)
  - Normalize weights based on eigenvector consistency check
  - Display consistency ratio (CR) and flag if CR > 0.1
- Feature scoring based on raw values × AHP weights

---

## 📈 Clustering & Suitability Scoring

### Clustering Options:
- Algorithms: KMeans, DBSCAN, HDBSCAN, Agglomerative
- Auto-suggest best algorithm using PCA or Feature Importance
- User defines:
  - No. of clusters / radius (for DBSCAN)
  - Features to include in clustering
- Visual output: cluster-colored map + summary stats

### Suitability Score:
- Calculated per polygon/point using weighted sum of feature scores
- Display Top-N best locations using slider or filter

---

## 🔁 Scenario Analysis
- User selects a **feature to simulate change** (e.g., 20% increase in 'piped water access')
- Recalculate suitability scores
- Show **Before vs After**:
  - Maps
  - Score distribution plots
  - Top-N locations change
  - Summary statistics and insights

---

## 🧠 Smart Features

### Auto-Suggestions:
- Feature reduction using PCA
- Recommend weights based on correlation with top-performing locations
- Identify redundant or highly correlated features

### Chatbot Assistant:
- Embedded chatbot to guide users:
  - “How to upload?”
  - “What do weights mean?”
  - “What clustering should I use?”
- Powered by rule-based or LLM backend (modular)

---

## 💾 Save & Resume Sessions
- Allow users to:
  - Save session state to cloud DB (MongoDB)
  - Reload session later
  - Export results as `.json` or `.xlsx`

---

## 🔗 Database Integration
- Optional MongoDB or any cloud database
- Provide field to enter Mongo connection string
- Store:
  - User sessions
  - Uploaded datasets metadata
  - Final recommendations

---

## 📤 Export Options
- **Maps**: Export as PNG, PDF or GeoJSON
- **Reports**: Export Top-N summary, Feature impacts, Suitability charts
- **Cluster comparisons**: Compare 2 clusters side-by-side (parallel radar plots, bar charts)

---

## 📊 Visualization Tools
- Folium/Leaflet for maps
- Altair/Plotly for dynamic charts
- Side-by-side comparison views for clusters or scenarios

---

## 🧩 Tech Stack Suggestions
- **Frontend**: Streamlit / Flet / React
- **Backend**: FastAPI / Flask
- **DB**: MongoDB / PostgreSQL (PostGIS for spatial)
- **AI Tools**: Scikit-learn (PCA, clustering), pyAHP, Pandas, Shapely

---

## ✅ Final Output
- Ranked list of best locations
- Feature-wise impact breakdown
- Cluster insights
- Interactive scenario simulation
- Exportable visuals + reports
"""
