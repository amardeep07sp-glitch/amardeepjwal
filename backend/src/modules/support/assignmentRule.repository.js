import { AssignmentRule } from './assignmentRule.model.js';

const AGENT_POPULATE = { path: 'agentUserId', select: 'name email' };

export const assignmentRuleRepository = {
  findAll() {
    return AssignmentRule.find().populate(AGENT_POPULATE).sort({ category: 1 });
  },

  findByCategory(category) {
    return AssignmentRule.findOne({ category, active: true });
  },

  async upsert(category, agentUserId, userId) {
    return AssignmentRule.findOneAndUpdate(
      { category },
      { agentUserId, active: true, updatedBy: userId },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate(AGENT_POPULATE);
  },

  deactivate(category, userId) {
    return AssignmentRule.findOneAndUpdate({ category }, { active: false, updatedBy: userId }, { new: true });
  },
};
