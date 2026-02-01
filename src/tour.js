import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';

export const tourSteps = [
  {
    id: 'welcome',
    title: 'Welcome to GemmaStat!',
    text: "Let's take a quick tour of the key features to get you started on your first analysis.",
    buttons: [{ text: 'Next', action: 'next' }],
  },
  {
    id: 'step-1-upload',
    title: 'Step 1: Upload Your Data',
    text: 'Start by uploading your CSV or Excel file here. Drag and drop or click to browse. Our "Data Janitor" will automatically clean it for you.',
    attachTo: { element: '#file-upload-area', on: 'bottom' },
    buttons: [
      { text: 'Back', action: 'back' },
      { text: 'Next', action: 'next' }
    ],
  },
  {
    id: 'step-2-configure',
    title: 'Step 2: Choose Your Analysis',
    text: 'Select the statistical test you want to run. The form will guide you to select the appropriate columns from your data.',
    attachTo: { element: '#analysis-config-area', on: 'top' },
    buttons: [
      { text: 'Back', action: 'back' },
      { text: 'Next', action: 'next' }
    ],
    when: {
      show: () => document.querySelector('#analysis-config-area') !== null,
    },
  },
  {
    id: 'step-3-results',
    title: 'Step 3: View Your Results',
    text: 'After running an analysis, your results will appear here in a professional, publication-ready format.',
    attachTo: { element: '#statistical-results-area', on: 'top' },
    buttons: [{ text: 'Back', action: 'back' }, { text: 'Next', action: 'next' }],
    when: {
      show: () => document.querySelector('#statistical-results-area') !== null,
    },
  },
  {
    id: 'step-4-visualize',
    title: 'Step 4: Visualize Your Data',
    text: 'Click this tab to see a beautiful, interactive chart of your results. You can switch between chart types and export them.',
    attachTo: { element: '#visualization-tab-button', on: 'bottom' },
    buttons: [
      { text: 'Back', action: 'back' },
      { text: 'Next', action: 'next' }
    ],
    when: {
      show: () => document.querySelector('#visualization-tab-button') !== null,
    },
  },
  {
    id: 'step-5-ai',
    title: 'Step 5: Get AI-Powered Insights',
    text: "Get an AI-powered explanation of what your results mean in simple, plain English. This section appears once you run an analysis.",
    attachTo: { element: '#ai-interpretation-button', on: 'bottom' },
    buttons: [{ text: 'Back', action: 'back' }, { text: 'Finish', action: 'complete' }],
    when: {
      show: () => document.querySelector('#ai-interpretation-button') !== null,
    },
  },
];

export const tourOptions = {
  defaultStepOptions: {
    cancelIcon: {
      enabled: true,
    },
    classes: 'shepherd-theme-arrows gemma-tour',
    scrollTo: { behavior: 'smooth', block: 'center' },
  },
  useModalOverlay: true,
};

export function createTour() {
  const tour = new Shepherd.Tour(tourOptions);
  tourSteps.forEach((step) => {
    tour.addStep({
      id: step.id,
      title: step.title,
      text: step.text,
      attachTo: step.attachTo,
      when: step.when,
      buttons: (step.buttons || []).map((btn) => ({
        text: btn.text,
        action: tour[btn.action] || tour.next,
        classes: 'gemma-tour-btn',
      })),
    });
  });
  return tour;
}


