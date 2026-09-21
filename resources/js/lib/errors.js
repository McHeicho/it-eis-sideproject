// Turns a failed axios call into one sentence a user can act on. Every catch
// block that used to end in console.error goes through here (blueprint A-06).
// Convention (handoff §4): render the sentence inline when the context stays
// (a modal, a form, a card); use toast.error() only when the context is gone
// (a modal closed, the page navigated).
export function describeError(
    error,
    fallback = "Something went wrong. Please try again."
) {
    if (!error) return fallback;

    // axios sets error.response only when the server answered.
    if (!error.response) {
        return "Cannot reach the server. Check that it is running, then try again.";
    }

    const { status, data } = error.response;

    if (status === 401) return "Your session has expired. Please sign in again.";
    if (status === 403) return data?.message || "You do not have permission to do that.";
    if (status === 404) return "That record no longer exists. Reload the page.";
    if (status === 409) return data?.message || "This record was changed by someone else. Reload and try again.";
    if (status === 413) return "The file is too large to upload.";
    if (status === 422) {
        const first = data?.errors ? Object.values(data.errors)[0]?.[0] : null;
        return first || data?.message || "Some of the values are invalid.";
    }
    if (status === 429) return "Too many attempts. Wait a minute, then try again.";
    if (status >= 500) return "The server reported an error. Please try again.";

    return data?.message || fallback;
}
