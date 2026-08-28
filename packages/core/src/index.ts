import { z } from "zod";

// Shared Zod schemas for type safety across packages

export const OrganizationSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  org_type: z.enum(["utility", "regulator", "rto_iso", "firm", "other"]),
  ownership_category: z.enum(["IOU", "Cooperative", "Municipal", "PUD"]).optional(),
  sector: z.enum(["electric", "gas", "water", "multi"]).optional(),
  state: z.string().optional(),
  meter_count: z.number().optional(),
  annual_revenue: z.number().optional(),
  website: z.string().optional(),
  notes: z.string().optional(),
});

export const ContactSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  title: z.string().optional(),
  organization_id: z.string(),
  role_category: z.enum(["executive", "regulatory_affairs", "board_member", "procurement", "technical", "other"]),
  decision_authority: z.enum(["decision_maker", "influencer", "gatekeeper", "unknown"]),
  email: z.string().optional(),
  phone: z.string().optional(),
  linkedin: z.string().optional(),
  is_current: z.boolean(),
});

export const RelationshipSchema = z.object({
  id: z.string().optional(),
  firm_colleague_id: z.string(),
  contact_id: z.string(),
  relationship_type: z.enum(["primary", "secondary", "historical", "introduced_by"]),
  strength_score: z.number().min(1).max(5),
  effective_strength: z.number().min(1).max(5).optional(),
  last_interaction_at: z.string().optional(),
  notes: z.string().optional(),
});

export const InteractionSchema = z.object({
  id: z.string().optional(),
  relationship_id: z.string(),
  interaction_type: z.enum(["meeting", "call", "email", "event", "note"]),
  date: z.string(),
  summary: z.string(),
  sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
  source: z.enum(["manual", "calendar_sync", "email_sync"]).default("manual"),
  notes: z.string().optional(),
});

export type Organization = z.infer<typeof OrganizationSchema>;
export type Contact = z.infer<typeof ContactSchema>;
export type Relationship = z.infer<typeof RelationshipSchema>;
export type Interaction = z.infer<typeof InteractionSchema>;

// Name-or-ID resolution utility
export function resolveId(input: string | { id?: string; name?: string }, type: "org" | "contact"): string {
  if (typeof input === "string") {
    return input;
  }
  if (input.id) {
    return input.id;
  }
  if (input.name) {
    // In a real implementation, this would do a database lookup
    return `${type}_${input.name.toLowerCase().replace(/\s+/g, "_")}`;
  }
  throw new Error(`Could not resolve ${type} ID from input`);
}

// Relationship strength calculation
export function calculateEffectiveStrength(
  manualScore: number,
  lastInteractionAt?: string,
  decayWindowDays: number = 180
): number {
  if (!lastInteractionAt) {
    // No interactions, use floor of 2
    return Math.min(manualScore, 2);
  }

  const lastInteractionDate = new Date(lastInteractionAt);
  const daysSinceInteraction = (Date.now() - lastInteractionDate.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceInteraction > decayWindowDays) {
    // Beyond decay window, cap at 2
    return Math.min(manualScore, 2);
  }

  // Linear decay within window
  const decayFactor = 1 - daysSinceInteraction / decayWindowDays;
  const floorScore = 2;
  return Math.max(floorScore, manualScore * decayFactor);
}
