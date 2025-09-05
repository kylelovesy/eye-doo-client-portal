import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
// import { Progress } from '../ui/progress';

interface OnboardingModalProps {
  onClose: () => void;
  onStartPlanning: () => void;
}

const slides = [
  {
    icon: "/icons/key-people-section.svg",
    title: "Key People",
    description: "List your wedding party, family members, and other VIPs. This helps us know who's who and ensures we capture everyone important.",
  },
  {
    icon: "/icons/locations-section.svg",
    title: "Locations",
    description: "Add all your important locations, from getting ready spots to the reception venue. Include addresses and times to help us plan our travel.",
  },
  {
    icon: "/icons/group-shots-section.svg",
    title: "Group Photos",
    description: "Select from a list of common group photos and add your own. This helps us organize the formal photo session efficiently.",
  },
  {
    icon: "/icons/photo-requests-section.svg",
    title: "Special Photo Requests",
    description: "Have a specific shot in mind? Add any unique ideas or 'must-have' photos here. You can even upload reference images.",
  },
  {
    icon: "/icons/timeline-section.svg",
    title: "Timeline",
    description: "Outline your day's schedule. A well-planned timeline is key to a relaxed day and ensures we don't miss a moment.",
  },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose, onStartPlanning }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const isLastSlide = currentSlide === slides.length - 1;

  const handleNext = () => {
    if (isLastSlide) {
      onStartPlanning();
    } else {
      setCurrentSlide(currentSlide + 1);
    }
  };

  // const progressValue = ((currentSlide + 1) / slides.length) * 100;

  return (
    <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="w-[90vw] max-w-md text-center">
        <DialogHeader key={currentSlide} className="fade-in">
          <div className="flex justify-center items-center mb-2">
              <Image src={slides[currentSlide].icon} alt={slides[currentSlide].title} width={100} height={100} />
          </div>
          <DialogTitle className="text-3xl font-serif">
            {slides[currentSlide].title}
          </DialogTitle>
          <DialogDescription className="min-h-[80px] font-sans text-md font-semibold mt-2">
            {slides[currentSlide].description}
          </DialogDescription>
        </DialogHeader>
        
        {/* <div className="my-4">
            <Progress value={progressValue} className="w-full" />
        </div> */}

        <DialogFooter className="flex-col items-center px-2">
          <Button
            onClick={handleNext}
            size="sm"
            className="w-full text-lg h-7 tracking-wide"
          >
            {isLastSlide ? "Get Started" : 'Next'}
          </Button>
          
          {/* Navigation Dots */}
          <div className="flex justify-center space-x-2 mt-4">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 shadow-xs rounded-full transition-colors ${
                  currentSlide === index ? 'bg-primary' : 'bg-primary/30'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

