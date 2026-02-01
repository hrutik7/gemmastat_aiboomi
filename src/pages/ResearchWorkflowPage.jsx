import React from 'react';
import { useParams } from 'react-router-dom';
import ResearchWorkflowEngine from '../components/ResearchWorkflowEngine';

/**
 * ResearchWorkflowPage
 * 
 * Dedicated page for the medical research workflow moat.
 * 
 * This is the core value proposition that makes GemmaStat irreplaceable:
 * - Opinionated workflow (users can't skip steps)
 * - Study type auto-detection
 * - Variable role classification
 * - Guardrail validation
 * - Test recommendations
 * - Publication-ready output
 */

const ResearchWorkflowPage = () => {
  const { conversationId } = useParams();

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      <ResearchWorkflowEngine />
    </div>
  );
};

export default ResearchWorkflowPage;
