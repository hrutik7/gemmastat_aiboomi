import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiChevronRight } from 'react-icons/fi';
import WorkflowMemoryPanel from './WorkflowMemoryPanel';

/**
 * ResearchWorkflowEngine Component
 * 
 * Implements the opinionated medical research workflow moat.
 * 
 * Workflow phases (users cannot skip):
 * 1. DataCharacterization - Explore and understand data
 * 2. StudyTypeSelection - Identify research design
 * 3. VariableClassification - Define variable roles
 * 4. GuardrailValidation - Check for methodological issues
 * 5. TestSelection - Choose valid statistical tests
 * 6. AnalysisExecution - Run the analysis
 * 7. ThesisGeneration - Create publication-ready output
 */

const ResearchWorkflowEngine = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [currentPhase, setCurrentPhase] = useState('DataCharacterization');
  const [completedPhases, setCompletedPhases] = useState([]);
  const [phaseData, setPhaseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [studyType, setStudyType] = useState(null);
  const [variableClassifications, setVariableClassifications] = useState({});
  const [workflowMemory, setWorkflowMemory] = useState(null);
  const [memoryExpanded, setMemoryExpanded] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Phase definitions with descriptions
  const phases = [
    {
      id: 'DataCharacterization',
      title: 'Data Characterization',
      description: 'Explore and understand your data structure, quality, and variables',
      icon: '📊'
    },
    {
      id: 'StudyTypeSelection',
      title: 'Study Type Selection',
      description: 'Identify your research design (RCT, Cohort, Case-Control, etc.)',
      icon: '🔍'
    },
    {
      id: 'VariableClassification',
      title: 'Variable Classification',
      description: 'Define the role of each variable (Outcome, Exposure, Confounder)',
      icon: '🏷️'
    },
    {
      id: 'GuardrailValidation',
      title: 'Validate Design',
      description: 'Ensure your study meets medical research standards',
      icon: '✓'
    },
    {
      id: 'TestSelection',
      title: 'Test Selection',
      description: 'Choose statistically valid tests for your design',
      icon: '⚙️'
    },
    {
      id: 'AnalysisExecution',
      title: 'Analysis Execution',
      description: 'Run the selected statistical tests',
      icon: '🚀'
    },
    {
      id: 'ThesisGeneration',
      title: 'Thesis Generation',
      description: 'Generate publication-ready tables and interpretations',
      icon: '📄'
    }
  ];

  // Execute workflow phase
  const executePhase = async (phase) => {
    setLoading(true);
    setError(null);

    try {
      let endpoint = '';
      let method = 'POST';
      let payload = null;

      switch (phase) {
        case 'DataCharacterization':
          endpoint = `/workflow/${conversationId}/characterize_data`;
          break;
        case 'StudyTypeSelection':
          endpoint = `/workflow/${conversationId}/detect_study_type`;
          break;
        case 'VariableClassification':
          endpoint = `/workflow/${conversationId}/classify_variables`;
          payload = { classifications: variableClassifications };
          break;
        case 'GuardrailValidation':
          endpoint = `/workflow/${conversationId}/validate_and_recommend`;
          break;
        case 'TestSelection':
          // This phase shows recommendations, next phase executes
          endpoint = `/workflow/${conversationId}/select_and_execute`;
          payload = { selected_tests: [] };
          break;
        case 'ThesisGeneration':
          endpoint = `/workflow/${conversationId}/generate_thesis`;
          break;
        default:
          throw new Error('Unknown phase');
      }

      const response = await axios.post(`${API_BASE}${endpoint}`, payload);
      const data = response.data;

      setPhaseData(data);
      setCurrentPhase(data.phase);
      
      // Capture workflow memory from response
      if (data.data?.workflow_memory) {
        setWorkflowMemory(data.data.workflow_memory);
      }

      if (data.status === 'completed' || data.status === 'confirmed') {
        setCompletedPhases([...completedPhases, data.phase]);
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle study type selection
  const handleStudyTypeSelect = async (type) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE}/workflow/${conversationId}/confirm_study_type`,
        { study_type: type, user_confirmed: true }
      );
      setStudyType(type);
      setPhaseData(response.data);
      setCompletedPhases([...completedPhases, 'StudyTypeSelection']);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle variable classification
  const handleVariableClassification = (variable, role) => {
    setVariableClassifications({
      ...variableClassifications,
      [variable]: role
    });
  };

  // Proceed to next phase
  const nextPhase = async () => {
    const currentIndex = phases.findIndex(p => p.id === currentPhase);
    if (currentIndex < phases.length - 1) {
      const nextPhaseId = phases[currentIndex + 1].id;
      await executePhase(nextPhaseId);
    }
  };

  // Initial load
  useEffect(() => {
    executePhase('DataCharacterization');
  }, [conversationId]);

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-6">
        <h1 className="text-3xl font-bold">Medical Research Workflow</h1>
        <p className="text-blue-100 mt-1">
          Guided, opinionated workflow for rigorous research methodology
        </p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Workflow Progress Sidebar */}
        <div className="w-80 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Workflow Steps</h2>

            {phases.map((phase, index) => {
              const isCompleted = completedPhases.includes(phase.id);
              const isCurrent = currentPhase === phase.id;
              const isLocked = index > completedPhases.length && !isCurrent;

              return (
                <div
                  key={phase.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isCurrent
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : isCompleted
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : isLocked
                      ? 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 opacity-50'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{phase.icon}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {phase.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {phase.description}
                        </p>
                      </div>
                    </div>
                    {isCompleted && (
                      <FiCheckCircle className="text-green-500 flex-shrink-0" size={20} />
                    )}
                    {isCurrent && (
                      <div className="animate-spin">⚙️</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-3">
              <FiAlertCircle className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-100">Error</h3>
                <p className="text-red-700 dark:text-red-200 text-sm">{error}</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin text-4xl mb-4">⚙️</div>
                <p className="text-gray-600 dark:text-gray-400">
                  Processing your data...
                </p>
              </div>
            </div>
          )}

          {phaseData && !loading && (
            <div className="max-w-6xl">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Phase Content */}
                <div className="lg:col-span-2">
                  {/* Phase 1: Data Characterization */}
                  {currentPhase === 'DataCharacterization' && (
                    <DataCharacterizationPhase data={phaseData.data} onNext={nextPhase} />
                  )}

                  {/* Phase 2: Study Type Selection */}
                  {currentPhase === 'StudyTypeSelection' && (
                    <StudyTypePhase 
                      data={phaseData.data} 
                      onSelect={handleStudyTypeSelect}
                      selectedType={studyType}
                    />
                  )}

                  {/* Phase 3: Variable Classification */}
                  {currentPhase === 'VariableClassification' && (
                    <VariableClassificationPhase 
                      variables={phaseData.data?.variables || []}
                      classifications={variableClassifications}
                      onClassify={handleVariableClassification}
                      onNext={nextPhase}
                    />
                  )}

                  {/* Phase 4: Guardrail Validation */}
                  {currentPhase === 'GuardrailValidation' && (
                    <GuardrailValidationPhase 
                      data={phaseData.data}
                      onNext={nextPhase}
                    />
                  )}

                  {/* Phase 5: Test Selection */}
                  {currentPhase === 'TestSelection' && (
                    <TestSelectionPhase 
                      recommendations={phaseData.data?.test_recommendations}
                      onNext={nextPhase}
                    />
                  )}

                  {/* Phase 7: Thesis Generation */}
                  {currentPhase === 'ThesisGeneration' && (
                    <ThesisGenerationPhase 
                      data={phaseData.data}
                    />
                  )}
                </div>

                {/* Workflow Memory Sidebar */}
                <div className="lg:col-span-1">
                  <div className="sticky top-8">
                    <WorkflowMemoryPanel 
                      memory={workflowMemory}
                      isExpanded={memoryExpanded}
                      onToggle={() => setMemoryExpanded(!memoryExpanded)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Sub-components for each phase

const DataCharacterizationPhase = ({ data, onNext }) => {
  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Data Overview
      </h2>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard 
          label="Sample Size" 
          value={data?.data_overview?.n_rows}
          icon="👥"
        />
        <StatCard 
          label="Variables" 
          value={data?.data_overview?.n_columns}
          icon="📊"
        />
        <StatCard 
          label="Data Quality" 
          value={`${(100 - data?.data_quality?.missing_percent || 0).toFixed(1)}%`}
          icon="✓"
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Insights</h3>
        <div className="space-y-2">
          {data?.initial_insights?.map((insight, idx) => (
            <div key={idx} className="flex gap-2 text-sm">
              {insight.startsWith('✓') ? (
                <FiCheckCircle className="text-green-500 flex-shrink-0" size={18} />
              ) : (
                <FiInfo className="text-blue-500 flex-shrink-0" size={18} />
              )}
              <span className="text-gray-700 dark:text-gray-300">{insight}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onNext}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
      >
        Continue to Study Type Selection
        <FiChevronRight />
      </button>
    </div>
  );
};

const StudyTypePhase = ({ data, onSelect, selectedType }) => {
  const studyTypes = [
    { id: 'RCT', name: 'Randomized Controlled Trial', icon: '🎲', description: 'Users are randomly assigned to treatment or control' },
    { id: 'Cohort', name: 'Cohort Study', icon: '→', description: 'Follow subjects forward from exposure to outcome' },
    { id: 'Case-Control', name: 'Case-Control Study', icon: '←', description: 'Select cases with outcome, compare to controls' },
    { id: 'Cross-Sectional', name: 'Cross-Sectional', icon: '📸', description: 'Snapshot assessment at a single point in time' },
    { id: 'Case-Series', name: 'Case Series', icon: '📋', description: 'Descriptive study of a small number of cases' },
  ];

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Study Type Detection
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        We analyzed your data and suggest: <span className="font-bold text-blue-600">{data?.detected_study_type}</span>
      </p>

      {data?.recommendations?.map((rec, idx) => (
        <div key={idx} className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-blue-900 dark:text-blue-100">{rec}</p>
        </div>
      ))}

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-8 mb-4">
        Select or confirm your study type:
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {studyTypes.map(study => (
          <button
            key={study.id}
            onClick={() => onSelect(study.id)}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              selectedType === study.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="text-2xl mb-2">{study.icon}</div>
            <h4 className="font-semibold text-gray-900 dark:text-white">
              {study.name}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {study.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};

const VariableClassificationPhase = ({ variables, classifications, onClassify, onNext }) => {
  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Classify Variables
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Assign a role to each variable: Outcome, Exposure, Confounder, or Other
      </p>

      <div className="space-y-4">
        {variables?.map(variable => (
          <div key={variable} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
              {variable}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['Outcome', 'Exposure', 'Confounder', 'Other'].map(role => (
                <button
                  key={role}
                  onClick={() => onClassify(variable, role)}
                  className={`py-2 px-3 rounded text-sm font-medium transition-all ${
                    classifications[variable] === role
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onNext}
        className="mt-8 flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
      >
        Validate Study Design
        <FiChevronRight />
      </button>
    </div>
  );
};

const GuardrailValidationPhase = ({ data, onNext }) => {
  const { guardrails, test_recommendations } = data;

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Study Design Validation
      </h2>

      {guardrails?.errors?.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">Critical Issues</h3>
          {guardrails.errors.map((err, idx) => (
            <p key={idx} className="text-red-700 dark:text-red-200 text-sm mb-1">
              • {err.message}
            </p>
          ))}
        </div>
      )}

      {guardrails?.warnings?.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">Warnings</h3>
          {guardrails.warnings.map((warn, idx) => (
            <p key={idx} className="text-yellow-700 dark:text-yellow-200 text-sm mb-1">
              • {warn.message}
            </p>
          ))}
        </div>
      )}

      {guardrails?.passed_checks?.length > 0 && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">Passed Checks</h3>
          {guardrails.passed_checks.map((check, idx) => (
            <p key={idx} className="text-green-700 dark:text-green-200 text-sm mb-1">
              {check}
            </p>
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
          Recommended Tests
        </h3>
        <p className="text-blue-700 dark:text-blue-200 text-sm mb-2">
          Primary: <span className="font-semibold">{test_recommendations?.primary_test}</span>
        </p>
        <p className="text-blue-700 dark:text-blue-200 text-sm">
          Valid options: {test_recommendations?.valid_tests?.join(', ')}
        </p>
      </div>

      <button
        onClick={onNext}
        className="mt-8 flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
      >
        Proceed to Analysis
        <FiChevronRight />
      </button>
    </div>
  );
};

const TestSelectionPhase = ({ recommendations, onNext }) => {
  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Statistical Test Selection
      </h2>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Valid Tests</h3>
        {recommendations?.valid_tests?.map((test, idx) => (
          <div key={idx} className="mb-3 flex items-start gap-3">
            <input type="checkbox" defaultChecked={idx === 0} className="mt-1" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{test}</p>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onNext}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
      >
        Execute Analysis
        <FiChevronRight />
      </button>
    </div>
  );
};

const ThesisGenerationPhase = ({ data }) => {
  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Publication-Ready Output
      </h2>

      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-8">
        <div className="flex items-center gap-2 mb-2">
          <FiCheckCircle className="text-green-600" size={20} />
          <h3 className="font-semibold text-green-900 dark:text-green-100">Workflow Complete!</h3>
        </div>
        <p className="text-green-700 dark:text-green-200 text-sm">
          Your analysis is complete. Download the publication-ready output below.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Table 1: Baseline Characteristics</h3>
          {/* Render table1 data */}
          <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-4 rounded overflow-x-auto">
            {JSON.stringify(data?.table1, null, 2)}
          </pre>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Interpretation</h3>
          <div className="text-gray-700 dark:text-gray-300 prose dark:prose-invert whitespace-pre-wrap">
            {data?.interpretation}
          </div>
        </div>
      </div>

      <button className="mt-8 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors">
        Download Results
      </button>
    </div>
  );
};

// Utility component
const StatCard = ({ label, value, icon }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
    <div className="text-3xl mb-2">{icon}</div>
    <p className="text-gray-600 dark:text-gray-400 text-sm">{label}</p>
    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
  </div>
);

export default ResearchWorkflowEngine;
