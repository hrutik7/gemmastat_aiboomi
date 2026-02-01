// src/services/authService.js

import api from './api';
import { jwtDecode } from 'jwt-decode'; // +++ NEW IMPORT +++
import { identifyUser, resetUser, setUserProperties } from './posthog'; // PostHog tracking

const TOKEN_KEY = 'token';

// --- Login Functions ---

const login = async (email, password) => {
  const params = new URLSearchParams();
  params.append('username', email);
  params.append('password', password);

  const response = await api.post('/token', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  if (response.data.access_token) {
    localStorage.setItem('user', JSON.stringify(response.data));
    setToken(response.data.access_token); // Use our helper
    
    // Track user login in PostHog
    try {
      const decoded = jwtDecode(response.data.access_token);
      identifyUser(decoded.sub || email, {
        email: email,
        role: decoded.role || 'user',
        login_method: 'email'
      });
    } catch (e) {
      console.error('Failed to track login:', e);
    }
  }
  return response.data;
};

const googleLogin = async (credential) => {
  const response = await api.post('/google-login', { credential });
  if (response.data.access_token) {
    localStorage.setItem('user', JSON.stringify(response.data));
    setToken(response.data.access_token); // Use our helper
    
    // Track user login in PostHog
    try {
      const decoded = jwtDecode(response.data.access_token);
      identifyUser(decoded.sub || decoded.email, {
        email: decoded.email,
        role: decoded.role || 'user',
        login_method: 'google'
      });
    } catch (e) {
      console.error('Failed to track Google login:', e);
    }
  }
  return response.data;
};

const logout = () => {
  // Reset PostHog user before clearing local storage
  resetUser();
  
  localStorage.removeItem('user');
  clearToken(); // Use our helper
};

const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch (e) {
    return null;
  }
};

// --- Token Helper Functions ---

export function getToken() {
  try {
    // Prefer our canonical token key, but fall back to common keys used elsewhere
    return localStorage.getItem(TOKEN_KEY) || localStorage.getItem('accessToken') || (JSON.parse(localStorage.getItem('user') || 'null')?.access_token) || null;
  } catch (e) {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      // keep legacy key for third-party code expecting 'accessToken'
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('accessToken');
    }
  } catch (e) {
    // ignore
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('accessToken');
  } catch (e) {
    // ignore
  }
}

export function isAuthenticated() {
  const token = getToken();
  return !!token;
}

// +++ NEW FUNCTION TO GET USER ROLE +++
export function getUserRole() {
  const token = getToken();
  if (!token) {
    return null; // No user is logged in
  }
  try {
    const decodedToken = jwtDecode(token);
    return decodedToken.role; // e.g., 'user' or 'admin'
  } catch (error) {
    console.error("Invalid token - cannot decode:", error);
    return null; // Token is malformed or invalid
  }
}


// --- Main Service Object (Default Export) ---

const authService = {
  login,
  googleLogin,
  logout,
  getCurrentUser,
  getToken,
  setToken,
  clearToken,
  isAuthenticated,
  getUserRole, // +++ ADD NEW FUNCTION HERE
};

// Also export named functions for convenience
export { login, googleLogin, logout, getCurrentUser };
export default authService;