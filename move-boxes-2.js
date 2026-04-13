const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/programaciones/surgery-form.tsx', 'utf8');

const s1 = '<div className="grid grid-cols-1 md:grid-cols-2 gap-6">';
const s2 = '                            {/* Action button to continue */}';

const startIdx = content.indexOf(s1);
const endIdx = content.indexOf(s2, startIdx);

if (startIdx === -1 || endIdx === -1) {
    console.error('Extraction points not found');
    process.exit(1);
}

const blockToMove = content.substring(startIdx, endIdx);

// Remove block from Section 1
content = content.replace(blockToMove, '');

// Insert block into Section 2
const insertionPointStr = '                            <div className="pt-2 flex justify-end">\n                                <button type="button" onClick={() => toggleSection(\'team\')}';

// We insert it BEFORE the div wrapper of the Action button
content = content.replace(insertionPointStr, blockToMove + '\n                            ' + insertionPointStr);

fs.writeFileSync('src/app/dashboard/programaciones/surgery-form.tsx', content);
console.log('Moved successfully!');
