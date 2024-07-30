import { addDays, parseISO as dateParse } from "date-fns";
import { Decimal } from "decimal.js";
import { Money, Percentage, Quantity, Serial } from "../../clay/common";
import { Link } from "../../clay/link";
import { LocalDate } from "../../clay/LocalDate";
import { RecordMeta } from "../../clay/meta";
import {
  anyMap,
  daysAgo,
  filterMap,
  firstMatch,
  ifNull,
  isEmpty,
  isNotNull,
  isNull,
  lastItem,
  resolve,
  selectArray,
  setDifference,
  sumMap,
  uniqueMap,
} from "../../clay/queryFuncs";
import { genUUID, newUUID, UUID } from "../../clay/uuid";
import { Version } from "../../clay/version";
import {
  Address,
  AddressJSON,
  AddressToJSON,
  ADDRESS_META,
  JSONToAddress,
  repairAddressJSON,
} from "../address";
import { Campaign } from "../campaign/table";
import {
  ContactDetail,
  ContactDetailJSON,
  ContactDetailToJSON,
  CONTACT_DETAIL_META,
  JSONToContactDetail,
  repairContactDetailJSON,
} from "../contact/table";
//@
import { find, maxBy, some, uniq } from "lodash";
import { UserPermissions } from "../../clay/server/api";
import {
  calcContingencyItemTotal,
  ContingencyItem,
  ContingencyItemJSON,
  ContingencyItemToJSON,
  CONTINGENCY_ITEM_META,
  JSONToContingencyItem,
  repairContingencyItemJSON,
} from "../contingency/table";
import { Option } from "../estimate/option/table";
import {
  calcInvoiceContingencyItemCertifiedForemanTotal,
  calcInvoiceContingencyItemDollarTotal,
  calcInvoiceContractTotal,
  calcInvoiceIsComplete,
  Invoice,
  InvoiceContingencyItem,
  InvoiceOption,
} from "../invoice/table";
import { calcPayoutOptionAmount, Payout, PayoutOption } from "../payout/table";
import { ProjectDescriptionCategory } from "../project-description/table";
import { Quotation } from "../quotation/table";
import { Role } from "../roles/table";
import {
  JSONToUserAndDate,
  repairUserAndDateJSON,
  UserAndDate,
  UserAndDateJSON,
  UserAndDateToJSON,
  USER_AND_DATE_META,
} from "../user-and-date/table";
import {
  ROLE_CERTIFIED_FOREMAN,
  ROLE_ESTIMATOR,
  ROLE_PROJECT_MANAGER,
  User,
} from "../user/table";
import {
  JSONToWarranty,
  JSONToWarrantyHistoryRecord,
  repairWarrantyHistoryRecordJSON,
  repairWarrantyJSON,
  Warranty,
  WarrantyHistoryRecord,
  WarrantyHistoryRecordJSON,
  WarrantyHistoryRecordToJSON,
  WarrantyJSON,
  WarrantyToJSON,
  WARRANTY_HISTORY_RECORD_META,
  WARRANTY_META,
} from "../warranty/table";
import { CompletionSurvey } from "./completion-survey/table";
import { DetailSheet, DETAIL_SHEET_META } from "./detail-sheet/table";
import {
  JSONToLocked,
  Locked,
  LockedJSON,
  LockedToJSON,
  LOCKED_META,
  repairLockedJSON,
} from "./locked/table";
import {
  JSONToPendingQuoteHistoryRecord,
  PendingQuoteHistoryRecord,
  PendingQuoteHistoryRecordJSON,
  PendingQuoteHistoryRecordToJSON,
  PENDING_QUOTE_HISTORY_RECORD_META,
  repairPendingQuoteHistoryRecordJSON,
} from "./pending-quote-history/table";
import {
  JSONToProjectPersonnel,
  ProjectPersonnel,
  ProjectPersonnelJSON,
  ProjectPersonnelToJSON,
  PROJECT_PERSONNEL_META,
  repairProjectPersonnelJSON,
} from "./personnel/table";
import {
  JSONToPreferredCertifiedForeman,
  PreferredCertifiedForeman,
  PreferredCertifiedForemanJSON,
  PreferredCertifiedForemanToJSON,
  PREFERRED_CERTIFIED_FOREMAN_META,
  repairPreferredCertifiedForemanJSON,
} from "./preferred-certified-foreman/table";
import {
  JSONToProjectDescriptionDetail,
  ProjectDescriptionDetail,
  ProjectDescriptionDetailJSON,
  ProjectDescriptionDetailToJSON,
  PROJECT_DESCRIPTION_DETAIL_META,
  repairProjectDescriptionDetailJSON,
} from "./projectDescriptionDetail/table";
import {
  JSONToQualityRfq,
  QualityRfq,
  QualityRfqJSON,
  QualityRfqToJSON,
  QUALITY_RFQ_META,
  repairQualityRfqJSON,
} from "./qualityRFQ/table";
import {
  JSONToQuoteSource,
  QuoteSource,
  QuoteSourceJSON,
  QuoteSourceToJSON,
  QUOTE_SOURCE_META,
  repairQuoteSourceJSON,
} from "./quoteSource/table";
import {
  JSONToProjectSchedule,
  ProjectSchedule,
  ProjectScheduleJSON,
  ProjectScheduleToJSON,
  PROJECT_SCHEDULE_META,
  repairProjectScheduleJSON,
} from "./schedule";
import {
  AnticipatedDuration,
  ApprovalType,
  Competitor,
  Manufacturer,
  ThirdPartySpecifier,
} from "./types/table";

//!Data
export type ProjectPauseRecord = {
  reason: string;
  date: LocalDate | null;
  user: Link<User>;
  confirmed: UserAndDate;
  addedDateTime: Date | null;
};

//!Data
export type CompetitorDetail = {
  bidRanking: Quantity;
  competitor: Link<Competitor>;
  bid: Money | null;
  percentageOfRemdal: Percentage | null;
  successfulBidder: boolean;
};
export function resolveSchedules(project: Project) {
  if (project.projectSchedulesDividedDescription) {
    return project;
  } else {
    return {
      ...project,
      projectSchedules: project.projectSchedules.map((projectSchedule) => ({
        ...projectSchedule,
        projectDescription: project.projectDescription,
      })),
      contingencyItems: project.projectContingencyItems.map(
        (contingencyItem) => ({
          ...contingencyItem,
          projectDescription: project.projectContingencyItems,
        })
      ),
    };
  }
}

export function getFiscalYear(date: Date) {
  return addDays(date, 31).getFullYear();
}

export function projectIsFromPreviousFiscalYear(project: Project) {
  if (project.projectStartDate === null) {
    return false;
  }

  return (
    getFiscalYear(project.projectStartDate.asDate()) < getFiscalYear(new Date())
  );
}

export function calcProjectPaymentDelayDays(project: Project): Quantity | null {
  return isNotNull(project.completion.date) &&
    isNotNull(project.finalInvoiceDate)
    ? daysAgo(project.finalInvoiceDate)!.minus(
        daysAgo(project.completion.date)!
      )
    : null;
}

export function calcProjectTotalProjectRevenue(project: Project): Money {
  return firstMatch(
    resolve("invoices"),
    (invoice: Invoice) => calcInvoiceIsComplete(invoice),
    (invoice) => calcInvoiceContractTotal(invoice)
  )!;
}

export function calcProjectImplFinalInvoiceDate(project: Project): Date | null {
  return firstMatch(
    resolve("invoices"),
    (invoice: Invoice) =>
      calcInvoiceIsComplete(invoice) && isNotNull(invoice.date),
    (invoice) => invoice.date
  );
}

function calcProjectScheduleProjectDescription(
  schedule: ProjectSchedule,
  project: Project
): ProjectDescriptionDetail {
  return project.projectSchedulesDividedDescription
    ? schedule.projectDescription
    : project.projectDescription;
}

export function calcProjectContingencyItemsTotal(project: Project): Money {
  return sumMap(project.projectContingencyItems, (item) =>
    calcContingencyItemTotal(item)
  );
}

//!Data
export type ProjectUnlockRequest = {
  id: UUID;
  recordVersion: Version;
  project: Link<Project>;
  addedBy: Link<User>;
  addedDateTime: Date | null;
};

export function calcProjectUnlockRequestTrue(
  request: ProjectUnlockRequest
): boolean {
  return true;
}

//!Data
export type FinishScheduleLine = {
  id: UUID;
  substrate: string;
  manufacturer: Link<Manufacturer>;
  productName: string;
  productSizeAndBase: string;
  colourName: string;
  colourFormula: string;
};

//!Data
export type ScheduledSiteVisit = {
  user: Link<User>;
  addedDateTime: Date | null;
  scheduledDateTime: Date | null;
  contact: ContactDetail;
};

//!Data
export type ProjectStatusChange = {
  id: UUID;
  recordVersion: Version;
  project: Link<Project>;
  status: string;
  date: Date | null;
  recordedDate: Date | null;
  user: Link<User>;
};

//!Data
export type EstimateDelay = {
  user: Link<User>;
  addedDate: Date | null;
  message: string;
  delayUntil: LocalDate | null;
  dismissed: Link<User>[];
};

//!Data
export type ProcessedForPayout = {
  processed: UserAndDate;
  payout: Link<Payout>;
};

//!Data
export type Project = {
  id: UUID;
  recordVersion: Version;
  name: string;

  estimateDelays: EstimateDelay[];

  hazmatSurveyAvailable: "" | "yes" | "no" | "unknown";
  hazmatSurveyOnFile: boolean;

  tenderDetailsProjectDetails: string;
  tenderDue: Date | null;
  tenderDeliveryMethod: "" | "email" | "hard-copy";
  bidBondRequired: boolean;
  bidBondType: "" | "physical" | "electronic";
  bidBidAmount: Percentage;
  consentOfSurety: boolean;
  tenderAcceptancePeriod: string;

  tenderEstimatedContractPrice: Money;
  tenderEstimatedStartDate: LocalDate | null;
  tenderEstimateStartDate: LocalDate | null;
  tenderEstimatedCompletionDate: LocalDate | null;

  sharepointFolderSuffix: string;
  sharepointFolderId: string;
  stagingSharepointFolderId: string;

  quoteRequestDate: Date | null;
  quoteRequiredBy: LocalDate | null;
  nextMeetingDate: LocalDate | null;
  customer: string;
  customerPurchaseOrderNumber: string;
  qualityRFQ: QualityRfq;

  siteAddress: Address;

  contacts: ContactDetail[];
  billingContacts: ContactDetail[];
  quoteRequestedBy: ContactDetail;

  source: QuoteSource;
  unitCount: Quantity;

  personnel: ProjectPersonnel[];

  billingCompany: string;
  billingAddress: Address;

  projectAwardDate: Date | null;
  budgetedHours: Quantity;
  anticipatedDuration: Link<AnticipatedDuration>;
  anticipatedContractValue: Money;

  preferredCertifiedForemen: PreferredCertifiedForeman[];

  otherSpecialNeeds: string[];

  estimateDate: Date | null;
  firstQuotationDate: Date | null;

  projectNumber: Serial;

  projectNameOrNumber: string;

  customersRequest: Locked;
  additionalCustomersRequests: Locked[];
  specialInstructions: Locked;

  yearConstructed: Quantity;

  additionalSiteAddresses: Address[];
  thirdPartySpecifierInvolved: Link<ThirdPartySpecifier>;

  pendingQuoteHistory: PendingQuoteHistoryRecord[];

  selectedQuotation: Link<Quotation>;
  lastQuotation: Link<Quotation>;
  projectLostDate: Date | null;
  projectLostUser: Link<User> | null;
  competitors: CompetitorDetail[];
  projectLostNotes: string;
  projectProceededWithoutRemdal: boolean;
  season: string;
  approvalType: Link<ApprovalType>;
  contractAwardSpecialNeedsAndNotes: string;
  contractDetailsDate: Date | null;
  projectDetailDate: Date | null;
  selectedOptions: Link<Option>[];

  projectSchedules: ProjectSchedule[];
  projectContingencyItems: ContingencyItem[];
  projectSchedulesDividedDescription: boolean;
  projectDescription: ProjectDescriptionDetail;

  engineeredProject: boolean;
  hasContingencyItems: boolean;
  lienHoldbackRequiredOverride: boolean | null;
  projectStartDate: LocalDate | null;
  projectStartDateConfirmed: UserAndDate;
  pauses: ProjectPauseRecord[];

  addedToAccountingSoftwareDate: Date | null;
  addedToAccountingSoftwareUser: Link<User>;
  addedToAccountingSoftware: UserAndDate;
  quickbooksId: string;
  processedForPayouts: ProcessedForPayout[];
  processedForPayout: UserAndDate;
  quoteRequestCompletedBy: Link<User>;
  completionDate: LocalDate | null;
  completion: UserAndDate;
  accessRequests: Link<User>[];
  tags: string[];
  finalInvoiceDate: Date | null;
  unitNumber: string;
  anticipatedProjectValue: Money;
  campaign: Link<Campaign>;
  finishScheduleDate: Date | null;
  finishScheduleNotRequiredDate: Date | null;
  finishScheduleContacts: ContactDetail[];
  finishScheduleInitialized: boolean;
  finishScheduleScopeOfWork: string;
  finishScheduleLines: FinishScheduleLine[];
  finishScheduleNotRequired: string;

  warrantyLength: "N/A" | "2" | "5";
  warrantyNotApplicableExplanation: string;
  warrantyProjectNotes: string;
  warrantyPotentialConcerns: string;
  warrantyExclusions: string;
  warrantyDate: Date | null;
  warrantyNotRequiredDate: Date | null;
  warrantyExcludeScopes: Link<InvoiceOption | InvoiceContingencyItem>[];
  warranties: Warranty[];
  warrantyHistory: WarrantyHistoryRecord[];
  warrantyNotRequired: string;
  warrantyNotRequiredNotes: Locked[];
  warrantyNotRequiredApproval: UserAndDate;

  scheduledSiteVisits: ScheduledSiteVisit[];

  quotationRecordedLate: boolean;

  customerSurveyMissing: boolean;
  customerSurveyMissingReason: string;
};

//!Data
export type QuotationLateRecord = {
  id: UUID;
  recordVersion: Version;
  project: Link<Project>;
  addedDateTime: Date | null;
  late: boolean;
};

export function calcProjectLateQuotationMismatch(project: Project): boolean {
  return project.quotationRecordedLate !== calcProjectIsEstimateLate(project);
}

export const ProjectSegments = {
  schedules: ["schedules"],
};

export function calcProjectHasThirdPartyTender(project: Project): boolean {
  return (
    project.source.category === "88abccc8-6a39-5e39-a4e5-d8b97ebb7062" ||
    project.source.category === "6186e7fe-ad7c-5284-b38e-ef92135f8dc8"
  );
}

export function isProjectLocked(project: Project) {
  return (
    (project.projectLostDate !== null &&
      daysAgo(project.projectLostDate)!.gt(365)) ||
    project.completion.date !== null
  );
}

export function calcProjectCertifiedForemanLacksDetailSheet(
  project: Project,
  detailSheets: DetailSheet[]
): boolean {
  return (
    calcProjectActive(project) &&
    !isEmpty(
      setDifference(
        filterMap(
          project.personnel,
          (entry) => entry.role === ROLE_CERTIFIED_FOREMAN,
          (entry) => entry.user
        ),
        detailSheets.map((sheet) => sheet.certifiedForeman)
      )
    )
  );
}

export function calcProjectSchedules(
  project: Project,
  detailSheets: DetailSheet[]
): ProjectSchedule[] {
  return selectArray(
    detailSheets.flatMap((detailSheet) => detailSheet.schedules),
    project.projectSchedules
  );
}

export function calcProjectUnacceptedUsers(project: Project): Link<User>[] {
  return filterMap(
    project.personnel,
    (row) => !row.accepted,
    (row) => row.user
  );
}

export function calcProjectHasAccessRequests(project: Project): boolean {
  return !isEmpty(project.accessRequests);
}

export function calcProjectNoSiteVisitScheduled(project: Project): boolean {
  return isEmpty(project.scheduledSiteVisits);
}

export function calcProjectDescriptionCategories(
  project: Project
): Link<ProjectDescriptionCategory>[] {
  return project.projectSchedulesDividedDescription
    ? uniqueMap(
        project.projectSchedules,
        (schedule) => schedule.projectDescription.category
      )
    : [project.projectDescription.category];
}

export function calcProjectDescriptions(
  project: Project
): ProjectDescriptionDetail[] {
  return project.projectSchedulesDividedDescription
    ? project.projectSchedules.map((schedule) => schedule.projectDescription)
    : [project.projectDescription];
}

export function calcProjectSummary(project: Project): string {
  return `${project.siteAddress.line1} > Project ${project.projectNumber}`;
}

export function calcProjectIsUnaddedToAccounting(project: Project): boolean {
  return (
    isNull(project.addedToAccountingSoftware.date) &&
    !isNull(project.projectDetailDate) &&
    !isNull(project.contractDetailsDate)
  );
}

export function calcProjectIsCertifiedForemanMissing(
  project: Project
): boolean {
  return (
    calcProjectActive(project) &&
    !isNull(project.contractDetailsDate) &&
    !anyMap(project.personnel, (entry) => entry.role === ROLE_CERTIFIED_FOREMAN)
  );
}

export function calcProjectLienHoldbackRequiredDefault(
  project: Project
): boolean {
  return calcProjectTotalContractValue(project).greaterThanOrEqualTo(
    new Decimal("35000")
  );
}

export function calcProjectTotal(project: Project): Money {
  return calcProjectIsPending(project)
    ? resolve("lastQuotation.expectedContractValue")
    : isNotNull(project.projectLostDate)
    ? ifNull(resolve("selectedQuotation.expectedContractValue"), new Decimal(0))
    : isNotNull(project.completion.date)
    ? resolve("lastPayout.amountTotal")
    : isNotNull(project.projectDetailDate)
    ? calcProjectTotalContractValue(project)
    : ifNull(
        resolve("selectedQuotation.expectedContractValue"),
        new Decimal(0)
      );
}

export function calcProjectLienHoldbackRequired(project: Project): boolean {
  return project.lienHoldbackRequiredOverride === true
    ? true
    : project.lienHoldbackRequiredOverride === false
    ? false
    : calcProjectLienHoldbackRequiredDefault(project);
}

export function calcProjectTotalContractValue(project: Project): Money {
  return sumMap(project.projectSchedules, (schedule) => schedule.price);
}

export function calcProjectActive(project: Project): boolean {
  return isNull(project.projectLostDate) && isNull(project.completion.date);
}

export function calcProjectIsPending(project: Project): boolean {
  return (
    isNull(project.projectLostDate) &&
    isNull(project.projectAwardDate) &&
    isNull(project.completion.date) &&
    ifNull(
      lastItem(
        project.pendingQuoteHistory,
        (item) =>
          item.landingLikelihood !== "d97b9b36-7a34-47a3-9cca-71cc4294c9fd"
      ),
      false
    )
  );
}

export function calcProjectReadyForPayout(project: Project): boolean {
  return (
    isNull(project.completion.date) &&
    lastItem(
      project.processedForPayouts,
      (x) => isNotNull(x.processed.date) && isNull(x.payout)
    )!
  );
}

export function calcProjectReadyForPayoutDate(project: Project): Date | null {
  return lastItem(project.processedForPayouts, (x) => x.processed.date);
}

export function calcProjectCurrentPendingQuoteStatus(
  project: Project
): PendingQuoteHistoryRecord {
  return lastItem(project.pendingQuoteHistory, (history) => history)!;
}

// #ffff80 - yellow - completed
// #77bbff - light blue - pending
// #9cff80 - light green - detail sheet
// #e5ffe0 - very light green - no detail sheet
// #ff0000 - red - invalid
// #ff8b13 - orange - estimate started
// #ffb3b3 - pink - no estimate started
// #b3b3b3 - gray - job lost

export function computeProjectStageEffectiveDate(
  project: Project,
  stage: string
) {
  switch (stage) {
    case "Invoiced":
      return project.finalInvoiceDate;
    case "Completed":
      return project.completion.date;
    default:
      return null;
  }
}

export function calcProjectStage(
  project: Project
):
  | "New RFQ"
  | "Estimating"
  | "Re-estimating"
  | "Pending"
  | "Lost"
  | "Awarded"
  | "Unscheduled"
  | "Future"
  | "Current"
  | "On Hold"
  | "Invoiced"
  | "Completed" {
  return isNotNull(project.projectLostDate)
    ? "Lost"
    : isNotNull(project.completion.date)
    ? "Completed"
    : isNotNull(project.finalInvoiceDate)
    ? "Invoiced"
    : isNull(project.projectStartDate) &&
      isNotNull(project.projectDetailDate) &&
      isNotNull(project.projectAwardDate)
    ? "Unscheduled"
    : isNotNull(project.projectDetailDate) &&
      isNotNull(project.projectAwardDate) &&
      isNotNull(project.projectStartDate) &&
      daysAgo(project.projectStartDate!)!.lessThan(0)
    ? "Future"
    : isNotNull(project.projectDetailDate) &&
      isNotNull(project.projectAwardDate)
    ? ifNull(
        lastItem(project.pauses, (pause) => daysAgo(pause.date)!.lessThan(0)),
        false
      )
      ? "On Hold"
      : "Current"
    : isNotNull(project.projectAwardDate)
    ? "Awarded"
    : calcProjectIsPending(project)
    ? "Pending"
    : isNotNull(project.estimateDate)
    ? calcProjectRevisedQuoteRequested(project)
      ? "Re-estimating"
      : "Estimating"
    : "New RFQ";
}

export function calcProjectStageSort(project: Project): string {
  return isNotNull(project.projectLostDate)
    ? "3"
    : isNotNull(project.completion.date)
    ? "6"
    : isNotNull(project.finalInvoiceDate)
    ? "5"
    : isNull(project.projectStartDate) &&
      isNotNull(project.projectDetailDate) &&
      isNotNull(project.projectAwardDate)
    ? "3b"
    : isNotNull(project.projectDetailDate) &&
      isNotNull(project.projectAwardDate) &&
      isNotNull(project.projectStartDate) &&
      daysAgo(project.projectStartDate!)!.lessThan(0)
    ? "3c"
    : isNotNull(project.projectDetailDate) &&
      isNotNull(project.projectAwardDate)
    ? ifNull(
        lastItem(project.pauses, (pause) => daysAgo(pause.date)!.lessThan(0)),
        false
      )
      ? "4b"
      : "4"
    : isNotNull(project.projectAwardDate)
    ? "3"
    : calcProjectIsPending(project)
    ? "2"
    : isNotNull(project.estimateDate)
    ? "1"
    : "0";
}

export function calcProjectIsEstimatorMissing(project: Project): boolean {
  return (
    calcProjectActive(project) &&
    !anyMap(project.personnel, (entry) => entry.role === ROLE_ESTIMATOR)
  );
}

export function calcProjectIsWarrantyNotRequiredUnapproved(
  project: Project
): boolean {
  return (
    isNotNull(project.warrantyNotRequiredDate) &&
    isNull(project.warrantyNotRequiredApproval.user)
  );
}

export function calcProjectFinalCalculationOfPayoutDate(
  project: Project
): Date | null {
  return project.completion.date;
}

export function calcProjectIsEstimatorAssignmentLate(
  project: Project
): boolean {
  return (
    calcProjectActive(project) &&
    ifNull(daysAgo(project.quoteRequestDate), new Decimal(0)).gt(
      new Decimal(3)
    ) &&
    !anyMap(
      project.personnel,
      (entry) => entry.role === "11ac42ea-5e6c-45e6-b74e-677483307c23"
    )
  );
}

export function calcProjectIsAcceptanceLate(project: Project): boolean {
  return anyMap(
    project.personnel,
    (entry) =>
      ifNull(daysAgo(entry.assignedDate), new Decimal(0)).gt(new Decimal(3)) &&
      !entry.accepted
  );
}

export function calcProjectSomewhatLateThreshold(project: Project): Quantity {
  return project.projectDescription.category ===
    "866037e5-98dc-498d-a34a-b2346d19729f"
    ? new Decimal(21)
    : new Decimal(10);
}

export function calcProjectLateThreshold(project: Project): Quantity {
  return project.projectDescription.category ===
    "866037e5-98dc-498d-a34a-b2346d19729f"
    ? new Decimal(28)
    : new Decimal(14);
}

export function calcProjectEffectiveQuoteRequestDate(
  project: Project
): Date | null {
  return ifNull(
    lastItem(project.pendingQuoteHistory, (item) =>
      item.landingLikelihood === "d97b9b36-7a34-47a3-9cca-71cc4294c9fd"
        ? item.date
        : null
    ),
    project.quoteRequestDate
  );
}

export function calcProjectRevisedQuoteRequested(project: Project): boolean {
  return ifNull(
    lastItem(
      project.pendingQuoteHistory,
      (item) =>
        item.landingLikelihood === "d97b9b36-7a34-47a3-9cca-71cc4294c9fd"
    ),
    false
  );
}

export function calcProjectIsEstimateDelayed(project: Project): boolean {
  return !isEmpty(project.estimateDelays);
}

export function calcProjectEstimateDelayDismissed(
  project: Project
): Link<User>[] {
  return ifNull(
    lastItem(project.estimateDelays, (item) => item.dismissed),
    [project.quoteRequestCompletedBy]
  );
}

export function calcProjectEstimateDelayDate(project: Project): Date | null {
  return lastItem(project.estimateDelays, (delay) => delay.addedDate);
}

export function calcProjectHasActiveEstimateDelay(project: Project): boolean {
  return ifNull(
    lastItem(project.estimateDelays, (delay) =>
      ifNull(daysAgo(delay.delayUntil), new Decimal("-1")).lt(0)
    ),
    false
  );
}

export function calcProjectLastScheduledSiteVisit(
  project: Project
): Date | null {
  return lastItem(
    project.scheduledSiteVisits,
    (visit) => visit.scheduledDateTime
  );
}

export function calcProjectHasActiveSiteVisitDelay(project: Project): boolean {
  return ifNull(
    daysAgo(calcProjectLastScheduledSiteVisit(project)),
    new Decimal("10")
  ).lt(7);
}

export function calcProjectIsQuoteFollowupDue(project: Project): boolean {
  return (
    ifNull(
      daysAgo(calcProjectQuoteFollowUpDate(project)),
      new Decimal("-8")
    ).gt(new Decimal("-7")) &&
    isNull(project.projectAwardDate) &&
    calcProjectActive(project)
  );
}

export function calcProjectIsQuoteFollowupOverDue(project: Project): boolean {
  return (
    ifNull(daysAgo(calcProjectQuoteFollowUpDate(project)), new Decimal(0)).gt(
      new Decimal(0)
    ) &&
    isNull(project.projectAwardDate) &&
    calcProjectActive(project)
  );
}

export function calcProjectIsEstimateLate(project: Project): boolean {
  return (
    ifNull(
      daysAgo(calcProjectEffectiveQuoteRequestDate(project)),
      new Decimal(0)
    ).gt(calcProjectLateThreshold(project)) &&
    !calcProjectIsPending(project) &&
    !calcProjectHasActiveEstimateDelay(project) &&
    !calcProjectHasActiveSiteVisitDelay(project) &&
    isNull(project.projectAwardDate) &&
    calcProjectActive(project)
  );
}

export function calcProjectColor(project: Project): string {
  return calcProjectIsEstimateLate(project) ||
    calcProjectIsEstimatorAssignmentLate(project)
    ? "#ff0000"
    : isNotNull(project.projectLostDate)
    ? "#b3b3b3"
    : isNotNull(project.completion.date)
    ? "#ffff80"
    : isNull(project.projectStartDate) &&
      isNotNull(project.projectDetailDate) &&
      isNotNull(project.projectAwardDate)
    ? "#e5ffe0"
    : isNotNull(project.projectDetailDate) &&
      isNotNull(project.projectAwardDate)
    ? "#9cff80"
    : isNotNull(project.projectAwardDate)
    ? "#e5ffe0"
    : calcProjectIsPending(project)
    ? "#77bbff"
    : isNotNull(project.estimateDate)
    ? "#ff8b13"
    : "#ffb3b3";
}

export function calcProjectPersonnelByRole(
  project: Project,
  role: Link<Role>
): Link<User>[] {
  return filterMap(
    project.personnel,
    (person) => person.role === role,
    (person) => person.user
  );
}

export function calcProjectAcceptedPersonnelByRole(
  project: Project,
  role: Link<Role>
): Link<User>[] {
  return filterMap(
    project.personnel,
    (person) => person.role === role && person.accepted,
    (person) => person.user
  );
}

export function calcProjectQuoteFollowUpDate(
  project: Project
): LocalDate | null {
  return lastItem(
    project.pendingQuoteHistory,
    (history) => history.followupDate
  );
}

export function constructPayout(action: {
  user: UserPermissions;
  users: User[];
  project: Project;
  quotation: Quotation | null;
  detailSheets: DetailSheet[];
  invoices: Invoice[];
  payouts: Payout[];
  surveys: CompletionSurvey[];
}) {
  const missingSurveys = action.project.personnel
    .filter(
      (entry) =>
        entry.role == ROLE_CERTIFIED_FOREMAN &&
        (find(action.users, (user) => user.id.uuid === entry.user)
          ?.postProjectSurvey ||
          find(
            action.surveys,
            (survey) => survey.certifiedForeman === entry.user
          )) &&
        !find(
          action.surveys,
          (survey) =>
            survey.certifiedForeman === entry.user && survey.date != null
        )
    )
    .map((entry) => entry.user);
  const lastPayout = maxBy(action.payouts, (payout) =>
    payout.number.toNumber()
  );

  const lastInvoice = maxBy(action.invoices, (invoice) =>
    invoice.number.toNumber()
  );

  let optionsTotal = new Decimal(0);
  const managerTotals = new Map();
  for (const detailSheet of action.detailSheets) {
    for (const option of detailSheet.schedules) {
      optionsTotal = optionsTotal.plus(option.price);
      for (const manager of detailSheet.managers) {
        managerTotals.set(
          manager.user,
          (managerTotals.get(manager.user) || new Decimal(0)).plus(
            manager.percentage.times(option.price)
          )
        );
      }
    }
  }

  const options: PayoutOption[] = action.detailSheets
    .filter(
      (detailSheet) =>
        missingSurveys.indexOf(detailSheet.certifiedForeman) === -1
    )
    .flatMap((detailSheet) => [
      ...detailSheet.schedules.map((schedule) => ({
        id: schedule.id,
        name: schedule.name,
        description: schedule.description,
        quotations: detailSheet.quotations,
        number: detailSheet.number,
        total: schedule.price,
        certifiedForemanAmount: schedule.certifiedForemanContractAmount,
        certifiedForeman: detailSheet.certifiedForeman,
        manager: detailSheet.manager,
        previous:
          find(
            lastPayout?.options,
            (option) =>
              option.id.uuid == detailSheet.id.uuid ||
              option.id.uuid === schedule.id.uuid
          )?.completed || new Decimal(0),
        completed: schedule.price.isZero()
          ? new Decimal(1)
          : find(
              lastInvoice?.options,
              (option) =>
                option.id.uuid == detailSheet.id.uuid ||
                option.id.uuid == schedule.id.uuid
            )?.completed || new Decimal(0),
        projectDescription: schedule.projectDescription,
      })),
      ...detailSheet.contingencyItems.map((contingencyItem) => ({
        id: contingencyItem.id,
        name: "",
        description: contingencyItem.description,
        quotations: detailSheet.quotations,
        number: detailSheet.number,
        total: lastInvoice
          ? sumMap(
              lastInvoice.contingencyItems.filter(
                (item) => item.contingencyItem == contingencyItem.id.uuid
              ),
              (item) => calcInvoiceContingencyItemDollarTotal(item)
            )
          : new Decimal(0),
        certifiedForemanAmount: sumMap(
          action.invoices
            .flatMap((invoice) => invoice.contingencyItems)
            .filter((item) => item.contingencyItem == contingencyItem.id.uuid),
          (item) => calcInvoiceContingencyItemCertifiedForemanTotal(item)
        ),
        certifiedForeman: detailSheet.certifiedForeman,
        manager: detailSheet.manager,
        previous: new Decimal(0),
        completed: new Decimal(1),
        projectDescription: contingencyItem.projectDescription,
      })),
    ]);

  const estimatorCount = action.project.personnel.filter(
    (entry) => entry.role === ROLE_ESTIMATOR
  ).length;

  const newPayout: Payout = {
    id: newUUID(),
    marginVarianceApproved: {
      user: null,
      date: null,
    },
    marginVarianceExplanation: "",
    marginVarianceReason: "",
    marginVarianceDescription: [],
    addedDateTime: null,
    addedToAccountingSoftware: {
      date: null,
      user: null,
    },
    addedToAccountingSoftwareDate: null,
    addedToAccountingSoftwareUser: null,
    recordVersion: { version: null },
    project: action.project.id.uuid,
    user: action.user.id,
    number: action.payouts
      .reduce(
        (current, quotation) => Decimal.max(current, quotation.number),
        new Decimal(0)
      )
      .plus(1),
    firstDate: null,
    date: null,
    options,
    employeeProfitShare: some(
      action.detailSheets.map(
        (sheet) =>
          find(action.users, (user) => user.id.uuid === sheet.certifiedForeman)
            ?.includeEmployeeProfitShare
      )
    )
      ? new Decimal("0.0075")
      : new Decimal("0"),
    certifiedForemen: uniq(
      action.detailSheets.map((sheet) => sheet.certifiedForeman)
    )
      .filter((user) => missingSurveys.indexOf(user) === -1)
      .map((foreman) => {
        const user = find(action.users, (user) => user.id.uuid == foreman);
        const previousEntry =
          lastPayout &&
          find(
            lastPayout.certifiedForemen,
            (cf) => cf.certifiedForeman == foreman
          );
        return {
          certifiedForeman: foreman,
          certifiedForemanExpenses: new Decimal(0),
          certifiedForemanExpensesNote: "",
          warrantyFundPercentage: user?.includeWarrantyFund
            ? new Decimal("0.02")
            : new Decimal("0.0"),
          taxHoldbackPercentage: user?.includeTaxHoldback
            ? new Decimal("0.22")
            : new Decimal(0),
          gstPercentage: user?.includeGst
            ? new Decimal("0.05")
            : new Decimal("0"),
          topUp: new Decimal(0),
          topUpDescription: "",
          previousTopUp: previousEntry
            ? previousEntry.previousTopUp.plus(previousEntry.topUp)
            : new Decimal(0),
          legacyDeduction: new Decimal(0),
          progressPayoutFoundsAlreadyPaid: new Decimal(0),
          hasProgressPayout: true,
        };
      }),
    note: "",
    estimators: [],
    managers: [],
    commissions: [
      ...action.project.personnel
        .filter((entry) => entry.role === ROLE_ESTIMATOR)
        .map((entry) => {
          const user = find(
            action.users,
            (user) => user.id.uuid == entry.user
          )!;

          return {
            user: entry.user,
            role: entry.role,
            rolePercentage: new Decimal("0.35"),
            portionPercentage: action.quotation
              ? find(action.quotation.estimators, (x) => x.user === entry.user)
                  ?.percentage || new Decimal(0)
              : new Decimal("1").dividedBy(estimatorCount),
            commissionPercentage: action.quotation
              ? find(action.quotation.estimators, (x) => x.user === entry.user)
                  ?.percentage || new Decimal(0)
              : user.commissionsPercentage,
            extraAmount: new Decimal("0"),
            extraPercentage: new Decimal("0"),
            extraReason: "",
            custom: false,
          };
        }),
      ...action.project.personnel
        .filter((entry) => entry.role === ROLE_PROJECT_MANAGER)
        .map((entry) => {
          const manager = entry.user;
          const user = find(action.users, (user) => user.id.uuid == manager)!;
          const managerTotal = sumMap(
            options.filter((option) => option.manager === manager),
            calcPayoutOptionAmount
          );
          return {
            user: manager,
            role: ROLE_PROJECT_MANAGER,
            rolePercentage: new Decimal("0.65"),
            portionPercentage: optionsTotal.isZero()
              ? new Decimal(1)
              : (managerTotals.get(manager) || new Decimal(0)).dividedBy(
                  optionsTotal
                ),
            commissionPercentage: user.commissionsPercentage,
            extraAmount: new Decimal("0"),
            extraPercentage: new Decimal("0"),
            extraReason: "",
            custom: false,
          };
        }),
    ],
    expenses: [],
    skippedCertifiedForemen: missingSurveys.length > 0,
  };
  return newPayout;
}

// BEGIN MAGIC -- DO NOT EDIT
export type ProjectPauseRecordJSON = {
  reason: string;
  date: string | null;
  user: string | null;
  confirmed: UserAndDateJSON;
  addedDateTime: string | null;
};

export function JSONToProjectPauseRecord(
  json: ProjectPauseRecordJSON
): ProjectPauseRecord {
  return {
    reason: json.reason,
    date: json.date !== null ? LocalDate.parse(json.date) : null,
    user: json.user,
    confirmed: JSONToUserAndDate(json.confirmed),
    addedDateTime:
      json.addedDateTime !== null ? dateParse(json.addedDateTime) : null,
  };
}
export type ProjectPauseRecordBrokenJSON = {
  reason?: string;
  date?: string | null;
  user?: string | null;
  confirmed?: UserAndDateJSON;
  addedDateTime?: string | null;
};

export function newProjectPauseRecord(): ProjectPauseRecord {
  return JSONToProjectPauseRecord(repairProjectPauseRecordJSON(undefined));
}
export function repairProjectPauseRecordJSON(
  json: ProjectPauseRecordBrokenJSON | undefined
): ProjectPauseRecordJSON {
  if (json) {
    return {
      reason: json.reason || "",
      date: json.date || null,
      user: json.user || null,
      confirmed: repairUserAndDateJSON(json.confirmed),
      addedDateTime: json.addedDateTime
        ? new Date(json.addedDateTime!).toISOString()
        : null,
    };
  } else {
    return {
      reason: undefined || "",
      date: undefined || null,
      user: undefined || null,
      confirmed: repairUserAndDateJSON(undefined),
      addedDateTime: undefined ? new Date(undefined!).toISOString() : null,
    };
  }
}

export function ProjectPauseRecordToJSON(
  value: ProjectPauseRecord
): ProjectPauseRecordJSON {
  return {
    reason: value.reason,
    date: value.date !== null ? value.date.toString() : null,
    user: value.user,
    confirmed: UserAndDateToJSON(value.confirmed),
    addedDateTime:
      value.addedDateTime !== null ? value.addedDateTime.toISOString() : null,
  };
}

export const PROJECT_PAUSE_RECORD_META: RecordMeta<
  ProjectPauseRecord,
  ProjectPauseRecordJSON,
  ProjectPauseRecordBrokenJSON
> & { name: "ProjectPauseRecord" } = {
  name: "ProjectPauseRecord",
  type: "record",
  repair: repairProjectPauseRecordJSON,
  toJSON: ProjectPauseRecordToJSON,
  fromJSON: JSONToProjectPauseRecord,
  fields: {
    reason: { type: "string" },
    date: { type: "date" },
    user: { type: "uuid", linkTo: "User" },
    confirmed: USER_AND_DATE_META,
    addedDateTime: { type: "datetime" },
  },
  userFacingKey: null,
  functions: {},
  segments: {},
};

export type CompetitorDetailJSON = {
  bidRanking: string;
  competitor: string | null;
  bid: string | null;
  percentageOfRemdal: string | null;
  successfulBidder: boolean;
};

export function JSONToCompetitorDetail(
  json: CompetitorDetailJSON
): CompetitorDetail {
  return {
    bidRanking: new Decimal(json.bidRanking),
    competitor: json.competitor,
    bid: json.bid !== null ? new Decimal(json.bid) : null,
    percentageOfRemdal:
      json.percentageOfRemdal !== null
        ? new Decimal(json.percentageOfRemdal)
        : null,
    successfulBidder: json.successfulBidder,
  };
}
export type CompetitorDetailBrokenJSON = {
  bidRanking?: string;
  competitor?: string | null;
  bid?: string | null;
  percentageOfRemdal?: string | null;
  successfulBidder?: boolean;
};

export function newCompetitorDetail(): CompetitorDetail {
  return JSONToCompetitorDetail(repairCompetitorDetailJSON(undefined));
}
export function repairCompetitorDetailJSON(
  json: CompetitorDetailBrokenJSON | undefined
): CompetitorDetailJSON {
  if (json) {
    return {
      bidRanking: json.bidRanking || "0",
      competitor: json.competitor || null,
      bid: json.bid || null,
      percentageOfRemdal: json.percentageOfRemdal || null,
      successfulBidder: json.successfulBidder || false,
    };
  } else {
    return {
      bidRanking: undefined || "0",
      competitor: undefined || null,
      bid: undefined || null,
      percentageOfRemdal: undefined || null,
      successfulBidder: undefined || false,
    };
  }
}

export function CompetitorDetailToJSON(
  value: CompetitorDetail
): CompetitorDetailJSON {
  return {
    bidRanking: value.bidRanking.toString(),
    competitor: value.competitor,
    bid: value.bid !== null ? value.bid.toString() : null,
    percentageOfRemdal:
      value.percentageOfRemdal !== null
        ? value.percentageOfRemdal.toString()
        : null,
    successfulBidder: value.successfulBidder,
  };
}

export const COMPETITOR_DETAIL_META: RecordMeta<
  CompetitorDetail,
  CompetitorDetailJSON,
  CompetitorDetailBrokenJSON
> & { name: "CompetitorDetail" } = {
  name: "CompetitorDetail",
  type: "record",
  repair: repairCompetitorDetailJSON,
  toJSON: CompetitorDetailToJSON,
  fromJSON: JSONToCompetitorDetail,
  fields: {
    bidRanking: { type: "quantity" },
    competitor: { type: "uuid", linkTo: "Competitor" },
    bid: { type: "money?" },
    percentageOfRemdal: { type: "percentage?" },
    successfulBidder: { type: "boolean" },
  },
  userFacingKey: null,
  functions: {},
  segments: {},
};

export type ProjectUnlockRequestJSON = {
  id: string;
  recordVersion: number | null;
  project: string | null;
  addedBy: string | null;
  addedDateTime: string | null;
};

export function JSONToProjectUnlockRequest(
  json: ProjectUnlockRequestJSON
): ProjectUnlockRequest {
  return {
    id: { uuid: json.id },
    recordVersion: { version: json.recordVersion },
    project: json.project,
    addedBy: json.addedBy,
    addedDateTime:
      json.addedDateTime !== null ? dateParse(json.addedDateTime) : null,
  };
}
export type ProjectUnlockRequestBrokenJSON = {
  id?: string;
  recordVersion?: number | null;
  project?: string | null;
  addedBy?: string | null;
  addedDateTime?: string | null;
};

export function newProjectUnlockRequest(): ProjectUnlockRequest {
  return JSONToProjectUnlockRequest(repairProjectUnlockRequestJSON(undefined));
}
export function repairProjectUnlockRequestJSON(
  json: ProjectUnlockRequestBrokenJSON | undefined
): ProjectUnlockRequestJSON {
  if (json) {
    return {
      id: json.id || genUUID(),
      recordVersion:
        json.recordVersion === undefined ? null : json.recordVersion,
      project: json.project || null,
      addedBy: json.addedBy || null,
      addedDateTime: json.addedDateTime
        ? new Date(json.addedDateTime!).toISOString()
        : null,
    };
  } else {
    return {
      id: undefined || genUUID(),
      recordVersion: null,
      project: undefined || null,
      addedBy: undefined || null,
      addedDateTime: undefined ? new Date(undefined!).toISOString() : null,
    };
  }
}

export function ProjectUnlockRequestToJSON(
  value: ProjectUnlockRequest
): ProjectUnlockRequestJSON {
  return {
    id: value.id.uuid,
    recordVersion: value.recordVersion.version,
    project: value.project,
    addedBy: value.addedBy,
    addedDateTime:
      value.addedDateTime !== null ? value.addedDateTime.toISOString() : null,
  };
}

export const PROJECT_UNLOCK_REQUEST_META: RecordMeta<
  ProjectUnlockRequest,
  ProjectUnlockRequestJSON,
  ProjectUnlockRequestBrokenJSON
> & { name: "ProjectUnlockRequest" } = {
  name: "ProjectUnlockRequest",
  type: "record",
  repair: repairProjectUnlockRequestJSON,
  toJSON: ProjectUnlockRequestToJSON,
  fromJSON: JSONToProjectUnlockRequest,
  fields: {
    id: { type: "uuid" },
    recordVersion: { type: "version" },
    project: { type: "uuid", linkTo: "Project" },
    addedBy: { type: "uuid", linkTo: "User" },
    addedDateTime: { type: "datetime" },
  },
  userFacingKey: null,
  functions: {
    true: {
      fn: calcProjectUnlockRequestTrue,
      parameterTypes: () => [PROJECT_UNLOCK_REQUEST_META],
      returnType: { type: "boolean" },
    },
  },
  segments: {},
};

export type FinishScheduleLineJSON = {
  id: string;
  substrate: string;
  manufacturer: string | null;
  productName: string;
  productSizeAndBase: string;
  colourName: string;
  colourFormula: string;
};

export function JSONToFinishScheduleLine(
  json: FinishScheduleLineJSON
): FinishScheduleLine {
  return {
    id: { uuid: json.id },
    substrate: json.substrate,
    manufacturer: json.manufacturer,
    productName: json.productName,
    productSizeAndBase: json.productSizeAndBase,
    colourName: json.colourName,
    colourFormula: json.colourFormula,
  };
}
export type FinishScheduleLineBrokenJSON = {
  id?: string;
  substrate?: string;
  manufacturer?: string | null;
  productName?: string;
  productSizeAndBase?: string;
  colourName?: string;
  colourFormula?: string;
};

export function newFinishScheduleLine(): FinishScheduleLine {
  return JSONToFinishScheduleLine(repairFinishScheduleLineJSON(undefined));
}
export function repairFinishScheduleLineJSON(
  json: FinishScheduleLineBrokenJSON | undefined
): FinishScheduleLineJSON {
  if (json) {
    return {
      id: json.id || genUUID(),
      substrate: json.substrate || "",
      manufacturer: json.manufacturer || null,
      productName: json.productName || "",
      productSizeAndBase: json.productSizeAndBase || "",
      colourName: json.colourName || "",
      colourFormula: json.colourFormula || "",
    };
  } else {
    return {
      id: undefined || genUUID(),
      substrate: undefined || "",
      manufacturer: undefined || null,
      productName: undefined || "",
      productSizeAndBase: undefined || "",
      colourName: undefined || "",
      colourFormula: undefined || "",
    };
  }
}

export function FinishScheduleLineToJSON(
  value: FinishScheduleLine
): FinishScheduleLineJSON {
  return {
    id: value.id.uuid,
    substrate: value.substrate,
    manufacturer: value.manufacturer,
    productName: value.productName,
    productSizeAndBase: value.productSizeAndBase,
    colourName: value.colourName,
    colourFormula: value.colourFormula,
  };
}

export const FINISH_SCHEDULE_LINE_META: RecordMeta<
  FinishScheduleLine,
  FinishScheduleLineJSON,
  FinishScheduleLineBrokenJSON
> & { name: "FinishScheduleLine" } = {
  name: "FinishScheduleLine",
  type: "record",
  repair: repairFinishScheduleLineJSON,
  toJSON: FinishScheduleLineToJSON,
  fromJSON: JSONToFinishScheduleLine,
  fields: {
    id: { type: "uuid" },
    substrate: { type: "string" },
    manufacturer: { type: "uuid", linkTo: "Manufacturer" },
    productName: { type: "string" },
    productSizeAndBase: { type: "string" },
    colourName: { type: "string" },
    colourFormula: { type: "string" },
  },
  userFacingKey: null,
  functions: {},
  segments: {},
};

export type ScheduledSiteVisitJSON = {
  user: string | null;
  addedDateTime: string | null;
  scheduledDateTime: string | null;
  contact: ContactDetailJSON;
};

export function JSONToScheduledSiteVisit(
  json: ScheduledSiteVisitJSON
): ScheduledSiteVisit {
  return {
    user: json.user,
    addedDateTime:
      json.addedDateTime !== null ? dateParse(json.addedDateTime) : null,
    scheduledDateTime:
      json.scheduledDateTime !== null
        ? dateParse(json.scheduledDateTime)
        : null,
    contact: JSONToContactDetail(json.contact),
  };
}
export type ScheduledSiteVisitBrokenJSON = {
  user?: string | null;
  addedDateTime?: string | null;
  scheduledDateTime?: string | null;
  contact?: ContactDetailJSON;
};

export function newScheduledSiteVisit(): ScheduledSiteVisit {
  return JSONToScheduledSiteVisit(repairScheduledSiteVisitJSON(undefined));
}
export function repairScheduledSiteVisitJSON(
  json: ScheduledSiteVisitBrokenJSON | undefined
): ScheduledSiteVisitJSON {
  if (json) {
    return {
      user: json.user || null,
      addedDateTime: json.addedDateTime
        ? new Date(json.addedDateTime!).toISOString()
        : null,
      scheduledDateTime: json.scheduledDateTime
        ? new Date(json.scheduledDateTime!).toISOString()
        : null,
      contact: repairContactDetailJSON(json.contact),
    };
  } else {
    return {
      user: undefined || null,
      addedDateTime: undefined ? new Date(undefined!).toISOString() : null,
      scheduledDateTime: undefined ? new Date(undefined!).toISOString() : null,
      contact: repairContactDetailJSON(undefined),
    };
  }
}

export function ScheduledSiteVisitToJSON(
  value: ScheduledSiteVisit
): ScheduledSiteVisitJSON {
  return {
    user: value.user,
    addedDateTime:
      value.addedDateTime !== null ? value.addedDateTime.toISOString() : null,
    scheduledDateTime:
      value.scheduledDateTime !== null
        ? value.scheduledDateTime.toISOString()
        : null,
    contact: ContactDetailToJSON(value.contact),
  };
}

export const SCHEDULED_SITE_VISIT_META: RecordMeta<
  ScheduledSiteVisit,
  ScheduledSiteVisitJSON,
  ScheduledSiteVisitBrokenJSON
> & { name: "ScheduledSiteVisit" } = {
  name: "ScheduledSiteVisit",
  type: "record",
  repair: repairScheduledSiteVisitJSON,
  toJSON: ScheduledSiteVisitToJSON,
  fromJSON: JSONToScheduledSiteVisit,
  fields: {
    user: { type: "uuid", linkTo: "User" },
    addedDateTime: { type: "datetime" },
    scheduledDateTime: { type: "datetime" },
    contact: CONTACT_DETAIL_META,
  },
  userFacingKey: null,
  functions: {},
  segments: {},
};

export type ProjectStatusChangeJSON = {
  id: string;
  recordVersion: number | null;
  project: string | null;
  status: string;
  date: string | null;
  recordedDate: string | null;
  user: string | null;
};

export function JSONToProjectStatusChange(
  json: ProjectStatusChangeJSON
): ProjectStatusChange {
  return {
    id: { uuid: json.id },
    recordVersion: { version: json.recordVersion },
    project: json.project,
    status: json.status,
    date: json.date !== null ? dateParse(json.date) : null,
    recordedDate:
      json.recordedDate !== null ? dateParse(json.recordedDate) : null,
    user: json.user,
  };
}
export type ProjectStatusChangeBrokenJSON = {
  id?: string;
  recordVersion?: number | null;
  project?: string | null;
  status?: string;
  date?: string | null;
  recordedDate?: string | null;
  user?: string | null;
};

export function newProjectStatusChange(): ProjectStatusChange {
  return JSONToProjectStatusChange(repairProjectStatusChangeJSON(undefined));
}
export function repairProjectStatusChangeJSON(
  json: ProjectStatusChangeBrokenJSON | undefined
): ProjectStatusChangeJSON {
  if (json) {
    return {
      id: json.id || genUUID(),
      recordVersion:
        json.recordVersion === undefined ? null : json.recordVersion,
      project: json.project || null,
      status: json.status || "",
      date: json.date ? new Date(json.date!).toISOString() : null,
      recordedDate: json.recordedDate
        ? new Date(json.recordedDate!).toISOString()
        : null,
      user: json.user || null,
    };
  } else {
    return {
      id: undefined || genUUID(),
      recordVersion: null,
      project: undefined || null,
      status: undefined || "",
      date: undefined ? new Date(undefined!).toISOString() : null,
      recordedDate: undefined ? new Date(undefined!).toISOString() : null,
      user: undefined || null,
    };
  }
}

export function ProjectStatusChangeToJSON(
  value: ProjectStatusChange
): ProjectStatusChangeJSON {
  return {
    id: value.id.uuid,
    recordVersion: value.recordVersion.version,
    project: value.project,
    status: value.status,
    date: value.date !== null ? value.date.toISOString() : null,
    recordedDate:
      value.recordedDate !== null ? value.recordedDate.toISOString() : null,
    user: value.user,
  };
}

export const PROJECT_STATUS_CHANGE_META: RecordMeta<
  ProjectStatusChange,
  ProjectStatusChangeJSON,
  ProjectStatusChangeBrokenJSON
> & { name: "ProjectStatusChange" } = {
  name: "ProjectStatusChange",
  type: "record",
  repair: repairProjectStatusChangeJSON,
  toJSON: ProjectStatusChangeToJSON,
  fromJSON: JSONToProjectStatusChange,
  fields: {
    id: { type: "uuid" },
    recordVersion: { type: "version" },
    project: { type: "uuid", linkTo: "Project" },
    status: { type: "string" },
    date: { type: "datetime" },
    recordedDate: { type: "datetime" },
    user: { type: "uuid", linkTo: "User" },
  },
  userFacingKey: null,
  functions: {},
  segments: {},
};

export type EstimateDelayJSON = {
  user: string | null;
  addedDate: string | null;
  message: string;
  delayUntil: string | null;
  dismissed: (string | null)[];
};

export function JSONToEstimateDelay(json: EstimateDelayJSON): EstimateDelay {
  return {
    user: json.user,
    addedDate: json.addedDate !== null ? dateParse(json.addedDate) : null,
    message: json.message,
    delayUntil:
      json.delayUntil !== null ? LocalDate.parse(json.delayUntil) : null,
    dismissed: json.dismissed.map((inner) => inner),
  };
}
export type EstimateDelayBrokenJSON = {
  user?: string | null;
  addedDate?: string | null;
  message?: string;
  delayUntil?: string | null;
  dismissed?: (string | null)[];
};

export function newEstimateDelay(): EstimateDelay {
  return JSONToEstimateDelay(repairEstimateDelayJSON(undefined));
}
export function repairEstimateDelayJSON(
  json: EstimateDelayBrokenJSON | undefined
): EstimateDelayJSON {
  if (json) {
    return {
      user: json.user || null,
      addedDate: json.addedDate
        ? new Date(json.addedDate!).toISOString()
        : null,
      message: json.message || "",
      delayUntil: json.delayUntil || null,
      dismissed: (json.dismissed || []).map((inner) => inner || null),
    };
  } else {
    return {
      user: undefined || null,
      addedDate: undefined ? new Date(undefined!).toISOString() : null,
      message: undefined || "",
      delayUntil: undefined || null,
      dismissed: (undefined || []).map((inner) => inner || null),
    };
  }
}

export function EstimateDelayToJSON(value: EstimateDelay): EstimateDelayJSON {
  return {
    user: value.user,
    addedDate: value.addedDate !== null ? value.addedDate.toISOString() : null,
    message: value.message,
    delayUntil: value.delayUntil !== null ? value.delayUntil.toString() : null,
    dismissed: value.dismissed.map((inner) => inner),
  };
}

export const ESTIMATE_DELAY_META: RecordMeta<
  EstimateDelay,
  EstimateDelayJSON,
  EstimateDelayBrokenJSON
> & { name: "EstimateDelay" } = {
  name: "EstimateDelay",
  type: "record",
  repair: repairEstimateDelayJSON,
  toJSON: EstimateDelayToJSON,
  fromJSON: JSONToEstimateDelay,
  fields: {
    user: { type: "uuid", linkTo: "User" },
    addedDate: { type: "datetime" },
    message: { type: "string" },
    delayUntil: { type: "date" },
    dismissed: { type: "array", items: { type: "uuid", linkTo: "User" } },
  },
  userFacingKey: null,
  functions: {},
  segments: {},
};

export type ProcessedForPayoutJSON = {
  processed: UserAndDateJSON;
  payout: string | null;
};

export function JSONToProcessedForPayout(
  json: ProcessedForPayoutJSON
): ProcessedForPayout {
  return {
    processed: JSONToUserAndDate(json.processed),
    payout: json.payout,
  };
}
export type ProcessedForPayoutBrokenJSON = {
  processed?: UserAndDateJSON;
  payout?: string | null;
};

export function newProcessedForPayout(): ProcessedForPayout {
  return JSONToProcessedForPayout(repairProcessedForPayoutJSON(undefined));
}
export function repairProcessedForPayoutJSON(
  json: ProcessedForPayoutBrokenJSON | undefined
): ProcessedForPayoutJSON {
  if (json) {
    return {
      processed: repairUserAndDateJSON(json.processed),
      payout: json.payout || null,
    };
  } else {
    return {
      processed: repairUserAndDateJSON(undefined),
      payout: undefined || null,
    };
  }
}

export function ProcessedForPayoutToJSON(
  value: ProcessedForPayout
): ProcessedForPayoutJSON {
  return {
    processed: UserAndDateToJSON(value.processed),
    payout: value.payout,
  };
}

export const PROCESSED_FOR_PAYOUT_META: RecordMeta<
  ProcessedForPayout,
  ProcessedForPayoutJSON,
  ProcessedForPayoutBrokenJSON
> & { name: "ProcessedForPayout" } = {
  name: "ProcessedForPayout",
  type: "record",
  repair: repairProcessedForPayoutJSON,
  toJSON: ProcessedForPayoutToJSON,
  fromJSON: JSONToProcessedForPayout,
  fields: {
    processed: USER_AND_DATE_META,
    payout: { type: "uuid", linkTo: "Payout" },
  },
  userFacingKey: null,
  functions: {},
  segments: {},
};

export type ProjectJSON = {
  id: string;
  recordVersion: number | null;
  name: string;
  estimateDelays: EstimateDelayJSON[];
  hazmatSurveyAvailable: string;
  hazmatSurveyOnFile: boolean;
  tenderDetailsProjectDetails: string;
  tenderDue: string | null;
  tenderDeliveryMethod: string;
  bidBondRequired: boolean;
  bidBondType: string;
  bidBidAmount: string;
  consentOfSurety: boolean;
  tenderAcceptancePeriod: string;
  tenderEstimatedContractPrice: string;
  tenderEstimatedStartDate: string | null;
  tenderEstimateStartDate: string | null;
  tenderEstimatedCompletionDate: string | null;
  sharepointFolderSuffix: string;
  sharepointFolderId: string;
  stagingSharepointFolderId: string;
  quoteRequestDate: string | null;
  quoteRequiredBy: string | null;
  nextMeetingDate: string | null;
  customer: string;
  customerPurchaseOrderNumber: string;
  qualityRFQ: QualityRfqJSON;
  siteAddress: AddressJSON;
  contacts: ContactDetailJSON[];
  billingContacts: ContactDetailJSON[];
  quoteRequestedBy: ContactDetailJSON;
  source: QuoteSourceJSON;
  unitCount: string;
  personnel: ProjectPersonnelJSON[];
  billingCompany: string;
  billingAddress: AddressJSON;
  projectAwardDate: string | null;
  budgetedHours: string;
  anticipatedDuration: string | null;
  anticipatedContractValue: string;
  preferredCertifiedForemen: PreferredCertifiedForemanJSON[];
  otherSpecialNeeds: string[];
  estimateDate: string | null;
  firstQuotationDate: string | null;
  projectNumber: number | null;
  projectNameOrNumber: string;
  customersRequest: LockedJSON;
  additionalCustomersRequests: LockedJSON[];
  specialInstructions: LockedJSON;
  yearConstructed: string;
  additionalSiteAddresses: AddressJSON[];
  thirdPartySpecifierInvolved: string | null;
  pendingQuoteHistory: PendingQuoteHistoryRecordJSON[];
  selectedQuotation: string | null;
  lastQuotation: string | null;
  projectLostDate: string | null;
  projectLostUser: string | null;
  competitors: CompetitorDetailJSON[];
  projectLostNotes: string;
  projectProceededWithoutRemdal: boolean;
  season: string;
  approvalType: string | null;
  contractAwardSpecialNeedsAndNotes: string;
  contractDetailsDate: string | null;
  projectDetailDate: string | null;
  selectedOptions: (string | null)[];
  projectSchedules: ProjectScheduleJSON[];
  projectContingencyItems: ContingencyItemJSON[];
  projectSchedulesDividedDescription: boolean;
  projectDescription: ProjectDescriptionDetailJSON;
  engineeredProject: boolean;
  hasContingencyItems: boolean;
  lienHoldbackRequiredOverride: boolean | null;
  projectStartDate: string | null;
  projectStartDateConfirmed: UserAndDateJSON;
  pauses: ProjectPauseRecordJSON[];
  addedToAccountingSoftwareDate: string | null;
  addedToAccountingSoftwareUser: string | null;
  addedToAccountingSoftware: UserAndDateJSON;
  quickbooksId: string;
  processedForPayouts: ProcessedForPayoutJSON[];
  processedForPayout: UserAndDateJSON;
  quoteRequestCompletedBy: string | null;
  completionDate: string | null;
  completion: UserAndDateJSON;
  accessRequests: (string | null)[];
  tags: string[];
  finalInvoiceDate: string | null;
  unitNumber: string;
  anticipatedProjectValue: string;
  campaign: string | null;
  finishScheduleDate: string | null;
  finishScheduleNotRequiredDate: string | null;
  finishScheduleContacts: ContactDetailJSON[];
  finishScheduleInitialized: boolean;
  finishScheduleScopeOfWork: string;
  finishScheduleLines: FinishScheduleLineJSON[];
  finishScheduleNotRequired: string;
  warrantyLength: string;
  warrantyNotApplicableExplanation: string;
  warrantyProjectNotes: string;
  warrantyPotentialConcerns: string;
  warrantyExclusions: string;
  warrantyDate: string | null;
  warrantyNotRequiredDate: string | null;
  warrantyExcludeScopes: (string | null)[];
  warranties: WarrantyJSON[];
  warrantyHistory: WarrantyHistoryRecordJSON[];
  warrantyNotRequired: string;
  warrantyNotRequiredNotes: LockedJSON[];
  warrantyNotRequiredApproval: UserAndDateJSON;
  scheduledSiteVisits: ScheduledSiteVisitJSON[];
  quotationRecordedLate: boolean;
  customerSurveyMissing: boolean;
  customerSurveyMissingReason: string;
};

export function JSONToProject(json: ProjectJSON): Project {
  return {
    id: { uuid: json.id },
    recordVersion: { version: json.recordVersion },
    name: json.name,
    estimateDelays: json.estimateDelays.map((inner) =>
      JSONToEstimateDelay(inner)
    ),
    hazmatSurveyAvailable: json.hazmatSurveyAvailable as any,
    hazmatSurveyOnFile: json.hazmatSurveyOnFile,
    tenderDetailsProjectDetails: json.tenderDetailsProjectDetails,
    tenderDue: json.tenderDue !== null ? dateParse(json.tenderDue) : null,
    tenderDeliveryMethod: json.tenderDeliveryMethod as any,
    bidBondRequired: json.bidBondRequired,
    bidBondType: json.bidBondType as any,
    bidBidAmount: new Decimal(json.bidBidAmount),
    consentOfSurety: json.consentOfSurety,
    tenderAcceptancePeriod: json.tenderAcceptancePeriod,
    tenderEstimatedContractPrice: new Decimal(
      json.tenderEstimatedContractPrice
    ),
    tenderEstimatedStartDate:
      json.tenderEstimatedStartDate !== null
        ? LocalDate.parse(json.tenderEstimatedStartDate)
        : null,
    tenderEstimateStartDate:
      json.tenderEstimateStartDate !== null
        ? LocalDate.parse(json.tenderEstimateStartDate)
        : null,
    tenderEstimatedCompletionDate:
      json.tenderEstimatedCompletionDate !== null
        ? LocalDate.parse(json.tenderEstimatedCompletionDate)
        : null,
    sharepointFolderSuffix: json.sharepointFolderSuffix,
    sharepointFolderId: json.sharepointFolderId,
    stagingSharepointFolderId: json.stagingSharepointFolderId,
    quoteRequestDate:
      json.quoteRequestDate !== null ? dateParse(json.quoteRequestDate) : null,
    quoteRequiredBy:
      json.quoteRequiredBy !== null
        ? LocalDate.parse(json.quoteRequiredBy)
        : null,
    nextMeetingDate:
      json.nextMeetingDate !== null
        ? LocalDate.parse(json.nextMeetingDate)
        : null,
    customer: json.customer,
    customerPurchaseOrderNumber: json.customerPurchaseOrderNumber,
    qualityRFQ: JSONToQualityRfq(json.qualityRFQ),
    siteAddress: JSONToAddress(json.siteAddress),
    contacts: json.contacts.map((inner) => JSONToContactDetail(inner)),
    billingContacts: json.billingContacts.map((inner) =>
      JSONToContactDetail(inner)
    ),
    quoteRequestedBy: JSONToContactDetail(json.quoteRequestedBy),
    source: JSONToQuoteSource(json.source),
    unitCount: new Decimal(json.unitCount),
    personnel: json.personnel.map((inner) => JSONToProjectPersonnel(inner)),
    billingCompany: json.billingCompany,
    billingAddress: JSONToAddress(json.billingAddress),
    projectAwardDate:
      json.projectAwardDate !== null ? dateParse(json.projectAwardDate) : null,
    budgetedHours: new Decimal(json.budgetedHours),
    anticipatedDuration: json.anticipatedDuration,
    anticipatedContractValue: new Decimal(json.anticipatedContractValue),
    preferredCertifiedForemen: json.preferredCertifiedForemen.map((inner) =>
      JSONToPreferredCertifiedForeman(inner)
    ),
    otherSpecialNeeds: json.otherSpecialNeeds.map((inner) => inner),
    estimateDate:
      json.estimateDate !== null ? dateParse(json.estimateDate) : null,
    firstQuotationDate:
      json.firstQuotationDate !== null
        ? dateParse(json.firstQuotationDate)
        : null,
    projectNumber: json.projectNumber,
    projectNameOrNumber: json.projectNameOrNumber,
    customersRequest: JSONToLocked(json.customersRequest),
    additionalCustomersRequests: json.additionalCustomersRequests.map((inner) =>
      JSONToLocked(inner)
    ),
    specialInstructions: JSONToLocked(json.specialInstructions),
    yearConstructed: new Decimal(json.yearConstructed),
    additionalSiteAddresses: json.additionalSiteAddresses.map((inner) =>
      JSONToAddress(inner)
    ),
    thirdPartySpecifierInvolved: json.thirdPartySpecifierInvolved,
    pendingQuoteHistory: json.pendingQuoteHistory.map((inner) =>
      JSONToPendingQuoteHistoryRecord(inner)
    ),
    selectedQuotation: json.selectedQuotation,
    lastQuotation: json.lastQuotation,
    projectLostDate:
      json.projectLostDate !== null ? dateParse(json.projectLostDate) : null,
    projectLostUser: json.projectLostUser,
    competitors: json.competitors.map((inner) => JSONToCompetitorDetail(inner)),
    projectLostNotes: json.projectLostNotes,
    projectProceededWithoutRemdal: json.projectProceededWithoutRemdal,
    season: json.season,
    approvalType: json.approvalType,
    contractAwardSpecialNeedsAndNotes: json.contractAwardSpecialNeedsAndNotes,
    contractDetailsDate:
      json.contractDetailsDate !== null
        ? dateParse(json.contractDetailsDate)
        : null,
    projectDetailDate:
      json.projectDetailDate !== null
        ? dateParse(json.projectDetailDate)
        : null,
    selectedOptions: json.selectedOptions.map((inner) => inner),
    projectSchedules: json.projectSchedules.map((inner) =>
      JSONToProjectSchedule(inner)
    ),
    projectContingencyItems: json.projectContingencyItems.map((inner) =>
      JSONToContingencyItem(inner)
    ),
    projectSchedulesDividedDescription: json.projectSchedulesDividedDescription,
    projectDescription: JSONToProjectDescriptionDetail(json.projectDescription),
    engineeredProject: json.engineeredProject,
    hasContingencyItems: json.hasContingencyItems,
    lienHoldbackRequiredOverride: json.lienHoldbackRequiredOverride,
    projectStartDate:
      json.projectStartDate !== null
        ? LocalDate.parse(json.projectStartDate)
        : null,
    projectStartDateConfirmed: JSONToUserAndDate(
      json.projectStartDateConfirmed
    ),
    pauses: json.pauses.map((inner) => JSONToProjectPauseRecord(inner)),
    addedToAccountingSoftwareDate:
      json.addedToAccountingSoftwareDate !== null
        ? dateParse(json.addedToAccountingSoftwareDate)
        : null,
    addedToAccountingSoftwareUser: json.addedToAccountingSoftwareUser,
    addedToAccountingSoftware: JSONToUserAndDate(
      json.addedToAccountingSoftware
    ),
    quickbooksId: json.quickbooksId,
    processedForPayouts: json.processedForPayouts.map((inner) =>
      JSONToProcessedForPayout(inner)
    ),
    processedForPayout: JSONToUserAndDate(json.processedForPayout),
    quoteRequestCompletedBy: json.quoteRequestCompletedBy,
    completionDate:
      json.completionDate !== null
        ? LocalDate.parse(json.completionDate)
        : null,
    completion: JSONToUserAndDate(json.completion),
    accessRequests: json.accessRequests.map((inner) => inner),
    tags: json.tags.map((inner) => inner),
    finalInvoiceDate:
      json.finalInvoiceDate !== null ? dateParse(json.finalInvoiceDate) : null,
    unitNumber: json.unitNumber,
    anticipatedProjectValue: new Decimal(json.anticipatedProjectValue),
    campaign: json.campaign,
    finishScheduleDate:
      json.finishScheduleDate !== null
        ? dateParse(json.finishScheduleDate)
        : null,
    finishScheduleNotRequiredDate:
      json.finishScheduleNotRequiredDate !== null
        ? dateParse(json.finishScheduleNotRequiredDate)
        : null,
    finishScheduleContacts: json.finishScheduleContacts.map((inner) =>
      JSONToContactDetail(inner)
    ),
    finishScheduleInitialized: json.finishScheduleInitialized,
    finishScheduleScopeOfWork: json.finishScheduleScopeOfWork,
    finishScheduleLines: json.finishScheduleLines.map((inner) =>
      JSONToFinishScheduleLine(inner)
    ),
    finishScheduleNotRequired: json.finishScheduleNotRequired,
    warrantyLength: json.warrantyLength as any,
    warrantyNotApplicableExplanation: json.warrantyNotApplicableExplanation,
    warrantyProjectNotes: json.warrantyProjectNotes,
    warrantyPotentialConcerns: json.warrantyPotentialConcerns,
    warrantyExclusions: json.warrantyExclusions,
    warrantyDate:
      json.warrantyDate !== null ? dateParse(json.warrantyDate) : null,
    warrantyNotRequiredDate:
      json.warrantyNotRequiredDate !== null
        ? dateParse(json.warrantyNotRequiredDate)
        : null,
    warrantyExcludeScopes: json.warrantyExcludeScopes.map((inner) => inner),
    warranties: json.warranties.map((inner) => JSONToWarranty(inner)),
    warrantyHistory: json.warrantyHistory.map((inner) =>
      JSONToWarrantyHistoryRecord(inner)
    ),
    warrantyNotRequired: json.warrantyNotRequired,
    warrantyNotRequiredNotes: json.warrantyNotRequiredNotes.map((inner) =>
      JSONToLocked(inner)
    ),
    warrantyNotRequiredApproval: JSONToUserAndDate(
      json.warrantyNotRequiredApproval
    ),
    scheduledSiteVisits: json.scheduledSiteVisits.map((inner) =>
      JSONToScheduledSiteVisit(inner)
    ),
    quotationRecordedLate: json.quotationRecordedLate,
    customerSurveyMissing: json.customerSurveyMissing,
    customerSurveyMissingReason: json.customerSurveyMissingReason,
  };
}
export type ProjectBrokenJSON = {
  id?: string;
  recordVersion?: number | null;
  name?: string;
  estimateDelays?: EstimateDelayJSON[];
  hazmatSurveyAvailable?: string;
  hazmatSurveyOnFile?: boolean;
  tenderDetailsProjectDetails?: string;
  tenderDue?: string | null;
  tenderDeliveryMethod?: string;
  bidBondRequired?: boolean;
  bidBondType?: string;
  bidBidAmount?: string;
  consentOfSurety?: boolean;
  tenderAcceptancePeriod?: string;
  tenderEstimatedContractPrice?: string;
  tenderEstimatedStartDate?: string | null;
  tenderEstimateStartDate?: string | null;
  tenderEstimatedCompletionDate?: string | null;
  sharepointFolderSuffix?: string;
  sharepointFolderId?: string;
  stagingSharepointFolderId?: string;
  quoteRequestDate?: string | null;
  quoteRequiredBy?: string | null;
  nextMeetingDate?: string | null;
  customer?: string;
  customerPurchaseOrderNumber?: string;
  qualityRFQ?: QualityRfqJSON;
  siteAddress?: AddressJSON;
  contacts?: ContactDetailJSON[];
  billingContacts?: ContactDetailJSON[];
  quoteRequestedBy?: ContactDetailJSON;
  source?: QuoteSourceJSON;
  unitCount?: string;
  personnel?: ProjectPersonnelJSON[];
  billingCompany?: string;
  billingAddress?: AddressJSON;
  projectAwardDate?: string | null;
  budgetedHours?: string;
  anticipatedDuration?: string | null;
  anticipatedContractValue?: string;
  preferredCertifiedForemen?: PreferredCertifiedForemanJSON[];
  otherSpecialNeeds?: string[];
  estimateDate?: string | null;
  firstQuotationDate?: string | null;
  projectNumber?: number | null;
  projectNameOrNumber?: string;
  customersRequest?: LockedJSON;
  additionalCustomersRequests?: LockedJSON[];
  specialInstructions?: LockedJSON;
  yearConstructed?: string;
  additionalSiteAddresses?: AddressJSON[];
  thirdPartySpecifierInvolved?: string | null;
  pendingQuoteHistory?: PendingQuoteHistoryRecordJSON[];
  selectedQuotation?: string | null;
  lastQuotation?: string | null;
  projectLostDate?: string | null;
  projectLostUser?: string | null;
  competitors?: CompetitorDetailJSON[];
  projectLostNotes?: string;
  projectProceededWithoutRemdal?: boolean;
  season?: string;
  approvalType?: string | null;
  contractAwardSpecialNeedsAndNotes?: string;
  contractDetailsDate?: string | null;
  projectDetailDate?: string | null;
  selectedOptions?: (string | null)[];
  projectSchedules?: ProjectScheduleJSON[];
  projectContingencyItems?: ContingencyItemJSON[];
  projectSchedulesDividedDescription?: boolean;
  projectDescription?: ProjectDescriptionDetailJSON;
  engineeredProject?: boolean;
  hasContingencyItems?: boolean;
  lienHoldbackRequiredOverride?: boolean | null;
  projectStartDate?: string | null;
  projectStartDateConfirmed?: UserAndDateJSON;
  pauses?: ProjectPauseRecordJSON[];
  addedToAccountingSoftwareDate?: string | null;
  addedToAccountingSoftwareUser?: string | null;
  addedToAccountingSoftware?: UserAndDateJSON;
  quickbooksId?: string;
  processedForPayouts?: ProcessedForPayoutJSON[];
  processedForPayout?: UserAndDateJSON;
  quoteRequestCompletedBy?: string | null;
  completionDate?: string | null;
  completion?: UserAndDateJSON;
  accessRequests?: (string | null)[];
  tags?: string[];
  finalInvoiceDate?: string | null;
  unitNumber?: string;
  anticipatedProjectValue?: string;
  campaign?: string | null;
  finishScheduleDate?: string | null;
  finishScheduleNotRequiredDate?: string | null;
  finishScheduleContacts?: ContactDetailJSON[];
  finishScheduleInitialized?: boolean;
  finishScheduleScopeOfWork?: string;
  finishScheduleLines?: FinishScheduleLineJSON[];
  finishScheduleNotRequired?: string;
  warrantyLength?: string;
  warrantyNotApplicableExplanation?: string;
  warrantyProjectNotes?: string;
  warrantyPotentialConcerns?: string;
  warrantyExclusions?: string;
  warrantyDate?: string | null;
  warrantyNotRequiredDate?: string | null;
  warrantyExcludeScopes?: (string | null)[];
  warranties?: WarrantyJSON[];
  warrantyHistory?: WarrantyHistoryRecordJSON[];
  warrantyNotRequired?: string;
  warrantyNotRequiredNotes?: LockedJSON[];
  warrantyNotRequiredApproval?: UserAndDateJSON;
  scheduledSiteVisits?: ScheduledSiteVisitJSON[];
  quotationRecordedLate?: boolean;
  customerSurveyMissing?: boolean;
  customerSurveyMissingReason?: string;
};

export function newProject(): Project {
  return JSONToProject(repairProjectJSON(undefined));
}
export function repairProjectJSON(
  json: ProjectBrokenJSON | undefined
): ProjectJSON {
  if (json) {
    return {
      id: json.id || genUUID(),
      recordVersion:
        json.recordVersion === undefined ? null : json.recordVersion,
      name: json.name || "",
      estimateDelays: (json.estimateDelays || []).map((inner) =>
        repairEstimateDelayJSON(inner)
      ),
      hazmatSurveyAvailable: json.hazmatSurveyAvailable || "",
      hazmatSurveyOnFile: json.hazmatSurveyOnFile || false,
      tenderDetailsProjectDetails: json.tenderDetailsProjectDetails || "",
      tenderDue: json.tenderDue
        ? new Date(json.tenderDue!).toISOString()
        : null,
      tenderDeliveryMethod: json.tenderDeliveryMethod || "",
      bidBondRequired: json.bidBondRequired || false,
      bidBondType: json.bidBondType || "",
      bidBidAmount: json.bidBidAmount || "0",
      consentOfSurety: json.consentOfSurety || false,
      tenderAcceptancePeriod: json.tenderAcceptancePeriod || "",
      tenderEstimatedContractPrice: json.tenderEstimatedContractPrice || "0",
      tenderEstimatedStartDate: json.tenderEstimatedStartDate || null,
      tenderEstimateStartDate: json.tenderEstimateStartDate || null,
      tenderEstimatedCompletionDate: json.tenderEstimatedCompletionDate || null,
      sharepointFolderSuffix: json.sharepointFolderSuffix || "",
      sharepointFolderId: json.sharepointFolderId || "",
      stagingSharepointFolderId: json.stagingSharepointFolderId || "",
      quoteRequestDate: json.quoteRequestDate
        ? new Date(json.quoteRequestDate!).toISOString()
        : null,
      quoteRequiredBy: json.quoteRequiredBy || null,
      nextMeetingDate: json.nextMeetingDate || null,
      customer: json.customer || "",
      customerPurchaseOrderNumber: json.customerPurchaseOrderNumber || "",
      qualityRFQ: repairQualityRfqJSON(json.qualityRFQ),
      siteAddress: repairAddressJSON(json.siteAddress),
      contacts: (json.contacts || []).map((inner) =>
        repairContactDetailJSON(inner)
      ),
      billingContacts: (json.billingContacts || []).map((inner) =>
        repairContactDetailJSON(inner)
      ),
      quoteRequestedBy: repairContactDetailJSON(json.quoteRequestedBy),
      source: repairQuoteSourceJSON(json.source),
      unitCount: json.unitCount || "0",
      personnel: (json.personnel || []).map((inner) =>
        repairProjectPersonnelJSON(inner)
      ),
      billingCompany: json.billingCompany || "",
      billingAddress: repairAddressJSON(json.billingAddress),
      projectAwardDate: json.projectAwardDate
        ? new Date(json.projectAwardDate!).toISOString()
        : null,
      budgetedHours: json.budgetedHours || "0",
      anticipatedDuration: json.anticipatedDuration || null,
      anticipatedContractValue: json.anticipatedContractValue || "0",
      preferredCertifiedForemen: (json.preferredCertifiedForemen || []).map(
        (inner) => repairPreferredCertifiedForemanJSON(inner)
      ),
      otherSpecialNeeds: (json.otherSpecialNeeds || []).map(
        (inner) => inner || ""
      ),
      estimateDate: json.estimateDate
        ? new Date(json.estimateDate!).toISOString()
        : null,
      firstQuotationDate: json.firstQuotationDate
        ? new Date(json.firstQuotationDate!).toISOString()
        : null,
      projectNumber:
        json.projectNumber === undefined ? null : json.projectNumber,
      projectNameOrNumber: json.projectNameOrNumber || "",
      customersRequest: repairLockedJSON(json.customersRequest),
      additionalCustomersRequests: (json.additionalCustomersRequests || []).map(
        (inner) => repairLockedJSON(inner)
      ),
      specialInstructions: repairLockedJSON(json.specialInstructions),
      yearConstructed: json.yearConstructed || "0",
      additionalSiteAddresses: (json.additionalSiteAddresses || []).map(
        (inner) => repairAddressJSON(inner)
      ),
      thirdPartySpecifierInvolved: json.thirdPartySpecifierInvolved || null,
      pendingQuoteHistory: (json.pendingQuoteHistory || []).map((inner) =>
        repairPendingQuoteHistoryRecordJSON(inner)
      ),
      selectedQuotation: json.selectedQuotation || null,
      lastQuotation: json.lastQuotation || null,
      projectLostDate: json.projectLostDate
        ? new Date(json.projectLostDate!).toISOString()
        : null,
      projectLostUser: json.projectLostUser || null,
      competitors: (json.competitors || []).map((inner) =>
        repairCompetitorDetailJSON(inner)
      ),
      projectLostNotes: json.projectLostNotes || "",
      projectProceededWithoutRemdal:
        json.projectProceededWithoutRemdal || false,
      season: json.season || "",
      approvalType: json.approvalType || null,
      contractAwardSpecialNeedsAndNotes:
        json.contractAwardSpecialNeedsAndNotes || "",
      contractDetailsDate: json.contractDetailsDate
        ? new Date(json.contractDetailsDate!).toISOString()
        : null,
      projectDetailDate: json.projectDetailDate
        ? new Date(json.projectDetailDate!).toISOString()
        : null,
      selectedOptions: (json.selectedOptions || []).map(
        (inner) => inner || null
      ),
      projectSchedules: (json.projectSchedules || []).map((inner) =>
        repairProjectScheduleJSON(inner)
      ),
      projectContingencyItems: (json.projectContingencyItems || []).map(
        (inner) => repairContingencyItemJSON(inner)
      ),
      projectSchedulesDividedDescription:
        json.projectSchedulesDividedDescription || false,
      projectDescription: repairProjectDescriptionDetailJSON(
        json.projectDescription
      ),
      engineeredProject: json.engineeredProject || false,
      hasContingencyItems: json.hasContingencyItems || false,
      lienHoldbackRequiredOverride: json.lienHoldbackRequiredOverride ?? null,
      projectStartDate: json.projectStartDate || null,
      projectStartDateConfirmed: repairUserAndDateJSON(
        json.projectStartDateConfirmed
      ),
      pauses: (json.pauses || []).map((inner) =>
        repairProjectPauseRecordJSON(inner)
      ),
      addedToAccountingSoftwareDate: json.addedToAccountingSoftwareDate
        ? new Date(json.addedToAccountingSoftwareDate!).toISOString()
        : null,
      addedToAccountingSoftwareUser: json.addedToAccountingSoftwareUser || null,
      addedToAccountingSoftware: repairUserAndDateJSON(
        json.addedToAccountingSoftware
      ),
      quickbooksId: json.quickbooksId || "",
      processedForPayouts: (json.processedForPayouts || []).map((inner) =>
        repairProcessedForPayoutJSON(inner)
      ),
      processedForPayout: repairUserAndDateJSON(json.processedForPayout),
      quoteRequestCompletedBy: json.quoteRequestCompletedBy || null,
      completionDate: json.completionDate || null,
      completion: repairUserAndDateJSON(json.completion),
      accessRequests: (json.accessRequests || []).map((inner) => inner || null),
      tags: (json.tags || []).map((inner) => inner || ""),
      finalInvoiceDate: json.finalInvoiceDate
        ? new Date(json.finalInvoiceDate!).toISOString()
        : null,
      unitNumber: json.unitNumber || "",
      anticipatedProjectValue: json.anticipatedProjectValue || "0",
      campaign: json.campaign || null,
      finishScheduleDate: json.finishScheduleDate
        ? new Date(json.finishScheduleDate!).toISOString()
        : null,
      finishScheduleNotRequiredDate: json.finishScheduleNotRequiredDate
        ? new Date(json.finishScheduleNotRequiredDate!).toISOString()
        : null,
      finishScheduleContacts: (json.finishScheduleContacts || []).map((inner) =>
        repairContactDetailJSON(inner)
      ),
      finishScheduleInitialized: json.finishScheduleInitialized || false,
      finishScheduleScopeOfWork: json.finishScheduleScopeOfWork || "",
      finishScheduleLines: (json.finishScheduleLines || []).map((inner) =>
        repairFinishScheduleLineJSON(inner)
      ),
      finishScheduleNotRequired: json.finishScheduleNotRequired || "",
      warrantyLength: json.warrantyLength || "N/A",
      warrantyNotApplicableExplanation:
        json.warrantyNotApplicableExplanation || "",
      warrantyProjectNotes: json.warrantyProjectNotes || "",
      warrantyPotentialConcerns: json.warrantyPotentialConcerns || "",
      warrantyExclusions: json.warrantyExclusions || "",
      warrantyDate: json.warrantyDate
        ? new Date(json.warrantyDate!).toISOString()
        : null,
      warrantyNotRequiredDate: json.warrantyNotRequiredDate
        ? new Date(json.warrantyNotRequiredDate!).toISOString()
        : null,
      warrantyExcludeScopes: (json.warrantyExcludeScopes || []).map(
        (inner) => inner || null
      ),
      warranties: (json.warranties || []).map((inner) =>
        repairWarrantyJSON(inner)
      ),
      warrantyHistory: (json.warrantyHistory || []).map((inner) =>
        repairWarrantyHistoryRecordJSON(inner)
      ),
      warrantyNotRequired: json.warrantyNotRequired || "",
      warrantyNotRequiredNotes: (json.warrantyNotRequiredNotes || []).map(
        (inner) => repairLockedJSON(inner)
      ),
      warrantyNotRequiredApproval: repairUserAndDateJSON(
        json.warrantyNotRequiredApproval
      ),
      scheduledSiteVisits: (json.scheduledSiteVisits || []).map((inner) =>
        repairScheduledSiteVisitJSON(inner)
      ),
      quotationRecordedLate: json.quotationRecordedLate || false,
      customerSurveyMissing: json.customerSurveyMissing || false,
      customerSurveyMissingReason: json.customerSurveyMissingReason || "",
    };
  } else {
    return {
      id: undefined || genUUID(),
      recordVersion: null,
      name: undefined || "",
      estimateDelays: (undefined || []).map((inner) =>
        repairEstimateDelayJSON(inner)
      ),
      hazmatSurveyAvailable: undefined || "",
      hazmatSurveyOnFile: undefined || false,
      tenderDetailsProjectDetails: undefined || "",
      tenderDue: undefined ? new Date(undefined!).toISOString() : null,
      tenderDeliveryMethod: undefined || "",
      bidBondRequired: undefined || false,
      bidBondType: undefined || "",
      bidBidAmount: undefined || "0",
      consentOfSurety: undefined || false,
      tenderAcceptancePeriod: undefined || "",
      tenderEstimatedContractPrice: undefined || "0",
      tenderEstimatedStartDate: undefined || null,
      tenderEstimateStartDate: undefined || null,
      tenderEstimatedCompletionDate: undefined || null,
      sharepointFolderSuffix: undefined || "",
      sharepointFolderId: undefined || "",
      stagingSharepointFolderId: undefined || "",
      quoteRequestDate: undefined ? new Date(undefined!).toISOString() : null,
      quoteRequiredBy: undefined || null,
      nextMeetingDate: undefined || null,
      customer: undefined || "",
      customerPurchaseOrderNumber: undefined || "",
      qualityRFQ: repairQualityRfqJSON(undefined),
      siteAddress: repairAddressJSON(undefined),
      contacts: (undefined || []).map((inner) =>
        repairContactDetailJSON(inner)
      ),
      billingContacts: (undefined || []).map((inner) =>
        repairContactDetailJSON(inner)
      ),
      quoteRequestedBy: repairContactDetailJSON(undefined),
      source: repairQuoteSourceJSON(undefined),
      unitCount: undefined || "0",
      personnel: (undefined || []).map((inner) =>
        repairProjectPersonnelJSON(inner)
      ),
      billingCompany: undefined || "",
      billingAddress: repairAddressJSON(undefined),
      projectAwardDate: undefined ? new Date(undefined!).toISOString() : null,
      budgetedHours: undefined || "0",
      anticipatedDuration: undefined || null,
      anticipatedContractValue: undefined || "0",
      preferredCertifiedForemen: (undefined || []).map((inner) =>
        repairPreferredCertifiedForemanJSON(inner)
      ),
      otherSpecialNeeds: (undefined || []).map((inner) => inner || ""),
      estimateDate: undefined ? new Date(undefined!).toISOString() : null,
      firstQuotationDate: undefined ? new Date(undefined!).toISOString() : null,
      projectNumber: null,
      projectNameOrNumber: undefined || "",
      customersRequest: repairLockedJSON(undefined),
      additionalCustomersRequests: (undefined || []).map((inner) =>
        repairLockedJSON(inner)
      ),
      specialInstructions: repairLockedJSON(undefined),
      yearConstructed: undefined || "0",
      additionalSiteAddresses: (undefined || []).map((inner) =>
        repairAddressJSON(inner)
      ),
      thirdPartySpecifierInvolved: undefined || null,
      pendingQuoteHistory: (undefined || []).map((inner) =>
        repairPendingQuoteHistoryRecordJSON(inner)
      ),
      selectedQuotation: undefined || null,
      lastQuotation: undefined || null,
      projectLostDate: undefined ? new Date(undefined!).toISOString() : null,
      projectLostUser: undefined || null,
      competitors: (undefined || []).map((inner) =>
        repairCompetitorDetailJSON(inner)
      ),
      projectLostNotes: undefined || "",
      projectProceededWithoutRemdal: undefined || false,
      season: undefined || "",
      approvalType: undefined || null,
      contractAwardSpecialNeedsAndNotes: undefined || "",
      contractDetailsDate: undefined
        ? new Date(undefined!).toISOString()
        : null,
      projectDetailDate: undefined ? new Date(undefined!).toISOString() : null,
      selectedOptions: (undefined || []).map((inner) => inner || null),
      projectSchedules: (undefined || []).map((inner) =>
        repairProjectScheduleJSON(inner)
      ),
      projectContingencyItems: (undefined || []).map((inner) =>
        repairContingencyItemJSON(inner)
      ),
      projectSchedulesDividedDescription: undefined || false,
      projectDescription: repairProjectDescriptionDetailJSON(undefined),
      engineeredProject: undefined || false,
      hasContingencyItems: undefined || false,
      lienHoldbackRequiredOverride: undefined ?? null,
      projectStartDate: undefined || null,
      projectStartDateConfirmed: repairUserAndDateJSON(undefined),
      pauses: (undefined || []).map((inner) =>
        repairProjectPauseRecordJSON(inner)
      ),
      addedToAccountingSoftwareDate: undefined
        ? new Date(undefined!).toISOString()
        : null,
      addedToAccountingSoftwareUser: undefined || null,
      addedToAccountingSoftware: repairUserAndDateJSON(undefined),
      quickbooksId: undefined || "",
      processedForPayouts: (undefined || []).map((inner) =>
        repairProcessedForPayoutJSON(inner)
      ),
      processedForPayout: repairUserAndDateJSON(undefined),
      quoteRequestCompletedBy: undefined || null,
      completionDate: undefined || null,
      completion: repairUserAndDateJSON(undefined),
      accessRequests: (undefined || []).map((inner) => inner || null),
      tags: (undefined || []).map((inner) => inner || ""),
      finalInvoiceDate: undefined ? new Date(undefined!).toISOString() : null,
      unitNumber: undefined || "",
      anticipatedProjectValue: undefined || "0",
      campaign: undefined || null,
      finishScheduleDate: undefined ? new Date(undefined!).toISOString() : null,
      finishScheduleNotRequiredDate: undefined
        ? new Date(undefined!).toISOString()
        : null,
      finishScheduleContacts: (undefined || []).map((inner) =>
        repairContactDetailJSON(inner)
      ),
      finishScheduleInitialized: undefined || false,
      finishScheduleScopeOfWork: undefined || "",
      finishScheduleLines: (undefined || []).map((inner) =>
        repairFinishScheduleLineJSON(inner)
      ),
      finishScheduleNotRequired: undefined || "",
      warrantyLength: undefined || "N/A",
      warrantyNotApplicableExplanation: undefined || "",
      warrantyProjectNotes: undefined || "",
      warrantyPotentialConcerns: undefined || "",
      warrantyExclusions: undefined || "",
      warrantyDate: undefined ? new Date(undefined!).toISOString() : null,
      warrantyNotRequiredDate: undefined
        ? new Date(undefined!).toISOString()
        : null,
      warrantyExcludeScopes: (undefined || []).map((inner) => inner || null),
      warranties: (undefined || []).map((inner) => repairWarrantyJSON(inner)),
      warrantyHistory: (undefined || []).map((inner) =>
        repairWarrantyHistoryRecordJSON(inner)
      ),
      warrantyNotRequired: undefined || "",
      warrantyNotRequiredNotes: (undefined || []).map((inner) =>
        repairLockedJSON(inner)
      ),
      warrantyNotRequiredApproval: repairUserAndDateJSON(undefined),
      scheduledSiteVisits: (undefined || []).map((inner) =>
        repairScheduledSiteVisitJSON(inner)
      ),
      quotationRecordedLate: undefined || false,
      customerSurveyMissing: undefined || false,
      customerSurveyMissingReason: undefined || "",
    };
  }
}

export function ProjectToJSON(value: Project): ProjectJSON {
  return {
    id: value.id.uuid,
    recordVersion: value.recordVersion.version,
    name: value.name,
    estimateDelays: value.estimateDelays.map((inner) =>
      EstimateDelayToJSON(inner)
    ),
    hazmatSurveyAvailable: value.hazmatSurveyAvailable,
    hazmatSurveyOnFile: value.hazmatSurveyOnFile,
    tenderDetailsProjectDetails: value.tenderDetailsProjectDetails,
    tenderDue: value.tenderDue !== null ? value.tenderDue.toISOString() : null,
    tenderDeliveryMethod: value.tenderDeliveryMethod,
    bidBondRequired: value.bidBondRequired,
    bidBondType: value.bidBondType,
    bidBidAmount: value.bidBidAmount.toString(),
    consentOfSurety: value.consentOfSurety,
    tenderAcceptancePeriod: value.tenderAcceptancePeriod,
    tenderEstimatedContractPrice: value.tenderEstimatedContractPrice.toString(),
    tenderEstimatedStartDate:
      value.tenderEstimatedStartDate !== null
        ? value.tenderEstimatedStartDate.toString()
        : null,
    tenderEstimateStartDate:
      value.tenderEstimateStartDate !== null
        ? value.tenderEstimateStartDate.toString()
        : null,
    tenderEstimatedCompletionDate:
      value.tenderEstimatedCompletionDate !== null
        ? value.tenderEstimatedCompletionDate.toString()
        : null,
    sharepointFolderSuffix: value.sharepointFolderSuffix,
    sharepointFolderId: value.sharepointFolderId,
    stagingSharepointFolderId: value.stagingSharepointFolderId,
    quoteRequestDate:
      value.quoteRequestDate !== null
        ? value.quoteRequestDate.toISOString()
        : null,
    quoteRequiredBy:
      value.quoteRequiredBy !== null ? value.quoteRequiredBy.toString() : null,
    nextMeetingDate:
      value.nextMeetingDate !== null ? value.nextMeetingDate.toString() : null,
    customer: value.customer,
    customerPurchaseOrderNumber: value.customerPurchaseOrderNumber,
    qualityRFQ: QualityRfqToJSON(value.qualityRFQ),
    siteAddress: AddressToJSON(value.siteAddress),
    contacts: value.contacts.map((inner) => ContactDetailToJSON(inner)),
    billingContacts: value.billingContacts.map((inner) =>
      ContactDetailToJSON(inner)
    ),
    quoteRequestedBy: ContactDetailToJSON(value.quoteRequestedBy),
    source: QuoteSourceToJSON(value.source),
    unitCount: value.unitCount.toString(),
    personnel: value.personnel.map((inner) => ProjectPersonnelToJSON(inner)),
    billingCompany: value.billingCompany,
    billingAddress: AddressToJSON(value.billingAddress),
    projectAwardDate:
      value.projectAwardDate !== null
        ? value.projectAwardDate.toISOString()
        : null,
    budgetedHours: value.budgetedHours.toString(),
    anticipatedDuration: value.anticipatedDuration,
    anticipatedContractValue: value.anticipatedContractValue.toString(),
    preferredCertifiedForemen: value.preferredCertifiedForemen.map((inner) =>
      PreferredCertifiedForemanToJSON(inner)
    ),
    otherSpecialNeeds: value.otherSpecialNeeds.map((inner) => inner),
    estimateDate:
      value.estimateDate !== null ? value.estimateDate.toISOString() : null,
    firstQuotationDate:
      value.firstQuotationDate !== null
        ? value.firstQuotationDate.toISOString()
        : null,
    projectNumber: value.projectNumber,
    projectNameOrNumber: value.projectNameOrNumber,
    customersRequest: LockedToJSON(value.customersRequest),
    additionalCustomersRequests: value.additionalCustomersRequests.map(
      (inner) => LockedToJSON(inner)
    ),
    specialInstructions: LockedToJSON(value.specialInstructions),
    yearConstructed: value.yearConstructed.toString(),
    additionalSiteAddresses: value.additionalSiteAddresses.map((inner) =>
      AddressToJSON(inner)
    ),
    thirdPartySpecifierInvolved: value.thirdPartySpecifierInvolved,
    pendingQuoteHistory: value.pendingQuoteHistory.map((inner) =>
      PendingQuoteHistoryRecordToJSON(inner)
    ),
    selectedQuotation: value.selectedQuotation,
    lastQuotation: value.lastQuotation,
    projectLostDate:
      value.projectLostDate !== null
        ? value.projectLostDate.toISOString()
        : null,
    projectLostUser: value.projectLostUser,
    competitors: value.competitors.map((inner) =>
      CompetitorDetailToJSON(inner)
    ),
    projectLostNotes: value.projectLostNotes,
    projectProceededWithoutRemdal: value.projectProceededWithoutRemdal,
    season: value.season,
    approvalType: value.approvalType,
    contractAwardSpecialNeedsAndNotes: value.contractAwardSpecialNeedsAndNotes,
    contractDetailsDate:
      value.contractDetailsDate !== null
        ? value.contractDetailsDate.toISOString()
        : null,
    projectDetailDate:
      value.projectDetailDate !== null
        ? value.projectDetailDate.toISOString()
        : null,
    selectedOptions: value.selectedOptions.map((inner) => inner),
    projectSchedules: value.projectSchedules.map((inner) =>
      ProjectScheduleToJSON(inner)
    ),
    projectContingencyItems: value.projectContingencyItems.map((inner) =>
      ContingencyItemToJSON(inner)
    ),
    projectSchedulesDividedDescription:
      value.projectSchedulesDividedDescription,
    projectDescription: ProjectDescriptionDetailToJSON(
      value.projectDescription
    ),
    engineeredProject: value.engineeredProject,
    hasContingencyItems: value.hasContingencyItems,
    lienHoldbackRequiredOverride: value.lienHoldbackRequiredOverride,
    projectStartDate:
      value.projectStartDate !== null
        ? value.projectStartDate.toString()
        : null,
    projectStartDateConfirmed: UserAndDateToJSON(
      value.projectStartDateConfirmed
    ),
    pauses: value.pauses.map((inner) => ProjectPauseRecordToJSON(inner)),
    addedToAccountingSoftwareDate:
      value.addedToAccountingSoftwareDate !== null
        ? value.addedToAccountingSoftwareDate.toISOString()
        : null,
    addedToAccountingSoftwareUser: value.addedToAccountingSoftwareUser,
    addedToAccountingSoftware: UserAndDateToJSON(
      value.addedToAccountingSoftware
    ),
    quickbooksId: value.quickbooksId,
    processedForPayouts: value.processedForPayouts.map((inner) =>
      ProcessedForPayoutToJSON(inner)
    ),
    processedForPayout: UserAndDateToJSON(value.processedForPayout),
    quoteRequestCompletedBy: value.quoteRequestCompletedBy,
    completionDate:
      value.completionDate !== null ? value.completionDate.toString() : null,
    completion: UserAndDateToJSON(value.completion),
    accessRequests: value.accessRequests.map((inner) => inner),
    tags: value.tags.map((inner) => inner),
    finalInvoiceDate:
      value.finalInvoiceDate !== null
        ? value.finalInvoiceDate.toISOString()
        : null,
    unitNumber: value.unitNumber,
    anticipatedProjectValue: value.anticipatedProjectValue.toString(),
    campaign: value.campaign,
    finishScheduleDate:
      value.finishScheduleDate !== null
        ? value.finishScheduleDate.toISOString()
        : null,
    finishScheduleNotRequiredDate:
      value.finishScheduleNotRequiredDate !== null
        ? value.finishScheduleNotRequiredDate.toISOString()
        : null,
    finishScheduleContacts: value.finishScheduleContacts.map((inner) =>
      ContactDetailToJSON(inner)
    ),
    finishScheduleInitialized: value.finishScheduleInitialized,
    finishScheduleScopeOfWork: value.finishScheduleScopeOfWork,
    finishScheduleLines: value.finishScheduleLines.map((inner) =>
      FinishScheduleLineToJSON(inner)
    ),
    finishScheduleNotRequired: value.finishScheduleNotRequired,
    warrantyLength: value.warrantyLength,
    warrantyNotApplicableExplanation: value.warrantyNotApplicableExplanation,
    warrantyProjectNotes: value.warrantyProjectNotes,
    warrantyPotentialConcerns: value.warrantyPotentialConcerns,
    warrantyExclusions: value.warrantyExclusions,
    warrantyDate:
      value.warrantyDate !== null ? value.warrantyDate.toISOString() : null,
    warrantyNotRequiredDate:
      value.warrantyNotRequiredDate !== null
        ? value.warrantyNotRequiredDate.toISOString()
        : null,
    warrantyExcludeScopes: value.warrantyExcludeScopes.map((inner) => inner),
    warranties: value.warranties.map((inner) => WarrantyToJSON(inner)),
    warrantyHistory: value.warrantyHistory.map((inner) =>
      WarrantyHistoryRecordToJSON(inner)
    ),
    warrantyNotRequired: value.warrantyNotRequired,
    warrantyNotRequiredNotes: value.warrantyNotRequiredNotes.map((inner) =>
      LockedToJSON(inner)
    ),
    warrantyNotRequiredApproval: UserAndDateToJSON(
      value.warrantyNotRequiredApproval
    ),
    scheduledSiteVisits: value.scheduledSiteVisits.map((inner) =>
      ScheduledSiteVisitToJSON(inner)
    ),
    quotationRecordedLate: value.quotationRecordedLate,
    customerSurveyMissing: value.customerSurveyMissing,
    customerSurveyMissingReason: value.customerSurveyMissingReason,
  };
}

export const PROJECT_META: RecordMeta<
  Project,
  ProjectJSON,
  ProjectBrokenJSON
> & { name: "Project" } = {
  name: "Project",
  type: "record",
  repair: repairProjectJSON,
  toJSON: ProjectToJSON,
  fromJSON: JSONToProject,
  fields: {
    id: { type: "uuid" },
    recordVersion: { type: "version" },
    name: { type: "string" },
    estimateDelays: { type: "array", items: ESTIMATE_DELAY_META },
    hazmatSurveyAvailable: {
      type: "enum",
      values: ["", "yes", "no", "unknown"],
    },
    hazmatSurveyOnFile: { type: "boolean" },
    tenderDetailsProjectDetails: { type: "string" },
    tenderDue: { type: "datetime" },
    tenderDeliveryMethod: {
      type: "enum",
      values: ["", "email", "hard-copy"],
    },
    bidBondRequired: { type: "boolean" },
    bidBondType: {
      type: "enum",
      values: ["", "physical", "electronic"],
    },
    bidBidAmount: { type: "percentage" },
    consentOfSurety: { type: "boolean" },
    tenderAcceptancePeriod: { type: "string" },
    tenderEstimatedContractPrice: { type: "money" },
    tenderEstimatedStartDate: { type: "date" },
    tenderEstimateStartDate: { type: "date" },
    tenderEstimatedCompletionDate: { type: "date" },
    sharepointFolderSuffix: { type: "string" },
    sharepointFolderId: { type: "string" },
    stagingSharepointFolderId: { type: "string" },
    quoteRequestDate: { type: "datetime" },
    quoteRequiredBy: { type: "date" },
    nextMeetingDate: { type: "date" },
    customer: { type: "string" },
    customerPurchaseOrderNumber: { type: "string" },
    qualityRFQ: QUALITY_RFQ_META,
    siteAddress: ADDRESS_META,
    contacts: { type: "array", items: CONTACT_DETAIL_META },
    billingContacts: { type: "array", items: CONTACT_DETAIL_META },
    quoteRequestedBy: CONTACT_DETAIL_META,
    source: QUOTE_SOURCE_META,
    unitCount: { type: "quantity" },
    personnel: { type: "array", items: PROJECT_PERSONNEL_META },
    billingCompany: { type: "string" },
    billingAddress: ADDRESS_META,
    projectAwardDate: { type: "datetime" },
    budgetedHours: { type: "quantity" },
    anticipatedDuration: { type: "uuid", linkTo: "AnticipatedDuration" },
    anticipatedContractValue: { type: "money" },
    preferredCertifiedForemen: {
      type: "array",
      items: PREFERRED_CERTIFIED_FOREMAN_META,
    },
    otherSpecialNeeds: { type: "array", items: { type: "string" } },
    estimateDate: { type: "datetime" },
    firstQuotationDate: { type: "datetime" },
    projectNumber: { type: "serial" },
    projectNameOrNumber: { type: "string" },
    customersRequest: LOCKED_META,
    additionalCustomersRequests: { type: "array", items: LOCKED_META },
    specialInstructions: LOCKED_META,
    yearConstructed: { type: "quantity" },
    additionalSiteAddresses: { type: "array", items: ADDRESS_META },
    thirdPartySpecifierInvolved: {
      type: "uuid",
      linkTo: "ThirdPartySpecifier",
    },
    pendingQuoteHistory: {
      type: "array",
      items: PENDING_QUOTE_HISTORY_RECORD_META,
    },
    selectedQuotation: { type: "uuid", linkTo: "Quotation" },
    lastQuotation: { type: "uuid", linkTo: "Quotation" },
    projectLostDate: { type: "datetime" },
    projectLostUser: { type: "uuid", linkTo: "User> | nul" },
    competitors: { type: "array", items: COMPETITOR_DETAIL_META },
    projectLostNotes: { type: "string" },
    projectProceededWithoutRemdal: { type: "boolean" },
    season: { type: "string" },
    approvalType: { type: "uuid", linkTo: "ApprovalType" },
    contractAwardSpecialNeedsAndNotes: { type: "string" },
    contractDetailsDate: { type: "datetime" },
    projectDetailDate: { type: "datetime" },
    selectedOptions: {
      type: "array",
      items: { type: "uuid", linkTo: "Option" },
    },
    projectSchedules: { type: "array", items: PROJECT_SCHEDULE_META },
    projectContingencyItems: {
      type: "array",
      items: CONTINGENCY_ITEM_META,
    },
    projectSchedulesDividedDescription: { type: "boolean" },
    projectDescription: PROJECT_DESCRIPTION_DETAIL_META,
    engineeredProject: { type: "boolean" },
    hasContingencyItems: { type: "boolean" },
    lienHoldbackRequiredOverride: { type: "boolean?" },
    projectStartDate: { type: "date" },
    projectStartDateConfirmed: USER_AND_DATE_META,
    pauses: { type: "array", items: PROJECT_PAUSE_RECORD_META },
    addedToAccountingSoftwareDate: { type: "datetime" },
    addedToAccountingSoftwareUser: { type: "uuid", linkTo: "User" },
    addedToAccountingSoftware: USER_AND_DATE_META,
    quickbooksId: { type: "string" },
    processedForPayouts: {
      type: "array",
      items: PROCESSED_FOR_PAYOUT_META,
    },
    processedForPayout: USER_AND_DATE_META,
    quoteRequestCompletedBy: { type: "uuid", linkTo: "User" },
    completionDate: { type: "date" },
    completion: USER_AND_DATE_META,
    accessRequests: {
      type: "array",
      items: { type: "uuid", linkTo: "User" },
    },
    tags: { type: "array", items: { type: "string" } },
    finalInvoiceDate: { type: "datetime" },
    unitNumber: { type: "string" },
    anticipatedProjectValue: { type: "money" },
    campaign: { type: "uuid", linkTo: "Campaign" },
    finishScheduleDate: { type: "datetime" },
    finishScheduleNotRequiredDate: { type: "datetime" },
    finishScheduleContacts: { type: "array", items: CONTACT_DETAIL_META },
    finishScheduleInitialized: { type: "boolean" },
    finishScheduleScopeOfWork: { type: "string" },
    finishScheduleLines: {
      type: "array",
      items: FINISH_SCHEDULE_LINE_META,
    },
    finishScheduleNotRequired: { type: "string" },
    warrantyLength: {
      type: "enum",
      values: ["N/A", "2", "5"],
    },
    warrantyNotApplicableExplanation: { type: "string" },
    warrantyProjectNotes: { type: "string" },
    warrantyPotentialConcerns: { type: "string" },
    warrantyExclusions: { type: "string" },
    warrantyDate: { type: "datetime" },
    warrantyNotRequiredDate: { type: "datetime" },
    warrantyExcludeScopes: {
      type: "array",
      items: {
        type: "uuid",
        linkTo: "InvoiceOption | InvoiceContingencyItem",
      },
    },
    warranties: { type: "array", items: WARRANTY_META },
    warrantyHistory: { type: "array", items: WARRANTY_HISTORY_RECORD_META },
    warrantyNotRequired: { type: "string" },
    warrantyNotRequiredNotes: { type: "array", items: LOCKED_META },
    warrantyNotRequiredApproval: USER_AND_DATE_META,
    scheduledSiteVisits: {
      type: "array",
      items: SCHEDULED_SITE_VISIT_META,
    },
    quotationRecordedLate: { type: "boolean" },
    customerSurveyMissing: { type: "boolean" },
    customerSurveyMissingReason: { type: "string" },
  },
  userFacingKey: "projectNumber",
  functions: {
    paymentDelayDays: {
      fn: calcProjectPaymentDelayDays,
      parameterTypes: () => [PROJECT_META],
      returnType: { type: "quantity?" },
    },
    totalProjectRevenue: {
      fn: calcProjectTotalProjectRevenue,
      parameterTypes: () => [PROJECT_META],
      returnType: { type: "money" },
    },
    implFinalInvoiceDate: {
      fn: calcProjectImplFinalInvoiceDate,
      parameterTypes: () => [PROJECT_META],
      returnType: { type: "datetime" },
    },
    contingencyItemsTotal: {
      fn: calcProjectContingencyItemsTotal,
      parameterTypes: () => [PROJECT_META],
      returnType: { type: "money" },
    },
    lateQuotationMismatch: {
      fn: calcProjectLateQuotationMismatch,
      parameterTypes: () => [PROJECT_META],
      returnType: { type: "boolean" },
    },
    hasThirdPartyTender: {
      fn: calcProjectHasThirdPartyTender,
      parameterTypes: () => [PROJECT_META],
      returnType: { type: "boolean" },
    },
    certifiedForemanLacksDetailSheet: {
      fn: calcProjectCertifiedForemanLacksDetailSheet,
      parameterTypes: () => [
        PROJECT_META,
        { type: "array", items: DETAIL_SHEET_META },
      ],
      returnType: { type: "boolean" },
    },
    schedules: {
      fn: calcProjectSchedules,
      parameterTypes: () => [
        PROJECT_META,
        { type: "array", items: DETAIL_SHEET_META },
      ],
      returnType: { type: "array", items: PROJECT_SCHEDULE_META },
    },
    unacceptedUsers: {
      fn: calcProjectUnacceptedUsers,
      parameterTypes: () => [PROJECT_META],
      returnType: {
        type: "array",
        items: { type: "uuid", linkTo: "User" },
      },
    },
    hasAccessRequests: {
      fn: calcProjectHasAccessRequests,
      parameterTypes: () => [PROJECT_META],
      returnType: { type: "boolean" },
    },
    noSiteVisitScheduled: {
      fn: calcProjectNoSiteVisitScheduled,
      parameterTypes: () => [PROJECT_META],
      returnType: { type: "boolean" },
    },
    descriptionCategories: {
      fn: calcProjectDescriptionCategories,
      parameterTypes: () => [PROJECT_META],
      returnType: {
        type: "array",
        items: { type: "uuid", linkTo: "ProjectDescriptionCategory" },
      },
    },
    descriptions: {
      fn: calcProjectDescriptions,
      parameterTypes: () => [PROJECT_META],
      returnType: {
        type: "array",
        items: PROJECT_DESCRIPTION_DETAIL_META,
      },
    },
    summary: {
      fn: calcProjectSummary,
      parameterTypes: () => [PROJECT_META],
      returnType: { type: "string" },
    },
    isUnaddedToAccounting: {
      fn: calcProjectIsUnaddedToAccounting,
      parameterTypes: () => [PROJECT_META],
      returnType: { type: "boolean" },
    },
    isCertifiedForemanMissing: {
      fn: calcProjectIsCertifiedForemanMissing,
      parameterTypes: () => [PROJECT_META],
      returnType: { type: "boolean" },
    },
    lienHoldbackRequiredDefault: {
      fn: calcProjectLienHoldbackRequiredDefault,
      parameterTypes: () => [PROJECT_META],
      returnType: { type: "boolean" },
    },
    total: {
      fn: calcProjectTotal,
      parameterTypes: () => [PROJECT_META],
      returnType: { type: "money" },
    },
    lienHoldbackRequired: {
      fn: calcProjectLienHoldbackRequired,
      parameterTypes: () => [PROJECT_META],
      returnType: { type: "boolean" },
    },
    totalContractValue: {
      fn: calcProjectTotalContractValue,
      parameterTypes: () => [PROJECT_META],
      returnType: { type: "money" },
    },
    active: {
      fn: calcProjectActive,
      parameterTypes: () => [PROJECT_META],
      returnType: { type: "boolean" },
    },
    isPending: {
      fn: calcProjectIsPending,
      parameterTypes: () => [PROJECT_META],
      returnType: { type: "boolean" },
    },
    readyForPayout: {
      fn: calcProjectReadyForPayout,
      parameterTypes: () => [PROJECT_META],
      returnType: { type: "boolean" },
    },
    readyForPayoutDate: {
      fn: calcProjectReadyForPayoutDate,
      parameterTypes: () => [PROJECT_META],
      returnType: { type: "datetime" },
    },
    currentPendingQuoteStatus: {
      fn: calcProjectCurrentPendingQuoteStatus,
      parameterTypes: () => [PROJECT_META],
      returnType: PENDING_QUOTE_HISTORY_RECORD_META,
    },
    stage: {
      fn: calcProjectStage,
      parameterTypes: () => [PROJECT_META],
      returnType: {
        type: "enum",
        values: [
          "New RFQ",
          "Estimating",
          "Re-estimating",
          "Pending",
          "Lost",
          "Awarded",
          "Unscheduled",
          "Future",
          "Current",
          "On Hold",
          "Invoiced",
          "Completed",
        ],
      },
    },
    stageSort: {
      fn: calcProjectStageSort,
      parameterTypes: () => [PROJECT_META],
      returnType: { type: "string" },
    },
    isEstimatorMissing: {
      fn: calcProjectIsEstimatorMissing,
      parameterTypes: () => [PROJECT_META],
      returnType: { type: "boolean" },
    },
    isWarrantyNotRequiredUnapproved: {
      fn: calcProjectIsWarrantyNotRequiredUnapproved,
      parameterTypes: () => [PROJECT_META],
      returnType: { type: "boolean" },
    },
    finalCalculationOfPayoutDate: {
      fn: calcProjectFinalCalculationOfPayoutDate,
      parameterTypes: () => [PROJECT_META],
      returnType: { type: "datetime" },
    },
    isEstimatorAssignmentLate: {
      fn: calcProjectIsEstimatorAssignmentLate,
      parameterTypes: () => [PROJECT_META],
      returnType: { type: "boolean" },
    },
    isAcceptanceLate: {
      fn: calcProjectIsAcceptanceLate,
      parameterTypes: () => [PROJECT_META],
      returnType: { type: "boolean" },
    },
    somewhatLateThreshold: {
      fn: calcProjectSomewhatLateThreshold,
      parameterTypes: () => [PROJECT_META],
      returnType: { type: "quantity" },
    },
    lateThreshold: {
      fn: calcProjectLateThreshold,
      parameterTypes: () => [PROJECT_META],
      returnType: { type: "quantity" },
    },
    effectiveQuoteRequestDate: {
      fn: calcProjectEffectiveQuoteRequestDate,
      parameterTypes: () => [PROJECT_META],
      returnType: { type: "datetime" },
    },
    revisedQuoteRequested: {
      fn: calcProjectRevisedQuoteRequested,
      parameterTypes: () => [PROJECT_META],
      returnType: { type: "boolean" },
    },
    isEstimateDelayed: {
      fn: calcProjectIsEstimateDelayed,
      parameterTypes: () => [PROJECT_META],
      returnType: { type: "boolean" },
    },
    estimateDelayDismissed: {
      fn: calcProjectEstimateDelayDismissed,
      parameterTypes: () => [PROJECT_META],
      returnType: {
        type: "array",
        items: { type: "uuid", linkTo: "User" },
      },
    },
    estimateDelayDate: {
      fn: calcProjectEstimateDelayDate,
      parameterTypes: () => [PROJECT_META],
      returnType: { type: "datetime" },
    },
    hasActiveEstimateDelay: {
      fn: calcProjectHasActiveEstimateDelay,
      parameterTypes: () => [PROJECT_META],
      returnType: { type: "boolean" },
    },
    lastScheduledSiteVisit: {
      fn: calcProjectLastScheduledSiteVisit,
      parameterTypes: () => [PROJECT_META],
      returnType: { type: "datetime" },
    },
    hasActiveSiteVisitDelay: {
      fn: calcProjectHasActiveSiteVisitDelay,
      parameterTypes: () => [PROJECT_META],
      returnType: { type: "boolean" },
    },
    isQuoteFollowupDue: {
      fn: calcProjectIsQuoteFollowupDue,
      parameterTypes: () => [PROJECT_META],
      returnType: { type: "boolean" },
    },
    isQuoteFollowupOverDue: {
      fn: calcProjectIsQuoteFollowupOverDue,
      parameterTypes: () => [PROJECT_META],
      returnType: { type: "boolean" },
    },
    isEstimateLate: {
      fn: calcProjectIsEstimateLate,
      parameterTypes: () => [PROJECT_META],
      returnType: { type: "boolean" },
    },
    color: {
      fn: calcProjectColor,
      parameterTypes: () => [PROJECT_META],
      returnType: { type: "string" },
    },
    personnelByRole: {
      fn: calcProjectPersonnelByRole,
      parameterTypes: () => [PROJECT_META, { type: "uuid", linkTo: "Role" }],
      returnType: {
        type: "array",
        items: { type: "uuid", linkTo: "User" },
      },
    },
    acceptedPersonnelByRole: {
      fn: calcProjectAcceptedPersonnelByRole,
      parameterTypes: () => [PROJECT_META, { type: "uuid", linkTo: "Role" }],
      returnType: {
        type: "array",
        items: { type: "uuid", linkTo: "User" },
      },
    },
    quoteFollowUpDate: {
      fn: calcProjectQuoteFollowUpDate,
      parameterTypes: () => [PROJECT_META],
      returnType: { type: "date" },
    },
  },
  segments: ProjectSegments,
};

export type QuotationLateRecordJSON = {
  id: string;
  recordVersion: number | null;
  project: string | null;
  addedDateTime: string | null;
  late: boolean;
};

export function JSONToQuotationLateRecord(
  json: QuotationLateRecordJSON
): QuotationLateRecord {
  return {
    id: { uuid: json.id },
    recordVersion: { version: json.recordVersion },
    project: json.project,
    addedDateTime:
      json.addedDateTime !== null ? dateParse(json.addedDateTime) : null,
    late: json.late,
  };
}
export type QuotationLateRecordBrokenJSON = {
  id?: string;
  recordVersion?: number | null;
  project?: string | null;
  addedDateTime?: string | null;
  late?: boolean;
};

export function newQuotationLateRecord(): QuotationLateRecord {
  return JSONToQuotationLateRecord(repairQuotationLateRecordJSON(undefined));
}
export function repairQuotationLateRecordJSON(
  json: QuotationLateRecordBrokenJSON | undefined
): QuotationLateRecordJSON {
  if (json) {
    return {
      id: json.id || genUUID(),
      recordVersion:
        json.recordVersion === undefined ? null : json.recordVersion,
      project: json.project || null,
      addedDateTime: json.addedDateTime
        ? new Date(json.addedDateTime!).toISOString()
        : null,
      late: json.late || false,
    };
  } else {
    return {
      id: undefined || genUUID(),
      recordVersion: null,
      project: undefined || null,
      addedDateTime: undefined ? new Date(undefined!).toISOString() : null,
      late: undefined || false,
    };
  }
}

export function QuotationLateRecordToJSON(
  value: QuotationLateRecord
): QuotationLateRecordJSON {
  return {
    id: value.id.uuid,
    recordVersion: value.recordVersion.version,
    project: value.project,
    addedDateTime:
      value.addedDateTime !== null ? value.addedDateTime.toISOString() : null,
    late: value.late,
  };
}

export const QUOTATION_LATE_RECORD_META: RecordMeta<
  QuotationLateRecord,
  QuotationLateRecordJSON,
  QuotationLateRecordBrokenJSON
> & { name: "QuotationLateRecord" } = {
  name: "QuotationLateRecord",
  type: "record",
  repair: repairQuotationLateRecordJSON,
  toJSON: QuotationLateRecordToJSON,
  fromJSON: JSONToQuotationLateRecord,
  fields: {
    id: { type: "uuid" },
    recordVersion: { type: "version" },
    project: { type: "uuid", linkTo: "Project" },
    addedDateTime: { type: "datetime" },
    late: { type: "boolean" },
  },
  userFacingKey: null,
  functions: {},
  segments: {},
};

// END MAGIC -- DO NOT EDIT
