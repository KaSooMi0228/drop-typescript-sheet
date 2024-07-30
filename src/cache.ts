import { Dictionary } from "./clay/common";

export type CacheConfig =
    | {
          type: "all";
          version: number;
      }
    | {
          type: "list";
          source: string;
          field: string;
          subfield?: string;
          version: number;
      }
    | {
          type: "link";
          source: string;
          field: string;
          version: number;
      }
    | {
          type: "backlink";
          source: string;
          field: string;
          version: number;
      }
    | {
          type: "project";
          version: number;
      }
    | {
          type: "none";
          version: number;
      };

export const CACHE_CONFIG: Dictionary<CacheConfig> = {
    ApplicationType: {
        type: "all",
        version: 4,
    },
    Company: {
        type: "link",
        source: "Contact",
        field: "company",
        version: 4,
    },
    EstimateTemplate: {
        type: "all",
        version: 4,
    },
    TimeAndMaterialsEstimateProduct: {
        type: "all",
        version: 7,
    },
    ItemType: {
        type: "all",
        version: 4,
    },
    UnitType: {
        type: "all",
        version: 4,
    },
    FinishSchedule: {
        type: "all",
        version: 4,
    },
    User: {
        type: "all",
        version: 2,
    },
    Substrate: {
        type: "all",
        version: 4,
    },
    View: {
        type: "all",
        version: 3,
    },
    Filter: {
        type: "all",
        version: 3,
    },
    ContactType: {
        type: "all",
        version: 2,
    },
    Contact: {
        type: "list",
        source: "Project",
        field: "contacts",
        subfield: "contact",
        version: 2,
    },
    Estimate: {
        type: "backlink",
        source: "Project",
        field: "(common).project",
        version: 2,
    },
    TimeAndMaterialsEstimate: {
        type: "backlink",
        source: "Project",
        field: "(common).project",
        version: 7,
    },
    Project: {
        type: "project",
        version: 2,
    },
    Role: {
        type: "all",
        version: 5,
    },
    QuoteSourceCategory: {
        type: "all",
        version: 6,
    },
    CompletionSurvey: {
        type: "backlink",
        source: "Project",
        field: "project",
        version: 8,
    },
    CustomerSurvey: {
        type: "backlink",
        source: "Project",
        field: "project",
        version: 13,
    },
    CompletionSurveyTemplate: {
        type: "all",
        version: 8,
    },
    DetailSheet: {
        type: "backlink",
        source: "Project",
        field: "project",
        version: 8,
    },
    LandingLikelihood: {
        type: "all",
        version: 8,
    },
    ProjectDescription: {
        type: "all",
        version: 8,
    },
    ProjectDescriptionCategory: {
        type: "all",
        version: 8,
    },
    SiteVisitReport: {
        type: "backlink",
        source: "Project",
        field: "project",
        version: 8,
    },
    CustomerRelation: {
        type: "all",
        version: 8,
    },
    Help: {
        type: "all",
        version: 8,
    },
    ScopeOfWork: {
        type: "all",
        version: 8,
    },
    ProjectSpotlight: {
        type: "all",
        version: 8,
    },
    ContractNote: {
        type: "all",
        version: 8,
    },
    Competitor: {
        type: "all",
        version: 8,
    },
    QuotationType: {
        type: "all",
        version: 8,
    },
    ThirdPartySpecifier: {
        type: "all",
        version: 8,
    },
    ApprovalType: {
        type: "all",
        version: 8,
    },
    AnticipatedDuration: {
        type: "all",
        version: 8,
    },
    CoreValueNoticeCategory: {
        type: "all",
        version: 8,
    },
    CoreValueNotice: {
        type: "backlink",
        source: "Project",
        field: "project",
        version: 8,
    },
    Invoice: {
        type: "backlink",
        source: "Project",
        field: "project",
        version: 8,
    },
    Payout: {
        type: "backlink",
        source: "Project",
        field: "project",
        version: 8,
    },
    Term: {
        type: "all",
        version: 8,
    },
    Quotation: {
        type: "backlink",
        source: "Project",
        field: "project",
        version: 10,
    },
    Subscription: {
        type: "none",
        version: 12,
    },
    WarrantyReviewDetailSheet: {
        type: "none",
        version: 14,
    },
};
