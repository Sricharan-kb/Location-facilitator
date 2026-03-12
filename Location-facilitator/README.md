# 🌍 Geo-Suitability: AI-Powered Location Optimization

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.8+-green.svg)](https://www.python.org/)
[![Node](https://img.shields.io/badge/Node-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)

**Geo-Suitability** is an innovative, AI-driven application that helps businesses, governments, and organizations identify optimal sites for facilities, services, or product rollouts. The platform integrates spatial data, advanced clustering algorithms, and artificial intelligence to deliver actionable, data-backed insights for strategic decision-making.

![Geo-Suitability Platform](https://via.placeholder.com/800x400/4A90E2/FFFFFF?text=Geo-Suitability+Platform)

---

## 🚀 Features

- **📊 Data Upload & Enrichment** - Upload CSV datasets with geographic coordinates and custom attributes
- **⚖️ Feature Weighting** - Dynamically select and prioritize factors (demographics, traffic, land use, etc.)
- **🤖 AI-Powered Clustering** - Apply advanced algorithms (DBSCAN, KMeans, HDBSCAN, Hierarchical, Buffer Analysis)
- **🗺️ Interactive Visualization** - Explore results on intuitive Leaflet-based maps with zoom and filtering
- **🔮 Scenario Analysis** - Simulate "What-If" scenarios to assess impacts of future changes
- **💡 AI Insights** - Generate business-oriented recommendations using Google Gemini AI
- **📤 Multi-Format Export** - Download results as GeoJSON, Excel, CSV, or PDF reports

---

## 🏗️ Architecture

Geo-Suitability uses a **dual-server microservices architecture**:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                  │
│                      Port 8080 (dev)                        │
└────────────┬──────────────────────────────┬─────────────────┘
             │                              │
             ▼                              ▼
┌────────────────────────┐    ┌────────────────────────────┐
│   Flask Backend 🐍     │    │  Express Backend 🟢        │
│   Port 5000            │    │  Port 4000                 │
│                        │    │                            │
│ • Clustering           │    │ • MongoDB Connection       │
│ • Feature Scoring      │    │ • Session Management       │
│ • AI Insights (Gemini) │    │ • Dataset Persistence      │
│ • Scenario Analysis    │    │ • Village Data API         │
└────────────────────────┘    └───────────┬────────────────┘
                                           │
                                           ▼
                                  ┌────────────────┐
                                  │   MongoDB 🍃   │
                                  │   Port 27017   │
                                  └────────────────┘
```

### Backend Components

1. **Flask API** (`backend/cluster_api.py`) - Computational & Analysis Engine
   - Clustering algorithms (DBSCAN, KMeans, HDBSCAN, etc.)
   - Feature normalization and scoring
   - AI-powered insights via Google Gemini
   - Scenario simulation

2. **Express API** (`backend/index.js`) - Data Persistence Layer (Optional)
   - MongoDB connection and management
   - Session storage and retrieval
   - Dataset metadata handling

---

## 📋 Prerequisites

- **Python** 3.8 or higher
- **Node.js** 18+ and npm
- **MongoDB** (optional, for persistence features)
- **Google Gemini API Key** (for AI insights)

---

## ⚡ Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/Location-facilitator.git
cd Location-facilitator
```

### 2. Setup Flask Backend (Required)

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp env.example .env
# Edit .env and add your GEMINI_API_KEY

# Run Flask backend
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

The frontend will open at `http://localhost:8080` (or next available port)

### 4. Setup Express Backend (Optional - for MongoDB persistence)

```bash
cd backend

# Install Node.js dependencies
npm install

# Ensure MongoDB is configured in .env
# MONGO_URL=mongodb://localhost:27017
# DB_NAME=toilet_launch

# Run Express backend
npm start
```

The Express backend will start on `http://localhost:4000`

---

## 🔧 Configuration

### Environment Variables

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
# Get your API key from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-2.0-flash-exp

# Application Settings
MAX_CONTENT_LENGTH=16777216
ENABLE_CACHE=True
CACHE_TTL=3600

# MongoDB Configuration (for Express backend)
MONGO_URL=mongodb://localhost:27017
DB_NAME=toilet_launch
NODE_PORT=4000
```

### AI/LLM API Integration

The application uses **Google Gemini API** for generating AI-powered insights:

1. **Get API Key**: Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. **Add to Environment**: Set `GEMINI_API_KEY` in `.env`
3. **Configure Model** (optional): Change `GEMINI_MODEL` to use different Gemini versions

**Alternative LLM Providers**: To use other LLM APIs (OpenAI, Anthropic, etc.), you'll need to modify the AI insight generation logic in `backend/cluster_api.py`.

---

## 🗄️ Database Setup (Optional)

MongoDB is used for persisting sessions, datasets, and village data. It's **optional** - the core clustering functionality works without it.

### Local MongoDB

```bash
# Install MongoDB Community Edition
# Visit: https://www.mongodb.com/try/download/community

# Start MongoDB service
# Windows:
net start MongoDB
# Linux:
sudo systemctl start mongod
# Mac:
brew services start mongodb-community
```

### MongoDB Atlas (Cloud)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get connection string
4. Update `MONGO_URL` in `.env`:
   ```
   MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/
   ```

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

- **POST** `/api/generate-ai-insights` - Generate AI-powered insights
  ```json
  {
    "clusters": [...],
    "algorithm": "dbscan",
    "features": ["population", "income"]
  }
  ```

### Express Backend (Port 4000)

#### Session Management
- **POST** `/api/sessions` - Save user session
- **GET** `/api/sessions/:id` - Load session by ID

#### Dataset Management
- **POST** `/api/datasets` - Save dataset metadata
- **GET** `/api/datasets` - List all datasets

#### Village Data
- **GET** `/villages` - Fetch all villages from MongoDB

---

## 🛠️ Development

### Project Structure

```
Location-facilitator/
├── frontend/                # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Utility functions
│   │   └── App.tsx         # Main app component
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                # Python Flask + Node Express backends
│   ├── cluster_api.py      # Flask API (clustering & AI)
│   ├── index.js            # Express API (MongoDB persistence)
│   ├── config.py           # Flask configuration
│   ├── validators.py       # Input validation (Pydantic)
│   ├── feature_descriptions.py
│   ├── utils/              # Helper utilities
│   ├── requirements.txt    # Python dependencies
│   ├── package.json        # Node.js dependencies
│   └── env.example         # Environment template
│
├── .github/
│   └── workflows/          # GitHub Actions CI/CD
├── DEPLOYMENT.md           # Deployment guide
├── LICENSE
└── README.md
```

### Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite (build tool)
- Tailwind CSS + shadcn/ui
- Leaflet (maps)
- Recharts (visualizations)
- React Query (state management)

**Backend:**
- Flask (Python) for computation
- Express (Node.js) for persistence
- scikit-learn, HDBSCAN (clustering)
- Google Generative AI (Gemini)
- MongoDB with Mongoose

### Available Scripts

**Frontend:**
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

**Backend (Python):**
```bash
python cluster_api.py              # Dev server
gunicorn cluster_api:app           # Production server
```

**Backend (Node):**
```bash
npm start            # Start Express server
npm run dev          # Start with nodemon (auto-reload)
```

---

## 🚢 Deployment

For comprehensive deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

### Quick Deployment Options

**Docker:**
```bash
docker-compose up -d
```

**Heroku:**
```bash
heroku create geosuit-backend
heroku config:set GEMINI_API_KEY=your-key
git push heroku main
```

**Manual (VPS):**
- Use Gunicorn for Flask backend
- Use Nginx for frontend static files
- Configure systemd services for auto-restart

---

## 🎯 Use Cases

- **🏢 Businesses** - Select optimal locations for warehouses, retail stores, or EV charging stations
- **🏛️ Governments** - Plan hospitals, schools, or public infrastructure strategically
- **🚀 Startups** - Launch products with maximum market reach and impact
- **📊 Analysts** - Perform spatial analysis and location intelligence studies

---

## 🐛 Troubleshooting

### Backend won't start

```bash
# Check if port 5000 is already in use
# Windows:
netstat -ano | findstr :5000
# Linux/Mac:
lsof -i :5000

# Verify Python environment
python --version  # Should be 3.8+
pip list          # Check installed packages
```

### Map not displaying

- Ensure Leaflet CSS is imported in frontend
- Check browser console for errors
- Verify API endpoints are accessible

### AI Insights errors

1. Verify `GEMINI_API_KEY` is set correctly in `.env`
2. Check API key permissions at [Google AI Studio](https://makersuite.google.com/)
3. Review backend logs: Check `http://localhost:5000/api/debug-models`
4. Try different model versions in `GEMINI_MODEL` setting

### MongoDB connection failed

- Verify MongoDB is running: `mongosh` (should connect)
- Check `MONGO_URL` format in `.env`
- For Atlas: Whitelist your IP address in Atlas dashboard

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style (PEP 8 for Python, ESLint for JavaScript)
- Write clear commit messages
- Add tests for new features
- Update documentation as needed

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Google Gemini AI** for powering intelligent insights
- **scikit-learn** and **HDBSCAN** for clustering algorithms
- **Leaflet** for interactive mapping
- **MongoDB** for data persistence

---

## 📞 Support

For issues or questions:
- 📧 Open an issue on GitHub
- 📖 Check [DEPLOYMENT.md](DEPLOYMENT.md) for deployment help
- 📚 Review backend and frontend READMEs for component-specific details

---

**Built with ❤️ for smarter location decisions**

*Last Updated: February 2026*
