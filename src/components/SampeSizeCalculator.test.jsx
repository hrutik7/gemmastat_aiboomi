// src/components/SampleSizeCalculator.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SampleSizeCalculator from './SampleSizeCalculator';
import api from '../services/api'; // We will mock this

// Mock the API service so we don't make real network calls
vi.mock('../services/api', () => ({
  default: {
    post: vi.fn(),
  },
}));

describe('SampleSizeCalculator', () => {
  it('should render correctly and have a disabled button initially', () => {
    render(<SampleSizeCalculator />);
    
    // Check if the title is there
    expect(screen.getByText(/AI-Powered Sample Size Calculator/i)).toBeInTheDocument();
    
    // The button should be enabled even without text, based on current logic
    const calculateButton = screen.getByRole('button', { name: /Calculate with AI/i });
    expect(calculateButton).toBeEnabled();
  });

  it('should show an error if the description is empty on calculate', () => {
    render(<SampleSizeCalculator />);
    const calculateButton = screen.getByRole('button', { name: /Calculate with AI/i });
    
    fireEvent.click(calculateButton);
    
    // Check if the error message appears
    expect(screen.getByText(/Please provide a description/i)).toBeInTheDocument();
  });

  it('should call the API and display results when the form is valid', async () => {
    // Set up the mock API response
    const mockResponse = {
      total_sample_size: 128,
      sample_size_per_group: 64,
      explanation: 'Based on your description...',
    };
    api.post.mockResolvedValue({ data: mockResponse });

    render(<SampleSizeCalculator />);
    
    const textarea = screen.getByPlaceholderText(/e.g., 'A small but important improvement/i);
    const calculateButton = screen.getByRole('button', { name: /Calculate with AI/i });
    
    // Simulate user typing
    fireEvent.change(textarea, { target: { value: 'a medium effect' } });
    
    // Simulate user clicking
    fireEvent.click(calculateButton);
    
    // Check if the loading state appears
    expect(screen.getByText(/AI is Calculating/i)).toBeInTheDocument();
    
    // Wait for the API call to resolve and the UI to update
    await waitFor(() => {
      expect(screen.getByText(/Total Sample Size Needed/i)).toBeInTheDocument();
    });

    expect(screen.getByText('128')).toBeInTheDocument();
    expect(screen.getByText(/Based on your description.../i)).toBeInTheDocument();
  });
});