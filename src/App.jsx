// src/App.jsx

import React from 'react';
import {
    HashRouter,
    Routes,
    Route,
    Navigate,
} from 'react-router-dom';
import authService from './services/authService';
import AppLayout from './components/AppLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AiAnalystPage from './pages/AiAnalystPage.jsx';
import SampleSizePage from './pages/SampleSizePage.jsx';
import LiteratureReviewPage from './pages/LiteratureReviewPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import NotFound from './pages/NotFound.jsx';
import ManualAnalysisPage from './pages/ManualAnalysisPage.jsx';
import PricingPage from './pages/PricingPage.jsx';
import PublicPricingPage from './pages/PublicPricingPage.jsx';
import ResearchWorkflowPage from './pages/ResearchWorkflowPage.jsx';

function App() {
    const isLoggedIn = authService.isAuthenticated();

    return (
        <>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/xyz/pricing" element={<PublicPricingPage />} />

                {/* --- FINAL ROUTING LOGIC --- */}
                <Route path="/" element={<Navigate to={isLoggedIn ? "/ai-analyst" : "/login"} />} />

                {/* Protected Routes Wrapper */}
                <Route element={<ProtectedRoute />}>
                    <Route element={<AppLayout />}>
                        <Route path="/ai-analyst" element={<AiAnalystPage />} />
                        <Route path="/sample-size" element={<SampleSizePage />} />
                        <Route path="/literature-review" element={<LiteratureReviewPage />} />
                        <Route path="/manual-analysis" element={<ManualAnalysisPage />} />
                        <Route path="/pricing" element={<PricingPage />} />
                        <Route path="/research/:conversationId" element={<ResearchWorkflowPage />} />
                    </Route>
                </Route>

                {/* Protected Admin Route (remains outside the main AppLayout) */}
                <Route element={<ProtectedRoute adminOnly={true} />}>
                    <Route path="/admin" element={<AdminPage />} />
                </Route>

                {/* Optional but recommended: Catch-all 404 page */}
                <Route path="*" element={<NotFound />} />
            </Routes>
        </>
    );
}

export default App;