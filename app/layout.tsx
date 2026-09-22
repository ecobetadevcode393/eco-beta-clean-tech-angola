import type {Metadata} from 'next';
import './globals.css'; // Global styles

// GitHub Pages serves a project site from https://<user>.github.io/<repo>/, so the
// favicon lives under that subpath there and at "/" everywhere else. `icons.href`
// values are the one thing Next does not rewrite for the basePath, so it is applied
// here by hand — the same way SYLVA_HERO_BASE_URL does it in src/shaders/landing-pages.
const PUBLIC_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const FAVICON_PATH = `${PUBLIC_BASE_PATH}/hero-logo-favicon.svg`;

export const metadata: Metadata = {
  title: 'Eco Beta - Clean Tech Angola',
  description: 'Economia circular, ecopontos eletrónicos inteligentes e tecnologia eletromecânica para valorização de resíduos em Angola.',
  icons: {
    icon: [{url: FAVICON_PATH, type: 'image/svg+xml'}],
    shortcut: FAVICON_PATH,
  },
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
