import { z } from "zod";
import { organizations } from "../../../db/src/index.js";

function result(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
}

const sector = z.enum(["electric", "gas", "water", "multi"]);

export const createOrganization = {
  description: "Create a new organization (utility, regulator, RTO/ISO, firm, or other).",
  inputSchema: {
    name: z.string().describe("Organization name"),
    org_type: z.enum(["utility", "regulator", "rto_iso", "firm", "other"]).describe("Type of organization"),
    ownership_category: z.enum(["IOU", "Cooperative", "Municipal", "PUD"]).optional().describe("Ownership category for utilities"),
    sector: sector.optional().describe("Utility sector: electric, gas, water, or multi (serves more than one)"),
    state: z.string().optional().describe("State"),
    meter_count: z.number().optional().describe("Meter count for utilities"),
    website: z.string().optional().describe("Website URL"),
    notes: z.string().optional().describe("Notes"),
  },
  async handler(input: any) {
    const organization = await organizations.create(input);
    return result({ success: true, organization });
  },
};

export const updateOrganization = {
  description: "Update fields on an existing organization.",
  inputSchema: {
    id: z.string().describe("Organization ID"),
    name: z.string().optional().describe("Organization name"),
    org_type: z.enum(["utility", "regulator", "rto_iso", "firm", "other"]).optional().describe("Type of organization"),
    ownership_category: z.enum(["IOU", "Cooperative", "Municipal", "PUD"]).optional().describe("Ownership category"),
    sector: sector.optional().describe("Utility sector: electric, gas, water, or multi"),
    state: z.string().optional().describe("State"),
    meter_count: z.number().optional().describe("Meter count"),
    website: z.string().optional().describe("Website URL"),
    notes: z.string().optional().describe("Notes"),
  },
  async handler(input: any) {
    const { id, ...updates } = input;
    const organization = await organizations.update(id, updates);
    if (!organization) return result({ success: false, error: "Organization not found" });
    return result({ success: true, organization });
  },
};

export const searchOrganizations = {
  description: "Search organizations by name, optionally filtered by state, type, or sector.",
  inputSchema: {
    query: z.string().describe("Search query"),
    state: z.string().optional().describe("Filter by state"),
    org_type: z.string().optional().describe("Filter by organization type"),
    sector: sector.optional().describe("Filter by utility sector"),
  },
  async handler(input: any) {
    const results = await organizations.search(input.query, { state: input.state, org_type: input.org_type, sector: input.sector });
    return result({ success: true, organizations: results });
  },
};
