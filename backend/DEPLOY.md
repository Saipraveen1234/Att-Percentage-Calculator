# Backend Deployment

This backend is designed to be deployed to platforms like Railway, Render, or similar Node.js hosting services.

## Environment Variables Required

```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-super-secret-jwt-key-here
GEMINI_API_KEY=your-gemini-api-key (optional, for OCR features)
```

## Build Command

```bash
npm install && npx prisma generate && npm run build
```

## Start Command

```bash
npm start
```

## Database Migration

After deployment, run migrations:

```bash
npx prisma migrate deploy
```

## Health Check Endpoint

The backend provides a health check at `/health` for monitoring.

## CORS Configuration

Update `src/server.ts` to include your frontend domain:

```typescript
app.use(cors({
    origin: [
        'http://localhost:4200',
        'https://your-frontend.vercel.app'
    ],
    credentials: true
}));
```
