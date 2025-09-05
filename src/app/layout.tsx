import { ThemeProvider } from '@/components/theme-provider';
import type { Metadata } from 'next';
import { Playfair_Display, Montserrat, Geist_Mono } from 'next/font/google';
// import { GeistMono } from 'geist/font/mono';
// import { cn } from '@/lib/utils';
import '@/app/globals.css';

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"]
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Client Planning Portal',
  description: 'Plan your perfect day with us.',
};



export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>      
      {/* <body
        className={cn(
          'min-h-screen font-sans antialiased', // Set default font-sans here
          GeistMono.variable,
          playfair.variable,
          lato.variable
        )}
      > */}
      <body
        className={`${geistMono.variable} ${playfair.variable} ${montserrat.variable} min-h-screen font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

