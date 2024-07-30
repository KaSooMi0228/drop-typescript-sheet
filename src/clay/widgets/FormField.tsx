import { CSSProperties } from "glamor";
import * as React from "react";
import { Form } from "react-bootstrap";
import { QuickCacheApi } from "../quick-cache";
import { RequestType } from "../requests";
import { ValidationError, Widget } from "./index";

type FormWrapperProps = {
    label: React.ReactNode;
    children: React.ReactNode;
    align?: "center" | "flex-end";
    noGrow?: boolean;
    style?: CSSProperties;
};

export function FormWrapper(props: FormWrapperProps) {
    return (
        <Form.Group
            style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                flexGrow: props.noGrow ? 0 : undefined,
                ...props.style,
            }}
        >
            <Form.Label
                style={{ alignSelf: props.align, whiteSpace: "nowrap" }}
            >
                {props.label === "" ? <>&nbsp;</> : props.label}
            </Form.Label>

            {props.children}
        </Form.Group>
    );
}

export function FormField<
    StateType,
    DataType,
    ContextType,
    ActionType,
    ExtraPropsType
>(
    meta: Widget<StateType, DataType, ContextType, ActionType, ExtraPropsType>
): Widget<
    StateType,
    DataType,
    ContextType,
    ActionType,
    ExtraPropsType & {
        align?: "center" | "flex-end";
        wrapperStyle?: CSSProperties;
    }
> {
    return {
        ...meta,
        component: (props) => (
            <FormWrapper
                label={props.label as string}
                align={props.align}
                noGrow={meta.noGrow}
                style={props.wrapperStyle}
            >
                <meta.component {...props} />
            </FormWrapper>
        ),
    };
}

export function OptionalFormField<
    StateType,
    DataType,
    ContextType,
    ActionType,
    ThisRequestType extends RequestType<{}, {}, {}>,
    ExtraPropsType
>(
    meta: Widget<StateType, DataType, ContextType, ActionType, ExtraPropsType>
): Widget<StateType, DataType, ContextType, ActionType, ExtraPropsType> {
    const base = FormField(meta);
    return {
        ...base,
        validate: (data: DataType, cache: QuickCacheApi): ValidationError[] => {
            return base.validate(data, cache).filter((error) => error.invalid);
        },
    };
}

export function Optional<
    StateType,
    DataType,
    ContextType,
    ActionType,
    ThisRequestType extends RequestType<{}, {}, {}>,
    ExtraPropsType
>(
    meta: Widget<StateType, DataType, ContextType, ActionType, ExtraPropsType>
): Widget<StateType, DataType, ContextType, ActionType, ExtraPropsType> {
    const base = meta;
    return {
        ...base,
        validate: (data: DataType, cache: QuickCacheApi): ValidationError[] => {
            return base.validate(data, cache).filter((error) => error.invalid);
        },
    };
}
export function Readonly<
    StateType,
    DataType,
    ContextType,
    ActionType,
    ThisRequestType extends RequestType<{}, {}, {}>,
    ExtraPropsType
>(
    meta: Widget<StateType, DataType, ContextType, ActionType, ExtraPropsType>
): Widget<StateType, DataType, ContextType, ActionType, ExtraPropsType> {
    const base = meta;
    return {
        ...base,
        component(props) {
            return base.component({
                ...props,
                status: {
                    ...props.status,
                    mutable: false,
                },
            });
        },
    };
}
