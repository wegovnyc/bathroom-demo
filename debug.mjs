import fs from 'fs';
import { getOpenStatus } from './src/utils/timeLogic.js';

fetch('https://data.cityofnewyork.us/resource/i7jb-7jku.json?$limit=5000')
  .then(res => res.json())
  .then(data => {
    fs.writeFileSync('data.json', JSON.stringify(data));
    const now = new Date('2026-03-31T15:30:00-04:00');
    let counts = {open:0, maybe:0, closed:0, unknown:0};
    
    data.forEach(d => {
      counts[getOpenStatus(d, now)]++;
    });
    console.log('Results:', counts);
    
    let yr = 0, szn = 0, blank = 0;
    data.forEach(d => {
      const o = (d.open||'').toLowerCase();
      const h = d.hours_of_operation||'';
      if(o.includes('year round')) yr++;
      if(o.includes('seasonal')) szn++;
      if(!h) blank++;
    });
    console.log('Total:', data.length, 'Year Round:', yr, 'Seasonal:', szn, 'Blank hours:', blank);
    
    const openExamples = data.filter(d => getOpenStatus(d, now) === 'open').slice(0, 3);
    if(openExamples.length === 0) {
      const yrSample = data.find(d => (d.open||'').toLowerCase().includes('year round') && d.hours_of_operation);
      console.log('Why is this not open?', yrSample, 'status:', getOpenStatus(yrSample, now));
    } else {
      console.log('Open examples:', openExamples.map(d=>d.hours_of_operation));
    }
  });
