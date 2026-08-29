import { createOrganization, updateOrganization, searchOrganizations, deleteOrganization } from "./organizations.js";
import { createContact, updateContact, addContactPositionHistory, searchContacts, createFirmColleague, getContactProfile, deleteContact } from "./contacts.js";
import { createRelationship, updateRelationshipStrength, updateRelationshipTemperature, listDriftingRelationships, getRelationshipMapForOrg } from "./relationships.js";
import { logInteraction, listRecentInteractions } from "./interactions.js";
import { createContactConnection, searchContactConnections, findWarmIntroPath } from "./connections.js";
import { createOpportunity, updateOpportunity, deleteOpportunity, addOpportunityContact, searchOpportunities, getRevenueForecast } from "./opportunities.js";
import { getRelationshipHealthSummary, getOrganizationSummary } from "./reports.js";

export const tools = {
  create_organization: createOrganization,
  update_organization: updateOrganization,
  search_organizations: searchOrganizations,
  delete_organization: deleteOrganization,
  create_contact: createContact,
  update_contact: updateContact,
  add_contact_position_history: addContactPositionHistory,
  search_contacts: searchContacts,
  create_firm_colleague: createFirmColleague,
  delete_contact: deleteContact,
  create_relationship: createRelationship,
  update_relationship_strength: updateRelationshipStrength,
  update_relationship_temperature: updateRelationshipTemperature,
  list_drifting_relationships: listDriftingRelationships,
  log_interaction: logInteraction,
  get_relationship_map_for_org: getRelationshipMapForOrg,
  get_contact_profile: getContactProfile,
  list_recent_interactions: listRecentInteractions,
  create_contact_connection: createContactConnection,
  search_contact_connections: searchContactConnections,
  find_warm_intro_path: findWarmIntroPath,
  create_opportunity: createOpportunity,
  update_opportunity: updateOpportunity,
  delete_opportunity: deleteOpportunity,
  add_opportunity_contact: addOpportunityContact,
  search_opportunities: searchOpportunities,
  get_revenue_forecast: getRevenueForecast,
  get_relationship_health_summary: getRelationshipHealthSummary,
  get_organization_summary: getOrganizationSummary,
};
