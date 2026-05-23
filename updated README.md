# 🌍 Geo-Suitability: AI-Powered Location Optimization

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.8+-green.svg)](https://www.python.org/)
[![Node](https://img.shields.io/badge/Node-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)

**Geo-Suitability** is an innovative, AI-driven application that helps businesses, governments, and organizations identify optimal sites for facilities, services, or product rollouts. The platform integrates spatial data, advanced clustering algorithms, and artificial intelligence to deliver actionable, data-backed insights for strategic decision-making.

---

## 🚀 Features

- **📊 Advanced Data Handling** - Upload datasets in CSV or Parquet formats
- **⚖️ Feature Weighting & Selection** - AI dynamically selects and prioritizes features.
- **🤖 AI-Powered Clustering** - Apply advanced algorithms including DBSCAN, HDBSCAN.
- **🗺️ Interactive & Split Visualization** - Explore results on intuitive Leaflet-based maps. Compare different clustering scenarios side-by-side using the Split Map Component.
- **🔮 Scenario Analysis** - Simulate "What-If" scenarios to assess impacts of future changes.
- **💡 Dual AI Insights** - Generate business-oriented recommendations using Google Gemini AI, or run local models using Ollama.
- **📤 Multi-Format Export** - Download comprehensive PDF reports, images, and tabular data summaries (powered by jsPDF and html-to-image).

---

## 🏗️ Architecture

Geo-Suitability uses a clean client-server architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                  │
│                      Port 5173 (dev)                        │
└────────────┬──────────────────────────────┬─────────────────┘
             │                              │
             ▼                              ▼
┌────────────────────────────────────────────────────────────┐
│                  Flask Backend 🐍                          │
│                  Port 5000                                 │
│                                                            │
│ • Clustering (scikit-learn, hdbscan)                       │
│ • Fast Data Processing (pandas, numpy, pyarrow)            │
│ • AI Insights (Gemini via google-generativeai, Ollama)     │
│ • Scenario Analysis & Validation (pydantic)                │
└────────────────────────────────────────────────────────────┘
```

### Key Technologies
* **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Shadcn UI, React-Leaflet, Recharts, Parquet-WASM.
* **Backend:** Python, Flask, Pandas, Scikit-Learn, HDBSCAN, PyArrow, Pydantic, Google Generative AI, Ollama.

---

## 📋 Prerequisites

- **Python** 3.8 or higher
- **Node.js** 18+ and npm
- **Google Gemini API Key** (for Gemini AI insights)
- **Ollama** (optional, for local AI insights)

---

## ⚡ Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/Location-facilitator.git
cd Location-facilitator
```

### 2. Setup Flask Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp env.example .env
# Edit .env and add your GEMINI_API_KEY (and configure Ollama if needed)

# Run Flask backend
# On Windows, you can also use start_backend.bat or start_production.bat
python cluster_api.py
```

The Flask backend will start on `http://localhost:5000`

### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will open at `http://localhost:5173` (or next available port).

---

## 🔧 Configuration (.env)

Create a `.env` file in the `backend/` directory (use `env.example` as template):

```bash
# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True
PORT=5000
HOST=127.0.0.1

# CORS Configuration
ALLOWED_ORIGINS=*

# Google Gemini AI Configuration
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-2.0-flash-exp

# Ollama Configuration (Optional Local LLM)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3

# Application Settings
MAX_CONTENT_LENGTH=16777216
```

### AI/LLM API Integration

The application supports dual LLM providers:
1. **Google Gemini (Cloud):** Set `GEMINI_API_KEY` in `.env`.
2. **Ollama (Local):** Run Ollama locally and specify the model name in your configuration to generate offline, privacy-first insights.

---

## 📚 API Documentation

### Flask Backend (Port 5000)

#### Clustering Endpoints

- **POST** `/api/cluster` - Perform clustering analysis
  ```json
  {
    "algorithm": "dbscan",
    "features": ["population", "income"],
    "weights": {"population": 0.6, "income": 0.4},
    "params": {"eps": 0.5, "min_samples": 5}
  }
  ```

- **POST** `/api/scenario-scoring` - Apply scenario changes to features
- **POST** `/api/scenario-cluster` - Cluster with scenario data
- **POST** `/api/buffer-cluster` - Perform buffer-based clustering

#### AI Insights

- **POST** `/api/generate-ai-insights` - Generate AI-powered insights using either Gemini or Ollama.

---

## 🛠️ Development Structure

```
Location-facilitator/
├── frontend/                # React frontend application
│   ├── src/
│   │   ├── components/     # UI Components (Shadcn), Analysis, Map, DataUpload
│   │   ├── pages/          # Page components
│   │   ├── api/            # Client API interaction logic
│   │   ├── hooks/          # Custom React hooks
│   │   └── utils/          # Export Utils (PDF, Image) & Clustering Utils
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                # Python Flask backend
│   ├── cluster_api.py      # Flask API (clustering & AI via Gemini/Ollama)
│   ├── config.py           # Flask configuration
│   ├── feature_descriptions.py
│   ├── requirements.txt    # Python dependencies (includes pyarrow, ollama, hdbscan)
│   ├── start_backend.bat   # Windows Dev Startup Script
│   └── start_production.bat# Windows Prod Startup Script
│
├── DEPLOYMENT.md           # Deployment guide
├── LICENSE
└── README.md
```

---

## 🎯 Use Cases

- **🏢 Businesses** - Select optimal locations for warehouses, retail stores, or EV charging stations
- **🏛️ Governments** - Plan hospitals, schools, or public infrastructure strategically
- **🚀 Startups** - Launch products with maximum market reach and impact
- **📊 Analysts** - Perform high-performance spatial analysis on large datasets using Parquet/Arrow.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style (PEP 8 for Python, ESLint for JavaScript/TypeScript)
- Write clear commit messages
- Add tests for new features

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
