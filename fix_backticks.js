const fs = require('fs');
const path = require('path');

const filesToFix = [
  'app/api/hospital/capacity/route.ts',
  'app/api/hospital/dashboard/route.ts',
  'app/api/hospital/inventory/route.ts',
  'app/api/hospital/register/route.ts',
  'app/hospital-dashboard/inventory/page.tsx',
  'app/hospital-dashboard/layout.tsx',
  'app/hospital-dashboard/page.tsx',
  'app/hospital-dashboard/routine-data/page.tsx',
  'app/hospital/register/page.tsx'
];

filesToFix.forEach(relPath => {
  const fullPath = path.join('c:/Users/HP/arogya-platform', relPath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    // Replace incorrectly escaped backticks
    content = content.replace(/\\\`/g, '\`');
    // Also, I noticed in page.tsx I escaped the string interpolation \${
    content = content.replace(/\\\$/g, '$');
    fs.writeFileSync(fullPath, content);
    console.log('Fixed', relPath);
  } else {
    console.log('Not found', relPath);
  }
});
