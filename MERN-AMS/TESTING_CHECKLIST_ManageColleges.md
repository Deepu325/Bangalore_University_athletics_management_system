# ManageColleges Testing Checklist

## Pre-Flight Checks

- [ ] Backend running on http://localhost:5000
- [ ] Frontend running on http://localhost:3000
- [ ] MongoDB connected and accessible
- [ ] Admin login working
- [ ] "Manage Colleges" button visible in Admin Dashboard

## Functional Testing

### 1. List Colleges ✅
- [ ] Navigate to "Manage Colleges" page
- [ ] Table displays all existing colleges
- [ ] Table shows columns: SL, Name, Code, PED Name, Phone, Actions
- [ ] Loading indicator works
- [ ] Empty state message appears when no colleges

### 2. Create College ✅
- [ ] Form appears on left side
- [ ] All input fields are present and labeled
- [ ] Click "Create College" button works
- [ ] Success toast appears after creation
- [ ] New college appears in table immediately
- [ ] Check database: College document created
- [ ] Check database: PED User created with username=college name

**Test Data:**
```
Name: Soundarya SIMS
Code: SIMS001
PED Name: Dr. Harish P M
Phone: 9876543210
```

### 3. Validation ✅
- [ ] Submit form with empty Name field → Error toast "College Name is required"
- [ ] Submit form with empty Code field → Error toast "College Code is required"
- [ ] Submit form with empty PED Name field → Error toast "PED Name is required"
- [ ] Submit form with empty Phone field → Error toast "PED Phone is required"
- [ ] Submit form with invalid phone (e.g., "123") → Error toast about phone format
- [ ] Submit form with duplicate college name → Error toast "already exists"
- [ ] Submit form with duplicate code → Error toast "already in use"

### 4. Edit College ✅
- [ ] Click "Edit" button on a college
- [ ] Form pre-fills with college data
- [ ] Heading changes to "Edit College"
- [ ] Modify any field
- [ ] Click "Update College" button
- [ ] Success toast "College updated"
- [ ] Table immediately reflects changes
- [ ] Check database: PED User username updated
- [ ] Check database: mustChangePassword flag set

**Edit Test:**
```
Original: Name="SIMS001", Code="SIMS", Phone="9876543210"
Updated:  Name="SIMS Bangalore", Code="SIMSBL", Phone="9898989898"
```

### 5. Delete College ✅
- [ ] Click "Delete" button on a college
- [ ] Confirmation dialog appears: "Delete this college?..."
- [ ] Click "Cancel" → Dialog closes, nothing deleted
- [ ] Click "Delete" again → "Delete" button in dialog
- [ ] Success toast "College deleted"
- [ ] College removed from table
- [ ] Check database: College document deleted
- [ ] Check database: PED User for that college deleted

### 6. Delete Protection ✅
- [ ] Create a college
- [ ] Create an athlete registered to that college (via Athlete Registration)
- [ ] Try to delete the college
- [ ] Error toast appears: "Cannot delete — college has active athlete registrations."
- [ ] College remains in table
- [ ] Check database: College still exists

### 7. Form Clear Button ✅
- [ ] Fill form with data
- [ ] Click "Clear" button
- [ ] All fields become empty
- [ ] Heading remains "Add College"
- [ ] editingId cleared (not in edit mode)

### 8. Responsiveness ✅
- [ ] Test on desktop (full grid layout: 360px form + table)
- [ ] Test on tablet (600px width)
- [ ] Test on mobile (< 600px width, single column)
- [ ] Table horizontal scroll works on mobile
- [ ] Form stays usable on all screen sizes

## UI/UX Testing

- [ ] Toast notifications display for 3-5 seconds then auto-hide
- [ ] Error toasts are red background
- [ ] Success toasts are green background
- [ ] Hover effects work on buttons
- [ ] Form inputs have focus state (blue border)
- [ ] Buttons are clearly labeled and clickable
- [ ] Table is readable and sortable

## Performance Testing

- [ ] Page loads quickly (< 2 seconds)
- [ ] List displays smoothly with 50+ colleges
- [ ] Form submission responds quickly (< 1 second)
- [ ] No console errors
- [ ] No memory leaks observed

## API Testing (Using Postman or curl)

### Create College
```
POST http://localhost:5000/api/colleges
Content-Type: application/json

{
  "name": "Test College",
  "code": "TC001",
  "pedName": "Dr. Test",
  "pedPhone": "9999999999"
}

Expected: 201 Created with college object
```

### List Colleges
```
GET http://localhost:5000/api/colleges

Expected: 200 OK with array of colleges
```

### Update College
```
PUT http://localhost:5000/api/colleges/{collegId}
Content-Type: application/json

{
  "name": "Updated College",
  "code": "TC002",
  "pedName": "Dr. Updated",
  "pedPhone": "8888888888"
}

Expected: 200 OK with updated college
```

### Delete College
```
DELETE http://localhost:5000/api/colleges/{collegeId}

Expected: 200 OK with { ok: true }
or 400 Bad Request with error message if college has athletes
```

## Database Verification

### Check Colleges Collection
```javascript
db.colleges.find()

Expected output:
[
  {
    _id: ObjectId(...),
    name: "Test College",
    code: "TC001",
    pedName: "Dr. Test",
    pedPhone: "9999999999",
    createdAt: ISODate(...)
  }
]
```

### Check Users Collection
```javascript
db.users.find({ role: "ped" })

Expected output:
[
  {
    _id: ObjectId(...),
    username: "Test College",           // matches college name
    password: "$2a$10$...",             // hashed phone
    role: "ped",
    collegeId: ObjectId(...),           // reference to college
    createdAt: ISODate(...)
  }
]
```

## Edge Cases

- [ ] Create college with spaces in name → Trimmed correctly
- [ ] Create college with special characters → Handled or error shown
- [ ] Very long college name (100+ chars) → Handled correctly
- [ ] Phone number at min length (6 digits) → Accepted
- [ ] Phone number at max length (15 digits) → Accepted
- [ ] Rapid succession of create/update/delete → No race conditions
- [ ] Network error during API call → Error toast shown gracefully

## Security Testing

- [ ] No sensitive data (passwords) displayed in UI
- [ ] No API calls expose unnecessary data
- [ ] Admin-only access enforced (can enhance with middleware)
- [ ] No XSS vulnerabilities in inputs
- [ ] Passwords properly hashed in database

## Final Verification

- [ ] All CRUD operations work correctly
- [ ] Data persists in database
- [ ] No console errors or warnings
- [ ] UI is intuitive and responsive
- [ ] Error handling is graceful
- [ ] Toast notifications are clear and helpful

---

## Sign-off

- **Tested by:** ___________________
- **Date:** ___________________
- **Notes:** ___________________

✅ **Status:** Ready for Production

---

**Contact:** deepukc2526@gmail.com
**Guided By:** Dr. Harish P M, HOD - PED, SIMS
