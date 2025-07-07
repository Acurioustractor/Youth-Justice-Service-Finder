# 🆓 Youth Justice Service Finder - Free Hosting Setup

This guide sets up the Youth Justice Service Finder using **100% free hosting** services perfect for development, testing, and initial deployment.

## 🎯 Free Hosting Strategy

### **Frontend: Vercel** (Recommended)
- ✅ **Free Plan**: Unlimited personal projects
- ✅ **Global CDN**: Fast worldwide delivery
- ✅ **Auto-deploy**: Connected to GitHub
- ✅ **Custom domains**: Free SSL certificates
- ✅ **Build optimization**: Automatic optimization

### **Backend: Railway** (API + Database)
- ✅ **Free Tier**: $5 credit monthly (enough for small projects)
- ✅ **PostgreSQL**: Managed database included
- ✅ **Docker support**: Deploy our containers directly
- ✅ **Auto-deploy**: GitHub integration
- ✅ **Environment variables**: Secure configuration

### **Search: ElasticCloud Free**
- ✅ **14-day trial**: Then free developer tier
- ✅ **Hosted Elasticsearch**: Fully managed
- ✅ **Small cluster**: Perfect for development
- ✅ **API access**: Standard Elasticsearch APIs

### **Alternative: Render.com** (Backup option)
- ✅ **Free tier**: Web services and databases
- ✅ **PostgreSQL**: Free managed database
- ✅ **Docker support**: Direct container deployment
- ✅ **SSL included**: Automatic HTTPS

## 🚀 Quick Setup Guide

### 1. Frontend on Vercel (5 minutes)

```bash
# Install Vercel CLI
npm i -g vercel

# In your project root
cd "/Users/benknight/Code/Youth Justice Service Finder"
cd frontend

# Deploy to Vercel
vercel

# Follow prompts:
# - Link to GitHub repo
# - Set build command: npm run build
# - Set output directory: dist
```

**Or use Vercel Dashboard:**
1. Go to [vercel.com](https://vercel.com)
2. Connect GitHub account
3. Import `Youth-Justice-Service-Finder` repository
4. Set framework preset: **Vite**
5. Set root directory: `frontend`
6. Deploy!

### 2. Backend on Railway (10 minutes)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# In project root
cd "/Users/benknight/Code/Youth Justice Service Finder"

# Initialize Railway project
railway init

# Deploy
railway up
```

**Or use Railway Dashboard:**
1. Go to [railway.app](https://railway.app)
2. Connect GitHub account
3. Deploy from GitHub repo
4. Select `Youth-Justice-Service-Finder`
5. Configure environment variables
6. Deploy!

## 🔧 Configuration for Free Hosting

### Frontend Environment Variables (Vercel)

```env
# In Vercel dashboard or vercel.json
VITE_API_URL=https://your-railway-app.railway.app
```

### Backend Environment Variables (Railway)

```env
# Railway automatically provides DATABASE_URL
# Add these in Railway dashboard:

NODE_ENV=production
PORT=3001

# API Keys (get free tiers)
FIRECRAWL_API_KEY=your_free_firecrawl_key
MY_COMMUNITY_DIRECTORY_API_KEY=optional

# JWT Secret
JWT_SECRET=your_secure_32_character_secret

# If using ElasticCloud
ELASTICSEARCH_URL=https://your-cluster.es.io:9243
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=your_elastic_password

# Basic rate limiting
API_RATE_LIMIT=50
```

## 📁 Free-Tier Optimized Files

Let me create optimized configurations for free hosting:

### Vercel Configuration (`vercel.json`)

```json
{
  "version": 2,
  "name": "youth-justice-frontend",
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_API_URL": "@api_url"
  }
}
```

### Railway Dockerfile (Simplified)

```dockerfile
# Optimized for Railway free tier
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build frontend in container
RUN cd frontend && npm ci && npm run build

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Start server
CMD ["npm", "start"]
```

### Simplified Docker Compose for Local Development

```yaml
# docker-compose.free.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: youth_justice
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/youth_justice
      NODE_ENV: development
    depends_on:
      - postgres

volumes:
  postgres_data:
```

## 🛠️ Free Service Alternatives

### **Search Engine Options**

1. **ElasticCloud Free Tier**
   - 14-day free trial
   - Then free developer edition
   - Limited storage but perfect for testing

2. **Local Elasticsearch (Development)**
   ```bash
   # For local development
   docker run -d --name elasticsearch \
     -p 9200:9200 \
     -e "discovery.type=single-node" \
     -e "xpack.security.enabled=false" \
     elasticsearch:8.11.0
   ```

3. **SQLite Full-Text Search (Fallback)**
   ```javascript
   // Fallback search without Elasticsearch
   const services = await db('services')
     .where('name', 'like', `%${query}%`)
     .orWhere('description', 'like', `%${query}%`)
     .limit(20);
   ```

### **Database Options**

1. **Railway PostgreSQL** (Free $5/month credit)
2. **Supabase** (Free tier with 500MB)
3. **PlanetScale** (Free tier with 1GB)
4. **Neon** (Free tier with 3GB)

### **API Hosting Options**

1. **Railway** (Recommended - $5 credit/month)
2. **Render.com** (Free tier with sleep after 15min idle)
3. **Fly.io** (Free tier with 3 apps)
4. **Heroku** (Free tier discontinued, but alternatives available)

## 📋 Deployment Checklist

### ✅ **Frontend (Vercel)**
- [ ] Connect GitHub repository
- [ ] Set framework to Vite
- [ ] Set root directory to `frontend`
- [ ] Configure environment variables
- [ ] Deploy and test

### ✅ **Backend (Railway)**
- [ ] Connect GitHub repository  
- [ ] Add PostgreSQL database
- [ ] Configure environment variables
- [ ] Deploy Docker container
- [ ] Run database migrations
- [ ] Test API endpoints

### ✅ **Domain Setup (Optional)**
- [ ] Configure custom domain in Vercel
- [ ] Update API URL in frontend
- [ ] Test end-to-end functionality

## 🚨 Free Tier Limitations

### **Railway Free Tier**
- **Monthly Credit**: $5 (usually sufficient for small apps)
- **Sleep Policy**: No automatic sleep
- **Build Time**: Limited build minutes
- **Memory**: 512MB RAM limit

### **Vercel Free Tier**
- **Bandwidth**: 100GB/month
- **Build Time**: 6,000 build execution minutes/month
- **Functions**: 10s execution limit
- **Team Size**: Personal projects only

### **Optimization Tips**
1. **Minimize API calls** in frontend
2. **Use caching** for frequently accessed data
3. **Optimize images** and assets
4. **Implement pagination** for large data sets
5. **Use CDN** for static assets

## 🎯 Scaling Path

When you outgrow free tiers:

1. **Vercel Pro** ($20/month) - Better performance and team features
2. **Railway Pro** ($20/month) - More resources and no credit limits  
3. **Dedicated hosting** - Move to DigitalOcean/Vultr as planned

## 🔧 Quick Start Commands

```bash
# 1. Deploy frontend to Vercel
cd frontend
npm install -g vercel
vercel --prod

# 2. Deploy backend to Railway  
npm install -g @railway/cli
railway login
railway init
railway up

# 3. Set up database
# (Railway will automatically create PostgreSQL)
# Run migrations through Railway console or locally

# 4. Update frontend API URL
# In Vercel dashboard, add environment variable:
# VITE_API_URL=https://your-app.railway.app
```

## 📞 Support

If you need help with free hosting setup:
1. Check service documentation (Vercel, Railway)
2. Use their Discord communities for quick help
3. Free tiers usually have community support

---

## 🎉 **Ready for Free Hosting!**

This setup gives you a **completely free** (or nearly free with Railway's $5 credit) production environment that can handle:

- ✅ **Frontend**: Global CDN with auto-deployment
- ✅ **Backend**: Scalable API with managed database  
- ✅ **Search**: Basic search functionality (with upgrade path to Elasticsearch)
- ✅ **SSL**: Automatic HTTPS on both frontend and backend
- ✅ **Monitoring**: Basic monitoring included with platforms

Perfect for building out the system before scaling to paid hosting! 🚀