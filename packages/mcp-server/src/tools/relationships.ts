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

export const updateRelationshipTemperature = {
  description: "Set the sales-interest signal (cold/cool/warm/hot) on a relationship. Distinct from strength_score, which measures the personal relationship rather than buying intent.",
  inputSchema: {
    relationship_id: z.string().describe("Relationship ID"),
    temperature: z.enum(["cold", "cool", "warm", "hot"]).describe("Current sales-interest temperature"),
  },
  async handler(input: any) {
    const relationship = await relationships.updateTemperature(input.relationship_id, input.temperature);
    if (!relationship) return result({ success: false, error: "Relationship not found" });
    return result({ success: true, relationship });
  },
};

export const listDriftingRelationships = {
  description: "Flag relationships that have gone quiet relative to their own normal contact rhythm (not a fixed global window).",
  inputSchema: {
    multiplier: z.number().optional().describe("How many times longer than the relationship's normal gap counts as drifting (defaults to 2)"),
  },
  async handler(input: any) {
    const drifting = await relationships.findDrifting(input.multiplier ?? 2);
    return result({ success: true, drifting_relationships: drifting });
  },
};
