import React from 'react';

interface ComingSoonModalProps {
  message?: string;
  onClose: () => void;
}

export function ComingSoonModal({ message, onClose }: ComingSoonModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-[#D8B46A]/10 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-[#D8B46A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          
          <h3 className="text-xl font-semibold text-[#283593] mb-2">
            Coming Soon
          </h3>
          
          <p className="text-gray-600 mb-6">
            {message || "Premium room scenes are being prepared. Check back soon for beautiful new room backgrounds!"}
          </p>
          
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-[#283593] text-white font-semibold rounded-lg hover:bg-[#1e2a6e] transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
