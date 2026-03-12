# Deployment Guide - Geo-Suitability Location Facilitator

This guide covers deploying the Geo-Suitability application to production environments.

---

## 📋 Pre-Deployment Checklist

### Environment Configuration

- [ ] Copy `backend/env.example` to `backend/.env`
- [ ] Set `FLASK_ENV=production`
- [ ] Set `FLASK_DEBUG=False`
- [ ] Configure `ALLOWED_ORIGINS` with your frontend domain
- [ ] Add valid `GEMINI_API_KEY`
- [ ] Set appropriate `PORT` if not using default (5000)

### Security Review

- [ ] Ensure `.env` is in `.gitignore`
- [ ] Review CORS settings
- [ ] Verify debug mode is disabled
- [ ] Check API key is not hardcoded anywhere
- [ ] Review error messages (don't expose sensitive info)

### Dependencies

- [ ] Install all backend dependencies: `pip install -r backend/requirements.txt`
- [ ] Install all frontend dependencies: `cd frontend && npm install`
- [ ] Build frontend for production: `npm run build`

---

## 🖥️ Deployment Options

### Option 1: Traditional Server (VPS/Dedicated)

#### Backend Deployment

1. **Install Python 3.8+**
   ```bash
   python --version  # Verify version
   ```

2. **Set up virtual environment**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**
   ```bash
   cp env.example .env
   # Edit .env with your production settings
   nano .env
   ```

5. **Run with Gunicorn (Production)**
   ```bash
   # Linux/Mac
   chmod +x start_production.sh
   ./start_production.sh
   
   # Windows
   start_production.bat
   ```

6. **Set up as a system service (Linux)**
   
   Create `/etc/systemd/system/geosuit-backend.service`:
   ```ini
   [Unit]
   Description=Geo-Suitability Backend
   After=network.target

   [Service]
   User=www-data
   WorkingDirectory=/path/to/Location-facilitator/backend
   Environment="PATH=/path/to/venv/bin"
   ExecStart=/path/to/venv/bin/gunicorn --bind 0.0.0.0:5000 --workers 4 cluster_api:app
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```
   
   Enable and start:
   ```bash
   sudo systemctl enable geosuit-backend
   sudo systemctl start geosuit-backend
   sudo systemctl status geosuit-backend
   ```

#### Frontend Deployment

1. **Build for production**
   ```bash
   cd frontend
   npm run build
   ```

2. **Serve with Nginx**
   
   Create `/etc/nginx/sites-available/geosuit`:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       # Frontend
       location / {
           root /path/to/Location-facilitator/frontend/dist;
           try_files $uri $uri/ /index.html;
       }
       
       # Backend API
       location /api/ {
           proxy_pass http://127.0.0.1:5000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
   
   Enable and restart:
   ```bash
   sudo ln -s /etc/nginx/sites-available/geosuit /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

3. **Add SSL with Let's Encrypt**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

---

### Option 2: Docker Deployment

1. **Create Dockerfile for Backend**
   
   `backend/Dockerfile`:
   ```dockerfile
   FROM python:3.11-slim
   
   WORKDIR /app
   
   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt
   
   COPY . .
   
   EXPOSE 5000
   
   CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "cluster_api:app"]
   ```

2. **Create Dockerfile for Frontend**
   
   `frontend/Dockerfile`:
   ```dockerfile
   FROM node:18 AS builder
   
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   
   COPY . .
   RUN npm run build
   
   FROM nginx:alpine
   COPY --from=builder /app/dist /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/conf.d/default.conf
   
   EXPOSE 80
   ```

3. **Create docker-compose.yml** (in project root)
   ```yaml
   version: '3.8'
   
   services:
     backend:
       build: ./backend
       ports:
         - "5000:5000"
       environment:
         - FLASK_ENV=production
         - FLASK_DEBUG=False
       env_file:
         - ./backend/.env
       restart: unless-stopped
   
     frontend:
       build: ./frontend
       ports:
         - "80:80"
       depends_on:
         - backend
       restart: unless-stopped
   ```

4. **Deploy**
   ```bash
   docker-compose up -d
   docker-compose logs -f  # View logs
   ```

---

### Option 3: Cloud Platform Deployment

#### Heroku

1. **Backend**
   ```bash
   cd backend
   echo "web: gunicorn cluster_api:app" > Procfile
   heroku create geosuit-backend
   heroku config:set FLASK_ENV=production
   heroku config:set GEMINI_API_KEY=your-key
   git push heroku main
   ```

2. **Frontend**
   ```bash
   cd frontend
   # Add static.json for serving
   echo '{"root": "dist/"}' > static.json
   heroku create geosuit-frontend
   heroku buildpacks:add heroku/nodejs
   git push heroku main
   ```

#### AWS (EC2 + S3)

1. **Backend on EC2**: Follow "Traditional Server" steps
2. **Frontend on S3 + CloudFront**:
   ```bash
   cd frontend
   npm run build
   aws s3 sync dist/ s3://your-bucket-name
   # Set up CloudFront distribution pointing to S3
   ```

#### Google Cloud Run

```bash
# Backend
cd backend
gcloud run deploy geosuit-backend \
    --source . \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated

# Frontend
cd frontend
npm run build
gcloud run deploy geosuit-frontend \
    --source . \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated
```

---

## 🔒 Production Security Checklist

- [ ] HTTPS enabled (SSL certificate installed)
- [ ] Firewall configured (only ports 80, 443, 22 open)
- [ ] Debug mode disabled (`FLASK_DEBUG=False`)
- [ ] CORS restricted to specific origins
- [ ] Environment variables properly secured
- [ ] Regular security updates applied
- [ ] Rate limiting configured (opcional: use nginx)
- [ ] Input validation enabled
- [ ] Error messages don't expose sensitive info

---

## 📊 Monitoring & Logging

### Application Logs

**Backend (Gunicorn)**:
```bash
# View logs
tail -f /var/log/geosuit/backend.log

# With systemd
journalctl -u geosuit-backend -f
```

**Frontend (Nginx)**:
```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Performance Monitoring

Consider adding:
- **Application Performance Monitoring (APM)**: New Relic, DataDog, or Sentry
- **Uptime Monitoring**: Pingdom, UptimeRobot
- **Log Aggregation**: ELK Stack, Papertrail

---

## 🔄 Updates & Maintenance

### Updating the Application

1. **Pull latest code**
   ```bash
   git pull origin main
   ```

2. **Update backend**
   ```bash
   cd backend
   source venv/bin/activate
   pip install -r requirements.txt
   sudo systemctl restart geosuit-backend
   ```

3. **Update frontend**
   ```bash
   cd frontend
   npm install
   npm run build
   # Copy dist/ to production location
   ```

### Database Backups

If you add a database later:
```bash
# Set up automated backups
# Example for PostgreSQL
0 2 * * * pg_dump geosuit_db > /backups/geosuit_$(date +\%Y\%m\%d).sql
```

---

## 🐛 Troubleshooting

### Backend won't start

1. Check logs: `journalctl -u geosuit-backend -n 50`
2. Verify `.env` file exists and is properly configured
3. Test manually: `python cluster_api.py`
4. Check port availability: `sudo lsof -i :5000`

### Frontend 404 errors

1. Verify nginx configuration
2. Check frontend build output
3. Ensure `try_files` directive includes `/index.html`

### CORS errors

1. Verify `ALLOWED_ORIGINS` in `.env`
2. Check frontend API endpoint configuration
3. Inspect browser console for exact error

### AI insights not working

1. Verify `GEMINI_API_KEY` is set correctly
2. Check API key has proper permissions
3. Review backend logs for Gemini API errors

---

## 📈 Scaling Recommendations

### Horizontal Scaling

- Use multiple Gunicorn workers: `--workers $((2 * $(nproc) + 1))`
- Load balancer (Nginx, HAProxy) for multiple backend instances
- CDN for frontend static assets (CloudFare, AWS CloudFront)

### Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize database queries (if added)
- Implement caching (Redis, Memcached)

### Performance Optimization

- Enable gzip compression in Nginx
- Optimize frontend bundle size
- Implement API response caching
- Use database connection pooling

---

## 📞 Support

For deployment issues or questions:
- Check application logs first
- Review this deployment guide
- Consult the main README.md
- Open an issue on GitHub (if applicable)

---

**Last Updated**: January 2026
**Version**: 1.0
