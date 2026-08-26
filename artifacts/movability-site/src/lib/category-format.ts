const ACRONYMS = new Set(["PTA", "MAAS", "MaaS", "PR", "PA", "EV", "DRT", "E-SCOOTER", "ESCOOTER", "RFI"]);

function titleCaseWord(word: string): string {
  if (!word) return word;
  const upper = word.toUpperCase();
  if (ACRONYMS.has(upper)) {
    if (upper === "MAAS") return "MaaS";
    if (upper === "E-SCOOTER") return "E-Scooter";
    return upper;
  }
  if (upper === "POLICY") return "Policy";
  if (upper === "SCOOTER") return "Scooter";
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function formatCategoryLabel(value: string): string {
  return value
    .trim()
    .replace(/&/g, " & ")
    .replace(/[-_]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) => {
      const upper = word.toUpperCase();
      if (word === "&") return "&";
      if (ACRONYMS.has(upper)) {
        if (upper === "MAAS") return "MaaS";
        if (upper === "E-SCOOTER") return "E-Scooter";
        return upper;
      }
      if (index > 0 && upper === "PA") return "PA";
      return titleCaseWord(word);
    })
    .join(" ")
    .replace(/\s+&\s+/g, " & ")
    .replace(/\bE Scooter\b/g, "E-Scooter")
    .replace(/\bEV Policy\b/g, "EV Policy")
    .replace(/\bPR PA\b/g, "PR & PA")
    .replace(/\bPta\b/g, "PTA")
    .replace(/\bMaas\b/g, "MaaS");
}
