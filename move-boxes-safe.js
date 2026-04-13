const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/programaciones/surgery-form.tsx', 'utf8');

const s1 = '<div className="grid grid-cols-1 md:grid-cols-2 gap-6">';
const startIdx = content.indexOf(s1);

// We need to find the ending div right BEFORE the button for Section 1 'Siguiente Paso'.
const s2 = '                            {/* Action button to continue */}';
const endIdx = content.indexOf(s2, startIdx);

console.log('startIdx', startIdx, 'endIdx', endIdx);

if (startIdx !== -1 && endIdx !== -1) {
    let blockToMove = content.substring(startIdx, endIdx);
    console.log('Block size:', blockToMove.length, 'characters.');

    // Where do we want to insert it in Section 2?
    // Let's search exactly for the Action button wrapper in Section 2
    // That means we search for Section 3 string, and then run backwards to find the Section 2 button.
    const s3 = '{/* --- SECCIÓN 3: AGENDA Y SALA --- */}';
    const s3Idx = content.indexOf(s3);
    
    // backwards from s3Idx, find 'Siguiente Paso' button wrapper.
    const divWrap = '<div className="pt-2 flex justify-end">';
    let btnIdx = content.lastIndexOf(divWrap, s3Idx);
    
    if (btnIdx !== -1) {
        console.log('Found insertion point at:', btnIdx);
        
        // Ensure block has right padding
        blockToMove = blockToMove + '\n                            ';
        
        let newContent = content.substring(0, startIdx) + content.substring(endIdx);
        
        // Re-find insertion point after content shift
        const newS3Idx = newContent.indexOf(s3);
        const newInsertIdx = newContent.lastIndexOf(divWrap, newS3Idx);
        
        newContent = newContent.substring(0, newInsertIdx) + blockToMove + newContent.substring(newInsertIdx);
        fs.writeFileSync('src/app/dashboard/programaciones/surgery-form.tsx', newContent);
        console.log('Applied cleanly!');
    } else {
        console.error('Could not find insertion point!');
    }
}
