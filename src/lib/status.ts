/**
 * FPL's availability codes, spelled out once. `a` is the only one that needs no explanation, so a
 * view shows no chip for it. Every other code is a reason to look before starting the player.
 */
export const STATUS_LABEL: Record<string, string> = {
  a: 'Available',
  d: 'Doubtful',
  i: 'Injured',
  s: 'Suspended',
  u: 'Unavailable',
  n: 'Not in squad',
};

export function statusLabel(status: string): string {
  return STATUS_LABEL[status] ?? status;
}

/** Doubtful is a warning; everything else that is not available is a stop. */
export function statusTone(status: string): 'good' | 'warn' | 'bad' {
  if (status === 'a') return 'good';
  if (status === 'd') return 'warn';
  return 'bad';
}

export function isFlagged(status: string | undefined | null): boolean {
  return status !== undefined && status !== null && status !== 'a';
}
