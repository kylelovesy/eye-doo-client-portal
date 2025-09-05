import React from 'react';

interface HeaderProps {
  projectName: string;
  photographerName: string;
  personA: string;
  personB: string;
}

export const Header: React.FC<HeaderProps> = ({ projectName, photographerName, personA, personB }) => {
  return (
    <header className="bg-card text-card-foreground shadow-sm rounded-lg p-6 text-center mb-8">
      <h1 className="text-3xl font-bold font-serif">{projectName}</h1>
      <p className="text-lg text-muted-foreground mt-2 font-sans">
        The Wedding of {personA} & {personB}
      </p>
      <p className="text-sm text-muted-foreground mt-1 font-sans">
        Photography by: {photographerName}
      </p>
    </header>
  );
};

