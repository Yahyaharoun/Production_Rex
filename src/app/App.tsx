import { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AppProvider } from '../providers/AppProvider';
import { ConfirmProvider } from '../providers/ConfirmProvider';
import InstallPrompt from '../components/pwa/InstallPrompt';
import { router } from '../routes';

function App() {
  return (
    <AppProvider>
      <ConfirmProvider>
        <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">Chargement...</div>}>
          <RouterProvider router={router} />
        </Suspense>
        <InstallPrompt />
      </ConfirmProvider>
    </AppProvider>
  );
}

export default App;
