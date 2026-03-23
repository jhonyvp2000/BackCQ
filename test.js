const patSearchTerm = "raul vela amasi";
const patSearchTermsArr = patSearchTerm.toLowerCase().trim().split(/\s+/).filter(Boolean);

const localPatients = [
  { pii: { nombres: "JONAS", apellidos: "PAREDES TUANAMA", dni: "92472774" }, id: "__api_pat__92472774" }
];

let filteredPatList = localPatients.filter(pat => {
    if (patSearchTermsArr.length === 0) return true;
    const fullText = (`${pat.pii?.nombres} ${pat.pii?.apellidos} ${pat.pii?.dni}`).toLowerCase();
    return patSearchTermsArr.every(term => fullText.includes(term));
});

console.log("Filtered Length:", filteredPatList.length);
console.log("Filtered Docs:", filteredPatList);
