import fs from 'fs';
import { getOpenStatus } from './src/utils/timeLogic.js';
const data = JSON.parse(fs.readFileSync('data.json'));
const now = new Date('2026-03-31T15:30:00-04:00');

let reasons = { blank: 0, seasonal_shoulder: 0, near_close: 0, parse_failed: 0, closed_fallthrough: 0 };
data.forEach(d => {
  if (getOpenStatus(d, now) === 'maybe') {
      const h = (d.hours_of_operation||'').toLowerCase();
      if(!h) { reasons.blank++; return; }
      
      const m = now.getMonth();
      const isSpringFall = m > 1 && !(m === 11 || m === 0 || m === 1) && !(m >= 5 && m <= 7);
      if((d.open||'').toLowerCase().includes('seasonal') && isSpringFall) { reasons.seasonal_shoulder++; return; }
      
      const timeRegex = /(1[0-2]|0?[1-9])(?::([0-5][0-9]))?\s*([aApP][mM])/g;
      const matches = [...h.matchAll(timeRegex)];
      let startMins=null, endMins=null;
      if (h.includes('dawn')) startMins = 6*60;
      if (h.includes('dusk')) endMins = 19*60;
      if (matches.length > 0 && !startMins) startMins = 1;
      if (matches.length > 1 && !endMins) endMins = 1;
      
      if (startMins !== null && endMins !== null) {
          reasons.near_close++;
      } else {
          reasons.parse_failed++;
          if (reasons.parse_failed < 5) console.log("Failed to Parse:", h);
      }
  }
});

console.log('Maybe Reasons:', reasons);
