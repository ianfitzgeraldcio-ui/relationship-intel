import { z } from "zod";
import { interactions } from "../../../db/src/index.js";

function result(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
}

export const logInteraction = {
  description: "Log an interaction (meeting, call, email, event, or note) tied to a relationship.",
  inputSchema: {
    relationship_id: z.string().describe("Relationship ID"),
    interaction_type: z.enum(["meeting", "call", "email", "event", "note"]).describe("Type of interaction"),
    date: z.string().describe("Date of interaction (YYYY-MM-DD)"),
    summary: z.string().describe("Summary of interaction"),
    sentiment: z.enum(["positive", "neutral", "negative"]).optional().describe("Sentiment of interaction"),
    notes: z.string().optional().describe("Additional notes"),
  },
  async handler(input: any) {
    const interaction = await interactions.create(input);
    return result({ success: true, interaction });
  },
};

export const listRecentInteractions = {
  description: "List recent interactions, optionally filtered by relationship or contact.",
  inputSchema: {
    relationship_id: z.string().optional().describe("Filter by relationship ID"),
    contact_id: z.string().optional().describe("Filter by contact ID"),
    days: z.number().optional().describe("Show interactions from last N days (default: 90)"),
    limit: z.number().optional().describe("Maximum number of interactions to return (default: 20)"),
  },
  async handler(input: any) {
    const results = await interactions.findRecent(input);
    return result({ success: true, interactions: results });
  },
};
