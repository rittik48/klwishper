const BRANCHES: Record<string, string> = { "8": "AI & DS", "3": "CSE", "6": "ECE", "9": "CSIT" };

export function detectStudentDetails(email: string) {
  const studentId = email.split("@")[0].trim();
  const batch = Number.parseInt(studentId.slice(0, 2), 10);
  const currentYear = new Date().getFullYear();
  const yearNumber = Number.isFinite(batch) ? Math.max(1, currentYear - (2000 + batch) + 1) : 1;
  const branchCode = [...studentId.slice(2)].find((character) => BRANCHES[character]);
  return { year: `${yearNumber}${yearNumber === 1 ? "st" : yearNumber === 2 ? "nd" : yearNumber === 3 ? "rd" : "th"} Year`, department: branchCode ? BRANCHES[branchCode] : "Undeclared" };
}
