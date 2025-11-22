# Stage 4 Present Athlete Filtering - Quick Test Guide

## Issue Fixed
**Before:** Stage 4 showed 19 athletes (including ABSENT/DIS) when should show 16 (PRESENT only)
**After:** Stage 4 now shows only PRESENT athletes across all event types

## What Was Changed
- `generateEventSheets()` now filters athletes before passing to generation functions
- All Stage 4 preview displays filter PRESENT athletes
- All print functions filter PRESENT athletes before PDF generation

## Quick Test Steps

### Test Case 1: Track Event
1. Create track event with 20 registered athletes
2. Go to Stage 3 (Complete Call Room)
3. Mark: 16 PRESENT, 2 ABSENT, 2 DISQUALIFIED
4. Verify summary shows: PRESENT: 16 | ABSENT: 2 | DIS: 2
5. Proceed to Stage 4
6. Click "Generate Sheets"
7. ✅ **Verify Preview**: Should show heats with ONLY 16 athletes total
8. ✅ **Verify Print**: PDF should contain ONLY 16 athletes
9. ✅ **Verify Count**: "Heat 1 (8 athletes)" + "Heat 2 (8 athletes)" = 16 total

### Test Case 2: Relay Event
1. Create relay event with 20 registered athletes
2. Go to Stage 3 and mark attendance (16 PRESENT, 4 ABSENT/DIS)
3. Proceed to Stage 4
4. Click "Generate Sheets"
5. ✅ **Verify**: Preview shows heats with ONLY 16 athletes
6. ✅ **Verify**: Each heat shows correct athlete count

### Test Case 3: Jump/Throw Event
1. Create jump or throw event with mixed attendance
2. Go to Stage 3 and mark attendance
3. Proceed to Stage 4 and generate sheets
4. ✅ **Verify**: Preview shows ONLY PRESENT athletes
5. ✅ **Verify**: Set count matches PRESENT athletes only

### Test Case 4: Combined Event (Decathlon/Heptathlon)
1. Create decathlon/heptathlon event with mixed attendance
2. Mark attendance in Stage 3
3. Proceed to Stage 4 and generate sheets
4. ✅ **Verify**: Preview shows ONLY PRESENT athletes
5. ✅ **Verify**: Day 1 and Day 2 sheets show same athletes

## Expected Behavior After Fix
- Stage 4 preview always shows only PRESENT athletes
- Heat/set counts in preview match actual athlete count
- PDF prints contain only PRESENT athletes
- No ABSENT or DISQUALIFIED athletes appear anywhere in Stage 4

## Troubleshooting
If you still see ABSENT/DIS athletes:

1. **Check Stage 3**: Verify attendance was actually marked
   - Summary should show PRESENT count ≠ total athletes

2. **Clear browser cache**: 
   - Ctrl+F5 in browser or Clear Cache in DevTools

3. **Check appState**: 
   - Open browser DevTools Console
   - Check if athletes have `status` field set to "PRESENT"

4. **Verify print function**:
   - The PDF preview should be filtered
   - Check browser Console for any errors

## Files Modified
- `EventManagementNew.jsx` - generateEventSheets() and all display/print functions

## Validation
- ✅ No code errors found
- ✅ All event types updated (Track, Relay, Jump, Throw, Combined)
- ✅ Filtering applied at 3 levels (input, display, output)
