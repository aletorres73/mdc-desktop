export function parseMoneyToNumber(moneyStr: string | number | undefined | null): number {
  if (typeof moneyStr === "number") return moneyStr;
  if (!moneyStr) return 0;
  const clean = moneyStr.replace(/\$/g, "").replace(/\s/g, "").trim();
  const lastDot = clean.lastIndexOf(".");
  const lastComma = clean.lastIndexOf(",");
  let normalized = clean;

  if (lastDot >= 0 && lastComma >= 0) {
    const decimalSeparator = lastDot > lastComma ? "." : ",";
    const thousandsSeparator = decimalSeparator === "." ? "," : ".";
    normalized = clean.replaceAll(thousandsSeparator, "").replace(decimalSeparator, ".");
  } else if (lastComma >= 0) {
    const decimals = clean.length - lastComma - 1;
    normalized = decimals <= 2
      ? clean.replace(",", ".")
      : clean.replaceAll(",", "");
  } else if (lastDot >= 0) {
    const decimals = clean.length - lastDot - 1;
    normalized = decimals <= 2
      ? clean
      : clean.replaceAll(".", "");
  }

  const num = Number(normalized);
  return isNaN(num) ? 0 : num;
}

export function formatNumberToMoney(value: number): string {
  return (Number.isFinite(value) ? value : 0).toFixed(2);
}
