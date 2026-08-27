import { z } from "zod";

const ContactSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  title: z.string().optional(),
  organization_id: z.string(),
  role_category: z.enum(["executive", "regulatory_affairs", "board_member", "procurement", "technical", "other"]),
  decision_authority: z.enum(["decision_maker", "influencer", "gatekeeper", "unknown"]),
  email: z.string().optional(),
  phone: z.string().optional(),
  linkedin: z.string().optional(),
  is_current: z.boolean(),
});

type Contact = z.infer<typeof ContactSchema>;

const contacts = new Map<string, Contact>();
let nextId = 1;

export const createContact = {
  schema: z.object({
    name: z.string().describe("Contact name"),
    title: z.string().optional().describe("Job title"),
    organization_id: z.string().describe("Organization ID"),
    organization_name: z.string().optional().describe("Organization name (for lookup)"),
    role_category: z.enum(["executive", "regulatory_affairs", "board_member", "procurement", "technical", "other"]).describe("Role category"),
    decision_authority: z.enum(["decision_maker", "influencer", "gatekeeper", "unknown"]).describe("Decision authority level"),
    email: z.string().optional().describe("Email address"),
    phone: z.string().optional().describe("Phone number"),
    linkedin: z.string().optional().describe("LinkedIn URL"),
    is_current: z.boolean().describe("Is this person currently at the organization"),
  }),
  async handler(input: z.infer<typeof createContact["schema"]>) {
    const { organization_id, organization_name, ...rest } = input;
    const id = `contact_${nextId++}`;
    const contact: Contact = { id, organization_id, ...rest };
    contacts.set(id, contact);
    return { success: true, contact };
  },
};

export const updateContact = {
  schema: z.object({
    id: z.string().describe("Contact ID"),
    name: z.string().optional(),
    title: z.string().optional(),
    role_category: z.enum(["executive", "regulatory_affairs", "board_member", "procurement", "technical", "other"]).optional(),
    decision_authority: z.enum(["decision_maker", "influencer", "gatekeeper", "unknown"]).optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    linkedin: z.string().optional(),
    is_current: z.boolean().optional(),
  }),
  async handler(input: z.infer<typeof updateContact["schema"]>) {
    const { id, ...updates } = input;
    const contact = contacts.get(id);
    if (!contact) {
      return { success: false, error: "Contact not found" };
    }
    const updated = { ...contact, ...updates };
    contacts.set(id, updated);
    return { success: true, contact: updated };
  },
};

export const addContactPositionHistory = {
  schema: z.object({
    contact_id: z.string().describe("Contact ID"),
    organization_id: z.string().describe("Organization ID"),
    title: z.string().describe("Job title"),
    start_date: z.string().optional().describe("Start date (YYYY-MM-DD)"),
    end_date: z.string().optional().describe("End date (YYYY-MM-DD)"),
  }),
  async handler(input: z.infer<typeof addContactPositionHistory["schema"]>) {
    // Placeholder - would normally write to contact_positions table
    return { success: true, message: "Position history recorded" };
  },
};

export const searchContacts = {
  schema: z.object({
    query: z.string().describe("Search query (name or email)"),
    organization_id: z.string().optional().describe("Filter by organization"),
    role_category: z.string().optional().describe("Filter by role category"),
    is_current: z.boolean().optional().describe("Filter by current status"),
  }),
  async handler(input: z.infer<typeof searchContacts["schema"]>) {
    const { query, organization_id, role_category, is_current } = input;
    const results = Array.from(contacts.values()).filter((contact) => {
      const matchesQuery =
        contact.name.toLowerCase().includes(query.toLowerCase()) ||
        (contact.email && contact.email.toLowerCase().includes(query.toLowerCase()));
      const matchesOrg = !organization_id || contact.organization_id === organization_id;
      const matchesRole = !role_category || contact.role_category === role_category;
      const matchesCurrent = is_current === undefined || contact.is_current === is_current;
      return matchesQuery && matchesOrg && matchesRole && matchesCurrent;
    });
    return { success: true, contacts: results };
  },
};

export const createFirmColleague = {
  schema: z.object({
    name: z.string().describe("Colleague name"),
    email: z.string().describe("Email address"),
    department: z.string().optional().describe("Department"),
    role: z.string().optional().describe("Role at firm"),
  }),
  async handler(input: z.infer<typeof createFirmColleague["schema"]>) {
    // Placeholder - would normally write to firm_colleagues table
    return { success: true, message: "Colleague added" };
  },
};
