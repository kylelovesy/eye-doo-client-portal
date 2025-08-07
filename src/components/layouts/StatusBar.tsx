import React from 'react';
import { Button } from '../ui/Button';

interface StatusBarProps {
  currentStep: number;
  steps: { id: string; title: string; description: string }[];
  onNext: () => void;
  onPrev: () => void;
}

export const StatusBar = ({ currentStep, steps, onNext, onPrev }: StatusBarProps) => {
  const step = steps[currentStep];

  return (
    <div className="bg-white border-l-4 border-[#4A90E2] p-4 rounded-lg mb-8 text-center shadow">
      <h3 className="font-bold text-lg text-gray-800">{step.title}</h3>
      <p className="text-gray-600">{step.description}</p>
      <div className="flex justify-center items-center space-x-4 mt-3">
        <button
          onClick={onPrev}
          className="text-gray-600 font-semibold hover:text-black transition-colors"
          style={{ visibility: currentStep === 0 ? 'hidden' : 'visible' }}
          aria-label="Go to previous step"
        >
          &larr; Previous
        </button>
        <Button
          onClick={onNext}
          style={{ visibility: currentStep === steps.length - 1 ? 'hidden' : 'visible' }}
          aria-label="Go to next step"
        >
          Next Step &rarr;
        </Button>
      </div>
    </div>
  );
};