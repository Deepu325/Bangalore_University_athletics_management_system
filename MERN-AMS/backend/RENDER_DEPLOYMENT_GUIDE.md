# Render Deployment Diagnostic Guide

## ✅ Verified Configuration

### Backend Structure ✓
- Location: `/MERN-AMS/backend/`
- Entry: `server.js` (uses ES modules)
- Start command: `node server.js`
- Package.json: ✓ Present

### MongoDB Connection Code ✓
- Uses: `process.env.MONGODB_URI`
- Fallback: `mongodb://localhost:27017/bu-ams`
- Connection string format: `mongodb+srv://...`

### Current Setup
```
MONGODB_URI=mongodb+srv://AthleticsMeet:AthleticsMeet@athleticsmeet.2wye07c.mongodb.net/?appName=AthleticsMeet
```

---

## 🔍 Render Configuration Checklist

### Required Settings on Render Dashboard:

1. **Root Directory**: `/MERN-AMS/backend`
   - NOT `/MERN-AMS`
   - NOT `/backend`
   - MUST be `/MERN-AMS/backend`

2. **Build Command**: `npm install`

3. **Start Command**: `node server.js`

4. **Environment Variables** (Set in Render Dashboard):
   ```
   MONGODB_URI=mongodb+srv://AthleticsMeet:AthleticsMeet@athleticsmeet.2wye07c.mongodb.net/?appName=AthleticsMeet
   PORT=10000
   NODE_ENV=production
   CLIENT_URL=https://your-vercel-frontend.vercel.app
   JWT_SECRET=your-secret-key
   GMAIL_USER=(leave empty for demo)
   GMAIL_PASSWORD=(leave empty for demo)
   ```

5. **MongoDB Atlas IP Whitelist**:
   - IP: Your Render IP (shown in Render logs)
   - OR: Allow all IPs: `0.0.0.0/0` (not recommended for production)

---

## 🐛 Troubleshooting

### Issue: "MONGODB_URI is UNDEFINED"
**Solution**: 
1. Check Render Dashboard → Settings → Environment Variables
2. Ensure `MONGODB_URI` is spelled EXACTLY (case-sensitive)
3. No spaces at beginning or end
4. Redeploy after adding variable

### Issue: "Connection timeout"
**Solution**:
1. Check MongoDB Atlas IP whitelist
2. Add Render IP address to whitelist
3. Check MONGODB_URI format (should start with `mongodb+srv://`)

### Issue: "Wrong folder running"
**Evidence**: Render logs show "Frontend: http://localhost:3000"
**Solution**: Change Root Directory to `/MERN-AMS/backend` and redeploy

---

## 📋 What to Do Next

1. **Verify Render Root Directory**:
   - Go to: Render Dashboard → Your Service → Settings
   - Check "Root Directory" field
   - Should be: `/MERN-AMS/backend`

2. **Check Environment Variables**:
   - Render Dashboard → Settings → Environment Variables
   - Should have `MONGODB_URI` set to full MongoDB Atlas connection string

3. **Check Render Logs**:
   - Render Dashboard → Logs
   - Should show diagnostic output with MONGODB_URI value

4. **Redeploy**:
   - Render Dashboard → Manual Deploy → Deploy latest commit

---

## ✅ Expected Output in Render Logs

After successful deployment, you should see:

```
🔍 ENVIRONMENT DIAGNOSTIC
NODE_ENV: production
PORT: 10000
CLIENT_URL: https://your-vercel-frontend.vercel.app
MONGODB_URI (first 50 chars): mongodb+srv://AthleticsMeet:AthleticsMeet@athleti...
MONGODB_URI length: 123
MONGODB_URI has invisible chars: NO ✓

✓ MongoDB connected successfully
✓ BU-AMS Backend Server running on http://localhost:10000
```

If `MONGODB_URI` shows `UNDEFINED` → the environment variable is not set on Render.

---

## 🚀 Quick Deployment Checklist

- [ ] Root Directory: `/MERN-AMS/backend`
- [ ] Build Command: `npm install`
- [ ] Start Command: `node server.js`
- [ ] MONGODB_URI environment variable set
- [ ] MongoDB Atlas IP whitelist updated
- [ ] Latest code pushed to GitHub
- [ ] Manual redeploy triggered on Render
