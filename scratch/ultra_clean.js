const PizZip = require('pizzip');
const fs = require('fs');

const content = fs.readFileSync('public/templates/nota_generica.docx', 'binary');
const zip = new PizZip(content);
let xml = zip.files['word/document.xml'].asText();

function superReplace(xml, searchText, replacement) {
    // Escapamos el texto de búsqueda y permitimos cualquier cantidad de tags o espacios entre cada letra
    const pattern = searchText.split('').map(c => {
        if (c === ' ') return '\\s*';
        return c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:<[^>]+>|\\s)*';
    }).join('');
    const regex = new RegExp(pattern, 'g');
    return xml.replace(regex, replacement);
}

// Limpiamos con regex ultra flexible
xml = superReplace(xml, '{bien_compra}', '{asunto}');
xml = superReplace(xml, '{doc_referencia}', '{referencia}');
xml = superReplace(xml, '{descripcion_compra}', '{cuerpo_documento}');
xml = superReplace(xml, '{numero_pedido_siga}', '');

// Limpiamos los bloques de texto estáticos
xml = superReplace(xml, 'REMITE PEDIDO DE COMPRA DE', '');
xml = superReplace(xml, 'NOTA DE COORDINACIÓN N°', '');
xml = superReplace(xml, 'EL PEDIDO DE COMPRA – SIGA', '');
xml = superReplace(xml, 'Para {cuerpo_documento} PARA EL SERVICIO DE CENTRO QUIRÚRGICO DEL HOSPITAL II-2 TARAPOTO de la OGESS ESPECIALIZADA.', '{cuerpo_documento}');
xml = superReplace(xml, 'Es grato dirigirme a usted para saludarle cordialmente y al mismo tiempo, en respuesta al documento de la referencia se envía', '');
xml = superReplace(xml, 'PEDIDO COMPRA N°', '');
xml = superReplace(xml, 'Reg.N° 025-2024_______________', 'Reg. N° {num_seguimiento}');

zip.file('word/document.xml', xml);
fs.writeFileSync('public/templates/nota_generica.docx', zip.generate({type:'nodebuffer'}));
console.log('Template ultra cleaned');
