import React, { useEffect, useState } from 'react';

function normalize(text) {
  return (text || '').toLowerCase();
}

function findBestMatchColumn(prompt, candidates) {
  const p = normalize(prompt);
  let best = null;
  let bestScore = -1;
  candidates.forEach(col => {
    const name = col.toLowerCase();
    // Simple scoring: full word match > substring > 0
    const exact = new RegExp(`(^|[^a-z0-9_])${name}($|[^a-z0-9_])`);
    let score = 0;
    if (exact.test(p)) score = 3;
    else if (p.includes(name)) score = 1;
    if (score > bestScore) { bestScore = score; best = col; }
  });
  return best || candidates[0];
}

function parsePromptToAnalysis(prompt, dataProfile) {
  const p = normalize(prompt);
  const numeric = dataProfile?.numeric_columns || [];
  const categorical = dataProfile?.categorical_columns || [];
  const anyCols = [...numeric, ...categorical];

  // Descriptive intent
  if (/(describe|distribution|histogram|summary|stats|mean|median|std)/.test(p)) {
    if (numeric.length === 0) return null;
    const col = findBestMatchColumn(p, numeric);
    return { analysis: 'Descriptive Statistics', params: { column: col } };
  }

  // Paired intent
  if (/(paired|before.*after|pre.*post)/.test(p) && numeric.length >= 2) {
    const c1 = findBestMatchColumn(p, numeric);
    const remaining = numeric.filter(c => c !== c1);
    const c2 = findBestMatchColumn(p, remaining.length ? remaining : numeric);
    return { analysis: 'Paired T-Test', params: { numeric_col_1: c1, numeric_col_2: c2 } };
  }

  // Group comparison intent (t-test/ANOVA)
  if (/(compare|difference|group|by|across|anova|t[- ]?test)/.test(p) && (numeric.length > 0 && categorical.length > 0)) {
    const num = findBestMatchColumn(p, numeric);
    const cat = findBestMatchColumn(p, categorical);
    const levels = (dataProfile?.categorical_values?.[cat] || []).length;
    if (/(anova)/.test(p) || levels >= 3) {
      return { analysis: 'One-Way ANOVA', params: { numeric_column: num, categorical_column: cat } };
    }
    return { analysis: 'Unpaired T-Test', params: { numeric_column: num, categorical_column: cat } };
  }

  // Association / Chi-Square intent
  if (/(association|relationship|chi|categorical)/.test(p) && categorical.length >= 2) {
    const c1 = findBestMatchColumn(p, categorical);
    const remaining = categorical.filter(c => c !== c1);
    const c2 = findBestMatchColumn(p, remaining.length ? remaining : categorical);
    return { analysis: 'Chi-Square Test', params: { categorical_col_1: c1, categorical_col_2: c2 } };
  }

  // Crosstab intent
  if (/(crosstab|contingency|table)/.test(p) && anyCols.length >= 2) {
    const v1 = findBestMatchColumn(p, anyCols);
    const remaining = anyCols.filter(c => c !== v1);
    const v2 = findBestMatchColumn(p, remaining.length ? remaining : anyCols);
    return { analysis: 'Crosstabulation', params: { variables: [v1, v2] } };
  }

  // Fallbacks
  if (numeric.length > 0) return { analysis: 'Descriptive Statistics', params: { column: numeric[0] } };
  if (anyCols.length >= 2) return { analysis: 'Crosstabulation', params: { variables: [anyCols[0], anyCols[1]] } };
  return null;
}

function ChatAnalysis({ dataProfile, onRunAnalysis, isLoading, analysisResult }) {
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]); // { role: 'user'|'assistant', content: string }

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const parsed = parsePromptToAnalysis(prompt, dataProfile);
    if (!parsed) {
      setError('Could not understand the request. Try mentioning a column name.');
      return;
    }
    // Append user message and a placeholder assistant message
    setMessages(prev => [
      ...prev,
      { role: 'user', content: prompt.trim() },
      { role: 'assistant', content: 'Analyzing your request...', pending: true }
    ]);
    setPrompt('');
    onRunAnalysis(parsed.analysis, parsed.params);
  };

  // When analysis completes, replace the latest pending assistant message with a short summary
  useEffect(() => {
    if (!analysisResult || isLoading) return;
    setMessages(prev => {
      const idx = [...prev].reverse().findIndex(m => m.role === 'assistant' && m.pending);
      if (idx === -1) return prev;
      const ri = prev.length - 1 - idx;
      const summary = buildAssistantSummary(analysisResult);
      const updated = [...prev];
      updated[ri] = { role: 'assistant', content: summary, pending: false };
      return updated;
    });
  }, [analysisResult, isLoading]);

  function buildAssistantSummary(resultPayload) {
    try {
      const r = resultPayload?.results || {};
      const type = r.analysis_type || 'Analysis';
      if (type === 'Descriptive Statistics') {
        const col = r.column_analyzed;
        const s = r.statistics || {};
        return `Ran Descriptive Statistics on ${col}. Mean ${fmt(s.mean)}, median ${fmt(s.median)}, SD ${fmt(s.std_dev)}, n ${fmt(r?.statistics?.count)}`;
      }
      if (type === 'Unpaired T-Test') {
        return `Compared ${r.numeric_column} across ${r.categorical_column}. p=${fmt(r.p_value)} (${sig(r.p_value)}).`;
      }
      if (type === 'One-Way ANOVA') {
        return `ANOVA of ${r.numeric_column} by ${r.categorical_column}. p=${fmt(r.p_value)} (${sig(r.p_value)}).`;
      }
      if (type === 'Paired T-Test') {
        return `Paired T-Test on ${r.columns_analyzed?.join(' vs ')}. p=${fmt(r.p_value)} (${sig(r.p_value)}).`;
      }
      if (type === 'Chi-Square Test') {
        return `Chi-Square between ${r.variables?.join(' and ')}. p=${fmt(r.p_value)} (${sig(r.p_value)}).`;
      }
      if (type === 'Crosstabulation') {
        return `Generated Crosstab: ${r.row_variable} by ${r.column_variable}.`;
      }
      return `${type} complete.`;
    } catch (_e) {
      return 'Analysis complete.';
    }
  }

  function fmt(x) {
    if (x == null || Number.isNaN(x)) return 'N/A';
    if (typeof x === 'number') return x.toFixed(4);
    return String(x);
  }

  function sig(p) {
    if (typeof p !== 'number') return 'n.s.';
    return p < 0.05 ? 'significant' : 'not significant';
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3">Chat Analysis</h3>

      {/* Chat thread */}
      <div className="mb-4 max-h-72 overflow-y-auto space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'} px-4 py-2 rounded-2xl max-w-[80%] whitespace-pre-wrap`}>
              {m.content}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Show distribution of BMI, or compare BMI across Gender"
            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-50"
          >
            {isLoading ? 'Running...' : 'Ask'}
          </button>
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <p className="text-xs text-gray-500 dark:text-gray-400">Hints: say “describe height”, “compare weight across gender”, “chi between smoke and disease”, “crosstab age by gender”.</p>
      </form>
    </div>
  );
}

export default ChatAnalysis;
