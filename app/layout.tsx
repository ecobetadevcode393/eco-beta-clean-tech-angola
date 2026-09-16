import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Eco Beta - Clean Tech Angola',
  description: 'Economia circular, ecopontos eletrónicos inteligentes e tecnologia eletromecânica para valorização de resíduos em Angola.',
  openGraph: {
    title: 'Eco Beta - Clean Tech Angola',
    description: 'Economia circular, ecopontos eletrónicos inteligentes e tecnologia eletromecânica para valorização de resíduos em Angola.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Eco Beta - Clean Tech Angola',
    description: 'Economia circular, ecopontos eletrónicos inteligentes e tecnologia eletromecânica para valorização de resíduos em Angola.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
