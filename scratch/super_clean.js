const PizZip = require('pizzip');
const fs = require('fs');

const content = fs.readFileSync('public/templates/nota_generica.docx', 'binary');
const zip = new PizZip(content);
let xml = zip.files['word/document.xml'].asText();

function superReplace(xml, searchText, replacement) {
    // Esta regex busca el texto ignorando cualquier tag XML intermedio (como <w:rPr>, <w:t>, etc.)
    const pattern = searchText.split('').map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('(?:<[^>]+>)*');
    const regex = new RegExp(pattern, 'g');
    return xml.replace(regex, replacement);
}

// Limpiamos las etiquetas rotas primero
xml = superReplace(xml, '{bien_compra}', '{asunto}');
xml = superReplace(xml, '{doc_referencia}', '{referencia}');
xml = superReplace(xml, '{descripcion_compra}', '{cuerpo_documento}');
xml = superReplace(xml, '{numero_pedido_siga}', '');

// Ahora limpiamos los bloques de texto estáticos que estorban
xml = superReplace(xml, 'REMITE PEDIDO DE COMPRA DE', '');
xml = superReplace(xml, 'NOTA DE COORDINACIÓN N°', '');
xml = superReplace(xml, 'EL PEDIDO DE COMPRA – SIGA , Para', '');
xml = superReplace(xml, 'PARA EL SERVICIO DE CENTRO QUIRÚRGICO DEL HOSPITAL II-2 TARAPOTO de la OGESS ESPECIALIZADA.', '');
xml = superReplace(xml, 'PEDIDO COMPRA N°', '');
xml = superReplace(xml, 'Reg.N° 025-2024_______________', 'Reg. N° {num_seguimiento}');

zip.file('word/document.xml', xml);
fs.writeFileSync('public/templates/nota_generica.docx', zip.generate({type:'nodebuffer'}));
console.log('Template super cleaned');
