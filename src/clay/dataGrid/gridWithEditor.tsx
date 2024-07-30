import * as React from "react";
import DataGridPage from "../dataGrid/DataGridPage";
import { OpenButton } from "../openButton";
import { RouterPage } from "../router-page";
import { FilterDetail, UserPermissions } from "../server/api";
import { TableWidgetOptions, TableWidgetPage } from "../TableWidgetPage";
import { UUID } from "../uuid";
import { BulkAction } from "./DataGrid";

export type GridWithEditorOptions<
    StateType,
    DataType extends { id: UUID },
    ContextType,
    ActionType,
    JsonType,
    BrokenJsonType
> = {
    prefix: string;
    newTitle?: string;
    fallbackSorts: Array<string>;
    colorColumn?: string;
    colorAppliedColumn?: string;
    textColorColumn?: string;
    bulkActions?: BulkAction[];
    extraFilters?: (user: UserPermissions) => FilterDetail[];
    actionCell?: (values: Array<{} | null>) => React.ReactElement<{}>;
    topActionCell?: () => React.ReactElement<{}>;
    extraColumns?: string[];
    actionCellWidth?: number;
} & TableWidgetOptions<
    StateType,
    DataType,
    ContextType,
    ActionType,
    JsonType,
    BrokenJsonType
>;

export function GridWithEditor<
    StateType,
    DataType extends { id: UUID },
    ContextType,
    ActionType,
    JsonType,
    BrokenJsonType
>(
    options: GridWithEditorOptions<
        StateType,
        DataType,
        ActionType,
        ContextType,
        JsonType,
        BrokenJsonType
    >
) {
    return RouterPage({
        browse: DataGridPage({
            table: options.meta.dataMeta.name,
            fallbackSorts: options.fallbackSorts,
            colorColumn: options.colorColumn,
            textColorColumn: options.textColorColumn,
            colorAppliedColumn: options.colorAppliedColumn,
            bulkActions: options.bulkActions,
            extraFilters: options.extraFilters,
            extraColumns: options.extraColumns,
            topActionCell:
                options.topActionCell ||
                (() => {
                    return (
                        <OpenButton
                            href={options.prefix + "/edit/new"}
                            variant="primary"
                            size="sm"
                            style={{
                                width: "80px",
                                fontSize: "14pt",
                            }}
                        >
                            {options.newTitle || "New"}
                        </OpenButton>
                    );
                }),
            actionCell:
                options.actionCell ||
                (([id]) => {
                    return (
                        <div style={{ textAlign: "center" }}>
                            <OpenButton
                                href={options.prefix + "/edit/" + id}
                                variant="primary"
                                size="sm"
                                style={{
                                    width: "80px",
                                    height: "24px",
                                    padding: "0px",
                                }}
                            >
                                Open
                            </OpenButton>
                        </div>
                    );
                }),
            actionCellWidth: options.actionCellWidth || 100,
        }),
        edit: TableWidgetPage(options),
    });
}
