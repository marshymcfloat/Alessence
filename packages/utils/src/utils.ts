export function capitalizeString(str: string): string | null {
  if (!str.trim()) {
    return null;
  }

  return str
    .split(" ")
    .filter((word) => word.length > 0)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
