import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import authService from '../services/authService';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

const ProtectedRoute = ({ adminOnly = false }) => {
  const location = useLocation();
  const [accessStatus, setAccessStatus] = useState(null); // 'allowed', 'denied', or null (loading)
  const [isLoading, setIsLoading] = useState(true);
  
  // Get the current user object, which contains the token
  const currentUser = authService.getCurrentUser();
  const token = currentUser ? currentUser.access_token : null;

  // Decode token to get user role (do this early, before hooks)
  let userRole = 'user';
  let tokenValid = true;
  
  if (token) {
    try {
      const decodedToken = jwtDecode(token);
      userRole = decodedToken.role;
    } catch (error) {
      console.error("Invalid token:", error);
      tokenValid = false;
    }
  }

  // Check access status for non-admin users
  useEffect(() => {
    const checkAccess = async () => {
      // Skip check for admins - they always have access
      if (userRole === 'admin') {
        setAccessStatus('allowed');
        setIsLoading(false);
        return;
      }

      try {
        // Check usage endpoint which tells us if user has remaining free messages or is paid
        const usageResponse = await api.get('/users/me/usage');
        const usage = usageResponse.data;
        
        console.log('Usage data:', usage); // Debug log
        
        // Allow access if:
        // 1. User is paid (has active subscription)
        // 2. User still has remaining free messages (including new users with full quota)
        // 3. remaining_free_messages is undefined/null means unlimited (paid user)
        const isPaid = usage.is_paid === true;
        const hasRemainingMessages = typeof usage.remaining_free_messages === 'number' && usage.remaining_free_messages > 0;
        const isUnlimited = usage.remaining_free_messages === null || usage.remaining_free_messages === undefined;
        
        if (isPaid || hasRemainingMessages || isUnlimited) {
          setAccessStatus('allowed');
        } else {
          setAccessStatus('denied');
        }
      } catch (error) {
        console.error('Failed to check access:', error);
        // On error, default to ALLOWING access to avoid blocking legitimate users
        // The backend will enforce limits when they try to send messages
        setAccessStatus('allowed');
      }
      setIsLoading(false);
    };

    if (token && tokenValid && userRole !== 'admin') {
      checkAccess();
    } else if (userRole === 'admin') {
      setAccessStatus('allowed');
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [location.pathname, token, tokenValid, userRole]);

  // Check if the user is logged in
  if (!token || !tokenValid) {
    return <Navigate to="/login" />;
  }

  // Admin check - admins bypass subscription checks
  if (adminOnly) {
    if (userRole !== 'admin') {
      return <Navigate to="/ai-analyst" />;
    }
    return <Outlet />;
  }

  // Admins have full access without subscription check
  if (userRole === 'admin') {
    return <Outlet />;
  }

  // Show loading state while checking access
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  // If user doesn't have access (no subscription AND no free messages left), redirect to pricing
  if (accessStatus === 'denied') {
    // Allow access to pricing page even without subscription
    if (location.pathname === '/pricing') {
      return <Outlet />;
    }
    return <Navigate to="/pricing" state={{ from: location }} />;
  }

  // User has access (either paid or has free messages remaining)
  return <Outlet />;
};

export default ProtectedRoute;