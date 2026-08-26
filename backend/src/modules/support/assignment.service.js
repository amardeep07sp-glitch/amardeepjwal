import { assignmentRuleRepository } from './assignmentRule.repository.js';

export const assignmentService = {
  listRules() {
    return assignmentRuleRepository.findAll();
  },

  setRule(category, agentUserId, userId) {
    return assignmentRuleRepository.upsert(category, agentUserId, userId);
  },

  removeRule(category, userId) {
    return assignmentRuleRepository.deactivate(category, userId);
  },

  // Returns the agent userId to auto-assign a freshly created ticket to,
  // or null if no active rule exists for its category (leaves it
  // unassigned, same as today - auto-assignment is additive, never a hard
  // requirement to create a ticket).
  async resolveAgentForCategory(category) {
    const rule = await assignmentRuleRepository.findByCategory(category);
    return rule?.agentUserId ?? null;
  },
};
