import { css } from "glamor";
import * as React from "react";
import { Button } from "react-bootstrap";
import { Typeahead } from "react-bootstrap-typeahead";
import { useId } from "react-id-generator";
import { doQuery, useQuery } from "../../clay/api";
import { toPattern } from "../../clay/dataGrid/patterns";
import { Link } from "../../clay/link";
import { openWindow } from "../../clay/openWindow";
import {
    statusToState,
    Widget,
    WidgetResult,
    WidgetStatus,
} from "../../clay/widgets";
import { hasPermission } from "../../permissions";
import { Company, CompanyJSON, JSONToCompany } from "../company/table";
import { useUser } from "../state";
import {
    buildCompanyDetail,
    buildContactDetail,
    calcContactDetailSummary,
    calcContactSummary,
    Contact,
    ContactDetail,
    ContactJSON,
    CONTACT_DETAIL_META,
    emptyContactDetail,
    JSONToContact,
} from "./table";

type ContactDetailWidgetState = {};

type Item = {
    contact: Contact | null;
    company: Company | null;
    name: string;
};

type ContactDetailWidgetAction =
    | {
          type: "SELECT";
          contact: Contact | null;
          company: Company | null;
      }
    | {
          type: "CLEAR";
      }
    | {
          type: "APPLY_COMPANY";
          company: Company | null;
      };

type ContactDetailWidgetProps = {
    state: ContactDetailWidgetState;
    data: ContactDetail;
    dispatch: (action: ContactDetailWidgetAction) => void;
    status: WidgetStatus;
    style?: React.CSSProperties;
    suggestions?: Link<Contact>[];
    forbiddenContactsToAdd?: Link<Contact>[];
};

const WIDGET_STYLE = css({
    "html & input.form-control": {
        border: "none",
        height: "auto",
        padding: "0px",
        cursor: "pointer",
    },
    "html & input:focus.form-control": {
        cursor: "auto",
    },
});
export async function selectForId(
    result: string
): Promise<ContactDetailWidgetAction> {
    const data = await doQuery({
        tableName: "Contact",
        columns: [".", "company.."],
        filters: [
            {
                column: "id",
                filter: {
                    equal: result,
                },
            },
        ],
    });
    return {
        type: "SELECT",
        contact:
            data.rows[0][0] === null
                ? null
                : JSONToContact(data.rows[0][0] as ContactJSON),
        company:
            data.rows[0][1] === null
                ? null
                : JSONToCompany(data.rows[0][1] as CompanyJSON),
    };
}

export function ContactDetailWidget(): Widget<
    ContactDetailWidgetState,
    ContactDetail,
    {},
    ContactDetailWidgetAction,
    {
        style?: React.CSSProperties;
        suggestions?: Link<Contact>[];
        forbiddenContactsToAdd?: Link<Contact>[];
    }
> {
    function makeLookupRequest(text: string) {
        const digits = text.replace(/\D/g, "");
        const filters = [
            {
                column: "name",
                filter: {
                    like: toPattern(text),
                },
            },
            {
                column: "email",
                filter: {
                    like: toPattern(text),
                },
            },
        ];
        if (digits) {
            filters.push({
                column: "phones.number",
                filter: {
                    like: "%" + digits + "%",
                },
            });
        }

        return {
            tableName: "Contact",
            columns: [".", "company.."],
            filters: [
                {
                    or: filters,
                },
                {
                    column: "active",
                    filter: {
                        equal: true,
                    },
                },
            ],
            sorts: ["name"],
            limit: 20,
        };
    }

    function initialize(
        data: ContactDetail,
        context: {}
    ): WidgetResult<ContactDetailWidgetState, ContactDetail> {
        return {
            data,
            state: {
                text: null,
            },
        };
    }

    return {
        dataMeta: CONTACT_DETAIL_META,
        initialize,
        component: (props: ContactDetailWidgetProps) => {
            const [text, setText] = React.useState("");
            const user = useUser();
            const lookup = useQuery(makeLookupRequest(text), [text]);

            const widgetId = useId()[0];

            const onOpenClick = React.useCallback(async () => {
                if (props.data === null) {
                    throw new Error("unreachable");
                }

                try {
                    const result = await openWindow(
                        "#/contact/edit/" + props.data.contact + "?watching"
                    );

                    if (props.status.mutable) {
                        props.dispatch(await selectForId(result));
                    }
                } catch (_error) {}
            }, [props.data, props.dispatch]);

            const [focus, setFocus] = React.useState(false);
            const onFocus = React.useCallback(() => setFocus(true), [setFocus]);
            const onBlur = React.useCallback(() => {
                //                setFocus(false);
                //                setText("");
            }, [setFocus, setText]);

            async function onChange(selected: any[]) {
                if (selected.length > 0) {
                    setFocus(false);
                    setText("");
                    const item = selected[0];
                    if (item.contact === null) {
                        try {
                            const result = await openWindow(
                                "#/contact/edit/new/?watching&name=" +
                                    encodeURIComponent(text || "")
                            );

                            const selectionAction = await selectForId(result);
                            props.dispatch(selectionAction);
                        } catch (_error) {
                            console.error(_error);
                        }
                    } else {
                        props.dispatch({
                            type: "SELECT",
                            contact: item.contact,
                            company: item.company,
                        });
                    }
                } else {
                    if (props.data.contact !== null) {
                        props.dispatch({
                            type: "SELECT",
                            contact: null,
                            company: null,
                        });
                    }
                }
            }

            const selectedText =
                props.data.contact !== null
                    ? calcContactDetailSummary(props.data)
                    : "";

            const currentItem = {
                name: text === "" ? selectedText : text,
                contact: null,
                company: null,
            };

            const items: Item[] = [];
            if (props.suggestions && text === "" && props.data === null) {
                /* TODO
                for (const item of props.suggestions) {
                    items.push(item);
                }
                */
            } else if (lookup) {
                for (const row of lookup) {
                    items.push({
                        contact: row[0] ? JSONToContact(row[0] as any) : null,
                        company: row[1] ? JSONToCompany(row[1] as any) : null,
                        name: calcContactSummary(JSONToContact(row[0] as any)),
                    });
                }
            }

            const isEmptyInvalid =
                props.status.validation[0]?.empty && props.data.contact == null;

            return (
                <div
                    style={{
                        ...props.style,
                        display: "flex",
                        position: "relative",
                    }}
                >
                    <div
                        className={
                            "form-control " +
                            statusToState(
                                props.status.validation,
                                props.data === null
                            )
                        }
                        {...WIDGET_STYLE}
                    >
                        <Typeahead
                            id={widgetId}
                            labelKey="name"
                            clearButton={false}
                            selected={[currentItem]}
                            filterBy={(record: any) => {
                                return (
                                    !props.forbiddenContactsToAdd ||
                                    props.forbiddenContactsToAdd.indexOf(
                                        record.contact?.id.uuid!
                                    ) === -1
                                );
                            }}
                            options={[
                                ...items,
                                ...(hasPermission(user, "Contact", "new")
                                    ? [
                                          {
                                              name: text + " (new)",
                                              contact: null,
                                              company: null,
                                          } as Item,
                                      ]
                                    : []),
                            ]}
                            onInputChange={setText}
                            onBlur={onBlur}
                            onFocus={onFocus}
                            onChange={onChange}
                            disabled={!props.status.mutable}
                        />
                    </div>
                    {props.data.contact && (
                        <Button onClick={onOpenClick}>Open</Button>
                    )}
                    <Button
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            zIndex: 2,
                            width: "100%",
                            pointerEvents: "none",
                            display:
                                focus || props.data.contact
                                    ? "none"
                                    : undefined,
                            border: isEmptyInvalid
                                ? "solid red 2px"
                                : undefined,
                        }}
                    >
                        Add Contact
                    </Button>
                </div>
            );
        },
        reduce: (
            state: ContactDetailWidgetState,
            data: ContactDetail,
            action: ContactDetailWidgetAction,
            context: {}
        ): WidgetResult<ContactDetailWidgetState, ContactDetail> => {
            switch (action.type) {
                case "CLEAR":
                    return {
                        state,
                        data: emptyContactDetail(),
                    };
                case "SELECT":
                    return {
                        state: {
                            ...state,
                            text: null,
                        },
                        data: buildContactDetail(
                            action.contact,
                            action.company
                        ),
                    };
                case "APPLY_COMPANY":
                    return {
                        state,
                        data: {
                            ...data,
                            company: buildCompanyDetail(action.company),
                        },
                    };
            }
        },

        validate(data: ContactDetail) {
            if (data.contact === null) {
                return [
                    {
                        invalid: false,
                        empty: true,
                    },
                ];
            } else {
                return [];
            }
        },
    };
}
