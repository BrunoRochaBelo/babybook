import React from 'react';
import ReactDOM from 'react-dom/client';
import './globals.css';
import { LandingPage } from './LandingPage';
import { ThemeProvider } from './components/ThemeProvider';

/**
 * Entry point for the landing page application.  
 * Mounts the <LandingPage /> component into the #root element defined in index.html.  
 */
const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ThemeProvider>
        {/* A simple handler to demonstrate the call to action. */}
        <LandingPage
          onGetStarted={() => {
            console.log('Get Started button clicked');
          }}
        />
      </ThemeProvider>
    </React.StrictMode>,
  );
}