import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: PropsWithChildren) {
  // Construct the service worker registration script.
  // This is stringified and injected into the dangerouslySetInnerHTML below.
  const serviceWorkerScript = `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('Service Worker registered with scope:', registration.scope);
    }).catch(error => {
      console.error('Service Worker registration failed:', error);
    });
  });
}
`;

  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Apple Touch Icons and PWA settings for iOS */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon-180x180.png" /> 
        {/* You'll need to create apple-touch-icon-180x180.png and place it in the public folder */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Mon Koach" /> 

        {/* Theme Color for Safari */}
        <meta name="theme-color" content="#007AFF" /> {/* Match with manifest.json theme_color */}

        {/* Inject the service worker registration script */}
        <script dangerouslySetInnerHTML={{ __html: serviceWorkerScript }} />

        {/* 
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Add any additional <head> elements that you want globally available on web... */}
        <title>Mon Koach</title>
      </head>
      <body>{children}</body>
    </html>
  );
} 