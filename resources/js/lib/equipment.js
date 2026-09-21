// Tooltip text for an Assigned record's current holder. Employee-held records
// name the person and their office; branch-held records name the branch.
// Returns null when neither resolves, so the caller can skip the tooltip.
// Shared by EquipmentList and EquipmentDetail.
export const holderLabel = (assignment) => {
    if (!assignment) return null;
    if (assignment.employee) {
        const branch = assignment.employee.branch?.branch_name;
        return `Assigned to: ${assignment.employee.name}${branch ? ` — ${branch}` : ""}`;
    }
    const branch = assignment.branch?.branch_name;
    return branch ? `Located at: ${branch}` : null;
};
