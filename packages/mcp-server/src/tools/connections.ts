import { z } from "zod";
import { contactConnections } from "../../../db/src/index.js";

function result(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
}

const connectionType = z.enum(["colleague", "reports_to", "former_colleague", "friend", "family", "other"]);
const referralWillingness = z.enum(["unknown", "unlikely", "possible", "likely", "confirmed"]);

export const createContactConnection = {
  description: "Record that two contacts know each other, and how willing that connection might be to make an introduction.",
  inputSchema: {
    contact_id_a: z.string().describe("First contact ID"),
    contact_id_b: z.string().describe("Second contact ID"),
    connection_type: connectionType.describe("How the two contacts know each other"),
    referral_willingness: referralWillingness.optional().describe("How likely this connection would make an introduction"),
    notes: z.string().optional().describe("Notes about the connection"),
  },
  async handler(input: any) {
    const connection = await contactConnections.create(input);
    return result({ success: true, connection });
  },
};

export const searchContactConnections = {
  description: "List a contact's known connections to other contacts.",
  inputSchema: {
    contact_id: z.string().describe("Contact ID"),
  },
  async handler(input: any) {
    const connections = await contactConnections.findForContact(input.contact_id);
    return result({ success: true, connections });
  },
};

export const findWarmIntroPath = {
  description: "Find which of my existing contacts (people I already have a relationship with) are connected to a target contact, and how willing they'd be to make an introduction. One-hop lookup, not full network pathfinding.",
  inputSchema: {
    target_contact_id: z.string().describe("The contact I'm trying to reach"),
  },
  async handler(input: any) {
    const paths = await contactConnections.findWarmIntroPath(input.target_contact_id);
    return result({ success: true, paths });
  },
};
