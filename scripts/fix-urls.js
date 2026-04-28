const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '../front-end/src/pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx'));

const OLD = 'https://tienda-rosastore.onrender.com';
const NEW = '${import.meta.env.VITE_API_URL}';

files.forEach(file => {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace 'https://...' with `${import.meta.env.VITE_API_URL}...`
  // Pattern: opening ' before the URL, closing ' after the URL path
  const regex = new RegExp(`'${OLD.replace(/\./g, '\\.')}(/[^']*)'`, 'g');
  content = content.replace(regex, (match, p1) => {
    return '`' + NEW + p1 + '`';
  });
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Fixed: ${file}`);
});

console.log('All done!');
