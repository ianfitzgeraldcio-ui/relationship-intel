const RECENCY_DECAY_MONTHS = 6;

export function calculateEffectiveStrength(manualScore: number | null | undefined, lastInteractionAt: Date | null | undefined): number {
  if (!manualScore || manualScore < 1 || manualScore > 5) return 0;
  if (!lastInteractionAt) return manualScore;

  const now = new Date();
  const monthsAgo = (now.getTime() - lastInteractionAt.getTime()) / (1000 * 60 * 60 * 24 * 30);

  if (monthsAgo >= RECENCY_DECAY_MONTHS) {
    return Math.min(2, manualScore);
  }

  return manualScore;
}

export function getRelationshipHealthStatus(effectiveStrength: number): string {
  if (effectiveStrength >= 4) return 'strong';
  if (effectiveStrength >= 3) return 'warm';
  if (effectiveStrength >= 2) return 'cool';
  return 'cold';
}

export const RECENCY_DECAY_MONTHS_CONSTANT = RECENCY_DECAY_MONTHS;
