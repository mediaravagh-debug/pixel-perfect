const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";

function mapChars(text: string, upperStart: number, lowerStart: number, digitStart?: number) {
  return Array.from(text)
    .map((ch) => {
      const u = UPPER.indexOf(ch);
      if (u >= 0) return String.fromCodePoint(upperStart + u);
      const l = LOWER.indexOf(ch);
      if (l >= 0) return String.fromCodePoint(lowerStart + l);
      if (digitStart !== undefined) {
        const d = DIGITS.indexOf(ch);
        if (d >= 0) return String.fromCodePoint(digitStart + d);
      }
      return ch;
    })
    .join("");
}

/** LinkedIn has no rich text, so bold/italic use unicode math letterforms. */
export const toBold = (text: string) => mapChars(text, 0x1d5d4, 0x1d5ee, 0x1d7ec);
export const toItalic = (text: string) => mapChars(text, 0x1d608, 0x1d622);

export function prefixLines(text: string, kind: "bullet" | "number") {
  const lines = text.split("\n");
  return lines
    .map((line, i) => {
      const clean = line.replace(/^(\s*)([•]|\d+\.)\s+/, "$1");
      if (!clean.trim()) return clean;
      return kind === "bullet" ? `• ${clean}` : `${i + 1}. ${clean}`;
    })
    .join("\n");
}
