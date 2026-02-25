import { Link } from 'react-router-dom';
import { HiOutlineShieldExclamation, HiOutlineHome, HiOutlineArrowLeft } from 'react-icons/hi';

const UnauthorizedPage = () => (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-6">
        <div className="text-center max-w-md animate-fade-in">
            {/* Icon */}
            <div className="w-24 h-24 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
                <HiOutlineShieldExclamation className="w-12 h-12 text-red-400" />
            </div>

            {/* Status code */}
            <p className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-red-400 to-rose-600 mb-4">
                403
            </p>

            <h1 className="text-2xl font-bold text-white mb-3">Access Denied</h1>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
                You don't have permission to view this page. Contact your administrator
                if you believe this is a mistake.
            </p>

            <div className="flex items-center justify-center gap-3">
                <button onClick={() => window.history.back()}
                    className="btn-secondary">
                    <HiOutlineArrowLeft className="w-4 h-4" /> Go Back
                </button>
                <Link to="/" className="btn-primary">
                    <HiOutlineHome className="w-4 h-4" /> Dashboard
                </Link>
            </div>
        </div>
    </div>
);

export default UnauthorizedPage;
