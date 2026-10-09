import type { Metadata } from 'next';
import { Bricolage_Grotesque, Instrument_Sans } from 'next/font/google';
import './globals.css';


const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--nf-display',
  display: 'swap',
});

const body = Instrument_Sans({
  subsets: ['latin'],
  variable: '--nf-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Skilho — Find talent. Find your next opportunity.',
  description:
    'A modern hiring platform connecting skilled professionals with verified employers.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} font-sans antialiased`}>
        {children}

      </body>
    </html>
  );
}