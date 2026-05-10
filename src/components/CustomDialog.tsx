'use client'

interface DialogProps {
  isOpen: boolean;
  type: 'alert' | 'confirm';
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function CustomDialog({ isOpen, type, message, onConfirm, onCancel }: DialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-sm border border-slate-200 text-center">
        <p className="text-slate-700 font-medium mb-6 whitespace-pre-wrap">{message}</p>
        <div className={`flex gap-2 ${type === 'alert' ? 'justify-center' : 'justify-end'}`}>
          {type === 'confirm' && (
            <button
              onClick={onCancel}
              className="px-5 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg transition-colors text-sm uppercase"
            >
              Cancel
            </button>
          )}
          <button
            onClick={onConfirm}
            className="px-5 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors text-sm uppercase"
          >
            {type === 'alert' ? 'OK' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}