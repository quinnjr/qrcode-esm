export function isValid(version: unknown): boolean {
  return typeof version === 'number' && !Number.isNaN(version) && version >= 1 && version <= 40;
}
