# Geo-Suitability Frontend

Modern React-based frontend for the Geo-Suitability Location Facilitator application.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Backend server running (see `../backend/README.md`)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will open at `http://localhost:8080` (or next available port).

---

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Analysis/       # Clustering & analysis components
│   ├── DataUpload/     # File upload components
│   ├── Export/         # Export functionality
│   ├── Layout/         # Layout components (Header, etc.)
│   ├── Map/            # Map visualization components
│   └── ui/             # shadcn/ui components
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
├── pages/              # Page components
├── utils/              # Utility functions
├── App.tsx             # Main app component
└── main.tsx            # Entry point
```

---

## 🛠️ Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router v6
- **Maps**: Leaflet & React-Leaflet
- **Charts**: Recharts
- **Data Parsing**: PapaParse
- **HTTP Client**: Axios

---

## 📜 Available Scripts

### Development

```bash
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm run preview      # Preview production build locally
npm run lint         # Run ESLint
```

### Production Build

```bash
# Standard build
npm run build

# Development build (with source maps)
npm run build:dev
```

---

## 🎨 Component Library

This project uses **shadcn/ui** components. Key components include:

- **Data Display**: Cards, Tables, Badges, Charts
- **Forms**: Inputs, Selects, Checkboxes, Sliders
- **Feedback**: Toasts, Alerts, Progress bars
- **Overlays**: Dialogs, Popovers, Tooltips
- **Navigation**: Tabs, Breadcrumbs, Navigation menus

### Adding New Components

```bash
npx shadcn-ui@latest add <component-name>
```

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the frontend directory (optional):

```bash
# API endpoint (if different from default)
VITE_API_URL=http://localhost:5000

# Other configuration
VITE_APP_TITLE="Geo-Suitability"
```

### Vite Configuration

Edit `vite.config.ts` to customize:
- Build output directory
- Dev server port
- Proxy configuration
- Plugin options

### Tailwind Configuration

Customize design tokens in `tailwind.config.ts`:
- Colors
- Fonts
- Breakpoints
- Custom utilities

---

## 📦 Key Features

### Data Upload
- CSV file upload with drag-and-drop
- Automatic field detection
- Data validation
- Sample data loading

### Interactive Map
- Leaflet-based visualization
- Cluster visualization
- Polygon selection
- Zoom controls
- Split-screen comparison (original vs scenario)

### Analysis Controls
- Algorithm selection (KMeans, DBSCAN, HDBSCAN, etc.)
- Feature selection and weighting
- Parameter tuning
- Product information input

### Scenario Analysis
- What-if scenario modeling
- Feature modification
- Impact comparison
- Side-by-side visualization

### AI Insights
- Gemini-powered business insights
- Cluster recommendations
- Strategic analysis
- Export-ready reports

### Export Options
- GeoJSON export
- Excel/CSV export
- PDF reports
- Screenshot capture

---

## 🔗 API Integration

The frontend communicates with the backend via REST API:

### API Endpoints Used

- `POST /api/normalize-score` - Normalize and score polygons
- `POST /api/cluster` - Perform clustering analysis
- `POST /api/feature-analysis` - Analyze feature correlations
- `POST /api/cluster-insights` - Generate AI insights
- `GET /api/feature-descriptions` - Get feature metadata

### API Client

Located in `src/utils/api.ts` (or similar), using Axios with:
- Request/response interceptors
- Error handling
- Loading states
- React Query integration

---

## 🎯 Development Guidelines

### Code Style

- **TypeScript**: Strict mode enabled
- **Naming**: PascalCase for components, camelCase for functions
- **File Organization**: One component per file
- **Imports**: Absolute imports with `@/` prefix

### Component Best Practices

```typescript
// Good: Typed props with interface
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return <button onClick={onClick} className={variant}>{label}</button>;
}
```

### State Management

- **Local State**: `useState` for component-specific state
- **Server State**: React Query for API data
- **Global State**: Context API (if needed)

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find and kill process on port 8080
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8080 | xargs kill -9
```

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
```

### Map Not Displaying

- Check Leaflet CSS is imported
- Verify map container has explicit height
- Check for console errors

---

## 🚀 Deployment

### Production Build

```bash
npm run build
```

Output will be in `dist/` directory.

### Deploy to Static Hosting

**Netlify**:
```bash
npm run build
netlify deploy --dir=dist --prod
```

**Vercel**:
```bash
vercel --prod
```

**S3 + CloudFront**:
```bash
npm run build
aws s3 sync dist/ s3://your-bucket-name
```

See `../DEPLOYMENT.md` for complete deployment guide.

---

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [Vite Guide](https://vitejs.dev/guide/)
- [shadcn/ui Docs](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Query](https://tanstack.com/query/latest)
- [Leaflet](https://leafletjs.com/)

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

---

## 📄 License

See main project LICENSE file.

---

**Last Updated**: January 2026
