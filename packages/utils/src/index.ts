export function formatBytes(bytes: number, decimals = 1) {
  if (!Number.isFinite(bytes)) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / Math.pow(1024, index);
  return `${value.toFixed(decimals)} ${units[index]}`;
}

export function percentage(partial: number, total: number) {
  if (total === 0) return 0;
  return Math.round((partial / total) * 100);
}
