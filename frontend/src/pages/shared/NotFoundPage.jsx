import { Link } from 'react-router-dom';
import { HiOutlineEmojiSad, HiOutlineHome, HiOutlineArrowLeft } from 'react-icons/hi';

const NotFoundPage = () => (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-6">
        <div className="text-center max-w-md animate-fade-in">
            {/* Icon */}
            <div className="w-24 h-24 rounded-3xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mx-auto mb-6">
                <HiOutlineEmojiSad className="w-12 h-12 text-primary-400" />
            </div>

            {/* Status code */}
            <p className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-primary-400 to-violet-600 mb-4">
                404
            </p>

            <h1 className="text-2xl font-bold text-white mb-3">Page Not Found</h1>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
                The page you're looking for doesn't exist or has been moved.
                Double-check the URL or head back to safety.
            </p>

            <div className="flex items-center justify-center gap-3">
                <button onClick={() => window.history.back()}
                    className="btn-secondary">
                    <HiOutlineArrowLeft className="w-4 h-4" /> Go Back
                </button>
                <Link to="/" className="btn-primary">
                    <HiOutlineHome className="w-4 h-4" /> Home
                </Link>
            </div>
        </div>
    </div>
);

export default NotFoundPage;
