import React from 'react';
import { ActionOn } from '@/types/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Lock, UserCheck } from 'lucide-react';

interface SectionContainerProps {
  title: string;
  description: string;
  isFinalized?: boolean;
  isLocked?: boolean;
  actionOn?: ActionOn;
  children: React.ReactNode;
}

export const SectionContainer: React.FC<SectionContainerProps> = ({ 
  title, 
  description, 
  isFinalized, 
  isLocked, 
  actionOn, 
  children 
}) => {

  return (
    <Card>
      <CardHeader className="bg-muted/30 rounded-t-lg">
        {isFinalized && (
          <Alert variant="success" className="mb-4">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>This section has been finalized.</AlertTitle>
            <AlertDescription>
              Please contact your photographer if further changes are required.
            </AlertDescription>
          </Alert>
        )}
        {isLocked && !isFinalized && actionOn === ActionOn.PHOTOGRAPHER && (
          <Alert variant="warning" className="mb-4">
            <Lock className="h-4 w-4" />
            <AlertTitle>This section is locked for review.</AlertTitle>
            <AlertDescription>
              Your photographer is reviewing the details. Please contact them if changes are needed.
            </AlertDescription>
          </Alert>
        )}
         {actionOn === ActionOn.CLIENT && !isLocked && !isFinalized && (
          <Alert variant="destructive" className="mb-4">
            <UserCheck className="h-4 w-4" />
            <AlertTitle>Action Required</AlertTitle>
            <AlertDescription>
              Your input is needed for this section. Please fill out the details below.
            </AlertDescription>
          </Alert>
        )}
        <CardTitle className="font-serif">{title}</CardTitle>
        <CardDescription className="font-sans">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 flex flex-grow">
        {children}
      </CardContent>
    </Card>
  );
};

