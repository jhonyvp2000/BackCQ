const PizZip = require('pizzip');
const fs = require('fs');

const content = fs.readFileSync('public/templates/nota_generica.docx', 'binary');
const zip = new PizZip(content);
let xml = zip.files['word/document.xml'].asText();

// Extraemos la cabecera (sectPr y propiedades del documento) para no romper el formato de página
const sectPrMatch = xml.match(/<w:sectPr[^]*?<\/w:sectPr>/);
const sectPr = sectPrMatch ? sectPrMatch[0] : '';

// Reconstruimos el body desde cero para asegurar que NO haya rastro de la nota SIGA
const newBody = `
<w:body>
    <w:p><w:pPr><w:jc w:val="center"/><w:rPr><w:b/><w:u w:val="single"/></w:rPr></w:pPr>
        <w:r><w:t>NOTA DE COORDINACION N° {numero_correlativo}-{anio_curso}- OGESS ESPECIALIZADA-HOSPITAL II-2T/DCQX</w:t></w:r>
    </w:p>
    <w:p/>
    <w:p><w:pPr><w:ind w:left="2880" w:hanging="2880"/></w:pPr>
        <w:r><w:b/><w:t>A                          :  </w:t></w:r>
        <w:r><w:t>{destinatario_nombre}</w:t></w:r>
    </w:p>
    <w:p><w:pPr><w:ind w:left="2880" w:hanging="2880"/></w:pPr>
        <w:r><w:t>                                {destinatario_cargo}</w:t></w:r>
    </w:p>
    <w:p/>
    <w:p><w:pPr><w:ind w:left="2880" w:hanging="2880"/></w:pPr>
        <w:r><w:b/><w:t>ASUNTO             :    </w:t></w:r>
        <w:r><w:t>{asunto}</w:t></w:r>
    </w:p>
    <w:p><w:pPr><w:ind w:left="2880" w:hanging="2880"/></w:pPr>
        <w:r><w:b/><w:t>REFERENCIA     :    </w:t></w:r>
        <w:r><w:t>{referencia}</w:t></w:r>
    </w:p>
    <w:p><w:pPr><w:ind w:left="2880" w:hanging="2880"/></w:pPr>
        <w:r><w:b/><w:t>FECHA                :    </w:t></w:r>
        <w:r><w:t>{fecha_documento}</w:t></w:r>
    </w:p>
    <w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="12" w:space="1" w:color="000000"/></w:pBdr></w:pPr></w:p>
    <w:p/>
    <w:p><w:r><w:t>{cuerpo_documento}</w:t></w:r></w:p>
    <w:p/>
    <w:p><w:r><w:t>Atentamente,</w:t></w:r></w:p>
    <w:p/>
    <w:p/>
    <w:p/>
    <w:p><w:r><w:t>JRB/acs</w:t></w:r></w:p>
    <w:p><w:r><w:t>C.c:</w:t></w:r></w:p>
    <w:p/>
    <w:p><w:r><w:t>Reg. N° {num_seguimiento}</w:t></w:r></w:p>
    ${sectPr}
</w:body>
`;

xml = xml.replace(/<w:body>[^]*?<\/w:body>/, newBody);

zip.file('word/document.xml', xml);
fs.writeFileSync('public/templates/nota_generica.docx', zip.generate({type:'nodebuffer'}));
console.log('Template reconstructed from scratch with clean body');
