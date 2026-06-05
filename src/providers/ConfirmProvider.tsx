import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Button } from '../components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context.confirm;
};

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ message: '' });
  const [resolver, setResolver] = useState<{ resolve: (value: boolean) => void } | null>(null);

  const confirm = (opts: ConfirmOptions | string): Promise<boolean> => {
    return new Promise((resolve) => {
      const defaultOptions: ConfirmOptions = {
        title: 'Confirmation',
        message: '',
        confirmText: 'Confirmer',
        cancelText: 'Annuler',
        variant: 'danger',
      };
      
      setOptions(typeof opts === 'string' ? { ...defaultOptions, message: opts } : { ...defaultOptions, ...opts });
      setResolver({ resolve });
      setIsOpen(true);
    });
  };

  const handleConfirm = () => {
    if (resolver) resolver.resolve(true);
    setIsOpen(false);
  };

  const handleCancel = () => {
    if (resolver) resolver.resolve(false);
    setIsOpen(false);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-border animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className={`p-3 rounded-full ${
                options.variant === 'danger' ? 'bg-red-100 text-red-600' : 
                options.variant === 'warning' ? 'bg-amber-100 text-amber-600' : 
                'bg-blue-100 text-blue-600'
              }`}>
                <AlertTriangle className="h-6 w-6" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-foreground">
                  {options.title || 'Confirmation'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {options.message}
                </p>
              </div>

              <div className="flex gap-3 w-full pt-4">
                <Button 
                  variant="outline" 
                  className="w-full font-bold" 
                  onClick={handleCancel}
                >
                  {options.cancelText || 'Annuler'}
                </Button>
                <Button 
                  className={`w-full font-bold text-white ${
                    options.variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 
                    options.variant === 'warning' ? 'bg-amber-600 hover:bg-amber-700' : 
                    'bg-emerald-600 hover:bg-emerald-700'
                  }`} 
                  onClick={handleConfirm}
                >
                  {options.confirmText || 'Confirmer'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};
