import React, { createContext, useContext, useState } from 'react';

// Create the context with a default value
const ConversationContext = createContext({
    selectedConversationId: null,
    setSelectedConversationId: () => {},
});

// Create a custom hook for easy access to the context
export const useConversation = () => useContext(ConversationContext);

// Create the Provider component that will wrap our layout
export const ConversationProvider = ({ children }) => {
    const [selectedConversationId, setSelectedConversationId] = useState(null);

    return (
        <ConversationContext.Provider value={{ selectedConversationId, setSelectedConversationId }}>
            {children}
        </ConversationContext.Provider>
    );
};