import { useTypography } from '@/lib/useAppStyle';

interface HeaderProps {
  projectName: string;
  photographerName: string;
  personA: string;
  personB: string;
}

export const Header = ({ projectName, photographerName, personA, personB }: HeaderProps) => {
  const t = useTypography();

  return (
    <header className="text-center mb-6">
      <h1 style={{ ...t.headlineLarge }}>{projectName}</h1>
      <p className="text-lg text-gray-700">{personA} & {personB}</p>
      <p style={{ ...t.onSurfaceVariant.bodyLarge, marginTop: 8 }}>Planning Portal</p>
      <p style={{ ...t.onSurfaceVariant.bodySmall }}>Shared by your photographer: {photographerName}</p>
    </header>
  );
};
