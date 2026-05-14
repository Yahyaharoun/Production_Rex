import { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AppProvider } from '../providers/AppProvider';
import { router } from '../routes';

function App() {
  return (
    <AppProvider>
      <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">Chargement...</div>}>
        <RouterProvider router={router} />
      </Suspense>
    </AppProvider>
  );
}

export default App;
