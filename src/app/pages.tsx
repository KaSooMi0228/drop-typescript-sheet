import { RecordHistoryPage } from "../clay/record-history-page";
import { RejectedChangesPage } from "../clay/rejected-changes-page";
import { RouterPage } from "../clay/router-page";
import { TermsPage } from "../terms";
import { BrowseCampaigns } from "./campaign";
import { CompanyPage } from "./company";
import {
    ContactFollowupActivityPage,
    ContactInactiveReasonPage,
    ContactPage,
} from "./contact";
import { ContactTypesPage } from "./contact-type/editor";
import { ContactsSettingsPage } from "./contacts-settings";
import { DataPage } from "./data";
import { DuplicatesPage } from "./DuplicatesWidget.widget";
import { EstimateContingencyItemTypePage, EstimatePage } from "./estimate";
import { EstimateSettingsPage } from "./estimate-settings";
import { FinishSchedulePage } from "./estimate/finish-schedule/editor";
import SimpleEstimateMobilePage from "./estimate/mobile";
import { RatePage } from "./estimate/rate/editor";
import { EstimateTemplatePage } from "./estimate/templates";
import { TimeAndMaterialsEstimatePage } from "./estimate/time-and-materials";
import { TimeAndMaterialsEstimateProductPage } from "./estimate/time-and-materials/editor";
import {
    ApplicationTypesPage,
    ItemTypesPage,
    SubstratePage,
    UnitTypesPage,
} from "./estimate/types/editor";
import { GeneralSettingsPage } from "./general-settings";
import { HELP_PAGE } from "./help";
import { HomePage } from "./home-page";
import { IndustrysPage } from "./industry";
import { InvoicesPage } from "./invoice";
import { ObserverPage } from "./observer";
import { PayoutsPage } from "./payout";
import {
    ProjectDescriptionCategoriesPage,
    ProjectDescriptionsPage,
} from "./project-description";
import {
    CompletionSurveyTemplatePage,
    PayoutSurveysPage,
} from "./project/completion-survey";
import { CoreValueNoticeCategoryPage } from "./project/core-values";
import {
    CustomerSurveysPage,
    CustomerSurveyTemplatesPage,
} from "./project/customer-survey";
import { ProjectEmailsPage } from "./project/email";
import { ProjectPage } from "./project/index";
import { LandingLikelihoodPage } from "./project/pending-quote-history/editor";
import { QuoteSourceCategoriesPage } from "./project/quoteSource/index";
import { WorkplaceInspectionAdmin } from "./project/safety/workplace-inspection/admin";
import { SiteVisitReportPage } from "./project/site-visit-report";
import SiteVisitReportMobilePage, {
    MobileSiteVisitReportPage,
} from "./project/site-visit-report/mobile";
import {
    AnticipatedDurationsPage,
    ApprovalTypesPage,
    CompetitorsPage,
    ManufacturersPage,
    ThirdPartySpecifiersPage,
} from "./project/types";
import { ProjectSettingsPage } from "./projects-settings";
import { QuotationsPage } from "./quotation";
import { QuotationSettingsPage } from "./quotation-settings";
import {
    ContractNotePage,
    ProjectSpotlightPage,
    ScopeOfWorkPage,
} from "./quotation/notes";
import { QuotationTypesPage } from "./quotation/type";
import { RolesPage } from "./roles";
import { SaltOrderPage, SaltProductPage } from "./salt";
import { SettingsPage } from "./settings";
import { SquadPage } from "./user";
import { UsersPage } from "./user/browse";
import { ViewsPage } from "./views";
import { WarrantyLengthsPage, WarrantyTemplatesPage } from "./warranty";
import {
    WarrantyReviewsPage,
    WarrantyReviewsTemplatePage,
} from "./warranty-review";
import * as React from "react";

const MOBILE_PAGE = RouterPage({
    "site-visit-report": SiteVisitReportMobilePage,
    "site-visit-report-x": MobileSiteVisitReportPage,
    "simple-estimate": SimpleEstimateMobilePage,
});

const ADMIN_PAGE = RouterPage({
    observer: ObserverPage,
    contacts: ContactsSettingsPage,
    users: UsersPage,
    "contact-types": ContactTypesPage,
    "project-descriptions": ProjectDescriptionsPage,
    "project-description-categories": ProjectDescriptionCategoriesPage,
    "quote-source-categories": QuoteSourceCategoriesPage,
    views: ViewsPage,
    roles: RolesPage,
    salt: SaltProductPage,
    "record-history": RecordHistoryPage,
    "rejected-changes": RejectedChangesPage,
    "": SettingsPage,
    "item-types": ItemTypesPage,
    "unit-types": UnitTypesPage,
    estimates: EstimateSettingsPage,
    quotations: QuotationSettingsPage,
    "finish-schedules": FinishSchedulePage,
    substrates: SubstratePage,
    rates: RatePage,
    "application-types": ApplicationTypesPage,
    "estimate-templates": EstimateTemplatePage,
    "tm-products": TimeAndMaterialsEstimateProductPage,
    "scope-of-work": ScopeOfWorkPage,
    "contract-note": ContractNotePage,
    "your-project-item": ProjectSpotlightPage,
    "quotation-types": QuotationTypesPage,
    "landing-likelihood": LandingLikelihoodPage,
    "third-party-specifiers": ThirdPartySpecifiersPage,
    competitors: CompetitorsPage,
    manufacturers: ManufacturersPage,
    "approval-types": ApprovalTypesPage,
    "anticipated-durations": AnticipatedDurationsPage,
    "core-value-notice-categories": CoreValueNoticeCategoryPage,
    "completion-survey-template": CompletionSurveyTemplatePage,
    terms: TermsPage,
    general: GeneralSettingsPage,
    projects: ProjectSettingsPage,
    duplicates: DuplicatesPage,
    "contact-inactive-reasons": ContactInactiveReasonPage,
    "estimate-contingency-item-types": EstimateContingencyItemTypePage,
    industries: IndustrysPage,
    "contact-activity-followup": ContactFollowupActivityPage,
    "warranty-lengths": WarrantyLengthsPage,
    "warranty-templates": WarrantyTemplatesPage,
    squads: SquadPage,
    "customer-survey-templates": CustomerSurveyTemplatesPage,
    "warranty-review-templates": WarrantyReviewsTemplatePage,
    "workplace-inspection": WorkplaceInspectionAdmin,
});

export const ROOT_PAGE = RouterPage({
    admin: ADMIN_PAGE,
    mobile: MOBILE_PAGE,
    project: ProjectPage,
    company: CompanyPage,
    contact: ContactPage,
    estimate: EstimatePage,
    "tm-estimate": TimeAndMaterialsEstimatePage,
    salt: SaltOrderPage,
    help: HELP_PAGE,
    quotations: QuotationsPage,
    "payout-surveys": PayoutSurveysPage,
    "customer-surveys": CustomerSurveysPage,
    invoices: InvoicesPage,
    payouts: PayoutsPage,
    "site-visit-reports": SiteVisitReportPage,
    data: DataPage,
    "project-emails": ProjectEmailsPage,
    campaigns: BrowseCampaigns,
    "": HomePage,
    "warranty-review": WarrantyReviewsPage,
});
