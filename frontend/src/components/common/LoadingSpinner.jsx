const LoadingSpinner = ({ size = 'md', text = '' }) => {
    const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10', xl: 'w-14 h-14' };
    return (
        <div className="flex flex-col items-center justify-center gap-3">
            <div className={`${sizes[size] || sizes.md} border-2 border-white/10 border-t-primary-500 rounded-full animate-spin`} />
            {text && <p className="text-slate-400 text-sm">{text}</p>}
        </div>
    );
};

export const PageLoader = ({ text = 'Loading...' }) => (
    <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" text={text} />
    </div>
);

export default LoadingSpinner;
