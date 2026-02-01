// src/services/posthog.js
import posthog from 'posthog-js';

// Initialize PostHog
export const initPostHog = () => {
    const posthogKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
    const posthogHost = import.meta.env.VITE_PUBLIC_POSTHOG_HOST;

    if (posthogKey && posthogHost) {
        posthog.init(posthogKey, {
            api_host: posthogHost,
            loaded: (posthog) => {
                if (import.meta.env.DEV) {
                    console.log('PostHog initialized');
                }
            },
            capture_pageview: true, // Automatically capture pageviews
            capture_pageleave: true, // Capture when users leave
            autocapture: true, // Automatically capture clicks, form submissions, etc.
        });
    } else {
        console.warn('PostHog not initialized: Missing API key or host');
    }
};

// Track custom events
export const trackEvent = (eventName, properties = {}) => {
    if (posthog.__loaded) {
        posthog.capture(eventName, properties);
    }
};

// Identify user
export const identifyUser = (userId, userProperties = {}) => {
    if (posthog.__loaded) {
        posthog.identify(userId, userProperties);
    }
};

// Reset user (on logout)
export const resetUser = () => {
    if (posthog.__loaded) {
        posthog.reset();
    }
};

// Set user properties
export const setUserProperties = (properties) => {
    if (posthog.__loaded) {
        posthog.people.set(properties);
    }
};

// Track page view manually (if needed)
export const trackPageView = (pageName) => {
    if (posthog.__loaded) {
        posthog.capture('$pageview', { page: pageName });
    }
};

export default posthog;
