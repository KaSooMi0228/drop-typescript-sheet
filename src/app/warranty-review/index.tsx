import * as React from "react";
import { Button, ModalBody } from "react-bootstrap";
import Modal from "react-modal";
import { generateDocument, storeRecord } from "../../clay/api";
import { GridWithEditor } from "../../clay/dataGrid/gridWithEditor";
import { OpenButton } from "../../clay/openButton";
import { useQuickRecord } from "../../clay/quick-cache";
import { TableWidgetPage } from "../../clay/TableWidgetPage";
import { FormWrapper } from "../../clay/widgets/FormField";
import { useLocalFieldWidget } from "../inbox/useLocalWidget";
import ModalHeader from "../ModalHeader";
import { ProjectLinkWidget } from "../project/link";
import { PROJECT_META } from "../project/table";
import {
    buildWarrantyReview,
    WarrantyReview,
    WARRANTY_REVIEW_META,
} from "./table";
import WarrantyReviewTemplateWidget from "./WarrantyReviewTemplateWidget.widget";
import WarrantyReviewWidget from "./WarrantyReviewWidget.widget";

function NewWarrantyReviewWidget(props: { onRequestClose: () => void }) {
    const projectWidget = useLocalFieldWidget(ProjectLinkWidget, null, {});

    const project = useQuickRecord(PROJECT_META, projectWidget.data);

    const onNew = React.useCallback(async () => {
        if (!project) {
            return;
        }
        const newWarrantyReview = buildWarrantyReview(project);
        await storeRecord(
            WARRANTY_REVIEW_META,
            "warranty-reviews",
            newWarrantyReview
        );
        window.open("#/warranty-review/edit/" + newWarrantyReview.id.uuid);
        props.onRequestClose();
    }, [project, props.onRequestClose]);

    return (
        <Modal isOpen={true} onRequestClose={props.onRequestClose}>
            <ModalHeader>New Warranty Review</ModalHeader>
            <ModalBody>
                <FormWrapper label="Select Project">
                    {projectWidget.component}
                </FormWrapper>
                <Button onClick={onNew} disabled={!project}>
                    New Warranty Review
                </Button>
            </ModalBody>
        </Modal>
    );
}

export const WarrantyReviewsPage = GridWithEditor({
    prefix: "#/warranty-review",
    newTitle: "New Project",
    meta: WarrantyReviewWidget,
    makeContext: (context) => context,
    fallbackSorts: ["project.projectNumber"],
    colorColumn: "color",
    colorAppliedColumn: "stage",
    title: (record: WarrantyReview) => {
        return "Warranty Review";
    },
    locked: (project: WarrantyReview) => {
        return false;
    },
    actionCellWidth: 200,
    topActionCell: () => {
        const [isOpen, setOpen] = React.useState(false);

        return (
            <>
                {isOpen && (
                    <NewWarrantyReviewWidget
                        onRequestClose={() => setOpen(false)}
                    />
                )}
                <Button
                    onClick={() => setOpen(true)}
                    variant="primary"
                    size="sm"
                    style={{
                        width: "160px",
                        fontSize: "14pt",
                        marginLeft: "auto",
                        marginRight: "auto",
                    }}
                >
                    Add New Warranty Review
                </Button>
            </>
        );
    },
    print: async (project, printTemplate, printParameters, sendEmails) => {
        await generateDocument(printTemplate, printParameters, sendEmails);
    },
    extraColumns: ["project.projectNumber"],
    actionCell: ([id, number]) => (
        <div style={{ textAlign: "center" }}>
            <OpenButton
                href={"#/warranty-review/edit/" + id}
                variant="primary"
                size="sm"
                style={{
                    width: "80px",
                    height: "24px",
                    padding: "0px",
                }}
            >
                Dropsheet
            </OpenButton>
            <Button
                variant="warning"
                size="sm"
                onClick={() => window.open("/server/project-files/" + number)}
                style={{
                    marginLeft: "2px",
                    width: "84px",
                    height: "24px",
                    padding: "0px",
                }}
            >
                SharePoint
            </Button>
        </div>
    ),
    disableFinish: true,
});

export const WarrantyReviewsTemplatePage = TableWidgetPage({
    meta: WarrantyReviewTemplateWidget,
    makeContext: (context) => context,
    title: () => "Warranty Review Template",
});
