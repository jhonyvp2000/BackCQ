const fs = require('fs');
let content = fs.readFileSync('src/app/actions/cirugias.ts', 'utf8');

// The marker pattern for start of editSurgery
const startMarker = 'export async function editSurgery(formData: FormData) {';
// The marker for the end of editSurgery (before deleteSurgery)
const endMarker = 'export async function deleteSurgery(formData: FormData) {';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
    console.error('Could not find markers');
    process.exit(1);
}

// Read the new code
const newEditLogic = fs.readFileSync('edit.txt', 'utf8');

// Slice out the old
const newContent = content.substring(0, startIndex) + newEditLogic + '\n\n' + content.substring(endIndex);

fs.writeFileSync('src/app/actions/cirugias.ts', newContent);
console.log('Successfully replaced editSurgery!');
