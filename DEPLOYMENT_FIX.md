# 🔧 Deployment Fix Guide

The deployment issues are caused by trying to build the frontend inside the backend container. Let's fix this with a **separated deployment strategy**.

## 🚨 **Problem Identified**
- ❌ Original Dockerfile tries to build frontend in backend container
- ❌ Frontend dependencies not available in backend environment
- ❌ Mixing frontend and backend build processes

## ✅ **Solution: Separate Frontend & Backend**

### **Strategy**
1. **Frontend**: Deploy only to Vercel (static hosting)
2. **Backend**: Deploy only to Railway (API + Database)
3. **Connect**: Frontend calls Railway API via environment variable

## 🚀 **Fixed Deployment Steps**

### **1. Deploy Backend to Railway (Fixed)**

#### **Option A: Use Native Node.js (Recommended)**
```bash
# In Railway dashboard:
1. Connect GitHub repo
2. Select: "Deploy from repo" 
3. Choose: Youth-Justice-Service-Finder
4. Framework: Node.js
5. Start Command: npm run start:simple
6. Add PostgreSQL database
```

#### **Option B: Use Fixed Docker**
```bash
# Railway will use Dockerfile.railway (backend only)
# This is now configured in railway.json
```

**Environment Variables for Railway:**
```env
NODE_ENV=production
PORT=3001
JWT_SECRET=your_32_character_secret_here
API_RATE_LIMIT=50
```

### **2. Deploy Frontend to Vercel (Fixed)**

#### **Option A: Vercel Dashboard**
```bash
1. Go to vercel.com
2. Import GitHub repo: Youth-Justice-Service-Finder
3. Framework: Other
4. Root Directory: frontend
5. Build Command: npm run build
6. Output Directory: dist
```

#### **Option B: Vercel CLI**
```bash
cd frontend
npx vercel --prod
```

**Environment Variables for Vercel:**
```env
VITE_API_URL=https://your-railway-app.railway.app
```

## 📁 **Files Updated**

| File | Purpose | Status |
|------|---------|--------|
| `Dockerfile.railway` | ✅ Backend-only Docker build | Fixed |
| `railway.json` | ✅ Railway configuration | Fixed |
| `vercel.json` | ✅ Frontend-only Vercel build | Fixed |
| `.dockerignore.railway` | ✅ Exclude frontend from backend | New |

## 🔧 **Alternative: Render.com (If Railway Issues)**

If Railway continues to have issues, use Render.com:

```bash
1. Go to render.com
2. Connect GitHub repo
3. Create "Web Service"
4. Build Command: npm ci
5. Start Command: npm run start:simple
6. Add PostgreSQL database
```

## 📝 **Step-by-Step Fix Process**

### **Step 1: Clean Up and Recommit**
```bash
git add .
git commit -m "Fix deployment configuration - separate frontend/backend"
git push origin main
```

### **Step 2: Deploy Backend**
1. Go to Railway dashboard
2. Delete any failed deployments
3. Create new service from GitHub
4. Choose **Node.js** (not Docker) as build method
5. Set start command: `npm run start:simple`
6. Add PostgreSQL database
7. Set environment variables

### **Step 3: Deploy Frontend**
1. Go to Vercel dashboard  
2. Import repository
3. Set root directory: `frontend`
4. Let Vercel auto-detect Vite
5. Add Railway API URL as environment variable
6. Deploy

### **Step 4: Test Connection**
1. Check Railway API: `https://your-app.railway.app/health`
2. Check Vercel frontend loads
3. Test search functionality works

## 🆘 **Troubleshooting**

### **If Railway Build Fails**
```bash
# Option 1: Use Nixpacks (simpler)
cp railway-native.json railway.json
git add . && git commit -m "Use native Railway build" && git push

# Option 2: Use alternative hosting
# Try Render.com or fly.io instead
```

### **If Vercel Build Fails**
```bash
# Test locally first
cd frontend
npm ci
npm run build

# If that works, the issue is with Vercel config
# Try deploying with CLI:
npx vercel --prod
```

### **Connection Issues**
```bash
# Check CORS in backend
# Verify VITE_API_URL in frontend
# Test API directly: curl https://your-api.railway.app/health
```

## 🚀 **Quick Deploy Commands**

```bash
# Push fixes
git add .
git commit -m "Fix deployment - use separate build processes"
git push origin main

# Deploy backend (Railway will auto-deploy)
# Deploy frontend
cd frontend && npx vercel --prod
```

## ✅ **Expected Results**

After fixes:
- ✅ **Backend**: Clean Node.js deployment on Railway
- ✅ **Frontend**: Fast static deployment on Vercel  
- ✅ **Database**: PostgreSQL auto-created on Railway
- ✅ **Connection**: Frontend → Railway API working
- ✅ **Performance**: Fast global CDN (Vercel) + API (Railway)

## 📞 **If Still Having Issues**

1. **Check Railway logs**: Look for specific error messages
2. **Test locally**: Run `npm run start:simple` locally first
3. **Verify dependencies**: Ensure all required packages in package.json
4. **Try alternative**: Use Render.com or other platforms

The key fix is **separating concerns**: Frontend builds on Vercel, Backend runs on Railway, Database on Railway. This is the standard pattern for modern web applications.

---

## 🎯 **Next Steps After Fix**

1. Commit the fixes above
2. Deploy backend to Railway (Node.js, not Docker)  
3. Deploy frontend to Vercel (from frontend/ directory)
4. Connect them with environment variables
5. Test and go live!

This separation will give you better performance, easier debugging, and more reliable deployments. 🚀