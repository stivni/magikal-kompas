// Bundelt data/parks/*.json -> data.js (window.PARK_DATA)
// Zo werkt de tool door index.html simpelweg te openen, zonder server.
// Gebruik:  node data/build-data.mjs   (vanuit de projectmap)
import fs from 'fs';
import path from 'path';
const dir = path.join('data','parks');
const files = fs.readdirSync(dir).filter(f=>f.endsWith('.json')).sort();
const parks = files.map(f=>JSON.parse(fs.readFileSync(path.join(dir,f),'utf8')));
const out = 'window.PARK_DATA = ' + JSON.stringify(parks) + ';\n';
fs.writeFileSync('data.js', out);
const n = parks.reduce((a,p)=>a+p.rides.length,0);
console.log(`data.js geschreven: ${parks.length} parken, ${n} attracties`);
