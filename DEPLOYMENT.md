# Deployment Guide

This guide covers deploying the Attendance Tracker application to production.

## Architecture

- **Frontend**: Angular 19 → Vercel
- **Backend**: Node.js/Express → Railway (or Render)
- **Database**: PostgreSQL → Railway/Supabase/Neon

---

## 🚀 Quick Deployment Steps

### 1. Deploy Database (PostgreSQL)

**Option A: Railway**
1. Go to [railway.app](https://railway.app)
2. Create new project → Add PostgreSQL
3. Copy the `DATABASE_URL` from the connection string

**Option B: Supabase**
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Get connection string from Settings → Database

**Option C: Neon**
1. Go to [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string

---

### 2. Deploy Backend

**Using Railway (Recommended)**

1. **Push code to GitHub** (if not already)
   ```bash
   cd backend
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Deploy to Railway**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect Node.js

3. **Set Environment Variables**
   In Railway dashboard, add these variables:
   ```
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=<your-postgres-connection-string>
   JWT_SECRET=<generate-a-secure-random-string>
   GEMINI_API_KEY=<your-gemini-api-key> (optional)
   ```

4. **Run Database Migrations**
   In Railway dashboard → Settings → Deploy:
   - Add build command: `npm install && npx prisma generate && npx prisma migrate deploy`
   - Or run manually in Railway CLI:
     ```bash
     railway run npx prisma migrate deploy
     ```

5. **Get Backend URL**
   - Railway will provide a URL like: `https://your-app.railway.app`
   - Note this URL for frontend configuration

**Using Render**

1. Go to [render.com](https://render.com)
2. Create "New Web Service"
3. Connect GitHub repository
4. Configure:
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: Node
5. Add environment variables (same as Railway)

---

### 3. Deploy Frontend to Vercel

1. **Update Environment Variables**
   
   Edit `frontend/.env.production`:
   ```
   API_URL=https://your-backend-url.railway.app/api
   ```

2. **Update `environment.prod.ts`**
   
   Edit `frontend/src/environments/environment.prod.ts`:
   ```typescript
   export const environment = {
     production: true,
     apiUrl: 'https://your-backend-url.railway.app/api'
   };
   ```

3. **Deploy to Vercel**

   **Option A: Vercel CLI**
   ```bash
   cd frontend
   npm install -g vercel
   vercel login
   vercel --prod
   ```

   **Option B: Vercel Dashboard**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Set root directory to `frontend`
   - Vercel will auto-detect Angular
   - Click "Deploy"

4. **Configure Environment Variables in Vercel**
   - Go to Project Settings → Environment Variables
   - Add: `API_URL` = `https://your-backend-url.railway.app/api`

---

## 🔧 Post-Deployment Configuration

### Backend CORS Setup

Ensure your backend allows requests from your Vercel domain.

Edit `backend/src/server.ts`:
```typescript
app.use(cors({
    origin: [
        'http://localhost:4200',
        'https://your-app.vercel.app'  // Add your Vercel URL
    ],
    credentials: true
}));
```

Redeploy backend after this change.

---

## 📋 Deployment Checklist

- [ ] Database deployed and accessible
- [ ] Backend environment variables configured
- [ ] Database migrations run successfully
- [ ] Backend deployed and accessible
- [ ] Backend CORS configured for frontend domain
- [ ] Frontend environment variables updated
- [ ] Frontend deployed to Vercel
- [ ] Test login functionality
- [ ] Test class creation
- [ ] Test student management
- [ ] Test exam marks entry

---

## 🐛 Troubleshooting

### Frontend can't connect to backend
- Check `environment.prod.ts` has correct backend URL
- Verify CORS is configured in backend
- Check browser console for errors

### Database connection errors
- Verify `DATABASE_URL` is correct
- Check if database allows external connections
- Ensure migrations have run

### 401 Errors on all requests
- Check `JWT_SECRET` is set in backend
- Verify token is being sent in requests
- Check backend logs

---

## 🔐 Security Notes

1. **Never commit `.env` files** - They're in `.gitignore`
2. **Use strong JWT_SECRET** - Generate with: `openssl rand -base64 32`
3. **Enable HTTPS** - Both Vercel and Railway provide this automatically
4. **Rotate secrets regularly**
5. **Monitor logs** for suspicious activity

---

## 📊 Monitoring

- **Vercel**: Analytics available in dashboard
- **Railway**: Logs and metrics in dashboard
- **Database**: Monitor connection count and query performance

---

## 💰 Cost Estimates

- **Vercel**: Free tier (Hobby) - Sufficient for small apps
- **Railway**: ~$5-10/month (includes database)
- **Supabase**: Free tier available, ~$25/month for production
- **Total**: $5-35/month depending on usage

---

## 🔄 CI/CD

Both Vercel and Railway support automatic deployments:
- Push to `main` branch → Auto-deploy to production
- Push to other branches → Preview deployments

Configure in respective dashboards.
