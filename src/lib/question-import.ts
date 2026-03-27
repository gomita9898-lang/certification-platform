import * as XLSX from "xlsx";

// --- Types ---

export interface ImportModule {
  id: string;
  title_pt: string;
  title_en: string;
}

export interface ImportOption {
  text_pt: string;
  text_en: string;
  is_correct: boolean;
  order_index: number;
}

export interface ParsedQuestion {
  rowNumber: number;
  module_id: string | null;
  module_title_pt: string;
  question_pt: string;
  question_en: string;
  explanation_pt: string | null;
  explanation_en: string | null;
  is_exam_question: boolean;
  options: ImportOption[];
  errors: string[];
  isValid: boolean;
}

export interface ParseResult {
  questions: ParsedQuestion[];
  totalRows: number;
  validCount: number;
  errorCount: number;
}

// --- Helpers ---

function normalizeString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeBoolean(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "boolean") return value;
  const str = String(value).trim().toUpperCase();
  return str === "TRUE" || str === "1" || str === "YES" || str === "SIM";
}

function matchModule(
  titlePt: string,
  modules: ImportModule[],
): ImportModule | null {
  if (!titlePt) return null;
  const normalized = titlePt.trim().toLowerCase();
  return (
    modules.find((m) => m.title_pt.trim().toLowerCase() === normalized) ?? null
  );
}

// --- Parse file ---

export async function parseQuestionFile(
  file: File,
  modules: ImportModule[],
): Promise<ParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Convert to array of objects with headers
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  const questions: ParsedQuestion[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const rowNumber = i + 2; // +2 because row 1 is headers, data starts at row 2
    const errors: string[] = [];

    // Extract required fields
    const moduleTitlePt = normalizeString(row["module_title_pt"]);
    const questionPt = normalizeString(row["question_pt"]);
    const questionEn = normalizeString(row["question_en"]);
    const explanationPt = normalizeString(row["explanation_pt"]) || null;
    const explanationEn = normalizeString(row["explanation_en"]) || null;
    const isExamQuestion = normalizeBoolean(row["is_exam_question"]);

    // Validate required fields
    if (!moduleTitlePt) errors.push("module_title_pt is required");
    if (!questionPt) errors.push("question_pt is required");
    if (!questionEn) errors.push("question_en is required");

    // Match module
    let moduleId: string | null = null;
    if (moduleTitlePt) {
      const matchedModule = matchModule(moduleTitlePt, modules);
      if (matchedModule) {
        moduleId = matchedModule.id;
      } else {
        errors.push(`Module not found: "${moduleTitlePt}"`);
      }
    }

    // Parse options (up to 4)
    const options: ImportOption[] = [];
    for (let optIdx = 1; optIdx <= 4; optIdx++) {
      const textPt = normalizeString(row[`option_${optIdx}_pt`]);
      const textEn = normalizeString(row[`option_${optIdx}_en`]);
      const isCorrect = normalizeBoolean(row[`option_${optIdx}_correct`]);

      if (textPt || textEn) {
        if (!textPt) {
          errors.push(`option_${optIdx}_pt is required when option_${optIdx}_en is provided`);
        }
        if (!textEn) {
          errors.push(`option_${optIdx}_en is required when option_${optIdx}_pt is provided`);
        }
        options.push({
          text_pt: textPt,
          text_en: textEn,
          is_correct: isCorrect,
          order_index: optIdx,
        });
      } else if (optIdx <= 2) {
        // Options 1 and 2 are required
        errors.push(`option_${optIdx}_pt and option_${optIdx}_en are required`);
      }
    }

    // Validate at least one correct answer
    if (options.length > 0 && !options.some((o) => o.is_correct)) {
      errors.push("At least one option must be marked as correct");
    }

    // Validate at least 2 options
    if (options.length < 2) {
      errors.push("At least 2 options are required");
    }

    questions.push({
      rowNumber,
      module_id: moduleId,
      module_title_pt: moduleTitlePt,
      question_pt: questionPt,
      question_en: questionEn,
      explanation_pt: explanationPt,
      explanation_en: explanationEn,
      is_exam_question: isExamQuestion,
      options,
      errors,
      isValid: errors.length === 0,
    });
  }

  return {
    questions,
    totalRows: questions.length,
    validCount: questions.filter((q) => q.isValid).length,
    errorCount: questions.filter((q) => !q.isValid).length,
  };
}

// --- Generate template ---

export function generateQuestionTemplate(modules: ImportModule[]): void {
  const headers = [
    "module_title_pt",
    "question_pt",
    "question_en",
    "explanation_pt",
    "explanation_en",
    "is_exam_question",
    "option_1_pt",
    "option_1_en",
    "option_1_correct",
    "option_2_pt",
    "option_2_en",
    "option_2_correct",
    "option_3_pt",
    "option_3_en",
    "option_3_correct",
    "option_4_pt",
    "option_4_en",
    "option_4_correct",
  ];

  const moduleName = modules.length > 0 ? modules[0].title_pt : "Nome do Modulo";

  const exampleRows = [
    [
      moduleName,
      "Qual e a resposta correta?",
      "What is the correct answer?",
      "A resposta correta e a opcao A.",
      "The correct answer is option A.",
      "FALSE",
      "Opcao A",
      "Option A",
      "TRUE",
      "Opcao B",
      "Option B",
      "FALSE",
      "Opcao C",
      "Option C",
      "FALSE",
      "Opcao D",
      "Option D",
      "FALSE",
    ],
    [
      moduleName,
      "Exemplo de pergunta 2",
      "Example question 2",
      "",
      "",
      "FALSE",
      "Verdadeiro",
      "True",
      "TRUE",
      "Falso",
      "False",
      "FALSE",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
  ];

  const worksheetData = [headers, ...exampleRows];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Auto-size columns
  const colWidths = headers.map((header, i) => {
    const maxDataLen = exampleRows.reduce((max, row) => {
      const cellLen = String(row[i] ?? "").length;
      return Math.max(max, cellLen);
    }, header.length);
    return { wch: Math.min(maxDataLen + 2, 40) };
  });
  worksheet["!cols"] = colWidths;

  // Add a second sheet with the list of available modules
  const modulesSheet = XLSX.utils.aoa_to_sheet([
    ["module_title_pt", "module_title_en"],
    ...modules.map((m) => [m.title_pt, m.title_en]),
  ]);
  modulesSheet["!cols"] = [{ wch: 40 }, { wch: 40 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Questions");
  XLSX.utils.book_append_sheet(workbook, modulesSheet, "Modules");

  XLSX.writeFile(workbook, "question-import-template.xlsx");
}
