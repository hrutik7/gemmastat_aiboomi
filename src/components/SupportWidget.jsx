import React, { useState, useRef } from 'react';
import { Dialog } from '@headlessui/react';
import api from '../services/api';

function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [status, setStatus] = useState({ state: 'idle', message: '' });
  const fileInputRef = useRef(null);

  const openModal = () => setIsOpen(true);
  const closeModal = () => {
    setIsOpen(false);
    setTimeout(() => {
        setMessage('');
        setScreenshot(null);
        setStatus({ state: 'idle', message: '' });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, 300);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setScreenshot(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ state: 'loading', message: '' });
    
    const formData = new FormData();
    formData.append('message', message);
    if (screenshot) {
      formData.append('screenshot', screenshot);
    }

    try {
      const response = await api.post('/support/tickets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setStatus({ state: 'success', message: response.data.message });
      setTimeout(closeModal, 2500);
    } catch (err) {
      setStatus({ state: 'error', message: err.response?.data?.detail || 'Failed to submit ticket.' });
    }
  };

  return (
    <>
      {/* The Floating Widget Button with the new animation element */}
      <button
        onClick={openModal}
        className="fixed bottom-5 right-5 z-40 h-16 w-16 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        aria-label="Open support widget"
      >
        {/* --- THE FIX IS HERE --- */}
        {/* This is the visual "ping" element. It's a colored ring that expands and fades. */}
        {/* The `animate-ping-slow` class is our new custom animation. */}
        <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 animate-ping-slow"></span>
        
        {/* The icon sits on top of the ping animation */}
        <span className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
        </span>
      </button>

      {/* The Support Modal (Unchanged) */}
      <Dialog open={isOpen} onClose={closeModal} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-lg bg-white p-6">
            <Dialog.Title className="text-xl font-bold text-gray-800">Contact Support</Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-gray-600">
              Have an issue or a question? Let us know and we'll get back to you.
            </Dialog.Description>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">Your Message</label>
                <textarea
                  id="message"
                  rows="5"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md mt-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Please describe the problem you're facing..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Attach Screenshot (Optional)</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                        <div className="flex text-sm text-gray-600">
                            <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                <span>Upload a file</span>
                                <input id="file-upload" ref={fileInputRef} onChange={handleFileChange} type="file" className="sr-only" accept="image/*" />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                        </div>
                        {screenshot ? (
                            <p className="text-xs text-green-600 font-semibold">{screenshot.name}</p>
                        ) : (
                            <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                        )}
                    </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={status.state === 'loading'} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300">
                  {status.state === 'loading' ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>

              {status.state === 'success' && <p className="text-sm text-green-600 text-center">{status.message}</p>}
              {status.state === 'error' && <p className="text-sm text-red-600 text-center">{status.message}</p>}
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
}

export default SupportWidget;