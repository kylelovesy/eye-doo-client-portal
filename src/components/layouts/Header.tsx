import { useAppThemeColors, useTypography } from '@/lib/useAppStyle';

interface HeaderProps {
  projectName: string;
  photographerName: string;
}

export const Header = ({ projectName, photographerName }: HeaderProps) => {
  const t = useTypography();
  const colors = useAppThemeColors();

  return (
    <header className="text-center mb-6">
      <h1 style={{ ...t.headlineLarge }}>{projectName}</h1>
      <p style={{ ...t.onSurfaceVariant.bodyLarge, marginTop: 8 }}>Planning Portal</p>
      <p style={{ ...t.onSurfaceVariant.bodySmall }}>Shared by your photographer: {photographerName}</p>
    </header>
  );
};
