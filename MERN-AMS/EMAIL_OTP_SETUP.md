# Email OTP Setup Guide

Your BU-AMS application now supports **sending OTPs via Gmail**. Follow these steps to set it up:

## Step 1: Create a Gmail App Password

1. Go to **Google Account Settings**: https://myaccount.google.com/
2. Click **Security** in the left sidebar
3. Scroll down to **App passwords** (you may need to enable 2-factor authentication first)
4. Select **Mail** and **Windows Computer** (or your device)
5. Google will generate a 16-character app password
6. Copy this password

## Step 2: Update Backend `.env` File

Edit `backend/.env` and replace the placeholders:

```
PORT=5000

# Gmail Configuration (using App Password from Step 1)
GMAIL_USER=your-email@gmail.com
GMAIL_PASSWORD=your-app-password-here

# OTP Settings
OTP_EXPIRY=600000
```

**Example:**
```
PORT=5000
GMAIL_USER=deepukc2526@gmail.com
GMAIL_PASSWORD=abcd efgh ijkl mnop
OTP_EXPIRY=600000
```

## Step 3: Test the Setup

1. **Backend is running at**: `http://localhost:5000`
2. **Frontend is running at**: `http://localhost:3000`

3. Navigate to Login page and enter: `admin@bu-ams.edu.in`
4. Click "Send OTP"
5. Check your Gmail inbox for the OTP email
6. The OTP will be valid for 10 minutes

## Features Implemented

✅ **Send OTP via Email**: Sends a formatted HTML email with the 6-digit OTP
✅ **OTP Verification**: Validates OTP against stored value with expiry
✅ **Error Handling**: Comprehensive error messages for network/email issues
✅ **Secure**: OTP expires after 10 minutes
✅ **Console Logging**: Backend also logs OTP to console for testing (can be removed in production)

## API Endpoints

**Send OTP:**
```
POST /api/auth/send-otp
Body: { "email": "admin@bu-ams.edu.in" }
```

**Verify OTP:**
```
POST /api/auth/verify-otp
Body: { "email": "admin@bu-ams.edu.in", "otp": "123456" }
```

## Testing Without Gmail Setup

For testing purposes, the backend logs the OTP to console:
```
📧 OTP for admin@bu-ams.edu.in: 123456 (Valid for 10 minutes)
```

You can copy this OTP from the terminal output without setting up Gmail.

## Troubleshooting

**Issue**: Email not received
- **Solution**: Check spam/promotions folder in Gmail
- **Solution**: Verify GMAIL_USER and GMAIL_PASSWORD are correct in `.env`
- **Solution**: Ensure 2-factor authentication is enabled on your Gmail account

**Issue**: "Invalid app password"
- **Solution**: Generate a new app password from https://myaccount.google.com/apppasswords
- **Solution**: Use exactly 16 characters (ignore spaces when copying)

**Issue**: CORS error when sending OTP
- **Solution**: Ensure backend is running on port 5000
- **Solution**: Check that frontend API URL is `http://localhost:5000`

## Production Deployment

For production:
1. Use a dedicated email service account
2. Store credentials securely using environment variables
3. Remove console logging of OTP
4. Consider using SendGrid, AWS SES, or Mailgun for better reliability
5. Implement rate limiting on OTP requests
