// src/utils/timeLogic.js

/**
 * Parses Socrata restroom strings to determine an "Open Now" confidence.
 * Returns: 'open', 'maybe', 'closed', or 'unknown'
 */
export function getOpenStatus(restroom, currentDate = new Date()) {
  const statusStr = (restroom.status || '').toLowerCase();
  if (statusStr.includes('closed') || statusStr.includes('not operational')) {
    return 'closed';
  }

  const openStr = (restroom.open || '').toLowerCase(); // 'seasonal' or 'year round'
  const hoursStr = (restroom.hours_of_operation || '').toLowerCase();
  
  // Seasonal Logic
  // JS Months: 0 = Jan, 11 = Dec.
  const m = currentDate.getMonth();
  const isWinter = m === 11 || m === 0 || m === 1; // Dec, Jan, Feb
  const isSummer = m >= 5 && m <= 7; // Jun, Jul, Aug
  const isSpringFall = m > 1 && !isWinter && !isSummer; // Mar, Apr, May, Sep, Oct, Nov
  
  let maxConfidence = 'open'; // Starts optimistic

  if (openStr.includes('seasonal')) {
    if (isWinter) return 'closed'; // Seasonal definitely closed in winter
    if (isSpringFall) maxConfidence = 'maybe'; // Shoulder season is unpredictable
  }

  // If no hours known, fallback to maxConfidence
  if (!hoursStr) {
     return statusStr.includes('operational') ? 'maybe' : 'unknown';
  }

  if (hoursStr.includes('closed')) return 'closed';

  // Extract base times
  const currentHour = currentDate.getHours(); // 0-23
  const currentMin = currentDate.getMinutes();
  const currentTotalMins = currentHour * 60 + currentMin;

  // Dusk/Dawn mapping based on season
  let duskHour = 20; // 8 PM default (Summer)
  if (isSpringFall) duskHour = 19; // 7 PM
  if (isWinter) duskHour = 17; // 5 PM
  
  let dawnHour = 6; // 6 AM

  let startMins = null;
  let endMins = null;

  if (hoursStr.includes('dawn')) {
    startMins = dawnHour * 60;
  }
  if (hoursStr.includes('dusk')) {
    endMins = duskHour * 60;
  }

  // Regex extract simple time like "8:00 am", "7 pm", "8 a.m.", "7 p.m."
  const timeRegex = /(1[0-2]|0?[1-9])(?::([0-5][0-9]))?\s*([aA]\.?[mM]\.?|[pP]\.?[mM]\.?)/g;
  const matches = [...hoursStr.matchAll(timeRegex)];
  
  if (matches.length > 0 && !startMins) {
    startMins = parseMins(matches[0]);
  }
  if (matches.length > 1 && !endMins) {
    endMins = parseMins(matches[1]);
  } else if (matches.length === 1 && !endMins && !hoursStr.includes('dusk')) {
    // single time found (might be closing time)
    // simplistic fallback depending on if it matches PM
    if (matches[0][3] === 'pm') {
      endMins = parseMins(matches[0]);
      startMins = dawnHour * 60;
    } else {
      startMins = parseMins(matches[0]);
      endMins = duskHour * 60;
    }
  }

  if (startMins !== null && endMins !== null) {
     // Boundary check
     if (currentTotalMins < startMins || currentTotalMins > endMins) {
         return 'closed'; // clearly outside hours
     }
     
     // Fuzz Factor: if we are within 45 minutes of closing time, drop confidence to maybe
     if (currentTotalMins >= endMins - 45) {
         return 'maybe';
     }

     return maxConfidence; // 'open' or 'maybe' based on Seasonal checks
  }
  
  // Parsing failed entirely, but we have an "Operational" status
  return 'maybe';
}

function parseMins(match) {
  let hr = parseInt(match[1], 10);
  let mn = match[2] ? parseInt(match[2], 10) : 0;
  let ampm = match[3].replace(/\./g, '').toLowerCase(); // remove dots
  
  if (ampm === 'pm' && hr < 12) hr += 12;
  if (ampm === 'am' && hr === 12) hr = 0;
  
  return (hr * 60) + mn;
}
