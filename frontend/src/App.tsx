/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './components/AppContext';
import { Navigation } from './components/Navigation';
import { ToastContainer } from './components/ToastContainer';
import { LandingPage } from './components/LandingPage';
import { RegistryPage } from './components/RegistryPage';
import { WorkDetailPage } from './components/WorkDetailPage';
import { FileDisputePage } from './components/FileDisputePage';
import { DisputeDetailPage } from './components/DisputeDetailPage';
import { DisputesPage } from './components/DisputesPage';
import { MyWorksPage } from './components/MyWorksPage';
import { RegisterWorkPage } from './components/RegisterWorkPage';

function AppContent() {
  const { currentRoute } = useApp();

  const renderActiveRoute = () => {
    switch (currentRoute) {
      case 'landing':
        return <LandingPage />;
      case 'registry':
        return <RegistryPage />;
      case 'registry-detail':
        return <WorkDetailPage />;
      case 'disputes':
        return <DisputesPage />;
      case 'dispute-detail':
        return <DisputeDetailPage />;
      case 'file-dispute':
        return <FileDisputePage />;
      case 'register-work':
        return <RegisterWorkPage />;
      case 'my-works':
        return <MyWorksPage />;
      default:
        return <LandingPage />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans antialiased">
      <Navigation />
      <main className="flex-grow">
        {renderActiveRoute()}
      </main>
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
