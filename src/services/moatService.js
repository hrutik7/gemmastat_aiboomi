// Moat Layer API Service
// Connects frontend to the 5 moat layers + Role-based analysis

import api from './api';

/**
 * Layer 1: Profile a dataset to understand its statistical characteristics
 */
export const profileDataset = async (conversationId) => {
  const response = await api.post('/moat/profile', {
    conversation_id: conversationId
  });
  return response.data;
};

/**
 * Layer 1 + 5: Get test recommendation based on data and question
 */
export const getRecommendation = async (conversationId, question, selectedColumns = null) => {
  const response = await api.post('/moat/recommend', {
    conversation_id: conversationId,
    question: question,
    selected_columns: selectedColumns
  });
  return response.data;
};

/**
 * Layer 3: Validate analysis before running
 */
export const validateAnalysis = async (conversationId, testName, parameters) => {
  const response = await api.post('/moat/validate', {
    conversation_id: conversationId,
    test_name: testName,
    parameters: parameters
  });
  return response.data;
};

/**
 * Layer 2: Get analysis context for a conversation
 */
export const getAnalysisContext = async (conversationId) => {
  const response = await api.get(`/moat/context/${conversationId}`);
  return response.data;
};

/**
 * Layer 2 + 4: Get viva/defense preparation material
 */
export const getVivaPreparation = async (conversationId, testName) => {
  const response = await api.post('/moat/viva-prep', {
    conversation_id: conversationId,
    test_name: testName
  });
  return response.data;
};


/**
 * Layer 5: Record user feedback for learning
 */
export const recordFeedback = async (conversationId, feedbackType, context) => {
  const response = await api.post('/moat/feedback', {
    conversation_id: conversationId,
    feedback_type: feedbackType,
    context: context
  });
  return response.data;
};

/**
 * Layer 5: Get learning insights (admin only)
 */
export const getLearningInsights = async () => {
  const response = await api.get('/moat/insights');
  return response.data;
};

/**
 * Health check for moat services
 */
export const checkMoatHealth = async () => {
  const response = await api.get('/moat/health');
  return response.data;
};

// ==================== ROLE-BASED ANALYSIS ====================

/**
 * Set user role for customized analysis
 */
export const setUserRole = async (conversationId, roleId, roleName, customContext = null) => {
  const response = await api.post(`/conversation/${conversationId}/set_role`, {
    role_id: roleId,
    role_name: roleName,
    custom_context: customContext
  });
  return response.data;
};

export default {
  profileDataset,
  getRecommendation,
  validateAnalysis,
  getAnalysisContext,
  getVivaPreparation,
  recordFeedback,
  getLearningInsights,
  checkMoatHealth,
  setUserRole
};
