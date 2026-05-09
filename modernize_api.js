const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'frontend', 'src');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.jsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk(srcDir);
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const oldLine = /const API_BASE = 'http:\/\/127.0.0.1:3001\/api';/g;
    const newLine = 'const API_BASE = `http://${window.location.hostname}:3001/api`;';
    
    if (content.includes("const API_BASE = 'http://127.0.0.1:3001/api';")) {
        content = content.replace(oldLine, newLine);
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated: ${path.basename(file)}`);
    }
});
console.log('All API addresses have been modernized!');
