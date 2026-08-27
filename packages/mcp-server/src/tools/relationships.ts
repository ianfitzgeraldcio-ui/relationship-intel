import { z } from "zod";
import { relationships } from "../../../db/src/index.js";

function result(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
}

export const createRelationship = {
  description: "Create a relationship between a firm colleague and a contact.",
  inputSchema: {
    firm_colleague_id: z.string().describe("Firm colleague ID"),
    contact_id: z.string().describe("Contact ID"),
    relationship_type: z.enum(["primary", "secondary", "historical", "introduced_by"]).describe("Type of relationship"),
    strength_score: z.number().min(1).max(5).describe("Strength score 1-5"),
    notes: z.string().optional().describe("Notes about the relationship"),
  },
  async handler(input: any) {
    const relationship = await relationships.create(input);
    return result({ success: true, relationship });
  },
};

export const updateRelationshipStrength = {
  description: "Update the manually-assessed strength score of a relationship.",
  inputSchema: {
    relationship_id: z.string().describe("Relationship ID"),
    strength_score: z.number().min(1).max(5).describe("New strength score"),
  },
  async handler(input: any) {
    const relationship = await relationships.updateStrength(input.relationship_id, input.strength_score);
    if (!relationship) return result({ success: false, error: "Relationship not found" });
    return result({ success: true, relationship });
  },
};

export const getRelationshipMapForOrg = {
  description: "Get every contact-to-firm-colleague relationship for an organization.",
  inputSchema: {
    organization_id: z.string().describe("Organization ID"),
  },
  async handler(input: any) {
    const map = await relationships.getMapForOrg(input.organization_id);
    return result({ success: true, relationships: map });
  },
};

export const linkRelationshipToOutcome = {
  description: "Record a business outcome (proposal, engagement, renewal) tied to a relationship.",
  inputSchema: {
    relationship_id: z.string().describe("Relationship ID"),
    outcome_type: z.enum(["proposal", "engagement", "renewal"]).describe("Type of business outcome"),
    outcome_value: z.string().describe("Description or reference"),
    revenue: z.number().optional().describe("Associated revenue"),
  },
  async handler(input: any) {
    const { relationship_id, ...outcome } = input;
    const relationship = await relationships.linkToOutcome(relationship_id, outcome);
    if (!relationship) return result({ success: false, error: "Relationship not found" });
    return result({ success: true, relationship });
  },
};
