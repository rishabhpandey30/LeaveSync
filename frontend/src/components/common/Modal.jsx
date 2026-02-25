import { useEffect } from 'react';
import { HiX } from 'react-icons/hi';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    // Close on Escape key
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
        if (isOpen) document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    // Lock body scroll while modal is open
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    const sizeMap = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
        >
            <div className={`bg-surface-800 border border-white/8 rounded-2xl shadow-card w-full ${sizeMap[size]} animate-slide-up`}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                    <h3 className="text-white font-semibold text-base">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                        <HiX className="w-5 h-5" />
                    </button>
                </div>
                {/* Body */}
                <div className="px-6 py-5">{children}</div>
            </div>
        </div>
    );
};

export default Modal;
