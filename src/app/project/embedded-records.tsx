import {
    faCalendarAlt,
    faFileExcel,
    faLock,
    faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { diff } from "jsondiffpatch";
import { find } from "lodash";
import React from "react";
import { Alert, Button, Pagination } from "react-bootstrap";
import ReactModal from "react-modal";
import RelativePortal from "react-relative-portal";
import {
    deleteRecord,
    fetchRawRecord,
    generateDocument,
    localPatchRecord,
    patchRecord,
} from "../../clay/api";
import { Dictionary } from "../../clay/common";
import { Editable, useEditableContext } from "../../clay/edit-context";
import { RecordMeta } from "../../clay/meta";
import { PageContext } from "../../clay/Page";
import {
    PaginatedWidgetAction,
    PaginatedWidgetState,
    PaginatedWidgetType,
} from "../../clay/paginated-widget";
import { QuickCacheApi, useQuickCache } from "../../clay/quick-cache";
import { UUID } from "../../clay/uuid";
import { Version } from "../../clay/version";
import { RecordContext, subStatus, WidgetStatus } from "../../clay/widgets";
import { hasPermission } from "../../permissions";
import { SERVICE } from "../service";
import { useUser } from "../state";

const DateTimePicker = require("react-datetime-picker");

export type EmbeddedRecordStateContext = {};

export type EmbeddedRecordState<DataType> = {
    data: DataType;
    state: PaginatedWidgetState<DataType, EmbeddedRecordStateContext>;
} | null;

export type EmbeddedRecordStateAction<DataType> =
    | {
          type: "DISPATCH";
          action: PaginatedWidgetAction<DataType>;
      }
    | {
          type: "CLOSE";
      }
    | {
          type: "LOAD";
          data: DataType;
      }
    | {
          type: "SELECT_TAB";
          tab: string;
      };

export function initializeEmbeddedRecordState<DataType extends { id: UUID }>(
    widget: PaginatedWidgetType<DataType, EmbeddedRecordStateContext>,
    data: DataType,
    context: EmbeddedRecordStateContext,
    new_record: boolean
): EmbeddedRecordState<DataType> {
    return {
        ...widget.initialize(data, context),
    };
}

export function embededRecordStateReduce<DataType>(
    widget: PaginatedWidgetType<DataType, EmbeddedRecordStateContext>,
    state: EmbeddedRecordState<DataType>,
    action: EmbeddedRecordStateAction<DataType>,
    context: EmbeddedRecordStateContext
): EmbeddedRecordState<DataType> {
    switch (action.type) {
        case "DISPATCH": {
            return {
                ...widget.reduce(
                    state!.state,
                    state!.data,
                    action.action,
                    context
                ),
            };
        }
        case "LOAD":
            return {
                ...widget.initialize(action.data, context),
            };
        case "CLOSE":
            return null;
        case "SELECT_TAB": {
            return {
                ...widget.reduce(
                    state!.state,
                    state!.data,
                    {
                        type: "SELECT_TAB",
                        pageId: action.tab,
                    },
                    context
                ),
            };
        }
    }
}

export type EmbeddedRecordStateOptions<DataType> = {
    preSave?: (data: DataType, detail: string, user_id: string) => void;
    preDelete?: (data: DataType) => void;
    process?: (
        data: DataType,
        cache: QuickCacheApi,
        detail: string,
        user_id: string
    ) => DataType;
    extra?: any;
    locked: (data: DataType) => boolean;
    unlock: (data: DataType) => DataType;
    mayCancel: (data: DataType) => boolean;
    mayUnlock?: (data: DataType) => boolean;
    canUnlock?: (data: DataType) => boolean;
    generateRequests: (
        data: DataType,
        cache: QuickCacheApi,
        detail: string
    ) => {
        template: string;
        parameters?: string[];
    }[];
};

const MODAL_STYLE = {
    content: {
        maxHeight: "13em",
        maxWidth: "40em",
        top: "50%",
        left: "50%",
        right: "auto",
        bottom: "auto",
        marginRight: "-50%",
        transform: "translate(-50%,-50%)",
    },
};

function RedateForm(props: {
    date: Date | null;
    updateDate: (date: Date | null) => void;
    stopRedating: () => void;
}) {
    const [date, setDate] = React.useState(props.date);

    return (
        <ReactModal
            isOpen={true}
            style={MODAL_STYLE}
            onRequestClose={props.stopRedating}
        >
            <Alert variant="danger">
                You are overriding an automatic timestamp. You should not
                ordinarily do this.
            </Alert>
            <RelativePortal className="relative-portal redate-form">
                <DateTimePicker.default
                    value={date}
                    onChange={setDate}
                    calendarType="US"
                />
            </RelativePortal>
            <div
                style={{
                    display: "flex",
                    marginTop: "4em",
                    justifyContent: "space-between",
                }}
            >
                <Button
                    variant="danger"
                    onClick={() => {
                        props.updateDate(date);
                    }}
                >
                    Override
                </Button>
            </div>
        </ReactModal>
    );
}

type Exporter = {
    export: () => void;
};

const EMBEDDED_RECORD_CONTEXT = React.createContext<
    null | ((exporter: Exporter) => void)
>(null);

export function useDefineExport(onExport: () => void) {
    const context = React.useContext(EMBEDDED_RECORD_CONTEXT)!;
    const exporter = React.useMemo(
        () => ({
            export: onExport,
        }),
        [onExport]
    );
    context(exporter);
}

type AutoSaverOptions<DataType, JsonType> = {
    meta: RecordMeta<DataType, JsonType, unknown>;
    id?: string;
    onLoad: (x: DataType) => void;
};

function useAutoSaver<DataType, JsonType>(
    options: AutoSaverOptions<DataType, JsonType>
): [(d: DataType) => Promise<void>, (d: DataType) => Promise<void>, boolean] {
    const [flag, setFlag] = React.useState(true);
    return React.useMemo(() => {
        if (!options.id) {
            return [
                async (x: DataType) => {},
                async (x: DataType) => {},
                false,
            ];
        }

        let previousRecord: any = undefined;
        let autoSaving = true;

        async function lifecycle() {
            const loadedRecord = await fetchRawRecord(
                options.meta,
                options.id!
            );

            if (loadedRecord) {
                previousRecord = loadedRecord;
                options.onLoad(options.meta.fromJSON(previousRecord));
            } else {
                previousRecord = options.meta.repair({ id: options.id });
            }

            autoSaving = false;
            setFlag(false);
        }

        lifecycle();

        async function update(data: DataType) {
            if (autoSaving) {
                return;
            }
            autoSaving = true;
            setFlag(true);

            const jsonRecord = options.meta.toJSON(data);
            const patch = diff(previousRecord, jsonRecord);
            if (patch !== undefined) {
                await localPatchRecord(
                    options.meta,
                    "Project",
                    options.id!,
                    patch
                );
                previousRecord = jsonRecord;
            }
            setFlag(false);
            autoSaving = false;
        }

        async function finalUpdate(data: DataType) {
            while (autoSaving) {
                await new Promise((resolve, reject) =>
                    setTimeout(resolve, 100)
                );
            }
            autoSaving = true;
            setFlag(true);

            const jsonRecord = options.meta.toJSON(data);
            const patch = diff(previousRecord, jsonRecord);
            if (patch !== undefined) {
                await patchRecord(options.meta, "Project", options.id!, patch);
            }
            autoSaving = false;
            setFlag(false);
        }

        return [update, finalUpdate, autoSaving];
    }, [options.meta, options.id]);
}

export function useEmbeddedRecordState<
    DataType extends { id: UUID; recordVersion: Version }
>(
    widget: PaginatedWidgetType<DataType, EmbeddedRecordStateContext>,
    state: EmbeddedRecordState<DataType>,
    dispatch: (action: EmbeddedRecordStateAction<DataType>) => void,
    status: WidgetStatus,
    options: EmbeddedRecordStateOptions<DataType>
) {
    const cache = useQuickCache();
    const pages = React.useMemo(
        () => (state ? widget.config.pages(state.data) : null),
        [widget, state?.data]
    );
    const page = find(pages, (page) => page.id === state?.state?.currentPageId);

    const locked =
        state != null &&
        (!status.mutable || (options.locked && options.locked(state.data)));
    const disableActions = !status.mutable;
    status = {
        ...status,
        mutable: status.mutable && (page?.admin ? true : !locked),
    };

    const processed = React.useMemo(
        () =>
            widget.config.process && state
                ? widget.config.process(
                      state.data,
                      cache,
                      state.state.currentPageId,
                      options.extra
                  )
                : null,
        [cache, state?.data, state?.state?.currentPageId, options.extra]
    );

    React.useEffect(() => {
        if (processed) {
            dispatch({
                type: "DISPATCH",
                action: {
                    type: "REBUILD",
                    data: processed,
                },
            });
        }
    }, [processed, dispatch]);

    const onClickUnlock = React.useCallback(() => {
        if (
            options.unlock &&
            state &&
            confirm("Are you sure you want to unlock?")
        ) {
            dispatch({
                type: "DISPATCH",
                action: {
                    type: "REBUILD",
                    data: options.unlock(state.data),
                },
            });
        }
    }, [options.unlock, state?.data, dispatch]);

    const widgetDispatch = React.useCallback(
        (action: PaginatedWidgetAction<DataType>) => {
            dispatch({
                type: "DISPATCH",
                action,
            });
        },
        [dispatch]
    );

    const [recordState, setRecordState] = React.useState("");

    const [update, finalUpdate, saveReady] = useAutoSaver({
        meta: widget.dataMeta,
        id: state?.data.id.uuid,
        onLoad(record) {
            dispatch({
                type: "LOAD",
                data: record,
            });
        },
    });

    React.useEffect(() => {
        if (state) {
            update(state.data);
        }
    }, [state?.data, saveReady]);

    const [badPatch, setBadPatch] = React.useState(false);

    React.useEffect(() => {
        const callback = (message: any) => {
            if (
                message.type == "ERROR" &&
                message.status == "BAD_PATCH" &&
                message.tableName == widget.dataMeta.name &&
                message.recordId == state?.data.id.uuid
            ) {
                setBadPatch(true);
            }
        };
        SERVICE.addListener("message", callback);
        return () => {
            SERVICE.removeListener("message", callback);
        };
    }, [widget.dataMeta.name, state?.data.id.uuid, setBadPatch]);

    const accessible: Dictionary<boolean> = {};
    let widgetStatus: WidgetStatus | undefined;
    let hasErrors = false;

    if (state != null) {
        const validation = widget.validate(state.data, cache);
        widgetStatus = {
            ...status,
            validation,
        };

        let finished = true;
        for (const somePage of pages!) {
            accessible[somePage.id] = finished;
            if (
                (!somePage.admin || page == somePage) &&
                finished &&
                widgetStatus.mutable &&
                subStatus(widgetStatus, somePage.id).validation.length > 0
            ) {
                finished = false;
                hasErrors = true;
            }
        }
    }

    const editableContext = useEditableContext();
    const processData = React.useCallback(
        async (data, detail) => {
            if (!locked || detail) {
                data = options.process
                    ? options.process(data, cache, detail, user.id)
                    : state!.data!;
                if (options.preSave) {
                    options.preSave(data, detail, user.id);
                }

                if (editableContext.save) {
                    editableContext.save.onClick(null);
                }

                setRecordState("saving");
                await finalUpdate(data);
                setRecordState("saved");
            }

            for (const request of options.generateRequests(
                data,
                cache,
                detail
            )) {
                generateDocument(
                    request.template,
                    [state!.data.id.uuid, ...(request.parameters || [])],
                    !locked
                );
            }

            dispatch({
                type: "CLOSE",
            });
        },
        [widget, state?.data, editableContext.save, finalUpdate]
    );

    const onClickGenerate = React.useCallback(
        (detail) => {
            processData(state!.data, detail);
        },
        [processData]
    );

    const onClickDelete = React.useCallback(async () => {
        if (
            confirm(
                options.mayCancel(state!.data)
                    ? "Are you sure you want to cancel this form? If you say YES, all entered data will be lost."
                    : "Are you sure you want to delete?"
            )
        ) {
            setRecordState("deleting");
            if (options.preDelete) {
                options.preDelete(state!.data);
            }
            await deleteRecord(widget.dataMeta, "Project", state!.data.id.uuid);
            setRecordState("deleted");
            dispatch({
                type: "CLOSE",
            });
        }
    }, [state?.data, setRecordState, dispatch]);

    const isBusy = recordState === "saving" || recordState === "deleting";
    const user = useUser();

    const subDispatch = React.useCallback(
        (action) =>
            widgetDispatch({
                type: "PAGE",
                pageId: state!.state.currentPageId,
                action,
            }),
        [state?.state.currentPageId, widgetDispatch]
    );

    const [onExport, setOnExport] = React.useState<null | Exporter>(null);
    const mainComponent = state && page && (
        <RecordContext meta={widget.dataMeta} value={state.data}>
            <EMBEDDED_RECORD_CONTEXT.Provider value={setOnExport}>
                <Editable
                    generate={
                        hasPermission(user, widget.dataMeta.name, "write")
                            ? {
                                  onClick: onClickGenerate,
                                  disabled:
                                      hasErrors ||
                                      isBusy ||
                                      (editableContext.print?.disabled ??
                                          false),
                                  active: recordState === "saving",
                                  completed: recordState === "saved",
                              }
                            : undefined
                    }
                    delete={{
                        onClick: onClickDelete,
                        disabled:
                            isBusy ||
                            !widgetStatus?.mutable ||
                            !hasPermission(
                                user,
                                widget.dataMeta.name,
                                "delete"
                            ) ||
                            !(
                                options.mayCancel(state.data) ||
                                hasPermission(
                                    user,
                                    widget.dataMeta.name,
                                    "delete-nocancel"
                                )
                            ),
                        active: recordState === "deleting",
                        completed: recordState === "deleted",
                        label: options.mayCancel(state.data)
                            ? "Cancel"
                            : "Delete",
                    }}
                >
                    {badPatch && (
                        <ReactModal
                            isOpen={true}
                            style={{
                                content: {
                                    zIndex: 200,
                                    width: "20em",
                                    height: "20em",
                                    top: "50%",
                                    left: "50%",
                                    right: "auto",
                                    bottom: "auto",
                                    marginRight: "-50%",
                                    transform: "translate(-50%, -50%)",
                                    textAlign: "center",
                                },
                            }}
                        >
                            <Alert variant="danger">
                                There was a problem saving your data. Please
                                refresh and try again.
                            </Alert>
                        </ReactModal>
                    )}
                    {processed === undefined ? (
                        <FontAwesomeIcon icon={faSpinner} spin />
                    ) : (
                        <page.widget.component
                            state={state.state.currentPageState}
                            data={state.data!}
                            dispatch={subDispatch}
                            status={subStatus(
                                widgetStatus!,
                                state.state.currentPageId
                            )}
                        />
                    )}
                </Editable>
            </EMBEDDED_RECORD_CONTEXT.Provider>
        </RecordContext>
    );

    const canUnlock =
        locked &&
        (!options.canUnlock || options.canUnlock(state!.data)) &&
        (hasPermission(user, widget.dataMeta.name, "unlock") ||
            (options.mayUnlock &&
                state != null &&
                options.mayUnlock(state.data)));

    const [redating, setRedating] = React.useState(false);

    const startRedating = React.useCallback(() => {
        setRedating(true);
    }, [setRedating]);

    const stopRedating = React.useCallback(() => {
        setRedating(false);
    }, [setRedating]);

    const updateDate = React.useCallback(
        async (date) => {
            setRedating(false);
            processData(
                {
                    ...state!.data,
                    date: date,
                },
                "redate"
            );
        },
        [dispatch, state, setRedating]
    );

    const tabs = (
        <>
            {redating && (
                <RedateForm
                    updateDate={updateDate}
                    stopRedating={stopRedating}
                    date={(state?.data as any)?.date || null}
                />
            )}
            {(pages || [])
                .filter(
                    (page) =>
                        !page.admin ||
                        hasPermission(user, widget.dataMeta.name, "admin")
                )
                .map((page) => (
                    <Pagination.Item
                        key={page.id}
                        disabled={!accessible[page.id]}
                        active={
                            !!state && page.id === state.state.currentPageId
                        }
                        onClick={() => {
                            dispatch({
                                type: "SELECT_TAB",
                                tab: page.id,
                            });
                        }}
                    >
                        {typeof page.title === "string"
                            ? page.title
                            : page.title(cache)}
                    </Pagination.Item>
                ))}
            {onExport && (
                <Pagination.Item className="lock-button">
                    <Button size="sm" onClick={onExport.export}>
                        <FontAwesomeIcon icon={faFileExcel} />
                    </Button>
                </Pagination.Item>
            )}
            {canUnlock && (
                <Pagination.Item className="lock-button">
                    <Button
                        size="sm"
                        onClick={onClickUnlock}
                        disabled={disableActions}
                    >
                        <FontAwesomeIcon icon={faLock} />
                    </Button>
                </Pagination.Item>
            )}
            {(locked || !hasErrors) &&
                state &&
                hasPermission(user, widget.dataMeta.name, "date-change") && (
                    <Pagination.Item className="lock-button">
                        <Button
                            size="sm"
                            onClick={startRedating}
                            disabled={disableActions}
                        >
                            <FontAwesomeIcon icon={faCalendarAlt} />
                        </Button>
                    </Pagination.Item>
                )}
        </>
    );

    return { mainComponent, tabs };
}

export type InternalStateOptions = {
    locked?: boolean;
    unlockAction?: () => void;
    extra?: any;
};

export function useInternalRecordState<
    DataType extends { id: UUID; recordVersion: Version }
>(
    widget: PaginatedWidgetType<DataType, PageContext>,
    data: DataType,
    state: PaginatedWidgetState<DataType, PageContext> | null,
    dispatch: (action: PaginatedWidgetAction<DataType>) => void,
    status: WidgetStatus,
    options: InternalStateOptions = {}
) {
    const cache = useQuickCache();
    const pages = React.useMemo(
        () => (state ? widget.config.pages(data) : null),
        [widget, data]
    );
    const page = find(pages, (page) => page.id === state?.currentPageId);

    const processed = React.useMemo(
        () =>
            widget.config.process && state && status.mutable
                ? widget.config.process(
                      data,
                      cache,
                      state.currentPageId,
                      options.extra
                  )
                : null,
        [cache, data, state?.currentPageId]
    );

    React.useEffect(() => {
        if (processed) {
            dispatch({
                type: "REBUILD",
                data: processed,
            });
        }
    }, [processed, dispatch]);

    const widgetDispatch = dispatch;

    const accessible: Dictionary<boolean> = {};
    let widgetStatus: WidgetStatus | undefined;
    let hasErrors = false;

    if (state != null) {
        const validation = widget.validate(data, cache);
        widgetStatus = {
            ...status,
            validation,
        };

        if (options.locked) {
            widgetStatus = {
                ...widgetStatus,
                mutable: false,
            };
        }

        let finished = true;
        for (const somePage of pages!) {
            accessible[somePage.id] = finished;
            if (
                (!somePage.admin || page == somePage) &&
                finished &&
                widgetStatus.mutable &&
                subStatus(widgetStatus, somePage.id).validation.length > 0
            ) {
                finished = false;
                hasErrors = true;
            }
        }
    }

    const user = useUser();

    const clickUnlock = React.useCallback(() => {
        if (options.unlockAction) {
            options.unlockAction();
        }
    }, [options.unlockAction]);

    const mainComponent = state && page && (
        <page.widget.component
            state={state.currentPageState}
            data={data!}
            dispatch={(action) =>
                widgetDispatch({
                    type: "PAGE",
                    pageId: state.currentPageId,
                    action,
                })
            }
            status={subStatus(widgetStatus!, state.currentPageId)}
        />
    );

    const tabs = state && (
        <>
            {(pages || [])
                .filter(
                    (page) =>
                        !page.admin ||
                        hasPermission(user, widget.dataMeta.name, "admin")
                )
                .map((page) => (
                    <Pagination.Item
                        key={page.id}
                        disabled={!accessible[page.id]}
                        active={!!state && page.id === state.currentPageId}
                        onClick={() => {
                            dispatch({
                                type: "SELECT_TAB",
                                pageId: page.id,
                            });
                        }}
                    >
                        {typeof page.title === "string"
                            ? page.title
                            : page.title(cache)}
                    </Pagination.Item>
                ))}
            {options.locked && options.unlockAction && (
                <Pagination.Item className="lock-button">
                    <Button size="sm" onClick={clickUnlock}>
                        <FontAwesomeIcon icon={faLock} />
                    </Button>
                </Pagination.Item>
            )}
        </>
    );

    return { mainComponent, tabs };
}

type DatedRecord = {
    firstDate: Date | null;
    date: Date | null;
};

export const DATED_EMBEDDED = {
    process<T extends DatedRecord>(
        record: T,
        cache: QuickCacheApi,
        detail: string
    ) {
        let date = new Date();
        if (detail.startsWith("backdate-")) {
            date = new Date(parseInt(detail.substring(9), 10), 10, 30);
        }

        return {
            ...record,
            firstDate: record.firstDate || date,
            date: record.date || date,
        };
    },
    locked<T extends DatedRecord>(record: T) {
        return record.date !== null;
    },
    unlock<T extends DatedRecord>(record: T) {
        return {
            ...record,
            date: null,
        };
    },
    mayCancel<T extends DatedRecord>(record: T) {
        return record.firstDate === null;
    },
};
