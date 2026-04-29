const PizZip = require('pizzip');
const fs = require('fs');

const content = fs.readFileSync('public/templates/nota_generica.docx', 'binary');
const zip = new PizZip(content);
let xml = zip.files['word/document.xml'].asText();

function cleanParagraph(xml, tagToFind, newContent) {
    // Busca el párrafo que contiene la etiqueta (puede estar dividida)
    // Usamos una búsqueda más flexible para la etiqueta
    const tagPattern = tagToFind.split('').join('[^>]*');
    const regex = new RegExp('<w:p [^>]*>(?:(?!<w:p ).)*' + tagPattern + '[^]*?</w:p>', 'g');
    
    return xml.replace(regex, (match) => {
        // Encontramos el párrafo. Ahora lo reemplazamos por uno limpio.
        // Mantenemos las propiedades del párrafo (w:pPr) si existen
        const pPrMatch = match.match(/<w:pPr>[^]*?<\/w:pPr>/);
        const pPr = pPrMatch ? pPrMatch[0] : '';
        
        return `<w:p>${pPr}<w:r><w:t>${newContent}</w:t></w:r></w:p>`;
    });
}

// Limpiamos los párrafos problemáticos
xml = cleanParagraph(xml, 'bien_compra', 'ASUNTO             :    {asunto}');
xml = cleanParagraph(xml, 'referencia', 'REFERENCIA     :    {referencia}');
xml = cleanParagraph(xml, 'descripcion_compra', '{cuerpo_documento}');
xml = cleanParagraph(xml, 'numero_pedido_siga', '');

zip.file('word/document.xml', xml);
fs.writeFileSync('public/templates/nota_generica.docx', zip.generate({type:'nodebuffer'}));
console.log('Template deep cleaned and tags standardized');
