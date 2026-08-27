import { z } from 'zod';

export const CreateOrganizationInput = z.object({
  name: z.string().min(1),
  org_type: z.enum(['utility', 'regulator', 'rto_iso', 'firm', 'other']),
  ownership_category: z.enum(['iou', 'cooperative', 'municipal', 'pud']).optional(),
  state: z.string().length(2).optional(),
  meter_count: z.number().int().optional(),
  total_revenue: z.number().optional(),
  website: z.string().url().optional(),
  notes: z.string().optional(),
});

export const CreateContactInput = z.object({
  organization_id: z.string().uuid().optional(),
  organization_name: z.string().optional(),
  full_name: z.string().min(1),
  title: z.string().optional(),
  role_category: z.enum(['executive', 'regulatory_affairs', 'board_member', 'procurement', 'technical', 'other']).optional(),
  decision_authority: z.enum(['decision_maker', 'influencer', 'gatekeeper', 'unknown']).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  linkedin_url: z.string().url().optional(),
  notes: z.string().optional(),
});

export const CreateRelationshipInput = z.object({
  firm_colleague_id: z.string().uuid().optional(),
  firm_colleague_name: z.string().optional(),
  contact_id: z.string().uuid().optional(),
  contact_name: z.string().optional(),
  contact_org: z.string().optional(),
  strength_score: z.number().int().min(1).max(5).optional(),
  relationship_type: z.enum(['primary', 'secondary', 'historical', 'introduced_by']).optional(),
  notes: z.string().optional(),
});

export const LogInteractionInput = z.object({
  contact_id: z.string().uuid().optional(),
  contact_name: z.string().optional(),
  contact_org: z.string().optional(),
  firm_colleague_id: z.string().uuid().optional(),
  firm_colleague_name: z.string().optional(),
  interaction_type: z.enum(['meeting', 'call', 'email', 'event', 'note']),
  occurred_at: z.string().datetime().optional(),
  summary: z.string().min(1),
  sentiment: z.enum(['positive', 'neutral', 'negative']).optional(),
});

export const UpdateRelationshipStrengthInput = z.object({
  relationship_id: z.string().uuid(),
  strength_score: z.number().int().min(1).max(5),
  notes: z.string().optional(),
});

export type CreateOrganizationInput = z.infer<typeof CreateOrganizationInput>;
export type CreateContactInput = z.infer<typeof CreateContactInput>;
export type CreateRelationshipInput = z.infer<typeof CreateRelationshipInput>;
export type LogInteractionInput = z.infer<typeof LogInteractionInput>;
export type UpdateRelationshipStrengthInput = z.infer<typeof UpdateRelationshipStrengthInput>;
