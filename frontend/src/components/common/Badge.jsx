import { STATUS_COLORS, LEAVE_TYPE_COLORS, REIMBURSEMENT_TYPE_COLORS, ROLES, capitalize } from '../../utils/helpers';

export const StatusBadge = ({ status }) => {
    const colors = STATUS_COLORS[status] || STATUS_COLORS.cancelled;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold
      ${colors.bg} ${colors.text} border ${colors.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
            {capitalize(status)}
        </span>
    );
};

export const LeaveTypeBadge = ({ type }) => {
    const colors = LEAVE_TYPE_COLORS[type] || LEAVE_TYPE_COLORS.unpaid;
    const labels = { annual: 'Annual', sick: 'Sick', casual: 'Casual', unpaid: 'Unpaid' };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
      ${colors.bg} ${colors.text} border ${colors.border}`}>
            {labels[type] || capitalize(type)}
        </span>
    );
};

export const ReimbursementTypeBadge = ({ type }) => {
    const colors = REIMBURSEMENT_TYPE_COLORS[type] || { bg: 'bg-gray-500/15', text: 'text-gray-400', border: 'border-gray-500/30' };
    const labels = { travel: 'Travel', food: 'Food', office_supplies: 'Office Supplies', internet: 'Internet', other: 'Other' };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
      ${colors.bg} ${colors.text} border ${colors.border}`}>
            {labels[type] || capitalize(type)}
        </span>
    );
};

export const RoleBadge = ({ role }) => {
    const cfg = ROLES[role] || ROLES.employee;
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
      ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
            {cfg.label}
        </span>
    );
};
