const fs = require('fs');
const path = require('path');

const MAX_CONTIGS = 500;

const targetFiles = [
  path.join(
    __dirname,
    '../node_modules/@jbrowse/plugin-linear-genome-view/dist/LinearGenomeView/components/RefNameAutocomplete/util.js'
  ),
  path.join(
    __dirname,
    '../node_modules/@jbrowse/plugin-linear-genome-view/esm/LinearGenomeView/components/RefNameAutocomplete/util.js'
  ),
];

for (const filePath of targetFiles) {
  if (!fs.existsSync(filePath)) continue;
  const content = fs.readFileSync(filePath, 'utf8');
  const updated = content
    .replace(/filtered\.slice\(0,\s*100\)/g, `filtered.slice(0, ${MAX_CONTIGS})`)
    .replace(/filtered\.length\s*>\s*100/g, `filtered.length > ${MAX_CONTIGS}`);

  if (updated !== content) {
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log(`[patch-jbrowse] Updated contig autocomplete limit to ${MAX_CONTIGS} in ${path.relative(process.cwd(), filePath)}`);
  } else {
    console.log(`[patch-jbrowse] ${path.relative(process.cwd(), filePath)} already patched (max ${MAX_CONTIGS} contigs)`);
  }
}
