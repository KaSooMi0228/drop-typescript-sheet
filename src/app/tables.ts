import { Dictionary } from "../clay/common";
import { Filter, FILTER_META } from "../clay/filters/table";
import { RecordMeta } from "../clay/meta";
import { Term, TERM_META } from "../terms/table";
import { Campaign, CAMPAIGN_META } from "./campaign/table";
import { Company, COMPANY_META } from "./company/table";
import { ContactType, CONTACT_TYPE_META } from "./contact-type/table";
import {
    Contact,
    ContactFollowupActivity,
    ContactInactiveReason,
    CONTACT_FOLLOWUP_ACTIVITY_META,
    CONTACT_INACTIVE_REASON_META,
    CONTACT_META,
    CustomerRelation,
    CUSTOMER_RELATION_META,
} from "./contact/table";
import {
    FinishSchedule,
    FINISH_SCHEDULE_META,
} from "./estimate/finish-schedule/table";
import {
    Estimate,
    EstimateContingencyItemType,
    EstimateCopyRequest,
    ESTIMATE_CONTINGENCY_ITEM_TYPE_META,
    ESTIMATE_COPY_REQUEST_META,
    ESTIMATE_META,
} from "./estimate/table";
import {
    EstimateTemplate,
    ESTIMATE_TEMPLATE_META,
} from "./estimate/templates/table";
import {
    TimeAndMaterialsEstimate,
    TimeAndMaterialsEstimateProduct,
    TIME_AND_MATERIALS_ESTIMATE_META,
    TIME_AND_MATERIALS_ESTIMATE_PRODUCT_META,
} from "./estimate/time-and-materials/table";
import {
    ApplicationType,
    APPLICATION_TYPE_META,
    ItemType,
    ITEM_TYPE_META,
    Substrate,
    SUBSTRATE_META,
    UnitType,
    UNIT_TYPE_META,
} from "./estimate/types/table";
import { General, GENERAL_META } from "./general/table";
import { Help, HELP_META } from "./help/table";
import { Subscription, SUBSCRIPTION_META } from "./inbox/table";
import { Industry, INDUSTRY_META } from "./industry/table";
import { Invoice, INVOICE_META } from "./invoice/table";
import { Message, MESSAGE_META } from "./messages/table";
import {
    ChangeRejected,
    CHANGE_REJECTED_META,
    Notice,
    NOTICE_META,
} from "./notice/table";
import { Payout, PAYOUT_META } from "./payout/table";
import {
    ProjectDescription,
    ProjectDescriptionCategory,
    PROJECT_DESCRIPTION_CATEGORY_META,
    PROJECT_DESCRIPTION_META,
} from "./project-description/table";
import {
    CompletionSurvey,
    CompletionSurveyTemplate,
    COMPLETION_SURVEY_META,
    COMPLETION_SURVEY_TEMPLATE_META,
} from "./project/completion-survey/table";
import {
    CoreValueNotice,
    CoreValueNoticeCategory,
    CORE_VALUE_NOTICE_CATEGORY_META,
    CORE_VALUE_NOTICE_META,
} from "./project/core-values/table";
import {
    CustomerSurvey,
    CustomerSurveyTemplate,
    CUSTOMER_SURVEY_META,
    CUSTOMER_SURVEY_TEMPLATE_META,
} from "./project/customer-survey/table";
import { DetailSheet, DETAIL_SHEET_META } from "./project/detail-sheet/table";
import { ProjectEmail, PROJECT_EMAIL_META } from "./project/email/table";
import {
    LandingLikelihood,
    LANDING_LIKELIHOOD_META,
} from "./project/pending-quote-history/table";

import {
    QuoteSourceCategory,
    QUOTE_SOURCE_CATEGORY_META,
} from "./project/quoteSource/table";
import {
    WorkplaceInspectionTemplate,
    WORKPLACE_INSPECTION_TEMPLATE_META,
} from "./project/safety/workplace-inspection/admin/table";
import {
    WorkplaceInspection,
    WORKPLACE_INSPECTION_META,
} from "./project/safety/workplace-inspection/table";
import {
    SiteVisitReport,
    SITE_VISIT_REPORT_META,
} from "./project/site-visit-report/table";
import {
    Project,
    ProjectStatusChange,
    ProjectUnlockRequest,
    PROJECT_META,
    PROJECT_STATUS_CHANGE_META,
    PROJECT_UNLOCK_REQUEST_META,
    QuotationLateRecord,
    QUOTATION_LATE_RECORD_META,
} from "./project/table";
import {
    AnticipatedDuration,
    ANTICIPATED_DURATION_META,
    ApprovalType,
    APPROVAL_TYPE_META,
    Competitor,
    COMPETITOR_META,
    Manufacturer,
    MANUFACTURER_META,
    ThirdPartySpecifier,
    THIRD_PARTY_SPECIFIER_META,
} from "./project/types/table";
import {
    ContractNote,
    CONTRACT_NOTE_META,
    ProjectSpotlight,
    PROJECT_SPOTLIGHT_META,
    ScopeOfWork,
    SCOPE_OF_WORK_META,
} from "./quotation/notes/table";
import {
    Quotation,
    QuotationCopyRequest,
    QUOTATION_COPY_REQUEST_META,
    QUOTATION_META,
} from "./quotation/table";
import { QuotationType, QUOTATION_TYPE_META } from "./quotation/type/table";
import { RichTextImage, RICH_TEXT_IMAGE_META } from "./rich-text-image";
import { Role, ROLE_META } from "./roles/table";
import {
    SaltOrder,
    SaltProduct,
    SALT_ORDER_META,
    SALT_PRODUCT_META,
} from "./salt/table";
import { Thread, THREAD_META } from "./thread";
import { Squad, SQUAD_META, User, USER_META } from "./user/table";
import { View, VIEW_META } from "./views/table";
import {
    WarrantyReview,
    WarrantyReviewDetailSheet,
    WarrantyReviewTemplate,
    WARRANTY_REVIEW_DETAIL_SHEET_META,
    WARRANTY_REVIEW_META,
    WARRANTY_REVIEW_TEMPLATE_META,
} from "./warranty-review/table";
import {
    WarrantyLength,
    WarrantyTemplate,
    WARRANTY_LENGTH_META,
    WARRANTY_TEMPLATE_META,
} from "./warranty/table";

//!Tables
export type Tables = [
    WorkplaceInspection,
    WorkplaceInspectionTemplate,
    QuotationLateRecord,
    ProjectStatusChange,
    WarrantyReviewDetailSheet,
    WarrantyReviewTemplate,
    WarrantyReview,
    CustomerSurveyTemplate,
    CustomerSurvey,
    Squad,
    WarrantyTemplate,
    WarrantyLength,
    ContactFollowupActivity,
    Campaign,
    Industry,
    EstimateContingencyItemType,
    ContactInactiveReason,
    EstimateCopyRequest,
    QuotationCopyRequest,
    RichTextImage,
    CompletionSurvey,
    CompletionSurveyTemplate,
    DetailSheet,
    Notice,
    ApplicationType,
    User,
    Company,
    ContactType,
    LandingLikelihood,
    Contact,
    Project,
    QuoteSourceCategory,
    ProjectDescription,
    ProjectDescriptionCategory,
    Estimate,
    EstimateTemplate,
    ItemType,
    UnitType,
    FinishSchedule,
    View,
    Role,
    SaltProduct,
    SaltOrder,
    Filter,
    SiteVisitReport,
    CustomerRelation,
    Help,
    Message,
    Substrate,
    TimeAndMaterialsEstimate,
    TimeAndMaterialsEstimateProduct,
    ScopeOfWork,
    ProjectSpotlight,
    ContractNote,
    Quotation,
    Competitor,
    QuotationType,
    ThirdPartySpecifier,
    ApprovalType,
    AnticipatedDuration,
    Thread,
    CoreValueNoticeCategory,
    CoreValueNotice,
    General,
    Invoice,
    Payout,
    Term,
    ProjectEmail,
    ChangeRejected,
    Subscription,
    ProjectUnlockRequest,
    Manufacturer
];

// BEGIN MAGIC -- DO NOT EDIT
export const TABLES_META: Dictionary<RecordMeta<any, any, any>> = {
    WorkplaceInspection: WORKPLACE_INSPECTION_META,
    WorkplaceInspectionTemplate: WORKPLACE_INSPECTION_TEMPLATE_META,
    QuotationLateRecord: QUOTATION_LATE_RECORD_META,
    ProjectStatusChange: PROJECT_STATUS_CHANGE_META,
    WarrantyReviewDetailSheet: WARRANTY_REVIEW_DETAIL_SHEET_META,
    WarrantyReviewTemplate: WARRANTY_REVIEW_TEMPLATE_META,
    WarrantyReview: WARRANTY_REVIEW_META,
    CustomerSurveyTemplate: CUSTOMER_SURVEY_TEMPLATE_META,
    CustomerSurvey: CUSTOMER_SURVEY_META,
    Squad: SQUAD_META,
    WarrantyTemplate: WARRANTY_TEMPLATE_META,
    WarrantyLength: WARRANTY_LENGTH_META,
    ContactFollowupActivity: CONTACT_FOLLOWUP_ACTIVITY_META,
    Campaign: CAMPAIGN_META,
    Industry: INDUSTRY_META,
    EstimateContingencyItemType: ESTIMATE_CONTINGENCY_ITEM_TYPE_META,
    ContactInactiveReason: CONTACT_INACTIVE_REASON_META,
    EstimateCopyRequest: ESTIMATE_COPY_REQUEST_META,
    QuotationCopyRequest: QUOTATION_COPY_REQUEST_META,
    RichTextImage: RICH_TEXT_IMAGE_META,
    CompletionSurvey: COMPLETION_SURVEY_META,
    CompletionSurveyTemplate: COMPLETION_SURVEY_TEMPLATE_META,
    DetailSheet: DETAIL_SHEET_META,
    Notice: NOTICE_META,
    ApplicationType: APPLICATION_TYPE_META,
    User: USER_META,
    Company: COMPANY_META,
    ContactType: CONTACT_TYPE_META,
    LandingLikelihood: LANDING_LIKELIHOOD_META,
    Contact: CONTACT_META,
    Project: PROJECT_META,
    QuoteSourceCategory: QUOTE_SOURCE_CATEGORY_META,
    ProjectDescription: PROJECT_DESCRIPTION_META,
    ProjectDescriptionCategory: PROJECT_DESCRIPTION_CATEGORY_META,
    Estimate: ESTIMATE_META,
    EstimateTemplate: ESTIMATE_TEMPLATE_META,
    ItemType: ITEM_TYPE_META,
    UnitType: UNIT_TYPE_META,
    FinishSchedule: FINISH_SCHEDULE_META,
    View: VIEW_META,
    Role: ROLE_META,
    SaltProduct: SALT_PRODUCT_META,
    SaltOrder: SALT_ORDER_META,
    Filter: FILTER_META,
    SiteVisitReport: SITE_VISIT_REPORT_META,
    CustomerRelation: CUSTOMER_RELATION_META,
    Help: HELP_META,
    Message: MESSAGE_META,
    Substrate: SUBSTRATE_META,
    TimeAndMaterialsEstimate: TIME_AND_MATERIALS_ESTIMATE_META,
    TimeAndMaterialsEstimateProduct: TIME_AND_MATERIALS_ESTIMATE_PRODUCT_META,
    ScopeOfWork: SCOPE_OF_WORK_META,
    ProjectSpotlight: PROJECT_SPOTLIGHT_META,
    ContractNote: CONTRACT_NOTE_META,
    Quotation: QUOTATION_META,
    Competitor: COMPETITOR_META,
    QuotationType: QUOTATION_TYPE_META,
    ThirdPartySpecifier: THIRD_PARTY_SPECIFIER_META,
    ApprovalType: APPROVAL_TYPE_META,
    AnticipatedDuration: ANTICIPATED_DURATION_META,
    Thread: THREAD_META,
    CoreValueNoticeCategory: CORE_VALUE_NOTICE_CATEGORY_META,
    CoreValueNotice: CORE_VALUE_NOTICE_META,
    General: GENERAL_META,
    Invoice: INVOICE_META,
    Payout: PAYOUT_META,
    Term: TERM_META,
    ProjectEmail: PROJECT_EMAIL_META,
    ChangeRejected: CHANGE_REJECTED_META,
    Subscription: SUBSCRIPTION_META,
    ProjectUnlockRequest: PROJECT_UNLOCK_REQUEST_META,
    Manufacturer: MANUFACTURER_META,
};

// END MAGIC -- DO NOT EDIT
