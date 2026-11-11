const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-12-14" → "14 Dec 2026", "2027-06" → "Jun 2027". */
export function formatStart(startsOn?: string) {
  if (!startsOn) return undefined;
  const [y, m, d] = startsOn.split("-");
  const month = MONTHS[Number(m) - 1];
  if (!y || !month) return undefined;
  return d ? `${Number(d)} ${month} ${y}` : `${month} ${y}`;
}
