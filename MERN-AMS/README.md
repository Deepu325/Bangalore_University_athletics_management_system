# BU-AMS: Bangalore University Athletic Meet Management System
## MERN Stack Implementation

A complete athletic meet management system built with **React + Express + MongoDB + Node.js** (MERN Stack).

## 📂 Project Structure

```
MERN-AMS/
├── frontend/                      # React Frontend
│   ├── public/
│   │   └── index.html            # Main HTML
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx   # Home page (🔥 FIRST PAGE)
│   │   │   └── AdminDashboard.jsx # Admin Panel
│   │   ├── components/
│   │   │   └── AthleteRegistration.jsx  # Nested inside Admin Panel
│   │   └── index.jsx             # React entry point
│   └── package.json
│
├── backend/                       # Express Backend
│   ├── models/
│   │   └── index.js              # MongoDB Schemas
│   ├── routes/
│   │   ├── colleges.js           # College APIs
│   │   ├── athletes.js           # Athlete APIs
│   │   └── events.js             # Event APIs
│   ├── server.js                 # Main server file
│   ├── .env.example              # Environment variables
│   └── package.json
│
└── README.md                      # This file
```

## 🎯 Architecture Flow

### Landing Page (First Page - User Entry Point)
- **URL**: `http://localhost:3000`
- Shows event categories
- Displays MERN Stack features
- Has Admin Login button

### Admin Panel (Protected Dashboard)
- **URL**: `http://localhost:3000/admin`
- Left sidebar with navigation
- Multiple sections: Dashboard, Colleges, Athletes, Events, Results

### Athlete Registration (Nested Component)
- **Location**: Inside Admin Dashboard → "Athlete Registration" menu
- College selection dropdown
- Gender-based tabs (Men/Women)
- Add/Edit/Delete athletes
- Event assignment (Individual + Relay events)

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v16+)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Edit .env and add MongoDB URI
# MONGO_URI=mongodb://localhost:27017/bu-ams

# Start backend server
npm run dev
# or
npm start
```

Backend will run on: `http://localhost:5000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start frontend development server
npm run dev
```

Frontend will run on: `http://localhost:3000`

## 📊 Database Schema

### College Collection
```javascript
{
  _id: ObjectId,
  code: String (unique),      // "RVCE"
  name: String,               // "RV College of Engineering"
  pedName: String,            // "Dr. Kumar"
  phone: String,              // "9876543210"
  email: String,
  createdAt: Date
}
```

### Athlete Collection
```javascript
{
  _id: ObjectId,
  name: String,               // "John Doe"
  uucms: String,             // Optional
  gender: String,            // "Male" or "Female"
  chestNo: String (unique),  // "M001"
  collegeId: ObjectId,       // Reference to College
  event1: String,            // "100m"
  event2: String,            // "200m"
  relay1: String,            // "4x100m Relay"
  relay2: String,
  mixedRelay: String,        // "4x400m Mixed Relay"
  createdAt: Date
}
```

### Event Collection
```javascript
{
  _id: ObjectId,
  name: String,              // "100m"
  gender: String,            // "Men", "Women", or "Mixed"
  category: String,          // "Track", "Jump", "Throw", "Relay", "Combined"
  date: Date,
  time: String,              // "09:00"
  venue: String,             // "Main Stadium"
  stage: String,             // Event progress stage
  stageIndex: Number,
  createdAt: Date
}
```

## 🔌 API Endpoints

### Colleges
- `GET /api/colleges` - Get all colleges
- `GET /api/colleges/:id` - Get specific college
- `POST /api/colleges` - Create college
- `PATCH /api/colleges/:id` - Update college
- `DELETE /api/colleges/:id` - Delete college

### Athletes
- `GET /api/athletes` - Get all athletes
- `GET /api/athletes/college/:collegeId` - Get athletes by college
- `GET /api/athletes/:id` - Get specific athlete
- `POST /api/athletes` - Create athlete
- `PATCH /api/athletes/:id` - Update athlete
- `DELETE /api/athletes/:id` - Delete athlete

### Events
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get specific event
- `POST /api/events` - Create event
- `PATCH /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

## 🎨 UI Components

### Landing Page
- Hero section with MERN stack branding
- Event categories display
- Admin login button
- Footer with links

### Admin Dashboard
- Overview with statistics
- Sidebar navigation
- Four main sections:
  1. **Dashboard Overview** - Stats and quick start guide
  2. **Manage Colleges** - View and manage colleges
  3. **Athlete Registration** - Register athletes (nested component)
  4. **Event Management** - Create and manage events
  5. **Results & Scoring** - View and publish results

### Athlete Registration Component
- College selector
- Gender tabs (Men/Women)
- Athlete data form:
  - Name (required)
  - UUCMS No (optional)
  - Event 1 & 2 (track/field)
  - Relay 1 & 2 (relay events)
- Athlete list table with actions
- Export to PDF functionality

## 🔐 Authentication
- Currently demo mode (no actual auth)
- Ready for JWT implementation
- User roles: Admin, PED, Viewer

## 🛠️ Technologies Used

### Frontend
- **React 18** - UI library
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **React Router** - Routing (optional)

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication (ready)
- **CORS** - Cross-origin requests

## 📝 Sample Data

### Pre-seeded Colleges
1. **RVCE** - RV College of Engineering (Dr. Kumar)
2. **BMSCE** - BMS College of Engineering (Prof. Sharma)
3. **MSRIT** - MS Ramaiah Institute of Technology (Dr. Patel)

### Event Categories
- Track Events: 100m, 200m, 400m, 800m, Hurdles, etc.
- Jump Events: Long Jump, High Jump, Pole Vault, Triple Jump
- Throw Events: Shot Put, Discus, Javelin, Hammer
- Relay Events: 4x100m, 4x400m, Mixed Relay
- Combined Events: Decathlon, Heptathlon

## 🚀 Future Enhancements

- [ ] JWT-based authentication
- [ ] Real-time scoring updates (WebSocket)
- [ ] PDF report generation
- [ ] Email notifications
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] Advanced analytics
- [ ] Video integration for live events
- [ ] Medal tally calculations
- [ ] Heat generation algorithms

## 📞 Support

For issues or questions, please contact the development team.

## 📄 License

© 2024 Bangalore University. All rights reserved.

---

**Happy Coding! 🎉**
