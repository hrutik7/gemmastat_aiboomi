// src/components/AnalysisWorkspace.jsx

import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { getToken } from '../services/authService';
import FileUpload from './FileUpload';
import DatabaseConnection from './DatabaseConnection';
import ShopifyConnection from './ShopifyConnection';
import ChartRenderer from './ChartRenderer';
import Editor from 'react-simple-code-editor';
import { motion } from 'framer-motion';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-python';
import 'prismjs/themes/prism-tomorrow.css';
import SheetSelector from './SheetSelector';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import moatService from '../services/moatService';
import AnalysisValidation from './AnalysisValidation';
import TestRecommendation from './TestRecommendation';
import VivaPreparation from './VivaPreparation';
import RoleSelector from './RoleSelector';
import WorkflowAgentBuilder from './WorkflowAgentBuilder';

// ===================================================================================
// Real-Time Streaming Thinking Loader
// ===================================================================================
const StreamingThinkingLoader = ({ question, streamingData, elapsedTime }) => {
    const { currentStep, tokens, interpretationTokens, isComplete } = streamingData;

    const formatTime = (ms) => {
        const seconds = Math.floor(ms / 1000);
        const tenths = Math.floor((ms % 1000) / 100);
        return `${seconds}.${tenths}s`;
    };

    // Combine all tokens for display
    const thinkingText = tokens.join('');
    const interpretationText = interpretationTokens.join('');

    return (
        <div className="w-full max-w-3xl mx-auto">
            {/* Header with brain icon and timer */}
            <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-3">
                    <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="text-2xl"
                    >
                        🧠
                    </motion.div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        {isComplete ? 'Analysis Complete!' : 'Thinking...'}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <motion.div
                        animate={isComplete ? {} : { opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className={`w-2 h-2 rounded-full ${isComplete ? 'bg-green-500' : 'bg-blue-500'}`}
                    />
                    {formatTime(elapsedTime)}
                </div>
            </div>

            {/* Chain of thought container */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Question echo */}
                <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-300 italic">
                        "{question || 'Processing your request...'}"
                    </p>
                </div>

                {/* Current step indicator */}
                {currentStep && (
                    <div className="px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent"
                            />
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                {currentStep}
                            </span>
                        </div>
                    </div>
                )}

                {/* Streaming tokens display */}
                {thinkingText && (
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-start gap-2 mb-2">
                            <span className="text-lg">💻</span>
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                Generated Code
                            </span>
                        </div>
                        <div className="bg-gray-900 rounded-lg p-3 max-h-64 overflow-y-auto">
                            <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap break-words">
                                {thinkingText}
                                <motion.span
                                    animate={{ opacity: [1, 0] }}
                                    transition={{ duration: 0.5, repeat: Infinity }}
                                    className="inline-block w-2 h-4 bg-green-400 ml-0.5"
                                />
                            </pre>
                        </div>
                    </div>
                )}

                {/* Interpretation streaming */}
                {interpretationText && (
                    <div className="p-4">
                        <div className="flex items-start gap-2 mb-2">
                            <span className="text-lg">✨</span>
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                AI Interpretation
                            </span>
                        </div>
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                {interpretationText}
                                {!isComplete && (
                                    <motion.span
                                        animate={{ opacity: [1, 0] }}
                                        transition={{ duration: 0.5, repeat: Infinity }}
                                        className="inline-block w-2 h-4 bg-gray-500 ml-0.5"
                                    />
                                )}
                            </p>
                        </div>
                    </div>
                )}

                {/* Progress indicator */}
                {!isComplete && (
                    <div className="h-1 bg-gray-200 dark:bg-gray-700">
                        <motion.div
                            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                            animate={{ width: ['0%', '100%'] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

// Custom Python syntax highlighting styles
const pythonEditorStyles = `
  .prism-code {
    background: #1e1e1e !important;
  }
  .token.comment { color: #6a9955 !important; font-style: italic; }
  .token.string { color: #ce9178 !important; }
  .token.number { color: #b5cea8 !important; }
  .token.keyword { color: #569cd6 !important; font-weight: bold; }
  .token.builtin { color: #4ec9b0 !important; }
  .token.function { color: #dcdcaa !important; }
  .token.class-name { color: #4ec9b0 !important; }
  .token.operator { color: #d4d4d4 !important; }
  .token.punctuation { color: #d4d4d4 !important; }
  .token.boolean { color: #569cd6 !important; }
  .token.decorator { color: #dcdcaa !important; }
  .token.property { color: #9cdcfe !important; }
  .token.variable { color: #9cdcfe !important; }
`;

const CodeModal = ({ isOpen, onClose, initialCode, onRunCode }) => {
    const [editedCode, setEditedCode] = useState(initialCode);

    useEffect(() => {
        if (isOpen) {
            setEditedCode(initialCode);
        }
    }, [initialCode, isOpen]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) { return null; }

    const handleRun = () => {
        onRunCode(editedCode);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <style>{pythonEditorStyles}</style>
            <div className="relative bg-[#1e1e1e] rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] p-6 flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex-shrink-0 mb-4 flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-100">Edit & Run Code</h3>
                    <div>
                        <button onClick={handleRun} className="px-4 py-2 mr-4 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold">
                            Run Code
                        </button>
                        <button onClick={onClose} className="p-2 rounded-full text-gray-400 bg-gray-800 hover:bg-gray-700" title="Close (Esc)">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>
                <div className="flex-1 min-h-0 overflow-auto border border-gray-700 rounded-lg bg-[#1e1e1e]">
                    <Editor
                        value={editedCode}
                        onValueChange={code => setEditedCode(code)}
                        highlight={code => highlight(code || '', languages.python, 'python')}
                        padding={16}
                        className="text-sm font-mono"
                        style={{
                            minHeight: '100%',
                            outline: 0,
                            fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
                            fontSize: '14px',
                            lineHeight: '1.6',
                            color: '#d4d4d4',
                            backgroundColor: '#1e1e1e'
                        }}
                    />
                </div>
            </div>
        </div>
    );
};
const ChartModal = ({ isOpen, onClose, result }) => {
    useEffect(() => { const handleKeyDown = (event) => { if (event.key === 'Escape') { onClose(); } }; if (isOpen) { window.addEventListener('keydown', handleKeyDown); } return () => { window.removeEventListener('keydown', handleKeyDown); }; }, [isOpen, onClose]);
    if (!isOpen) { return null; }
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] p-6 flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex-shrink-0 mb-4"><h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{result.visualization.title}</h3></div>
                <div className="flex-1 min-h-0"><ChartRenderer result={result} /></div>
                <button onClick={onClose} className="absolute top-3 right-3 p-2 rounded-full text-gray-500 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600" title="Close (Esc)"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
            </div>
        </div>
    );
};
const DataSummary = ({ summary }) => {
    // This "guard clause" is the fix. It prevents errors if 'summary' is not yet loaded.
    if (!summary || !summary.shape) {
        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 animate-pulse">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 animate-fade-in">
            <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">Dataset Loaded</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm my-6">
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"><strong>Rows:</strong> {summary.shape.rows}</div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"><strong>Columns:</strong> {summary.shape.columns}</div>
            </div>
        </div>
    );
};

const DataPreview = ({ preview }) => {
    if (!preview || preview.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Data Preview (First 5 Rows)</h3>
                <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                </div>
            </div>
        );
    }

    const headers = Object.keys(preview[0] || {});

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 animate-fade-in">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Data Preview (First 5 Rows)</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            {headers.map(key => <th key={key} scope="col" className="px-6 py-3">{key}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {preview.map((row, rowIndex) => (
                            <tr key={rowIndex} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                {headers.map((header, cellIndex) => <td key={cellIndex} className="px-6 py-4">{String(row[header])}</td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
const StatsTable = ({ summary }) => { if (!summary || Object.keys(summary).length === 0) return null; return (<div className="analysis-section mb-8"><h4 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-200">Statistical Summary</h4><div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg"><table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700"><thead className="bg-gray-50 dark:bg-gray-700"><tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"><th scope="col" className="px-6 py-3">Parameter</th><th scope="col" className="px-6 py-3">Value</th></tr></thead><tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">{Object.entries(summary).map(([key, value]) => (<tr key={key}><td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{key}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{String(value)}</td></tr>))}</tbody></table></div></div>); };
const AnalysisResult = ({ result, onNextQuestion, onCodeChange }) => {
    const [currentCode, setCurrentCode] = useState(result.python_code.code);
    const [chartType, setChartType] = useState(result.visualization.type);
    const [reported, setReported] = useState(false);
    const [isChartModalOpen, setIsChartModalOpen] = useState(false);
    const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
    useEffect(() => { setCurrentCode(result.python_code.code); setChartType(result.visualization.type); setReported(false); setIsChartModalOpen(false); setIsCodeModalOpen(false); }, [result]);
    const executionResult = result.python_code.execution_result;
    const hasError = executionResult && executionResult.toLowerCase().startsWith('error');
    const isImportError = hasError && (executionResult.toLowerCase().includes('import of') || executionResult.toLowerCase().includes('no module named'));
    const handleRunCodeFromModal = (newCode) => { setCurrentCode(newCode); onCodeChange(newCode); };
    return (
        <>
            <style>{pythonEditorStyles}</style>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 mt-6 animate-fade-in">
                <div className="p-6 space-y-8">
                    <div className="analysis-section" id="ai-interpretation-button">
                        <h4 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-200">AI Interpretation</h4>
                        <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap text-gray-600 dark:text-gray-300">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.python_code.comments}</ReactMarkdown>
                        </div>
                    </div>
                    <div className="analysis-section">
                        <h4 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-200">Code & Result</h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                            <div className="code-editor flex flex-col">
                                <div className="bg-[#2d2d2d] rounded-t-lg p-2 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1.5">
                                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                        </div>
                                        <span className="text-xs text-gray-400 font-mono ml-2">generated_code.py</span>
                                        <button onClick={() => setIsCodeModalOpen(true)} title="Expand Code View" className="text-gray-400 hover:text-white ml-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"></path>
                                            </svg>
                                        </button>
                                    </div>
                                    <button onClick={() => onCodeChange(currentCode)} className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded font-semibold flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                                        Run
                                    </button>
                                </div>
                                <div className="bg-[#1e1e1e] rounded-b-lg h-80 overflow-auto">
                                    <Editor
                                        value={currentCode}
                                        onValueChange={code => setCurrentCode(code)}
                                        highlight={code => highlight(code || '', languages.python, 'python')}
                                        padding={16}
                                        className="text-sm"
                                        style={{
                                            minHeight: '100%',
                                            outline: 0,
                                            fontFamily: '"Fira Code", "Consolas", "Monaco", "Courier New", monospace',
                                            fontSize: '13px',
                                            lineHeight: '1.6',
                                            color: '#d4d4d4',
                                            backgroundColor: '#1e1e1e'
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="result-window border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 flex flex-col">
                                <div className="bg-gray-100 dark:bg-gray-700 rounded-t-lg p-2 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 font-mono">
                                    <div className="flex items-center gap-2">
                                        <span>Output</span>
                                        {!hasError && result.chart_data && (
                                            <button onClick={() => setIsChartModalOpen(true)} title="Expand View" className="text-gray-500 hover:text-gray-800 dark:hover:text-white">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"></path>
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                    {!hasError && result.chart_data && (
                                        <select value={chartType} onChange={(e) => setChartType(e.target.value)} className="bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-xs px-2 py-1">
                                            {['table', 'bar', 'line_plot', 'pie', 'scatter', 'boxplot', 'heatmap'].map(type => (
                                                <option key={type} value={type}>{type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                                <div className="flex-1 flex items-center justify-center overflow-auto p-4 relative">
                                    {isImportError ? (
                                        <div className="text-center">
                                            <p className="text-yellow-600 dark:text-yellow-400 font-mono text-sm whitespace-pre-wrap">{executionResult}</p>
                                            <button onClick={() => setReported(true)} disabled={reported} className="mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold disabled:opacity-50">
                                                {reported ? 'Reported!' : 'Report Missing Library'}
                                            </button>
                                        </div>
                                    ) : hasError ? (
                                        <div className="text-center">
                                            <p className="text-red-500 font-mono text-sm whitespace-pre-wrap">{executionResult}</p>
                                            <button onClick={() => onCodeChange(currentCode, executionResult)} className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold">
                                                🤖 Ask AI to Fix This
                                            </button>
                                        </div>
                                    ) : (
                                        <ChartRenderer key={chartType} result={{ ...result, visualization: { ...result.visualization, type: chartType } }} />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <StatsTable summary={result.summary_table} />
                </div>
                {result.suggested_next_steps && (
                    (() => {
                        // Parse suggested_next_steps - could be array, string, or JSON string
                        let steps = result.suggested_next_steps;
                        if (typeof steps === 'string') {
                            try {
                                steps = JSON.parse(steps);
                            } catch (e) {
                                // If not valid JSON, treat as single suggestion
                                steps = [steps];
                            }
                        }
                        if (!Array.isArray(steps)) {
                            steps = [steps];
                        }
                        // Filter out empty items
                        steps = steps.filter(s => s && typeof s === 'string' && s.trim());

                        if (steps.length === 0) return null;

                        return (
                            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 rounded-b-2xl">
                                <h4 className="text-base font-semibold mb-3 text-gray-700 dark:text-gray-300">Suggested Next Steps:</h4>
                                <div className="flex flex-wrap gap-2">
                                    {steps.map((q, i) => (
                                        <button
                                            key={i}
                                            onClick={() => onNextQuestion(q)}
                                            className="px-4 py-2 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 text-sm rounded-full hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors cursor-pointer text-left"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })()
                )}
            </div>
            <ChartModal isOpen={isChartModalOpen} onClose={() => setIsChartModalOpen(false)} result={{ ...result, visualization: { ...result.visualization, type: chartType } }} />
            <CodeModal isOpen={isCodeModalOpen} onClose={() => setIsCodeModalOpen(false)} initialCode={currentCode} onRunCode={handleRunCodeFromModal} />
        </>
    );
};
const DataSourceModal = ({ isOpen, onClose, onUploadSuccess, onTableSelect, onShopifyDataSelect }) => {
    const [activeTab, setActiveTab] = useState('file');

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 pt-6 pb-4">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                        Add Data Source
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Upload a file, connect to a database, or import from Shopify
                    </p>
                </div>

                {/* Tabs */}
                <div className="px-6">
                    <div className="flex border-b border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => setActiveTab('file')}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'file'
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            Upload File
                        </button>
                        <button
                            onClick={() => setActiveTab('database')}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'database'
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                            </svg>
                            Database
                        </button>
                        <button
                            onClick={() => setActiveTab('shopify')}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'shopify'
                                ? 'border-green-600 text-green-600 dark:text-green-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            Shopify
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto" id="file-upload-area">
                    {activeTab === 'file' && (
                        <FileUpload onUploadSuccess={onUploadSuccess} isStandalone={true} />
                    )}
                    {activeTab === 'database' && (
                        <DatabaseConnection onTableSelect={onTableSelect} onConnectionSuccess={() => { }} />
                    )}
                    {activeTab === 'shopify' && (
                        <ShopifyConnection
                            onConnectionSuccess={() => { }}
                            onDataSelect={(data) => {
                                onShopifyDataSelect && onShopifyDataSelect(data);
                                onClose();
                            }}
                        />
                    )}
                </div>

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Close (Esc)"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        </div>
    );
};
const ChatInput = ({ onSendMessage, onDataSourceClick, onAgentClick, disabled, hasConversation, isWelcomeScreen }) => {
    const [inputValue, setInputValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [showConnectors, setShowConnectors] = useState(false);
    const [showTools, setShowTools] = useState(false);
    const [showAgent, setShowAgent] = useState(false);
    const [advancedReasoning, setAdvancedReasoning] = useState(false);
    const [selectedModel, setSelectedModel] = useState('Default');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (inputValue.trim()) {
            onSendMessage(inputValue.trim());
            setInputValue('');
        }
    };

    // Icons for toolbar
    const AttachIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
        </svg>
    );

    const ConnectorIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
    );

    const ToolsIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="21" x2="4" y2="14" />
            <line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" />
            <line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" />
            <line x1="9" y1="8" x2="15" y2="8" />
            <line x1="17" y1="16" x2="23" y2="16" />
        </svg>
    );

    const AgentIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
            <path d="M2 12h20" />
        </svg>
    );

    const BrainIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.54" />
            <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24A2.5 2.5 0 0 0 14.5 2" />
        </svg>
    );

    const ChevronDown = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
        </svg>
    );

    return (
        <div className="w-full">
            <form onSubmit={handleSubmit} className="w-full">
                {/* Main input container */}
                <div className={`relative w-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg ${isFocused ? 'ring-2 ring-blue-500/20 border-blue-400' : ''} transition-all duration-200`}>
                    {/* Input field row */}
                    <div className="flex items-center">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            placeholder={hasConversation ? "Ask a follow-up question..." : "Create an interactive dashboard from my data..."}
                            disabled={disabled}
                            className="w-full px-5 py-4 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none font-medium text-base"
                        />
                    </div>

                    {/* Toolbar row */}
                    <div className="flex items-center justify-between px-3 py-2.5 border-t border-gray-100 dark:border-gray-700/50">
                        {/* Left side - options */}
                        <div className="flex items-center gap-1">
                            {/* Attach button */}
                            <button
                                type="button"
                                onClick={onDataSourceClick}
                                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                title="Attach file"
                            >
                                <AttachIcon />
                            </button>

                            {/* Connectors dropdown */}
                            <button
                                type="button"
                                onClick={() => setShowConnectors(!showConnectors)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${showConnectors ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                            >
                                <ConnectorIcon />
                                <span>Connectors</span>
                                <ChevronDown />
                            </button>

                            {/* Tools dropdown */}
                            {/* <button
                                type="button"
                                onClick={() => setShowTools(!showTools)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${showTools ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                            >
                                <ToolsIcon />
                                <span>Tools</span>
                                <ChevronDown />
                            </button> */}

                            {/* Agent dropdown */}
                            <button
                                type="button"
                                onClick={() => onAgentClick?.()}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400`}
                                title="Build Custom Agent"
                            >
                                <AgentIcon />
                                <span>Agent</span>
                                <ChevronDown />
                            </button>

                            {/* Advanced Reasoning toggle */}
                            <button
                                type="button"
                                onClick={() => setAdvancedReasoning(!advancedReasoning)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${advancedReasoning ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                            >
                                <BrainIcon />
                                <span>Advanced Reasoning</span>
                            </button>
                        </div>

                        {/* Right side - model selector and send */}
                        <div className="flex items-center gap-2">
                            {/* Model selector */}
                            <div className="relative">
                                <select
                                    value={selectedModel}
                                    onChange={(e) => setSelectedModel(e.target.value)}
                                    className="appearance-none bg-transparent text-sm font-medium text-gray-600 dark:text-gray-400 pr-6 pl-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer focus:outline-none"
                                >
                                    <option value="Default">Default</option>
                                    <option value="GPT-4">GPT-4</option>
                                    <option value="Claude">Claude</option>
                                    <option value="Gemini">Gemini</option>
                                </select>
                                <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <ChevronDown />
                                </div>
                            </div>

                            {/* Send button */}
                            <button
                                type="submit"
                                disabled={disabled || !inputValue.trim()}
                                className="p-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
                                title="Send"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 19V5" />
                                    <path d="m5 12 7-7 7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </form>


        </div>
    );
};

// ===================================================================================
// MAIN WORKSPACE COMPONENT - CORRECTED
// ===================================================================================
export default function AnalysisWorkspace({ conversationId, onConversationUpdate }) {
    const [conversation, setConversation] = useState(null);
    // messages is the single source-of-truth for chat rendering
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState('');
    const [error, setError] = useState('');
    const chatEndRef = useRef(null);
    const [sheetSelection, setSheetSelection] = useState(null);
    const [isDataSourceModalOpen, setIsDataSourceModalOpen] = useState(false);
    const [usage, setUsage] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [streamingData, setStreamingData] = useState({
        currentStep: '',
        tokens: [],
        interpretationTokens: [],
        isComplete: false
    });

    // Role-based analysis state
    const [showRoleSelector, setShowRoleSelector] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);
    const [roleSummary, setRoleSummary] = useState(null);
    const [pendingConversation, setPendingConversation] = useState(null);

    // Agent Builder modal state
    const [isAgentBuilderOpen, setIsAgentBuilderOpen] = useState(false);

    // Timer for elapsed time during thinking
    useEffect(() => {
        let timer;
        if (isThinking) {
            setElapsedTime(0);
            timer = setInterval(() => {
                setElapsedTime(prev => prev + 100);
            }, 100);
        }
        return () => clearInterval(timer);
    }, [isThinking]);

    // keep viewport scrolled to bottom when messages change
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, streamingData]);

    // notify parent about conversation metadata changes
    useEffect(() => {
        onConversationUpdate(conversation);
    }, [conversation, onConversationUpdate]);

    useEffect(() => {
        // load selected conversation
        const loadConversation = async () => {
            if (!conversationId) {
                setConversation(null);
                setMessages([]);
                setError('');
                return;
            }
            setIsLoading(true);
            setError('');
            try {
                const response = await api.get(`/conversation/${conversationId}`);
                // normalize: backend may return { conversation: {...} } or the conversation object directly
                const data = response.data || {};
                const conv = data.conversation || data;
                setConversation(conv);
                // normalize messages into our local messages state
                setMessages(Array.isArray(conv?.messages) ? conv.messages : []);
            } catch (err) {
                setError(err.response?.data?.detail || 'Failed to load conversation.');
                setConversation(null);
                setMessages([]);
            } finally {
                setIsLoading(false);
            }
        };
        loadConversation();
    }, [conversationId]);

    // Fetch usage info so we can disable sending when free limit hit
    useEffect(() => {
        let mounted = true;
        const fetchUsage = async () => {
            try {
                const resp = await api.get('/users/me/usage');
                if (!mounted) return;
                setUsage(resp.data);
            } catch (e) {
                // It's okay if this endpoint isn't present; just don't enforce client-side
                setUsage(null);
            }
        };
        fetchUsage();
        return () => { mounted = false; };
    }, []);

    const pushAssistantMessage = (assistantContent) => {
        const assistantMsg = { role: 'assistant', content: assistantContent };
        setMessages(prev => {
            const next = [...prev, assistantMsg];
            // keep conversation.messages in sync
            setConversation(prevConv => prevConv ? ({ ...prevConv, messages: next }) : prevConv);
            return next;
        });
    };

    const handleUploadSuccess = async (datasetFile) => {
        setIsDataSourceModalOpen(false);
        setIsLoading(true);
        setError('');
        setConversation(null);
        setMessages([]);
        setSheetSelection(null);
        setSelectedRole(null);
        setRoleSummary(null);

        const formData = new FormData();
        formData.append('file', datasetFile);

        try {
            const response = await api.post('/conversation/start', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            const data = response.data || {};
            if (data.status === 'requires_sheet_selection') {
                setSheetSelection(data);
            } else {
                const conv = data.conversation || data;
                // Store conversation but show role selector first
                setPendingConversation(conv);
                setShowRoleSelector(true);
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to start analysis.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle role selection
    const handleRoleSelect = async (role) => {
        if (!pendingConversation?.conversation_id) return;

        setIsLoading(true);
        try {
            const response = await moatService.setUserRole(
                pendingConversation.conversation_id,
                role.id,
                role.name,
                role.description
            );

            setSelectedRole(role);
            setRoleSummary(response.role_summary);
            setConversation(pendingConversation);
            setMessages(Array.isArray(pendingConversation.messages) ? pendingConversation.messages : []);
            onConversationUpdate(pendingConversation);
            setShowRoleSelector(false);
            setPendingConversation(null);
        } catch (err) {
            console.log('Role setting failed, continuing without role:', err.message);
            // Continue without role if it fails
            setConversation(pendingConversation);
            setMessages(Array.isArray(pendingConversation.messages) ? pendingConversation.messages : []);
            onConversationUpdate(pendingConversation);
            setShowRoleSelector(false);
            setPendingConversation(null);
        } finally {
            setIsLoading(false);
        }
    };

    // Skip role selection
    const handleSkipRole = () => {
        if (pendingConversation) {
            setConversation(pendingConversation);
            setMessages(Array.isArray(pendingConversation.messages) ? pendingConversation.messages : []);
            onConversationUpdate(pendingConversation);
        }
        setShowRoleSelector(false);
        setPendingConversation(null);
    };

    const handleSheetSelect = async (sheetName) => {
        if (!sheetSelection?.conversation_id) return;
        setIsLoading(true);
        setError('');
        try {
            const response = await api.post(`/conversation/${sheetSelection.conversation_id}/select_sheet`, { sheet_name: sheetName });
            const data = response.data || {};
            const conv = data.conversation || data;
            setConversation(conv);
            setMessages(Array.isArray(conv.messages) ? conv.messages : []);
            setSheetSelection(null);
            onConversationUpdate(conv);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to load selected sheet.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTableSelect = (response) => {
        // normalize response object if backend returned wrapper
        const data = response || {};
        const conv = data.conversation || data;
        setConversation(conv);
        setMessages(Array.isArray(conv.messages) ? conv.messages : []);
        setSheetSelection(null);
        setIsDataSourceModalOpen(false);
        onConversationUpdate(conv);
    };

    // Handle Shopify data import
    const handleShopifyDataSelect = (response) => {
        const data = response || {};
        const conv = data.conversation || data;
        setConversation(conv);
        setMessages(Array.isArray(conv.messages) ? conv.messages : []);
        setSheetSelection(null);
        setIsDataSourceModalOpen(false);
        onConversationUpdate(conv);
    };

    const handleAskQuestion = async (question) => {
        // client-side guard: if user is on free plan and has no remaining messages, block
        if (usage && !usage.is_paid && typeof usage.remaining_free_messages === 'number' && usage.remaining_free_messages <= 0) {
            setError('Free message limit reached. Please upgrade to continue.');
            return;
        }
        if (!conversation?.conversation_id || isThinking) return;
        const userMsg = { role: 'user', content: question };
        const optimistic = [...messages, userMsg];
        setMessages(optimistic);
        setIsThinking(true);
        setCurrentQuestion(question);
        setError('');

        // Reset streaming data
        setStreamingData({
            currentStep: '',
            tokens: [],
            interpretationTokens: [],
            isComplete: false
        });

        try {
            // Use streaming endpoint
            const token = getToken();
            if (!token) {
                setError('Authentication required. Please log in again.');
                setIsThinking(false);
                return;
            }
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/conversation/${conversation.conversation_id}/ask_stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ question })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to get analysis');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let finalResult = null;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));

                            if (data.type === 'thinking') {
                                setStreamingData(prev => ({
                                    ...prev,
                                    currentStep: data.content
                                }));
                            } else if (data.type === 'token') {
                                setStreamingData(prev => ({
                                    ...prev,
                                    tokens: [...prev.tokens, data.content]
                                }));
                            } else if (data.type === 'interpretation_token') {
                                setStreamingData(prev => ({
                                    ...prev,
                                    interpretationTokens: [...prev.interpretationTokens, data.content]
                                }));
                            } else if (data.type === 'complete') {
                                finalResult = data.result;
                                setStreamingData(prev => ({
                                    ...prev,
                                    isComplete: true
                                }));
                            } else if (data.type === 'error') {
                                throw new Error(data.content);
                            }
                        } catch (parseError) {
                            // Skip invalid JSON lines
                        }
                    }
                }
            }

            if (finalResult) {
                pushAssistantMessage(finalResult);
                setConversation(prev => prev ? ({ ...prev, messages: [...(prev.messages || []), userMsg, { role: 'assistant', content: finalResult }] }) : prev);
                onConversationUpdate(conversation ? ({ ...conversation, messages: [...(conversation.messages || []), userMsg, { role: 'assistant', content: finalResult }] }) : conversation);
            }

            // refresh usage after a successful ask
            try {
                const resp = await api.get('/users/me/usage');
                setUsage(resp.data);
            } catch (e) {
                // ignore
            }
        } catch (err) {
            setError(err.message || 'Failed to get analysis.');
        } finally {
            setIsThinking(false);
            setStreamingData({
                currentStep: '',
                tokens: [],
                interpretationTokens: [],
                isComplete: false
            });
        }
    };

    const handleCodeChange = async (newCode, errorToFix = null) => {
        if (!conversation?.conversation_id || isThinking) return;
        const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
        if (!lastUserMessage) return;

        const userPrompt = errorToFix ? "Please fix the previous code." : "I've edited the code. Please run this new version.";
        const userMsg = { role: 'user', content: userPrompt };
        setMessages(prev => [...prev, userMsg]);
        setIsThinking(true);
        setError('');

        try {
            const response = await api.post(`/conversation/${conversation.conversation_id}/fix_code`, {
                code: newCode,
                error: errorToFix || "User edited the code.",
                question: lastUserMessage.content
            });
            const assistantContent = response.data;
            pushAssistantMessage(assistantContent);
            // update conversation object
            setConversation(prev => prev ? ({ ...prev, messages: [...(prev.messages || []), userMsg, { role: 'assistant', content: assistantContent }] }) : prev);
            onConversationUpdate(conversation ? ({ ...conversation, messages: [...(conversation.messages || []), userMsg, { role: 'assistant', content: assistantContent }] }) : conversation);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to process code.');
        } finally {
            setIsThinking(false);
        }
    };

    // Render helpers
    const renderMessage = (msg, index) => {
        if (msg.role === 'user') {
            return (
                <div key={index} className="flex justify-end">
                    <div className="bg-blue-600 text-white rounded-2xl rounded-br-none max-w-xl p-4">
                        <p>{String(msg.content)}</p>
                    </div>
                </div>
            );
        }

        // assistant messages - if structured result object with valid python_code, render AnalysisResult
        // Check for complete structure to avoid crashes with malformed data
        const isValidAnalysisResult = msg.role === 'assistant' &&
            msg.content &&
            typeof msg.content === 'object' &&
            msg.content.python_code &&
            typeof msg.content.python_code.code === 'string' &&
            msg.content.visualization;

        if (isValidAnalysisResult) {
            return (
                <div key={index} className="flex justify-start w-full">
                    <div className="w-full ">
                        <AnalysisResult
                            result={msg.content}
                            onNextQuestion={(q) => handleAskQuestion(q)}
                            onCodeChange={handleCodeChange}
                        />
                    </div>
                </div>
            );
        }

        // assistant plain text fallback (or error message or malformed data)
        return (
            <div key={index} className="flex justify-start">
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg max-w-xl">
                    {typeof msg.content === 'string' ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    ) : msg.content?.python_code?.comments ? (
                        // Malformed AnalysisResult - show at least the comments/interpretation
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content.python_code.comments}</ReactMarkdown>
                    ) : (
                        <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(msg.content, null, 2)}</pre>
                    )}
                </div>
            </div>
        );
    };

    const renderWelcomeScreen = () => (
        <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-full max-w-3xl">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-gray-100 mb-10">
                    What do you want to analyze today?
                </h2>
                <ChatInput
                    onSendMessage={handleAskQuestion}
                    onDataSourceClick={() => setIsDataSourceModalOpen(true)}
                    onAgentClick={() => setIsAgentBuilderOpen(true)}
                    disabled={isThinking || (usage && !usage.is_paid && usage.remaining_free_messages === 0)}
                    hasConversation={false}
                    isWelcomeScreen={true}
                />
            </div>
        </div>
    );

    const renderContent = () => {
        if (isLoading) return <div className="flex items-center justify-center h-full"><p className="animate-pulse text-gray-600 dark:text-gray-300">Loading conversation...</p></div>;
        if (sheetSelection) return <div className="flex flex-col items-center justify-center h-full p-4"><SheetSelector sheetNames={sheetSelection.sheet_names} onSelectSheet={handleSheetSelect} isLoading={isLoading} /></div>;

        // Show role selector after upload
        if (showRoleSelector && pendingConversation) {
            const columns = pendingConversation.initial_summary?.columns?.map(c => c.name) || [];
            return (
                <div className="flex flex-col items-center justify-center h-full p-4">
                    <RoleSelector
                        columns={columns}
                        onRoleSelect={handleRoleSelect}
                        onSkip={handleSkipRole}
                    />
                </div>
            );
        }

        const initialSummary = conversation?.initial_summary;

        if (!conversation) {
            return renderWelcomeScreen();
        }

        return (
            <div className="chat-history flex-1 mb-24 md:mb-20 overflow-y-auto">
                <div className="space-y-6 p-4">
                    <DataSummary summary={initialSummary} />

                    {/* Role-based summary card */}
                    {selectedRole && roleSummary && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl border border-purple-200 dark:border-purple-800 p-6"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-2xl">{selectedRole.icon}</span>
                                <div>
                                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                                        Analyzing as: {selectedRole.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Customized insights for your role
                                    </p>
                                </div>
                            </div>

                            {/* Key Insights */}
                            {roleSummary.key_insights?.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-400 mb-2">💡 Key Insights</h4>
                                    <ul className="space-y-1">
                                        {roleSummary.key_insights.map((insight, i) => (
                                            <li key={i} className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2">
                                                <span className="text-purple-500">•</span>
                                                {insight}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Suggested Questions */}
                            {roleSummary.suggested_questions?.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-400 mb-2">❓ Questions to Ask</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {roleSummary.suggested_questions.map((q, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleAskQuestion(q)}
                                                className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-gray-700 dark:text-gray-300"
                                            >
                                                {q}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Relevant Metrics */}
                            {roleSummary.relevant_metrics?.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-400 mb-2">📊 Key Metrics to Track</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {roleSummary.relevant_metrics.map((metric, i) => (
                                            <span key={i} className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                                                {metric}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Action Items */}
                            {roleSummary.action_items?.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-400 mb-2">✅ Recommended Actions</h4>
                                    <ul className="space-y-1">
                                        {roleSummary.action_items.map((action, i) => (
                                            <li key={i} className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2">
                                                <span className="text-green-500">→</span>
                                                {action}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </motion.div>
                    )}

                    <DataPreview preview={initialSummary?.sample_preview} />
                    {messages.map((msg, index) => renderMessage(msg, index))}
                    {/* Show thinking loader while awaiting AI reply */}
                    {isThinking && (
                        <div className="flex justify-start">
                            <div className="w-full">
                                <StreamingThinkingLoader
                                    question={currentQuestion}
                                    streamingData={streamingData}
                                    elapsedTime={elapsedTime}
                                />
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                    {error && <pre className="p-4 bg-red-100 text-red-800 rounded-lg mt-4 text-xs whitespace-pre-wrap">{error}</pre>}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            <div className="flex-grow overflow-y-auto relative">
                {renderContent()}
            </div>
            {/* Only show bottom input bar when there's an active conversation */}
            {conversation && (
                <div className="absolute bottom-0 left-0 right-0 flex-shrink-0 w-full p-4 bg-gradient-to-t from-gray-50 dark:from-gray-900 to-transparent">
                    <div className="max-w-3xl mx-auto">
                        <ChatInput
                            onSendMessage={handleAskQuestion}
                            onDataSourceClick={() => setIsDataSourceModalOpen(true)}
                            onAgentClick={() => setIsAgentBuilderOpen(true)}
                            disabled={isThinking || (usage && !usage.is_paid && usage.remaining_free_messages === 0)}
                            hasConversation={true}
                            isWelcomeScreen={false}
                        />
                        {/* show a small quota banner when the user is close to or out of limit */}
                        {usage && !usage.is_paid && (
                            <div className="mt-2 text-center text-xs text-gray-600 dark:text-gray-300">
                                {usage.remaining_free_messages > 0 ? (
                                    <span>Free messages remaining: <strong>{usage.remaining_free_messages}</strong></span>
                                ) : (
                                    <span className="text-red-600 dark:text-red-400">Free message limit reached — <a href="#/pricing" className="underline">upgrade</a> to continue</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
            <DataSourceModal
                isOpen={isDataSourceModalOpen}
                onClose={() => setIsDataSourceModalOpen(false)}
                onUploadSuccess={handleUploadSuccess}
                onTableSelect={handleTableSelect}
                onShopifyDataSelect={handleShopifyDataSelect}
            />
            <WorkflowAgentBuilder
                isOpen={isAgentBuilderOpen}
                onClose={() => setIsAgentBuilderOpen(false)}
                onAgentCreated={(agent) => {
                    console.log('Agent created:', agent);
                    // Optionally show success notification
                }}
            />
        </div>
    );
}