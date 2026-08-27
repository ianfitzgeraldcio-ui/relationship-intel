import {
  createOrganization,
  updateOrganization,
  searchOrganizations,
} from "./organizations.js";
import {
  createContact,
  updateContact,
  addContactPositionHistory,
  searchContacts,
  createFirmColleague,
} from "./contacts.js";
import {
  createRelationship,
  updateRelationshipStrength,
  getRelationshipMapForOrg,
  getContactProfile,
  linkRelationshipToOutcome,
} from "./relationships.js";
import { logInteraction, listRecentInteractions } from "./interactions.js";

export {
  createOrganization,
  updateOrganization,
  searchOrganizations,
  createContact,
  updateContact,
  addContactPositionHistory,
  searchContacts,
  createFirmColleague,
  createRelationship,
  updateRelationshipStrength,
  getRelationshipMapForOrg,
  getContactProfile,
  linkRelationshipToOutcome,
  logInteraction,
  listRecentInteractions,
};
