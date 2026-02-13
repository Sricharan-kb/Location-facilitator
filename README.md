# 🌍 Geo-Suitability 

Geo-Suitability is a platform for AI-driven location optimization.  
It combines geospatial analytics, clustering algorithms, and weighted scoring to identify suitable locations for facilities, services, or product launches.

---

## 🚀 Features

- Upload and analyze spatial datasets  
- Feature selection with weighted scoring  
- Clustering (KMeans, DBSCAN, HDBSCAN, Buffer Analysis)  
- Interactive map visualization  
- Scenario-based re-scoring  
- AI-generated insights (Google Gemini)  
- Export results (CSV / GeoJSON)

---

## 🏗️ Tech Stack

**Frontend**
- React (Vite)
- Leaflet
- Tailwind CSS

**Backend**
- Flask (Python)
- Express (Node.js)

**AI / ML**
- scikit-learn
- HDBSCAN
- Google Gemini API

**Database (Optional)**
- MongoDB

---

## ⚡ Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/Location-facilitator.git
cd Location-facilitator

cd backend
python -m venv venv

source venv/bin/activate

venv\Scripts\activate

pip install -r requirements.txt
python cluster_api.py

cd frontend
npm install
npm run dev

