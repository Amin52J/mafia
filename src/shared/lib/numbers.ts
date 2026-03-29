export function localizeDigits(text: string, language: string): string {
  if (language !== "fa") return text;
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  return text.replace(/\d/g, (d) => persianDigits[Number(d)] ?? d);
}

export function delocalizeDigits(text: string): string {
  const persianDigits = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
  let normalized = text;
  for (let i = 0; i <= 9; i++) {
    normalized = normalized.replace(persianDigits[i], i.toString());
  }
  return normalized;
}

export function createNumberFormatter(language: string) {
  return new Intl.NumberFormat(
    language === "fa" ? "fa-IR-u-nu-arabext" : "en-US"
  );
}
