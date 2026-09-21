// Short date for tables and summaries, e.g. "12 May 2026". EquipmentDetail
// keeps its own long-month format inline; everything else uses this.
export const formatDate = (date) =>
    date
        ? new Date(date).toLocaleDateString("en-PH", {
              year: "numeric",
              month: "short",
              day: "numeric",
          })
        : "—";
