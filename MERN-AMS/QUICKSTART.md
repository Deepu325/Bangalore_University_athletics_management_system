# 🚀 Quick Start Guide - BU-AMS MERN Stack

## One-Time Setup

### 1. Backend Setup (Terminal 1)

```bash
cd MERN-AMS/backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env if using remote MongoDB
# Default: mongodb://localhost:27017/bu-ams

# Start backend server
npm run dev
```

**Expected Output:**
```
✓ Connected to MongoDB
✓ BU-AMS Backend Server running on http://localhost:5000
✓ API Routes:
  - GET    /api/colleges
  - POST   /api/athletes
  ... etc
```

### 2. Frontend Setup (Terminal 2)

```bash
cd MERN-AMS/frontend

# Install dependencies
npm install

# Start frontend server
npm run dev
```

**Expected Output:**
```
Compiled successfully!
You can now view bu-ams-frontend in the browser.
http://localhost:3000
```

## 🎯 Using the Application

### Navigation Flow

**1. Landing Page (Home)**
- URL: `http://localhost:3000`
- View event categories
- See MERN Stack features
- Click "Admin Login"

**2. Admin Dashboard**
- URL: `http://localhost:3000/admin`
- Left sidebar with menu options

**3. Athlete Registration (Inside Admin)**
- Click "🏃 Athlete Registration" in sidebar
- Select a college from dropdown
- Switch between Men/Women tabs
- Add athletes with event assignments

### Step-by-Step: Register an Athlete

1. **Go to Admin Dashboard** → Click sidebar "Athlete Registration"
2. **Select College** - Choose from RVCE, BMSCE, or MSRIT
3. **Pick Gender** - Click Men or Women tab
4. **Click "Add Athlete"** button
5. **Fill Form:**
   - Athlete Name: Required
   - UUCMS No: Optional
   - Event 1: Pick a track/field event
   - Event 2: Pick another event
   - Relay 1 & 2: Optional relay events
6. **Click "Save Athlete"**
7. **Athlete appears in table** with chest number
8. **Click "Submit Registration"** to save all

## 📊 Database Check

### Using MongoDB Compass (GUI)
1. Open MongoDB Compass
2. Connect to `mongodb://localhost:27017`
3. Navigate to `bu-ams` database
4. View collections: colleges, athletes, events, users

### Using MongoDB CLI
```bash
mongosh
use bu-ams
db.colleges.find()
db.athletes.find()
db.events.find()
```

## 🔌 Testing API

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Get All Colleges
```bash
curl http://localhost:5000/api/colleges
```

### Add New Athlete
```bash
curl -X POST http://localhost:5000/api/athletes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "gender": "Male",
    "chestNo": "M001",
    "collegeId": "COLLEGE_ID",
    "event1": "100m",
    "event2": "200m"
  }'
```

## 📁 Key Files to Edit

### Frontend
- **Landing Page**: `frontend/src/pages/LandingPage.jsx`
- **Admin Dashboard**: `frontend/src/pages/AdminDashboard.jsx`
- **Athlete Registration**: `frontend/src/components/AthleteRegistration.jsx`
- **HTML Template**: `frontend/public/index.html`

### Backend
- **Models**: `backend/models/index.js`
- **Routes**: `backend/routes/athletes.js`, `colleges.js`, `events.js`
- **Server**: `backend/server.js`

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# For Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### MongoDB Connection Error
```bash
# Start MongoDB service (Windows)
net start MongoDB

# Or use MongoDB Atlas (cloud)
# Update MONGO_URI in .env
```

### CORS Errors
- Ensure backend is running on port 5000
- Check CORS middleware in `server.js`

### React Module Errors
```bash
# Clear cache and reinstall
rm -rf frontend/node_modules
npm install

# Same for backend
rm -rf backend/node_modules
npm install
```

## 📋 Sample Test Data

### College 1
- Code: RVCE
- Name: RV College of Engineering
- PED: Dr. Kumar
- Phone: 9876543210

### College 2
- Code: BMSCE
- Name: BMS College of Engineering
- PED: Prof. Sharma
- Phone: 9876543211

### Sample Athlete
- Name: Raj Kumar
- UUCMS: CS21B001
- Gender: Male
- College: RVCE
- Event 1: 100m
- Event 2: 200m

## 🎓 Learning Path

1. Understand folder structure
2. Read `README.md` for architecture
3. Check API endpoints in `server.js`
4. Review React components
5. Test in browser
6. Modify and experiment

## ✅ Checklist

- [ ] Node.js installed
- [ ] MongoDB running
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Backend server running (port 5000)
- [ ] Frontend server running (port 3000)
- [ ] Can access landing page
- [ ] Can navigate to admin
- [ ] Can register an athlete

## 📞 Common Issues

| Issue | Solution |
|-------|----------|
| Cannot connect to MongoDB | Check if MongoDB service is running |
| Port 5000 already in use | Kill process or use different port |
| React page blank | Check browser console for errors |
| API 404 errors | Verify backend is running |
| CORS errors | Check if frontend/backend URLs match |

---

**Happy Coding! 🎉 You're all set to start developing!**
