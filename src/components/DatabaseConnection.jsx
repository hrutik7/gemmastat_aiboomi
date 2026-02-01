import React, { useState } from 'react';
import api from '../services/api';

function DatabaseConnection({ onConnectionSuccess, onTableSelect }) {
  const [connectionUrl, setConnectionUrl] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [tables, setTables] = useState([]);
  const [schemaInfo, setSchemaInfo] = useState({});
  const [conversationId, setConversationId] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [isSelectingTable, setIsSelectingTable] = useState(false);
  const [databaseName, setDatabaseName] = useState('');

  const handleInputChange = (e) => {
    setConnectionUrl(e.target.value);
    setError('');
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    if (!connectionUrl.trim()) {
      setError('Please enter a connection URL');
      return;
    }
    
    setIsConnecting(true);
    setError('');
    
    try {
      const response = await api.post('/conversation/connect_db', {
        connection_url: connectionUrl.trim()
      });
      
      // Set the tables and schema info from the new format
      const tables = response.data.database_schema?.tables || [];
      const schema = response.data.database_schema?.schema || {};
      
      setTables(tables);
      setSchemaInfo(schema);
      setConversationId(response.data.conversation_id);
      setDatabaseName(response.data.message?.replace('Successfully connected to ', '') || 'Database');
      
      // Pass both tables and schema info to parent
      if (onConnectionSuccess) {
        onConnectionSuccess({
          ...response.data,
          tables,
          schemaInfo
        });
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to connect to database. Please check your connection URL.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSelectTable = async (tableName) => {
    if (!conversationId) return;
    
    setIsSelectingTable(true);
    setError('');
    
    try {
      const response = await api.post(`/conversation/${conversationId}/select_table`, {
        table_name: tableName
      });
      setSelectedTable(tableName);
      if (onTableSelect) {
        onTableSelect({
          ...response.data,
          selectedTable: tableName,
          tableInfo: schemaInfo[tableName] || {}
        });
      }
    } catch (err) {
      const errorMessage = err.response?.data?.detail;
      if (errorMessage?.includes('SQL')) {
        // Format SQL-related errors to be more user-friendly
        const friendlyError = errorMessage
          .replace('Failed to execute database query:', 'Database Error:')
          .replace('Error executing SQL:', '')
          .trim();
        setError(friendlyError);
      } else {
        setError(errorMessage || 'Failed to select table.');
      }
    } finally {
      setIsSelectingTable(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
        <span>🗄️</span>Connect to PostgreSQL Database
      </h3>

      {!conversationId ? (
        <form onSubmit={handleConnect} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              PostgreSQL Connection URL
            </label>
            <input
              type="text"
              value={connectionUrl}
              onChange={handleInputChange}
              required
              placeholder="postgresql://username:password@host:port/database"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100 font-mono text-sm"
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Example: postgresql://user:pass@localhost:5432/mydb
              <br />
              For schema: postgresql://user:pass@host:port/db?schema=custom_schema
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isConnecting || !connectionUrl.trim()}
            className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConnecting ? 'Connecting...' : 'Connect to Database'}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg">
            ✓ Successfully connected to {databaseName}
          </div>

          {tables?.length > 0 ? (
            <div>
              <h4 className="text-md font-semibold text-gray-800 dark:text-gray-100 mb-3">
                Select a table to analyze:
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {tables.map((table) => {
                  const tableInfo = schemaInfo[table] || {};
                  const relationships = tableInfo.relationships || [];
                  const columnCount = tableInfo.columns?.length || 0;
                  return (
                    <button
                      key={table}
                      onClick={() => handleSelectTable(table)}
                      disabled={isSelectingTable}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        selectedTable === table
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      } ${isSelectingTable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div>
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-100 block">
                          {table}
                        </span>
                        <div className="flex flex-col gap-1 mt-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {columnCount} {columnCount === 1 ? 'column' : 'columns'}
                          </span>
                          {relationships.length > 0 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {relationships.length} {relationships.length === 1 ? 'relationship' : 'relationships'}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-lg">
              No tables found in the database.
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DatabaseConnection;

