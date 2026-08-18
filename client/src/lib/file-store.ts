// ── Module-level file holder ──────────────────────────────────────────────────
// File objects aren't serializable through router state, so we stash the
// File reference here temporarily between page navigations.
// Analysis page picks it up on mount and clears it after use.

let _pendingFile: File | null = null;

export function getPendingFile(): File | null {
  return _pendingFile;
}

export function setPendingFile(file: File): void {
  _pendingFile = file;
}

export function clearPendingFile(): void {
  _pendingFile = null;
}
