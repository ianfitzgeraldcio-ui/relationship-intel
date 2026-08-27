import { z } from "zod";

export const logInteraction = {
  schema: z.object({
    relationship_id: z.string().describe("Relationship ID"),
    interaction_type: z.enum(["meeting", "call", "email", "event", "note"]).describe("Type of interaction"),
    date: z.string().describe("Date of interaction (YYYY-MM-DD)"),
    summary: z.string().describe("Summary of interaction"),
    sentiment: z.enum(["positive", "neutral", "negative"]).optional().describe("Sentiment of interaction"),
    notes: z.string().optional().describe("Additional notes"),
  }),
  async handler(input: z.infer<typeof logInteraction["schema"]>) {
    return {
      success: true,
      interaction: {
        id: `interaction_${Date.now()}`,
        ...input,
        created_at: new Date().toISOString(),
      },
    };
  },
};

export const listRecentInteractions = {
  schema: z.object({
    relationship_id: z.string().optional().describe("Filter by relationship ID"),
    contact_id: z.string().optional().describe("Filter by contact ID"),
    days: z.number().optional().describe("Show interactions from last N days (default: 90)"),
    limit: z.number().optional().describe("Maximum number of interactions to return (default: 20)"),
  }),
  async handler(input: z.infer<typeof listRecentInteractions["schema"]>) {
    return { success: true, interactions: [] };
  },
};
