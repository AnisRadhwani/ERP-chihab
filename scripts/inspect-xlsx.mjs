import XLSX from "xlsx";

const filePath = process.argv[2];
const wb = XLSX.readFile(filePath);
const sheetName = wb.SheetNames[0];
const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: "" });

console.log("SHEETS:", wb.SheetNames);
console.log("ROW_COUNT:", rows.length);
console.log("COLUMNS:", Object.keys(rows[0] || {}));
console.log("SAMPLE:", JSON.stringify(rows.slice(0, 5), null, 2));
