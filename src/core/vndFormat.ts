const vndFormatter = new Intl.NumberFormat('vi-VN');

export function roundVnd(amount: number): number {
  return Math.round(amount / 1000) * 1000;
}

export function formatVnd(amount: number): string {
  return `${vndFormatter.format(amount)}đ`;
}

export function formatVndWithExact(
  exactAmount: number,
  roundedAmount: number
): { roundedText: string; exactText: string | null; showExact: boolean } {
  const showExact = exactAmount !== roundedAmount;
  return {
    roundedText: formatVnd(roundedAmount),
    exactText: showExact ? formatVnd(exactAmount) : null,
    showExact,
  };
}
