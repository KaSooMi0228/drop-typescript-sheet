import * as React from "react";

export type ITEM_TYPE =
    | {
          type: string;
          id: string;
      }
    | {
          type: "new-thread";
          id: string;
      };

export type InboxThreadTable =
    | "Thread"
    | "Project"
    | "Invoice"
    | "Payout"
    | "DetailSheet"
    | "WarrantyReview"
    | "SiteVisitReport"
    | "EstimateCopyRequest"
    | "QuotationCopyRequest"
    | "ProjectUnlockRequest"
    | "CoreValueNotice"
    | "CompletionSurvey"
    | "Quotation"
    | "Contact"
    | "CustomerSurvey";

export type InboxTarget =
    | "column"
    | "category-manager"
    | "quote-requested-by"
    | "project-role"
    | "permission"
    | "user-column"
    | "column-single";

export type InboxSource = {
    type: string;
    table: InboxThreadTable;
    column: string;
    target: InboxTarget;
    dated: boolean;
    priority: boolean | string;
    permission?: string;
    date?: string | null;
    label?: string;
    read?: string;
    dismissed?: string;
};
