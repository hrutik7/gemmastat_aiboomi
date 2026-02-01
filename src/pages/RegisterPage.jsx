// src/pages/RegisterPage.jsx

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import authService from '../services/authService';
import { GoogleLogin } from '@react-oauth/google'; // +++ IMPORT GOOGLE LOGIN COMPONENT

function RegisterPage() {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    phone_number: '', 
    profession: '', 
    promo_code: '' 
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [promoMessage, setPromoMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setPromoMessage('');
    setLoading(true);
    try {
      // Create the user account with promo code
      const response = await api.post('/register', formData);
      
      // Store the token and user data
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      // Show promo code message if applicable
      if (response.data.promo_code) {
        setPromoMessage(response.data.message);
        // Show success message for a moment before redirecting
        setTimeout(() => {
          navigate('/ai-analyst');
        }, 2000);
      } else {
        navigate('/ai-analyst');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // +++ HANDLER FOR GOOGLE LOGIN SUCCESS (SAME AS LOGIN PAGE) +++
  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    try {
      // The backend handles both registration and login with this single endpoint
      await authService.googleLogin(credentialResponse.credential);
      navigate('/ai-analyst');
    } catch (err) {
      setError('Google sign-up failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // +++ HANDLER FOR GOOGLE LOGIN FAILURE (SAME AS LOGIN PAGE) +++
  const handleGoogleError = () => {
    setError('Google sign-up failed. Please try again.');
    console.error('Login Failed');
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Create a Free Account</h2>
        <p className="text-center text-gray-500 mb-6">Start analyzing your data in seconds.</p>

        {/* +++ GOOGLE LOGIN BUTTON +++ */}
        <div className="mb-4 flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
            />
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              Or sign up with email
            </span>
          </div>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          {promoMessage && <p className="text-green-600 text-sm text-center bg-green-50 p-3 rounded-lg">{promoMessage}</p>}
          
          <div>
            <label className="block text-gray-700 font-medium mb-1">Full Name</label>
            <input 
              name="name" 
              type="text" 
              value={formData.name} 
              onChange={handleChange} 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              required 
            />
          </div>
          
          <div>
            <label className="block text-gray-700 font-medium mb-1">Email Address</label>
            <input 
              name="email" 
              type="email" 
              value={formData.email} 
              onChange={handleChange} 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              required 
            />
          </div>
          
          <div>
            <label className="block text-gray-700 font-medium mb-1">Phone Number</label>
            <input 
              name="phone_number" 
              type="tel" 
              value={formData.phone_number} 
              onChange={handleChange} 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              required 
            />
          </div>
          
          <div>
            <label className="block text-gray-700 font-medium mb-1">Profession</label>
            <select 
              name="profession" 
              value={formData.profession} 
              onChange={handleChange} 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              required
            >
              <option value="">Select your profession</option>
              <option value="researcher">Researcher</option>
              <option value="data_scientist">Data Scientist</option>
              <option value="analyst">Business Analyst</option>
              <option value="student">Student</option>
              <option value="professor">Professor/Academic</option>
              <option value="consultant">Consultant</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 font-medium mb-1">Password</label>
            <input 
              name="password" 
              type="password" 
              value={formData.password} 
              onChange={handleChange} 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              required 
            />
          </div>
          
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Promo Code <span className="text-gray-500 font-normal">(Optional)</span>
            </label>
            <input 
              name="promo_code" 
              type="text" 
              value={formData.promo_code} 
              onChange={handleChange} 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              placeholder="Enter promo code"
            />
            <p className="text-xs text-gray-500 mt-1">Have a promo code? Enter it here to get a discount on your first subscription!</p>
          </div>
          
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Account...' : 'Get Started Free'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account? <Link to="/login" className="font-medium text-blue-600 hover:underline">Log In</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;