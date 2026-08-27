import { z } from "zod";

const OrganizationSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  org_type: z.enum(["utility", "regulator", "rto_iso", "firm", "other"]),
  ownership_category: z.enum(["IOU", "Cooperative", "Municipal", "PUD"]).optional(),
  state: z.string().optional(),
  meter_count: z.number().optional(),
  website: z.string().optional(),
  notes: z.string().optional(),
});

type Organization = z.infer<typeof OrganizationSchema>;

// Store organizations in memory for now
const organizations = new Map<string, Organization>();
let nextId = 1;

export const createOrganization = {
  schema: z.object({
    name: z.string().describe("Organization name"),
    org_type: z.enum(["utility", "regulator", "rto_iso", "firm", "other"]).describe("Type of organization"),
    ownership_category: z.enum(["IOU", "Cooperative", "Municipal", "PUD"]).optional().describe("Ownership category for utilities"),
    state: z.string().optional().describe("State"),
    meter_count: z.number().optional().describe("Meter count for utilities"),
    website: z.string().optional().describe("Website URL"),
    notes: z.string().optional().describe("Notes"),
  }),
  async handler(input: z.infer<typeof createOrganization["schema"]>) {
    const id = `org_${nextId++}`;
    const org: Organization = { id, ...input };
    organizations.set(id, org);
    return { success: true, organization: org };
  },
};

export const updateOrganization = {
  schema: z.object({
    id: z.string().describe("Organization ID"),
    name: z.string().optional().describe("Organization name"),
    org_type: z.enum(["utility", "regulator", "rto_iso", "firm", "other"]).optional().describe("Type of organization"),
    ownership_category: z.enum(["IOU", "Cooperative", "Municipal", "PUD"]).optional().describe("Ownership category"),
    state: z.string().optional().describe("State"),
    meter_count: z.number().optional().describe("Meter count"),
    website: z.string().optional().describe("Website URL"),
    notes: z.string().optional().describe("Notes"),
  }),
  async handler(input: z.infer<typeof updateOrganization["schema"]>) {
    const { id, ...updates } = input;
    const org = organizations.get(id);
    if (!org) {
      return { success: false, error: "Organization not found" };
    }
    const updated = { ...org, ...updates };
    organizations.set(id, updated);
    return { success: true, organization: updated };
  },
};

export const searchOrganizations = {
  schema: z.object({
    query: z.string().describe("Search query"),
    state: z.string().optional().describe("Filter by state"),
    org_type: z.string().optional().describe("Filter by organization type"),
  }),
  async handler(input: z.infer<typeof searchOrganizations["schema"]>) {
    const { query, state, org_type } = input;
    const results = Array.from(organizations.values()).filter((org) => {
      const matchesQuery = org.name.toLowerCase().includes(query.toLowerCase());
      const matchesState = !state || org.state === state;
      const matchesType = !org_type || org.org_type === org_type;
      return matchesQuery && matchesState && matchesType;
    });
    return { success: true, organizations: results };
  },
};
