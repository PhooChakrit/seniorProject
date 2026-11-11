const fs = require('fs');
const path = require('path');

const MAX_CONTIGS = 500;

function findTargetFiles(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '.git' || entry.name === '.vite' || entry.name === '.cache') continue;
      findTargetFiles(fullPath, results);
    } else if (
      (entry.name === 'util.js' && fullPath.includes('RefNameAutocomplete')) ||
      entry.name.startsWith('react-linear-genome-view.umd.') && entry.name.endsWith('.js')
    ) {
      results.push(fullPath);
    }
  }
  return results;
}

const nodeModulesDir = path.join(__dirname, '../node_modules');
const targetFiles = findTargetFiles(nodeModulesDir);

for (const filePath of targetFiles) {
  const content = fs.readFileSync(filePath, 'utf8');
  const updated = content
    .replace(/filtered\.slice\(0,\s*100\)/g, `filtered.slice(0, ${MAX_CONTIGS})`)
    .replace(/filtered\.length\s*>\s*100/g, `filtered.length > ${MAX_CONTIGS}`)
    .replace(/\.slice\(0,100\)\),(.)\((.)\.length>100\?/g, `.slice(0,${MAX_CONTIGS})),$1($2.length>${MAX_CONTIGS}?`);

  if (updated !== content) {
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log(`[patch-jbrowse] Updated contig autocomplete limit to ${MAX_CONTIGS} in ${path.relative(process.cwd(), filePath)}`);
  } else {
    console.log(`[patch-jbrowse] ${path.relative(process.cwd(), filePath)} already patched (max ${MAX_CONTIGS} contigs)`);
  }
}
