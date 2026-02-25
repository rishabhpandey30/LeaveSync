const StatCard = ({ icon, label, value, sub, color = 'indigo', trend }) => {
    const colorMap = {
        indigo: { icon: 'bg-primary-600/20 text-primary-400', border: 'border-primary-500/20' },
        emerald: { icon: 'bg-emerald-600/20 text-emerald-400', border: 'border-emerald-500/20' },
        amber: { icon: 'bg-amber-600/20   text-amber-400', border: 'border-amber-500/20' },
        red: { icon: 'bg-red-600/20     text-red-400', border: 'border-red-500/20' },
        violet: { icon: 'bg-violet-600/20  text-violet-400', border: 'border-violet-500/20' },
        blue: { icon: 'bg-blue-600/20    text-blue-400', border: 'border-blue-500/20' },
    };
    const c = colorMap[color] || colorMap.indigo;

    return (
        <div className={`card p-5 flex items-start gap-4 border ${c.border} hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5`}>
            <div className={`w-12 h-12 rounded-xl ${c.icon} flex items-center justify-center flex-shrink-0 text-xl`}>
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-slate-400 text-xs font-medium mb-0.5 uppercase tracking-wider">{label}</p>
                <p className="text-white text-2xl font-bold">{value ?? '—'}</p>
                {sub && <p className="text-slate-500 text-xs mt-0.5">{sub}</p>}
                {trend && (
                    <p className={`text-xs mt-1 font-medium ${trend.positive ? 'text-emerald-400' : 'text-red-400'}`}>
                        {trend.positive ? '↑' : '↓'} {trend.label}
                    </p>
                )}
            </div>
        </div>
    );
};

export default StatCard;
