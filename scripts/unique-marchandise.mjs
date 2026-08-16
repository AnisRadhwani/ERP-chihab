import XLSX from "xlsx";

const filePath = process.argv[2];
const wb = XLSX.readFile(filePath);
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
const unique = [...new Set(rows.map((r) => r.Marchandise))];
console.log("UNIQUE MARCHANDISE:", unique.length);
unique.forEach((m) => console.log("-", m));
