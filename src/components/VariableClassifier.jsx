import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// --- A self-contained component for the Ordinal ordering UI ---
const OrdinalSorter = ({ order, onOrderChange }) => {
  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(order);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    onOrderChange(items);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="categories">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef} className="mt-2 p-2 border bg-gray-50 rounded-md space-y-2">
            <p className="text-xs text-gray-500 text-center">Drag to reorder (Top = Lowest, Bottom = Highest)</p>
            {order.map((category, index) => (
              <Draggable key={category} draggableId={String(category)} index={index}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className="p-2 bg-white border rounded shadow-sm text-sm"
                  >
                    {category}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};


function VariableClassifier({ dataset, dataProfile }) {
  // State holds the type and order for each categorical variable
  const [variableConfig, setVariableConfig] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  // --- THE DEFINITIVE FIX IS IN THIS useEffect HOOK ---
  useEffect(() => {
    // Guard against running before the data profile is loaded
    if (!dataProfile || !dataProfile.categorical_columns || !dataProfile.categorical_values) {
        return;
    }

    const initialConfig = {};
    const savedConfig = dataProfile.variable_types || {};

    // Safely iterate through the categorical columns identified by the backend
    dataProfile.categorical_columns.forEach(col => {
      const saved = savedConfig[col];
      
      // Safely get the unique values for this column from the profile
      const uniqueValues = dataProfile.categorical_values[col] || [];

      if (saved && saved.type === 'Ordinal' && Array.isArray(saved.order)) {
        // If a valid saved ordinal config exists, use it.
        // We also ensure the saved order is still valid by checking against current unique values.
        const currentValuesSet = new Set(uniqueValues);
        const validSavedOrder = saved.order.filter(item => currentValuesSet.has(item));
        const newValues = uniqueValues.filter(item => !saved.order.includes(item));
        
        initialConfig[col] = { type: 'Ordinal', order: [...validSavedOrder, ...newValues] };
      } else {
        // Otherwise, default to Nominal and use the fresh unique values for the order.
        initialConfig[col] = { type: 'Nominal', order: uniqueValues };
      }
    });
    setVariableConfig(initialConfig);

  }, [dataProfile]); // This effect re-runs whenever the dataProfile prop changes

  const handleTypeChange = (column, newType) => {
    setVariableConfig(prev => ({
      ...prev,
      [column]: { ...prev[column], type: newType },
    }));
  };

  const handleOrderChange = (column, newOrder) => {
    setVariableConfig(prev => ({
        ...prev,
        [column]: { ...prev[column], order: newOrder },
    }));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setSaveStatus('');
    try {
      await api.put(`/datasets/${dataset.id}/variable-types`, variableConfig);
      setSaveStatus('Changes saved successfully!');
      setTimeout(() => setSaveStatus(''), 3000); // Clear message after 3s
    } catch (err) {
      setSaveStatus('Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const categoricalColumns = dataProfile?.categorical_columns || [];
  if (!categoricalColumns.length) {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-2">
                <span className="text-2xl">🏷️</span>
                Classify Your Categorical Variables
            </h3>
            <p className="text-sm text-gray-500">No categorical variables were detected in your dataset for classification.</p>
        </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 animate-fade-in">
      <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
        <span className="text-2xl">🏷️</span> Classify Your Categorical Variables
      </h3>
      <div className="space-y-6">
        {categoricalColumns.map(column => (
          <div key={column} className="p-4 border rounded-lg bg-gray-50/50">
            <div className="grid grid-cols-3 items-center gap-4">
              <label className="font-medium text-gray-700 truncate">{column}</label>
              <div className="col-span-2">
                <select
                  value={variableConfig[column]?.type || 'Nominal'}
                  onChange={(e) => handleTypeChange(column, e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="Nominal">Nominal (No Order, e.g., Gender)</option>
                  <option value="Ordinal">Ordinal (Has Order, e.g., Education Level)</option>
                </select>
              </div>
            </div>
            
            {variableConfig[column]?.type === 'Ordinal' && variableConfig[column]?.order && (
              <OrdinalSorter 
                order={variableConfig[column].order}
                onOrderChange={(newOrder) => handleOrderChange(column, newOrder)}
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-6 text-right">
        {saveStatus && <span className={`text-sm mr-4 ${saveStatus.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>{saveStatus}</span>}
        <button onClick={handleSaveChanges} disabled={isSaving} className="bg-blue-600 text-white font-semibold py-2 px-5 rounded-lg hover:bg-blue-700 transition disabled:bg-blue-300">
          {isSaving ? 'Saving...' : 'Save Types'}
        </button>
      </div>
    </div>
  );
}

export default VariableClassifier;