import { createOrganization, updateOrganization, searchOrganizations } from "./organizations.js";
import { createContact, updateContact, addContactPositionHistory, searchContacts, createFirmColleague, getContactProfile } from "./contacts.js";
import { createRelationship, updateRelationshipStrength, getRelationshipMapForOrg, linkRelationshipToOutcome } from "./relationships.js";
import { logInteraction, listRecentInteractions } from "./interactions.js";

export const tools = {
  create_organization: createOrganization,
  update_organization: updateOrganization,
  search_organizations: searchOrganizations,
  create_contact: createContact,
  update_contact: updateContact,
  add_contact_position_history: addContactPositionHistory,
  search_contacts: searchContacts,
  create_firm_colleague: createFirmColleague,
  create_relationship: createRelationship,
  update_relationship_strength: updateRelationshipStrength,
  log_interaction: logInteraction,
  get_relationship_map_for_org: getRelationshipMapForOrg,
  get_contact_profile: getContactProfile,
  list_recent_interactions: listRecentInteractions,
  link_relationship_to_outcome: linkRelationshipToOutcome,
};
