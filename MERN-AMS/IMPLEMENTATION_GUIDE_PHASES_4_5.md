# Implementation Guide: Phases 4-5

**Document Purpose:** Quick reference for implementing Heats Scoring, Pre-Final Sheet, Finals, and PDF export

---

## Phase 4: Heats Scoring & Pre-Final Sheet

### 4.1 Heats Scoring Stage

**New Stage Location:** Between current Stage 7 (Generate Heats) and Stage 8 (Pre-Final Sheet)

#### Backend Setup

**Route:** `POST /api/events/:eventId/heats`

```javascript
// Add to backend/routes/events.js

router.post('/:eventId/heats', async (req, res) => {
  try {
    const { heats, metadata } = req.body;
    // heats: [{ heatNo, athletes: [{ athleteId, lane, performance }] }, ...]
    // metadata: { timestamp, scoredBy, remarks }

    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Store heats results
    event.heatsResults = heats;
    event.heatsMetadata = metadata;

    await event.save();

    res.json({ 
      success: true,
      message: 'Heats results saved',
      heatsCount: heats.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

#### Frontend Setup

**Component Structure:**

```jsx
function StageHeatsScoring() {
  // State: heatsWithResults = { heatNo: 1, athletes: [{}, ...], status: 'scoring'|'complete' }
  // State: scores = { athleteId: "00:20:50" }
  
  return (
    <div>
      <h3>Stage 7: Heats Scoring</h3>
      
      {/* Heat Navigation Tabs */}
      <div className="flex gap-2 mb-4">
        {appState.heats.map(heat => (
          <button
            key={heat.heatNo}
            onClick={() => setCurrentHeat(heat.heatNo)}
            className={`px-4 py-2 rounded ${
              currentHeat === heat.heatNo ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            Heat {heat.heatNo}
          </button>
        ))}
      </div>
      
      {/* Current Heat Table */}
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Lane</th>
              <th>Chest No</th>
              <th>Name</th>
              <th>College</th>
              <th>Performance</th>
            </tr>
          </thead>
          <tbody>
            {appState.heats
              .find(h => h.heatNo === currentHeat)
              ?.athletes.map((athlete, idx) => (
                <tr key={athlete.athleteId}>
                  <td className="text-center font-bold">{athlete.lane}</td>
                  <td className="text-center">{athlete.bibNumber}</td>
                  <td>{athlete.name}</td>
                  <td>{athlete.college}</td>
                  <td>
                    <TimeInput
                      athleteId={athlete.athleteId}
                      defaultValue={scores[athlete.athleteId] || ""}
                      onCommit={(id, val) => handleScoreChange(id, val)}
                      onKeyDown={(e, id) => handleTabInHeats(e, id)}
                    />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      
      {/* Complete & Save Heats */}
      <button onClick={completeHeatsScoring} className="bg-blue-600 text-white px-6 py-2 rounded mt-4">
        ✓ Complete Heats & Save Results
      </button>
    </div>
  );
}
```

**Key Function: Auto-select Top 8 from Heats**

```javascript
const completeHeatsScoring = async () => {
  // 1. Flatten all heats results
  const allResults = [];
  for (const heat of appState.heats) {
    for (const athlete of heat.athletes) {
      allResults.push({
        athleteId: athlete.athleteId,
        bibNumber: athlete.bibNumber,
        name: athlete.name,
        college: athlete.college,
        performance: scores[athlete.athleteId] || "99:59:99:99",
        heatNo: heat.heatNo,
        lane: athlete.lane
      });
    }
  }

  // 2. Sort by performance (fastest first)
  const sorted = allResults.sort((a, b) => {
    const msA = digitsToMs(a.performance);
    const msB = digitsToMs(b.performance);
    return msA - msB;
  });

  // 3. If came from Top 16, select Top 8 for Finals
  let finalAthletes = [];
  if (appState.topSelection === 16) {
    finalAthletes = sorted.slice(0, 8);
    console.log('📌 Auto-selected Top 8 from heats for Finals:', finalAthletes);
  } else if (appState.topSelection === 8) {
    finalAthletes = sorted; // All 8 go to finals
  }

  // 4. Update stage
  setAppState(prev => ({
    ...prev,
    heatsResults: allResults,
    finalAthletes: finalAthletes,
    statusFlow: { ...prev.statusFlow, heatsScored: true }
  }));

  // 5. Save to database
  await saveHeatsResults(allResults);
  
  // 6. Proceed to Stage 8: Pre-Final Sheet
  setCurrentStage(8);
};
```

---

### 4.2 Pre-Final Sheet Update

**Current Stage 8 Concerns:**
- Currently shows athletes from `round1Results` qualified
- Should now show the Top 8 selected from heats with correct lanes

**Update Logic:**

```jsx
function Stage8PreFinalSheet() {
  // Use finalAthletes (from heats results) instead of round1Results
  const athletes = appState.finalAthletes || appState.round1Results.slice(0, 8);

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Stage 8: Pre-Final Sheet - Top 8 Athletes</h3>
      
      <div className="bg-blue-50 p-4 rounded mb-4">
        <p className="text-sm text-gray-700">
          These 8 athletes qualified from heats to compete in the Final.
          Lanes are assigned based on heats seeding.
        </p>
      </div>

      <div className="overflow-x-auto mb-6">
        <table className="w-full border-collapse border border-gray-400">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 text-center">RANK</th>
              <th className="p-2 text-center">LANE</th>
              <th className="p-2 text-center">CHEST NO</th>
              <th className="p-2">NAME</th>
              <th className="p-2">COLLEGE</th>
              <th className="p-2 text-center">HEATS TIME</th>
            </tr>
          </thead>
          <tbody>
            {athletes.map((a, idx) => (
              <tr key={a._id || a.id} className="border-b">
                <td className="p-2 text-center font-bold">{idx + 1}</td>
                <td className="p-2 text-center text-lg font-bold text-blue-600">{a.lane || "-"}</td>
                <td className="p-2 text-center">{a.bibNumber}</td>
                <td className="p-2">{a.name}</td>
                <td className="p-2">{typeof a.college === 'object' ? a.college?.name : a.college}</td>
                <td className="p-2 text-center">{a.performance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Print button */}
      <button 
        onClick={() => printSheet('preFinal')}
        className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
      >
        🖨 Print Pre-Final Sheet
      </button>
    </div>
  );
}
```

---

## Phase 5: Final Scoring & Announcement

### 5.1 Final Scoring Stage

**Similar to Round 1, but with only 8 athletes**

```jsx
function Stage9FinalScoring() {
  const inputRefsMap = React.useRef({});

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Stage 9: Final Scoring - Top 8</h3>
      
      <div className="overflow-x-auto mb-6">
        <table className="w-full border-collapse border border-gray-400">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 text-center">LANE</th>
              <th className="p-2 text-center">CHEST NO</th>
              <th className="p-2">NAME</th>
              <th className="p-2">COLLEGE</th>
              <th className="p-2 text-center">FINAL TIME</th>
              <th className="p-2 text-center">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {appState.finalAthletes.map((a, idx) => {
              const aid = a._id || a.id;
              const isDisabled = scoreStatus[aid] === "DNF" || scoreStatus[aid] === "DIS";
              return (
                <tr key={aid} className="border-b">
                  <td className="p-2 text-center font-bold text-blue-600">{a.lane}</td>
                  <td className="p-2 text-center">{a.bibNumber}</td>
                  <td className="p-2">{a.name}</td>
                  <td className="p-2">{a.college}</td>
                  <td className="p-2 text-center">
                    <TimeInput
                      ref={el => inputRefsMap.current[`final-${aid}`] = el}
                      athleteId={aid}
                      disabled={isDisabled}
                      defaultValue={formatTimeInput(scores[aid] || "")}
                      onCommit={(id, val) => setScores(prev => ({ ...prev, [id]: val }))}
                    />
                  </td>
                  <td className="p-2 text-center">
                    <select value={scoreStatus[aid] || "OK"} onChange={(e) => updateStatus(aid, e.target.value)}>
                      <option value="OK">✓ OK</option>
                      <option value="DNF">⚠ DNF</option>
                      <option value="DIS">✗ DIS</option>
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button onClick={completeFinalScoring} className="bg-blue-600 text-white px-6 py-2 rounded">
        ✓ Complete Final & Calculate Results
      </button>
    </div>
  );
}

const completeFinalScoring = () => {
  // 1. Rank finalists by performance
  const ranked = appState.finalAthletes
    .map(a => ({
      ...a,
      performance: scores[a._id || a.id] || "99:59:99:99"
    }))
    .sort((a, b) => digitsToMs(a.performance) - digitsToMs(b.performance))
    .map((a, idx) => ({
      ...a,
      rank: idx + 1,
      points: [5, 3, 1, 0, 0, 0, 0, 0][idx] // 5 for 1st, 3 for 2nd, 1 for 3rd
    }));

  // 2. Update state
  setAppState(prev => ({
    ...prev,
    finalResults: ranked,
    statusFlow: { ...prev.statusFlow, finalScored: true }
  }));

  // 3. Move to announcement
  setCurrentStage(10);
};
```

### 5.2 Final Announcement

**Already implemented, just ensure it displays correctly**

```jsx
function Stage10FinalAnnouncement() {
  return (
    <div>
      <h3 className="text-2xl font-bold mb-6 text-center">🏆 Final Results & Winners</h3>

      <div className="overflow-x-auto mb-6">
        <table className="w-full border-collapse border border-gray-400">
          <thead>
            <tr className="bg-yellow-100">
              <th className="p-3 text-center">RANK</th>
              <th className="p-3 text-center">MEDAL</th>
              <th className="p-3 text-center">CHEST NO</th>
              <th className="p-3">NAME</th>
              <th className="p-3">COLLEGE</th>
              <th className="p-3 text-center">FINAL TIME</th>
              <th className="p-3 text-center">POINTS</th>
            </tr>
          </thead>
          <tbody>
            {appState.finalResults.map((a, idx) => {
              let medal = '';
              if (a.rank === 1) medal = '🥇 GOLD';
              else if (a.rank === 2) medal = '🥈 SILVER';
              else if (a.rank === 3) medal = '🥉 BRONZE';
              
              return (
                <tr key={a._id || a.id} className={`border-b ${
                  idx === 0 ? 'bg-yellow-50' : idx === 1 ? 'bg-gray-50' : idx === 2 ? 'bg-orange-50' : ''
                }`}>
                  <td className="p-3 text-center font-bold text-lg">{a.rank}</td>
                  <td className="p-3 text-center text-2xl">{medal}</td>
                  <td className="p-3 text-center">{a.bibNumber}</td>
                  <td className="p-3">{a.name}</td>
                  <td className="p-3">{a.college}</td>
                  <td className="p-3 text-center font-mono font-bold">{a.performance}</td>
                  <td className="p-3 text-center font-bold">{a.points} pts</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button onClick={() => printSheet('finalAnnouncement')} className="bg-green-600 text-white px-6 py-2 rounded">
        🖨 Print Final Announcement
      </button>
    </div>
  );
}
```

---

## PDF Export Implementation

### Backend Setup

**Route:** `POST /api/events/:eventId/print`

```javascript
// Add to backend/routes/events.js

router.post('/:eventId/print', async (req, res) => {
  try {
    const { sheetType, heatNo } = req.body;
    // sheetType: 'callRoom' | 'heats' | 'preFinal' | 'final'
    
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Generate HTML based on sheet type
    let htmlContent = generateHTMLForSheet(event, sheetType, heatNo);

    // Convert to PDF using html2pdf or Puppeteer
    // const pdf = await htmlToPdf(htmlContent);
    
    res.json({ 
      success: true,
      message: 'PDF generated',
      html: htmlContent // For now, return HTML
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function generateHTMLForSheet(event, sheetType, heatNo) {
  // Implement based on sheet type
  // Return formatted HTML string
}
```

### Frontend: Print Buttons

```jsx
// Add to relevant stages

const printSheet = async (sheetType) => {
  try {
    const eventId = appState.event?._id || appState.event?.id;
    const response = await axios.post(
      `${API_BASE_URL}/api/events/${eventId}/print`,
      { sheetType }
    );
    
    // For now, use existing printSheet function
    printSheet(response.data.html, `${sheetType}-${new Date().toISOString().split('T')[0]}`);
  } catch (err) {
    console.error('Error printing sheet:', err);
  }
};
```

---

## Testing Workflow

### Phase 4 Testing
```
1. Create event (Track)
2. Add 18 athletes
3. Mark 16 as PRESENT
4. Stage 5: Score Round 1
5. Stage 6: Select Top 16
6. Stage 7: Generate Heats
   - Verify: 2 heats of 8
7. NEW Stage 7.5: Score Heats (Implement)
   - Score each heat
   - Auto-select Top 8
8. Stage 8: Pre-Final (Update)
   - Verify: 8 athletes with lanes
9. Stop here for Phase 4
```

### Phase 5 Testing
```
10. Stage 9: Final Scoring (Implement)
    - Score 8 athletes
    - Verify: Tab navigation works
11. Stage 10: Final Announcement (Verify existing)
    - Check: Medals assigned (1st/2nd/3rd)
    - Check: Points assigned (5/3/1)
12. Print each sheet (Implement)
    - Verify: PDF generation
    - Verify: Lane numbers correct
```

---

## Key Implementation Notes

1. **Tab Navigation in Heats:** Use same pattern as Round 1
   - Ref map: `heats-${athleteId}`
   - Navigate within current heat's athletes

2. **Auto-selection Logic:** 
   - If Top 16 → Select best 8 from heats
   - If Top 8 → All 8 go to finals

3. **Lane Preservation:**
   - Keep athlete.lane from heats through finals
   - Display prominently in Pre-Final and Final sheets

4. **Database Consistency:**
   - Save heatsResults after scoring
   - Save finalResults after final scoring
   - Calculate combined points after finals

5. **Error Handling:**
   - Validate all required athletes have performances
   - Handle DNF/DIS in finals
   - Show warnings if athlete missing data

---

**Next Review:** After Phase 4 completion
**Estimated Time:** 4-6 hours for Phase 4, 3-4 hours for Phase 5
