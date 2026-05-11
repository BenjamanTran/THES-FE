const VND = new Intl.NumberFormat('vi-VN');

export function formatVnd(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0đ';
  return `${VND.format(Math.round(value))}đ`;
}

export function formatPriceRange(min: number, max: number): string {
  const safeMin = Number.isFinite(min) ? min : 0;
  const safeMax = Number.isFinite(max) ? max : 0;
  if (safeMin <= 0 && safeMax <= 0) return 'Miễn phí';
  if (safeMin === safeMax) return formatVnd(safeMax);
  if (safeMin <= 0) return `≤ ${formatVnd(safeMax)}`;
  if (safeMax <= safeMin) return formatVnd(safeMin);
  return `${formatVnd(safeMin)} – ${formatVnd(safeMax)}`;
}

export function formatVndShort(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0đ';
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}tr`;
  }
  if (value >= 1_000) {
    const k = value / 1_000;
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(0)}K`;
  }
  return `${value}đ`;
}
