# Deployment Guide - AI Writing Assistant

## Overview
This guide covers deploying the AI Writing Assistant to Vercel (frontend) and provides options for backend deployment.

## Prerequisites
- GitHub account and repository (already have)
- Vercel account (https://vercel.com/)
- OpenAI API key (https://platform.openai.com/)
- Privy account and App ID (https://dashboard.privy.io/)
- Backend deployment service account (Render, Railway, etc.)

## Part 1: Prepare the Code for Deployment

### 1. Update API Endpoints for Production

After deploying your backend, update the API endpoints in `client/src/components/Editor.jsx`:

Replace:
```javascript
const response = await axios.post(
  "http://localhost:8000/api/analyze",
  ...
)
```

With your deployed backend URL:
```javascript
const response = await axios.post(
  "https://your-backend-url.com/api/analyze",
  ...
)
```

Do this for:
- `rephraseSentence()` - `/api/analyze`
- `checkSpelling()` - `/api/spellcheck`
- `checkGrammar()` - `/api/grammarcheck`

### 2. Commit Changes

```bash
git add .
git commit -m "Fix issues and prepare for production deployment"
git push origin main
```

## Part 2: Deploy Backend

### Option 1: Render.com (Recommended for free)

1. Go to https://render.com/ and sign up
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: ai-writing-assistant-server
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Publish Port**: 8000
5. Add environment variables:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `PORT`: 8000
6. Click "Create Web Service"
7. Note your deployment URL (e.g., `https://ai-writing-assistant-server.onrender.com`)

### Option 2: Railway.app

1. Go to https://railway.app/ and sign up
2. Create a new project from your GitHub repo
3. Set environment variables:
   - `OPENAI_API_KEY`: Your OpenAI API key
4. Deploy and note the URL

### Option 3: Heroku (Paid alternative)

1. Go to https://www.heroku.com/ and sign up
2. Create a new app
3. Connect to GitHub
4. Set environment variables
5. Deploy

## Part 3: Deploy Frontend to Vercel

### Step 1: Prepare Repository

Ensure your code is pushed to GitHub:
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### Step 2: Deploy on Vercel

1. Go to https://vercel.com/
2. Click "New Project"
3. Select your GitHub repository: `AI-Writing-Assistant`
4. Configure Build Settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `AI-Writing-Assistant-MERN/client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Add Environment Variables:
   ```
   VITE_PRIVY_APP_ID=your_privy_app_id_here
   ```

6. Click "Deploy"

### Step 3: Update API Endpoints

Once deployment is complete:

1. Create a new version commit with updated API endpoints:

   ```bash
   # In client/src/components/Editor.jsx
   # Update all API calls from localhost:8000 to your backend URL
   ```

2. Commit and push:
   ```bash
   git add .
   git commit -m "Update API endpoints for production"
   git push origin main
   ```

   Vercel will automatically redeploy

## Part 4: Configure Privy

1. Go to https://dashboard.privy.io/
2. Create a new app (if not already created)
3. Copy your App ID
4. Configure allowed URLs:
   - Add your Vercel deployment URL (e.g., `https://ai-writing-assistant.vercel.app`)
   - Add localhost URLs for development
5. Set up your preferred login methods

## Part 5: Final Testing

### Test Frontend

Visit your Vercel deployment URL:
```
https://ai-writing-assistant.vercel.app
```

Check that:
- [ ] Page loads without errors
- [ ] Navigation works
- [ ] Privy login works
- [ ] Editor page is accessible after login

### Test Backend Connectivity

After logging in, try the following:
- [ ] Spell check works
- [ ] Grammar check works
- [ ] Rephrase function works

### Troubleshooting

**Issue: API calls fail with CORS error**
- Solution: Ensure backend CORS is configured for your frontend URL
  ```javascript
  app.use(cors({
    origin: ["https://ai-writing-assistant.vercel.app", "http://localhost:5173"]
  }));
  ```

**Issue: OpenAI API returns 401 error**
- Solution: Verify `OPENAI_API_KEY` is set correctly in backend environment

**Issue: Privy login not working**
- Solution: Verify `VITE_PRIVY_APP_ID` is set in Vercel environment variables

**Issue: Port already in use**
- Solution: Change PORT in backend `.env` (Render auto-assigns ports)

## Production Deployment Checklist

- [ ] Backend deployed and tested
- [ ] Frontend deployed on Vercel
- [ ] API endpoints updated for production
- [ ] Environment variables configured
- [ ] Privy app configured with correct URLs
- [ ] All features tested in production
- [ ] SSL certificate active (automatic on Vercel and Render)
- [ ] Monitoring/logging enabled
- [ ] Backups configured (if needed)

## Monitoring

### Vercel
- Visit your project dashboard to see deployment logs
- Monitor build times and errors

### Render/Railway
- Access service dashboard for error logs
- Monitor resource usage

## Scaling Considerations

For production use:
- Monitor API rate limits
- Consider caching common rephrasing requests
- Implement user rate limiting
- Add database for storing suggestions history (if needed)
- Use Redis for session management

## Cost Estimates

- **Vercel Frontend**: Free tier available, paid tier starts at $20/month
- **Render Backend**: Free tier available, paid tier starts at $7/month
- **OpenAI API**: Pay-as-you-go, starting at $0.002 per token

## Support

For issues:
1. Check Vercel and backend service logs
2. Verify environment variables are set
3. Test locally before deploying
4. Check API documentation for rate limits

---

Deployment complete! Your AI Writing Assistant is now live. 🚀
