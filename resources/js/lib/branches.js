// Office codes are fixed server-side (BranchController locks branch_code on
// ids 1 and 2), so the frontend may key on them. Every place that needs
// "the two offices" imports these instead of spelling the codes out.
export const HEAD_OFFICE_CODE = "HO";
export const MANILA_OFFICE_CODE = "MLA";
export const OFFICE_CODES = [HEAD_OFFICE_CODE, MANILA_OFFICE_CODE];

// Branch display order, shared by every branch dropdown and list.
// Head Office and Manila Office are pinned to the top; everything else
// sorts alphabetically by name beneath them.
export function sortBranches(branches = []) {
    return [...branches].sort((a, b) => {
        const ai = OFFICE_CODES.indexOf(a.branch_code);
        const bi = OFFICE_CODES.indexOf(b.branch_code);
        if (ai !== -1 && bi !== -1) return ai - bi;
        if (ai !== -1) return -1;
        if (bi !== -1) return 1;
        return a.branch_name.localeCompare(b.branch_name);
    });
}
