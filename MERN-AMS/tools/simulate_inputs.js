// Simulation of TimeInput and DecimalInput logic for testing

function timeInputProcess(rawInput, cursorPos) {
  // This simulates the behavior of the TimeInput's handleInput logic.
  // rawInput: the current text in the input (what the user typed)
  // cursorPos: caret position (0-based) before formatting
  const val = (rawInput || '').toUpperCase();

  // Special cases: DNF/DIS
  if (val === 'DNF' || val === 'DIS') {
    return { formatted: val, cursor: val.length };
  }
  if (val.startsWith('D')) {
    // allow typing partial D/DI
    return { formatted: val, cursor: val.length };
  }

  // Normal time logic: digits only
  let raw = val.replace(/\D/g, '').slice(0, 8);
  raw = raw.padStart(8, '0');

  const hh = raw.slice(0, 2);
  const mm = raw.slice(2, 4);
  const ss = raw.slice(4, 6);
  const ms = raw.slice(6, 8);

  const formatted = `${hh}:${mm}:${ss}:${ms}`;

  // Adjust cursor: if cursor is at 2,5,8 increment by 1 to skip colon
  let newCursor = cursorPos;
  if ([2,5,8].includes(cursorPos)) newCursor = cursorPos + 1;
  // Bound cursor
  if (newCursor > formatted.length) newCursor = formatted.length;

  return { formatted, cursor: newCursor };
}

function decimalInputProcess(rawInput) {
  let val = (rawInput || '').toUpperCase();

  if (val === 'DNF' || val === 'DIS' || val.startsWith('D')) {
    return val;
  }

  val = val.replace(/[^\d.]/g, '');
  if (val.includes('.')) {
    const [p, d] = val.split('.');
    val = p + '.' + (d || '').slice(0,2);
  }
  return val;
}

function timeSequenceTest(sequence) {
  console.log('--- Time typing sequence test ---');
  let input = '';
  let cursor = 0;
  for (let ch of sequence) {
    input += ch;
    cursor = input.length; // typing at end
    const res = timeInputProcess(input, cursor);
    console.log(`typed='${input}' -> formatted='${res.formatted}' (cursor=${res.cursor})`);
  }
}

function disSequence() {
  console.log('--- DIS typing test ---');
  const steps = ['d','i','s'];
  let input = '';
  for (let ch of steps) {
    input += ch;
    const res = timeInputProcess(input, input.length);
    console.log(`typed='${input}' -> formatted='${res.formatted}'`);
  }
}

function dnfSequence() {
  console.log('--- DNF typing test ---');
  const steps = ['d','n','f'];
  let input = '';
  for (let ch of steps) {
    input += ch;
    const res = timeInputProcess(input, input.length);
    console.log(`typed='${input}' -> formatted='${res.formatted}'`);
  }
}

function decimalTest(sequence) {
  console.log('--- Decimal typing test ---');
  let input = '';
  for (let ch of sequence) {
    input += ch;
    const out = decimalInputProcess(input);
    console.log(`typed='${input}' -> '${out}'`);
  }
}

function rankingTest(){
  console.log('--- Ranking test ---');
  const MEDAL_POINTS = {1:5,2:3,3:1};
  function timeToMs(t){
    if(!t) return 1e12;
    if(typeof t !== 'string') return 1e12;
    const parts = t.split(':').map(p => parseInt(p)||0);
    if(parts.length===4) return parts[0]*3600000 + parts[1]*60000 + parts[2]*1000 + parts[3];
    if(parts.length===3) return parts[0]*60000 + parts[1]*1000 + parts[2];
    return 1e12;
  }

  const rankByPerformance = (list, type) => {
    const normal = [];
    const dnf = [];
    const dis = [];

    list.forEach(a => {
      const p = (a.performance || '').toUpperCase();
      if (p === 'DIS') dis.push(a);
      else if (p === 'DNF') dnf.push(a);
      else normal.push(a);
    });

    if (type === 'track' || type === 'relay') {
      normal.sort((a,b)=> timeToMs(a.performance) - timeToMs(b.performance));
    } else {
      normal.sort((a,b)=> (parseFloat(b.performance)||0) - (parseFloat(a.performance)||0));
    }

    const ranked = [...normal, ...dnf, ...dis];
    ranked.forEach((a,i)=>{ a.rank = i+1; a.points = MEDAL_POINTS[a.rank]||0 });
    return ranked;
  }

  const athletes = [
    {name:'A', performance:'00:00:10:00'},
    {name:'B', performance:'DNF'},
    {name:'C', performance:'00:00:09:00'},
    {name:'D', performance:'DIS'},
    {name:'E', performance:'00:00:11:00'}
  ];
  const ranked = rankByPerformance(athletes, 'track');
  ranked.forEach(a=> console.log(`${a.rank}: ${a.name} - ${a.performance} (points=${a.points})`));
}

// Run tests
console.log('Simulating input behavior...');
// Test 1 sequence: typing digits to get 00:00:25:26
timeSequenceTest(['0','0','0','0','2','5','2','6']);

// Test DIS
disSequence();

// Test DNF
dnfSequence();

// Decimal input tests
decimalTest(['7','.','2','3','9','1']);
decimalTest(['d','n','f']);

// Ranking
rankingTest();

console.log('Simulation complete.');
