const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '../front-end/src/pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix double backtick: ``), -> `),  and ``); -> `); and ``, -> `,  etc.
  const before = content;
  content = content.replace(/``/g, '`');
  
  if (before !== content) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed double backtick: ${file}`);
  } else {
    console.log(`⏭️  No change: ${file}`);
  }
});

// Also fix App.jsx and AuthContext.jsx
const srcDir = path.join(__dirname, '../front-end/src');
['App.jsx', 'context/AuthContext.jsx', 'pages/LoginPage.jsx'].forEach(rel => {
  const filePath = path.join(srcDir, rel);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  const before = content;
  content = content.replace(/``/g, '`');
  if (before !== content) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${rel}`);
  }
});

console.log('Done!');
