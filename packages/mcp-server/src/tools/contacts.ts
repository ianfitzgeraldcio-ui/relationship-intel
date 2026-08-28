import { z } from "zod";
import { contacts, firmColleagues } from "../../../db/src/index.js";

function result(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
}

const roleCategory = z.enum(["executive", "regulatory_affairs", "board_member", "procurement", "technical", "other"]);
const decisionAuthority = z.enum(["decision_maker", "influencer", "gatekeeper", "unknown"]);

// Postgres error code for a foreign-key violation.
const FOREIGN_KEY_VIOLATION = "23503";

export const createContact = {
  description: "Create a new contact at an organization.",
  inputSchema: {
    name: z.string().describe("Contact name"),
    title: z.string().optional().describe("Job title"),
    organization_id: z.string().describe("Organization ID"),
    role_category: roleCategory.describe("Role category"),
    decision_authority: decisionAuthority.describe("Decision authority level"),
    email: z.string().optional().describe("Email address"),
    phone: z.string().optional().describe("Phone number"),
    linkedin: z.string().optional().describe("LinkedIn URL"),
    is_current: z.boolean().describe("Is this person currently at the organization"),
  },
  async handler(input: any) {
    const contact = await contacts.create(input);
    return result({ success: true, contact });
  },
};

export const updateContact = {
  description: "Update fields on an existing contact.",
  inputSchema: {
    id: z.string().describe("Contact ID"),
    name: z.string().optional(),
    title: z.string().optional(),
    role_category: roleCategory.optional(),
    decision_authority: decisionAuthority.optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    linkedin: z.string().optional(),
    is_current: z.boolean().optional(),
  },
  async handler(input: any) {
    const { id, ...updates } = input;
    const contact = await contacts.update(id, updates);
    if (!contact) return result({ success: false, error: "Contact not found" });
    return result({ success: true, contact });
  },
};

export const addContactPositionHistory = {
  description: "Record a past or current position a contact held at an organization.",
  inputSchema: {
    contact_id: z.string().describe("Contact ID"),
    organization_id: z.string().describe("Organization ID"),
    title: z.string().describe("Job title"),
    start_date: z.string().optional().describe("Start date (YYYY-MM-DD)"),
    end_date: z.string().optional().describe("End date (YYYY-MM-DD)"),
  },
  async handler(input: any) {
    const position = await contacts.addPositionHistory(input);
    return result({ success: true, position });
  },
};

export const searchContacts = {
  description: "Search contacts by name or email, optionally filtered by organization, role, or current status.",
  inputSchema: {
    query: z.string().describe("Search query (name or email)"),
    organization_id: z.string().optional().describe("Filter by organization"),
    role_category: z.string().optional().describe("Filter by role category"),
    is_current: z.boolean().optional().describe("Filter by current status"),
  },
  async handler(input: any) {
    const results = await contacts.search(input.query, {
      organization_id: input.organization_id,
      role_category: input.role_category,
      is_current: input.is_current,
    });
    return result({ success: true, contacts: results });
  },
};

export const deleteContact = {
  description: "Permanently delete a contact. Fails if relationships or position history still reference it.",
  inputSchema: {
    id: z.string().describe("Contact ID"),
  },
  async handler(input: any) {
    try {
      const contact = await contacts.remove(input.id);
      if (!contact) return result({ success: false, error: "Contact not found" });
      return result({ success: true, contact });
    } catch (err: any) {
      if (err?.code === FOREIGN_KEY_VIOLATION) {
        return result({ success: false, error: "Cannot delete: relationships or position history still reference this contact. Delete those first." });
      }
      throw err;
    }
  },
};

export const createFirmColleague = {
  description: "Add a colleague at the firm who can hold relationships with contacts.",
  inputSchema: {
    name: z.string().describe("Colleague name"),
    email: z.string().describe("Email address"),
    department: z.string().optional().describe("Department"),
    role: z.string().optional().describe("Role at firm"),
  },
  async handler(input: any) {
    const colleague = await firmColleagues.create(input);
    return result({ success: true, colleague });
  },
};

export const getContactProfile = {
  description: "Get a contact's full profile: position history, relationships, and recent interactions.",
  inputSchema: {
    contact_id: z.string().describe("Contact ID"),
  },
  async handler(input: any) {
    const profile = await contacts.getProfile(input.contact_id);
    if (!profile) return result({ success: false, error: "Contact not found" });
    return result({ success: true, profile });
  },
};
