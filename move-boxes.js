const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/programaciones/surgery-form.tsx', 'utf8');

const s1 = '<div className="grid grid-cols-1 md:grid-cols-2 gap-6">';
const s2 = '{/* Action button to continue */}';

const startIdx = content.indexOf(s1);
const endIdx = content.indexOf(s2, startIdx);

if (startIdx === -1 || endIdx === -1) {
    console.error('Cannot find block');
    process.exit(1);
}

const blockToMove = content.substring(startIdx, endIdx);

// Remove the block from Section 1
content = content.substring(0, startIdx) + content.substring(endIdx);

// Insert before the button in Section 2
// we will search for the Siguiente Paso of Section 2 which is toggleSection('team')
const btnS2 = '<button type="button" onClick={() => toggleSection(\'team\')}';
const btnS2Idx = content.indexOf(btnS2);

if (btnS2Idx === -1) {
    console.error('Cannot find button index');
    process.exit(1);
}

// But we want to inject it before the div that wraps the button
const divBtnS2 = '<div className="pt-2 flex justify-end">';
// Find the last index of divBtnS2 BEFORE btnS2Idx
const injectIdx = content.lastIndexOf(divBtnS2, btnS2Idx);

// Insert
content = content.substring(0, injectIdx) + blockToMove + '\n                            ' + content.substring(injectIdx);

fs.writeFileSync('src/app/dashboard/programaciones/surgery-form.tsx', content);
console.log('Successfully moved block!');
