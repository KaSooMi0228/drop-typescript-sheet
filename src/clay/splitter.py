X = """import { RecordHistoryPage } from "../clay/record-history-page";
import { RejectedChangesPage } from "../clay/rejected-changes-page";
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
} from "./warranty-review" """

for part in X.split(";"):
    names = [
        x.strip()
        for x in part[part.index("{") + 1 : part.index("}")].split(",")
        if x.strip()
    ]
    path = part[part.index('"') : part.rindex('"') + 1]

    for name in names:
        print(f"const {name} = memoize(() => import({path}).then(x => x.{name}));")
