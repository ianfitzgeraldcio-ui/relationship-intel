import { z } from "zod";
import { opportunities } from "../../../db/src/index.js";

function result(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
}

// Postgres error code for a foreign-key violation.
const FOREIGN_KEY_VIOLATION = "23503";

const stage = z.enum(["identified", "qualifying", "proposal", "negotiation", "won", "lost"]);
const contactRole = z.enum(["champion", "economic_buyer", "technical_evaluator", "influencer", "blocker", "other"]);

export const createOpportunity = {
  description: "Start tracking a potential deal for an organization.",
  inputSchema: {
    organization_id: z.string().describe("Organization ID"),
    name: z.string().describe("Short name for the opportunity"),
    stage: stage.optional().describe("Pipeline stage (defaults to 'identified')"),
    estimated_value: z.number().optional().describe("Estimated deal value in USD"),
    probability: z.number().min(0).max(100).optional().describe("Probability of closing, 0-100"),
    expected_close_date: z.string().optional().describe("Expected close date (YYYY-MM-DD)"),
    notes: z.string().optional().describe("Notes"),
  },
  async handler(input: any) {
    const opportunity = await opportunities.create(input);
    return result({ success: true, opportunity });
  },
};

export const updateOpportunity = {
  description: "Update an opportunity - move it through pipeline stages, or update value/probability/close dates.",
  inputSchema: {
    id: z.string().describe("Opportunity ID"),
    name: z.string().optional(),
    stage: stage.optional().describe("Pipeline stage"),
    estimated_value: z.number().optional(),
    probability: z.number().min(0).max(100).optional(),
    expected_close_date: z.string().optional(),
    actual_close_date: z.string().optional().describe("Set when moving to won/lost"),
    notes: z.string().optional(),
  },
  async handler(input: any) {
    const { id, ...updates } = input;
    const opportunity = await opportunities.update(id, updates);
    if (!opportunity) return result({ success: false, error: "Opportunity not found" });
    return result({ success: true, opportunity });
  },
};

export const deleteOpportunity = {
  description: "Permanently delete an opportunity.",
  inputSchema: {
    id: z.string().describe("Opportunity ID"),
  },
  async handler(input: any) {
    try {
      const opportunity = await opportunities.remove(input.id);
      if (!opportunity) return result({ success: false, error: "Opportunity not found" });
      return result({ success: true, opportunity });
    } catch (err: any) {
      if (err?.code === FOREIGN_KEY_VIOLATION) {
        return result({ success: false, error: "Cannot delete: contacts are still linked to this opportunity. Remove those links first." });
      }
      throw err;
    }
  },
};

export const addOpportunityContact = {
  description: "Attach a contact to an opportunity with their role in the deal.",
  inputSchema: {
    opportunity_id: z.string().describe("Opportunity ID"),
    contact_id: z.string().describe("Contact ID"),
    contact_role: contactRole.optional().describe("The contact's role in this deal"),
  },
  async handler(input: any) {
    const link = await opportunities.addContact(input);
    return result({ success: true, link });
  },
};

export const searchOpportunities = {
  description: "List opportunities, optionally filtered by organization or stage.",
  inputSchema: {
    organization_id: z.string().optional().describe("Filter by organization"),
    stage: stage.optional().describe("Filter by pipeline stage"),
  },
  async handler(input: any) {
    const results = await opportunities.search(input);
    return result({ success: true, opportunities: results });
  },
};

export const getRevenueForecast = {
  description: "Get weighted pipeline revenue forecast by period (open opportunities), plus actual booked revenue from won deals.",
  inputSchema: {
    group_by: z.enum(["month", "quarter"]).optional().describe("Period to group the forecast by (defaults to month)"),
  },
  async handler(input: any) {
    const forecast = await opportunities.getRevenueForecast(input.group_by ?? "month");
    return result({ success: true, ...forecast });
  },
};
