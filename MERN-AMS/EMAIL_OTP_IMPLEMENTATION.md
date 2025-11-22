# BU-AMS Email OTP Implementation - Summary

## What's New

✅ **Email-based OTP System Implemented**
- OTPs are now sent to Gmail instead of appearing in console
- Uses Node.js Nodemailer package for email delivery
- OTPs expire after 10 minutes for security
- Backend validates OTPs before granting access

## How It Works

1. **User enters email** (admin@bu-ams.edu.in) on login page
2. **Backend generates OTP** and sends it via Gmail
3. **User receives email** with formatted 6-digit OTP
4. **User enters OTP** on the verification screen
5. **Backend validates** the OTP and grants access to role selection

## Setup Instructions

### Quick Start (For Testing Without Gmail)

The backend logs all OTPs to console, so you can test without Gmail setup:

```
1. Start backend: npm start
2. Start frontend: npm run dev
3. Navigate to http://localhost:3000
4. Enter: admin@bu-ams.edu.in
5. Check backend terminal for OTP (shows: "📧 OTP for admin@bu-ams.edu.in: 123456")
6. Enter OTP on login page
```

### Full Setup (With Gmail)

See `EMAIL_OTP_SETUP.md` in the project root for complete Gmail configuration.

## Files Modified

**Backend:**
- `backend/server.js` - Added email OTP endpoints and Nodemailer configuration
- `backend/.env` - Added Gmail credentials (create this file with your settings)
- `backend/package.json` - Added nodemailer dependency

**Frontend:**
- `frontend/src/pages/LoginPage.jsx` - Updated to call email OTP API
- Removed local OTP generation, now uses backend API

## API Endpoints

```
POST /api/auth/send-otp
- Body: { "email": "admin@bu-ams.edu.in" }
- Returns: { "message": "OTP sent to your email" }

POST /api/auth/verify-otp
- Body: { "email": "admin@bu-ams.edu.in", "otp": "123456" }
- Returns: { "message": "OTP verified successfully", "verified": true }
```

## Application Status

✅ **Backend**: Running on http://localhost:5000
✅ **Frontend**: Running on http://localhost:3000
✅ **Compilation**: Both apps compile without errors
✅ **Email OTP**: Ready (API implemented)

## Login Credentials

**Admin Login:**
- Email: `admin@bu-ams.edu.in`
- OTP: Check email or backend console
- Admin names: Admin One, Admin Two, Admin Three, Admin Four
- Password: `12345`

**PED User Login:**
- Username: `harish_pm`, `rajesh_k`, `meera_sharma`, or `anita_singh`
- Password: `password123`

## Next Steps

1. **Configure Gmail** (optional for testing):
   - Follow instructions in `EMAIL_OTP_SETUP.md`
   - Update `backend/.env` with your Gmail credentials

2. **Test the application**:
   - Visit http://localhost:3000
   - Test admin login with email OTP
   - Test PED user login
   - Verify both dashboards work

3. **Production Deployment** (future):
   - Remove OTP logging from console
   - Use dedicated email service (SendGrid, AWS SES)
   - Add rate limiting for OTP requests
   - Implement proper error handling

## Architecture

```
┌─────────────────────────────────────────────┐
│         React Frontend (3000)               │
│  LoginPage → API Call → OTP Verification   │
└──────────────────┬──────────────────────────┘
                   │
                   ↓ HTTP
┌─────────────────────────────────────────────┐
│      Express Backend (5000)                 │
│  /api/auth/send-otp → Generate & Email OTP │
│  /api/auth/verify-otp → Validate & Verify  │
└──────────────────┬──────────────────────────┘
                   │
                   ↓ SMTP
┌─────────────────────────────────────────────┐
│          Gmail SMTP Server                  │
│  (Sends OTP emails to user)                 │
└─────────────────────────────────────────────┘
```

## Troubleshooting

**Issue**: Email not arriving
- Check backend console for OTP (shows even if email fails)
- Verify .env file has correct Gmail credentials
- Check Gmail spam/promotions folder

**Issue**: CORS error from frontend
- Ensure backend is running on port 5000
- Check API URL in frontend is `http://localhost:5000`

**Issue**: OTP expired
- OTP is valid for 10 minutes
- Request new OTP by clicking "Send OTP" again

For more details, see `EMAIL_OTP_SETUP.md`.
