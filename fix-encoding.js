import fs from 'fs';

const files = [
    'src/app/dashboard/programaciones/surgery-form.tsx',
    'src/app/actions/cirugias.ts',
    'src/app/dashboard/programaciones/surgery-view-toggle.tsx'
];

for (const file of files) {
    if (!fs.existsSync(file)) continue;
    
    let content = fs.readFileSync(file, 'utf8');
    
    content = content
        .replace(/Ã¡/g, 'á')
        .replace(/Ã©/g, 'é')
        .replace(/Ã³/g, 'ó')
        .replace(/Ã­/g, 'í')
        .replace(/Ãº/g, 'ú')
        .replace(/Ã±/g, 'ñ')
        .replace(/Ã‘/g, 'Ñ')
        .replace(/Â°/g, '°')
        .replace(/Ã“/g, 'Ó')
        .replace(/Ã /g, 'Á')
        .replace(/Ã‰/g, 'É')
        .replace(/Ã /g, 'Í')
        .replace(/Ãš/g, 'Ú')
        .replace(/Ã¼/g, 'ü');
        
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Fixed ${file}`);
}
