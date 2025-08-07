import React from 'react';

interface HeaderProps {
  projectName: string;
  photographerName: string;
}

export const Header = ({ projectName, photographerName }: HeaderProps) => {
  return (
    <header className="text-center mb-6">
      <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A]">
        {projectName}
      </h1>
      <p className="text-lg text-gray-600 mt-2">Planning Portal</p>
      <p className="text-sm text-gray-500">Shared by your photographer: {photographerName}</p>
    </header>
  );
};
