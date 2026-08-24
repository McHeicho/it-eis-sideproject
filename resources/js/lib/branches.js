// Branch display order, shared by every branch dropdown and list.
// Head Office and Manila Office are pinned to the top; everything else
// sorts alphabetically by name beneath them.
const PINNED = ["HO", "MLA"];

export function sortBranches(branches = []) {
    return [...branches].sort((a, b) => {
        const ai = PINNED.indexOf(a.branch_code);
        const bi = PINNED.indexOf(b.branch_code);
        if (ai !== -1 && bi !== -1) return ai - bi;
        if (ai !== -1) return -1;
        if (bi !== -1) return 1;
        return a.branch_name.localeCompare(b.branch_name);
    });
}
