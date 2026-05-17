const fs = require('fs');
fs.writeFileSync('.env', 'VITE_ANTHROPIC_API_KEY=PLACEHOLDER', 'utf8');
console.log('.env created with UTF-8 encoding');
