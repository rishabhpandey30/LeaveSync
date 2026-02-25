import { avatarColor, initials } from '../../utils/helpers';

const sizeMap = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
};

const Avatar = ({ name = '', size = 'md', className = '' }) => {
    const bg = avatarColor(name);
    const init = initials(name);
    const dim = sizeMap[size] || sizeMap.md;

    return (
        <div className={`${dim} ${bg} rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-white ${className}`}>
            {init}
        </div>
    );
};

export default Avatar;
