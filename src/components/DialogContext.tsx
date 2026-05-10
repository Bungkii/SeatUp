'use client'
import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import CustomDialog from '@/components/CustomDialog';

type DialogContextType = {
  showAlert: (message: string) => Promise<void>;
  showConfirm: (message: string) => Promise<boolean>;
};

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    type: 'alert' | 'confirm';
    message: string;
    resolve: (value: any) => void;
  } | null>(null);

  const showAlert = useCallback((message: string) => {
    return new Promise<void>((resolve) => {
      setDialogState({ isOpen: true, type: 'alert', message, resolve });
    });
  }, []);

  const showConfirm = useCallback((message: string) => {
    return new Promise<boolean>((resolve) => {
      setDialogState({ isOpen: true, type: 'confirm', message, resolve });
    });
  }, []);

  const handleConfirm = () => {
    dialogState?.resolve(dialogState.type === 'confirm' ? true : undefined);
    setDialogState(null);
  };

  const handleCancel = () => {
    dialogState?.resolve(false);
    setDialogState(null);
  };

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <CustomDialog isOpen={!!dialogState} type={dialogState?.type || 'alert'} message={dialogState?.message || ''} onConfirm={handleConfirm} onCancel={handleCancel} />
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (context === undefined) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
}