import { z } from "zod";
import { reports } from "../../../db/src/index.js";

function result(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
}

export const getRelationshipHealthSummary = {
  description: "Portfolio-wide dashboard: relationship temperature distribution, drifting relationships, and open pipeline by stage.",
  inputSchema: {},
  async handler() {
    const summary = await reports.getRelationshipHealthSummary();
    return result({ success: true, ...summary });
  },
};

export const getOrganizationSummary = {
  description: "Per-organization report: contact and relationship counts, recent activity, open opportunities, and revenue to date.",
  inputSchema: {
    organization_id: z.string().describe("Organization ID"),
  },
  async handler(input: any) {
    const summary = await reports.getOrganizationSummary(input.organization_id);
    return result({ success: true, ...summary });
  },
};
