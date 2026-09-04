export function parseMoneyToNumber(moneyStr: string | number | undefined | null): number {
  if (typeof moneyStr === "number") return moneyStr;
  if (!moneyStr) return 0;
  const clean = moneyStr.replace(/\$/g, "").replace(/\./g, "").replace(/,/g, ".").trim();
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

export function formatNumberToMoney(value: number): string {
  return `$ ${(value || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
