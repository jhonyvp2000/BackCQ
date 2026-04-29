const xlsx = require('xlsx');
const mammoth = require('mammoth');
const fs = require('fs');

async function readFiles() {
  console.log("=== EXCEL INSTRUCTIONS ===");
  try {
    const workbook = xlsx.readFile('./no_copiar _a_produccion/Instrucciones JVP_01.xlsx');
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Error reading Excel:", e.message);
  }

  console.log("\n=== WORD TEMPLATE (JVP_01.docx) ===");
  try {
    const result = await mammoth.extractRawText({path: './no_copiar _a_produccion/JVP_01.docx'});
    console.log(result.value);
  } catch (e) {
    console.error("Error reading Word:", e.message);
  }
}

readFiles();
