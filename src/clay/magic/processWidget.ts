import { constantCase } from "change-case";
import { some } from "lodash";
import {
    CodeBlockWriter,
    ImportSpecifierStructure,
    Node,
    Project,
    SourceFile,
} from "ts-morph";
import { Dictionary } from "../common";
import { titleCase } from "../title-case";
import bail from "./bail";
import { Processor } from "./Processor";

type ItemDef = {
    widget: string;
    data: string;
    data_update: string;
    state_type: string;
    state_update: string;
    tab: boolean;
    validate: boolean;
    subaction: string;
    reduce: string;
    initialize: string;
    extra_actions: {
        name: string;
        type: string;
        impl: string;
    }[];
    add_widget: boolean;
    embed_options_type?: string;
    embed_hook?: string;
    embed_data?: boolean;
};

type PartialItemDef = {
    container: string;
    name: string;
    data: string;
    data_update: string;
    state_update: string;
    tab: boolean;
    validate: boolean;
    state_type?: string;
    add_widget: boolean;
    subaction?: string;
    reduce?: string;
    initialize?: string;
    extra_actions?: {
        name: string;
        type: string;
        impl: string;
    }[];
    embed_options_type?: string;
    embed_hook?: string;
    embed_data?: boolean;
};

function itemDef(def: PartialItemDef): ItemDef {
    const widget = def.container + "." + def.name;
    const widgetType = "typeof " + widget;

    const subaction = def.subaction || `WidgetAction<${widgetType}>`;

    return {
        widget: def.container + "." + def.name,
        data: def.data,
        data_update: def.data_update,
        subaction: subaction,
        extra_actions: def.extra_actions || [],
        tab: def.tab,
        validate: def.validate,
        state_update: def.state_update,
        embed_data: def.embed_data,
        reduce:
            def.reduce ||
            `${widget}.reduce(state.${def.name}, ${def.data}, action.action, subcontext)`,
        state_type:
            def.state_type ||
            `WidgetState<typeof ${def.container}.${def.name}>`,
        add_widget: def.add_widget,
        initialize:
            def.initialize ||
            `${widget}.initialize(${def.data}, subcontext, subparameters.${def.name})`,
        embed_options_type: def.embed_options_type,
        embed_hook: def.embed_hook,
    };
}

function itemMember(name: string): ItemDef {
    return itemDef({
        container: "Fields",
        name,
        data: "data." + name,
        state_update: "inner.state",
        data_update: `{...data, ${name}: inner.data}`,
        validate: true,
        tab: false,
        add_widget: true,
    });
}

function itemEmbed(name: string): ItemDef {
    return itemDef({
        container: "Embedded",
        name,
        state_update: "inner",
        state_type: `EmbeddedRecordState<WidgetData<typeof Embedded.${name}>>`,
        subaction: `EmbeddedRecordStateAction<WidgetData<typeof Embedded.${name}>>`,
        extra_actions: [
            {
                name: `OPEN_${constantCase(name)}`,
                type: `${name}: WidgetData<typeof Embedded.${name}>`,
                impl: `return {state: {...state, ${name}: initializeEmbeddedRecordState(
                                                Embedded.${name},
                                                action.${name},
                                                context,
                                                false
                                            )}, data};`,
            },
        ],
        reduce: `embededRecordStateReduce(
                                                Embedded.${name},
                                                state.${name},
                                                action.action,
                                                context
                                            )`,

        tab: true,
        validate: false,
        data: "#$%@#$",
        data_update: "data",
        add_widget: false,
        initialize: "null",
        embed_options_type: `EmbeddedRecordStateOptions<WidgetData<typeof Embedded.${name}>>`,
        embed_hook: "useEmbeddedRecordState",
    });
}

function itemInternal(name: string): ItemDef {
    return itemDef({
        container: "Internal",
        embed_data: true,
        name,
        state_update: "inner.state",
        state_type: `PaginatedWidgetState<WidgetData<typeof Internal.${name}>,{}> | null`,
        subaction: `PaginatedWidgetAction<WidgetData<typeof Internal.${name}>>`,
        extra_actions: [
            {
                name: `OPEN_${constantCase(name)}`,
                type: ``,
                impl: `const inner = Internal.${name}.initialize(
                                                data,
                                                context,
                                            ); return {state: {...state, ${name}: inner.state}, data: inner.data};`,
            },
        ],
        reduce: `Internal.${name}.reduce(
                                                state.${name}!, data,
                                                action.action,
                                                context
                                            )`,

        tab: true,
        validate: false,
        data: "data",
        data_update: "inner.data",
        add_widget: false,
        initialize: "{state: null, data}",
        embed_options_type: `InternalStateOptions`,
        embed_hook: "useInternalRecordState",
    });
}

function itemSub(name: string): ItemDef {
    return itemDef({
        container: "Subs",
        name,
        state_update: "inner.state",
        data: "data",
        data_update: "inner.data",
        validate: true,
        tab: false,
        add_widget: true,
    });
}

function extractMembers(source: SourceFile) {
    const node = source.getTypeAlias("Data");
    if (!node) {
        throw bail(source, "Expected Data");
    }

    const typeNode = node.getTypeNode();
    if (!typeNode) {
        throw bail(node, "Missing TypeNode");
    }

    if (!Node.isTypeReference(typeNode)) {
        throw bail(node, "Expected a TypeReferenceNode");
    }

    const typeNameNode = typeNode.getTypeName();

    if (!Node.isIdentifier(typeNameNode)) {
        throw bail(typeNameNode, "Expected an Identifier");
    }

    let members: string[] = [];
    let embeddeds: string[] = [];
    let internals: string[] = [];
    let subs: string[] = [];
    const names: Set<string> = new Set();

    for (const declarationLists of node
        .getSourceFile()
        .getVariableStatements()) {
        for (const declaration of declarationLists.getDeclarations()) {
            const name = declaration.getStructure().name;
            names.add(name);
            if (name == "Fields") {
                const initializer = declaration.getInitializerOrThrow();
                if (!Node.isObjectLiteralExpression(initializer)) {
                    throw bail(
                        initializer,
                        "Expected object literal expression"
                    );
                }
                members = initializer
                    .getProperties()
                    .map((property) => (property.getStructure() as any).name);
            }
            if (name == "Subs") {
                const initializer = declaration.getInitializerOrThrow();
                if (!Node.isObjectLiteralExpression(initializer)) {
                    throw bail(
                        initializer,
                        "Expected object literal expression"
                    );
                }
                subs = initializer
                    .getProperties()
                    .map((property) => (property.getStructure() as any).name);
            }

            if (name == "Embedded") {
                const initializer = declaration.getInitializerOrThrow();
                if (!Node.isObjectLiteralExpression(initializer)) {
                    throw bail(
                        initializer,
                        "Expected object literal expression"
                    );
                }
                embeddeds = initializer
                    .getProperties()
                    .map((property) => (property.getStructure() as any).name);
            }

            if (name == "Internal") {
                const initializer = declaration.getInitializerOrThrow();
                if (!Node.isObjectLiteralExpression(initializer)) {
                    throw bail(
                        initializer,
                        "Expected object literal expression"
                    );
                }
                internals = initializer
                    .getProperties()
                    .map((property) => (property.getStructure() as any).name);
            }
        }
    }

    const actions = [];

    for (const statement of node.getSourceFile().getFunctions()) {
        const name = statement.getName();
        if (name) {
            names.add(name);

            if (name.startsWith("action")) {
                const structure = statement.getStructure();
                if (!structure.parameters) {
                    throw bail(statement, "Expected function");
                }
                actions.push({
                    impl: name,
                    name: name.substring("action".length),
                    params: structure.parameters.slice(2).map((structure) => ({
                        name: structure.name,
                        type: structure.type,
                    })),
                });
            }
        }
    }

    for (const statement of node.getSourceFile().getTypeAliases()) {
        names.add(statement.getName());
    }

    const items: Dictionary<ItemDef> = {};

    for (const member of members) {
        items[member] = itemMember(member);
    }
    for (const embedded of embeddeds) {
        items[embedded] = itemEmbed(embedded);
    }
    for (const sub of subs) {
        items[sub] = itemSub(sub);
    }
    for (const internal of internals) {
        items[internal] = itemInternal(internal);
    }

    return {
        data: typeNameNode.getText(),
        names,
        actions,
        items,
    };
}

export default function processWidget(
    project: Project,
    source: SourceFile
): Processor {
    const detail = extractMembers(source);

    const imports: Dictionary<string[]> = {};

    const clayApiSourceFile = project.getSourceFile("src/clay/api.tsx");
    if (!clayApiSourceFile) {
        throw bail(source, "cannot find widgets source");
    }
    const clayApiPath = source
        .getDirectory()
        .getRelativePathAsModuleSpecifierTo(clayApiSourceFile);

    const widgetsSourceFile = project.getSourceFile(
        "src/clay/widgets/index.tsx"
    );
    if (!widgetsSourceFile) {
        throw bail(source, "cannot find widgets source");
    }
    const widgetsPath = source
        .getDirectory()
        .getRelativePathAsModuleSpecifierTo(widgetsSourceFile);

    const cacheSourceFile = project.getSourceFile("src/clay/quick-cache.tsx");
    if (!cacheSourceFile) {
        throw bail(source, "cannot find cache source");
    }
    const cachePath = source
        .getDirectory()
        .getRelativePathAsModuleSpecifierTo(cacheSourceFile);

    const requestsSourceFile = project.getSourceFile(
        "src/clay/requests/index.tsx"
    );
    if (!requestsSourceFile) {
        throw bail(source, "cannot find requests source");
    }
    const requestsPath = source
        .getDirectory()
        .getRelativePathAsModuleSpecifierTo(requestsSourceFile);

    const commonSourceFile = project.getSourceFile("src/clay/common.ts");
    if (!commonSourceFile) {
        throw bail(source, "cannot find common source");
    }
    const commonPath = source
        .getDirectory()
        .getRelativePathAsModuleSpecifierTo(commonSourceFile);

    const propCheckSourceFile = project.getSourceFile("src/clay/propCheck.tsx");
    if (!propCheckSourceFile) {
        throw bail(source, "cannot find propCheck source");
    }
    const propCheckPath = source
        .getDirectory()
        .getRelativePathAsModuleSpecifierTo(propCheckSourceFile);

    imports[clayApiPath] = ["fetchRecord"];
    imports[commonPath] = ["Dictionary"];
    imports["lodash"] = ["some"];
    imports[widgetsPath] = [
        "WidgetStatus",
        "WidgetContext",
        "Widget",
        "WidgetResult",
        "WidgetRequest",
        "WidgetPropsOf",
        "subRequests",
        "subvalidate",
        "subStatus",
        "WidgetState",
        "WidgetAction",
        "WidgetData",
        "WidgetExtraProps",
        "WidgetProps",
        "RecordWidget",
        "ValidationError",
        "RecordContext",
    ];
    imports[requestsPath] = ["transformRequest", "castRequest"];
    imports[propCheckPath] = ["propCheck"];
    imports[cachePath] = ["QuickCacheApi"];

    const importDeclaration = source.getImportDeclaration((declaration) => {
        const structure = declaration.getStructure();
        if (structure) {
            for (const namedImport of structure.namedImports as ImportSpecifierStructure[]) {
                if (namedImport.name === detail.data) {
                    return true;
                }
            }
        }
        return false;
    });

    if (importDeclaration) {
        imports[importDeclaration.getModuleSpecifierValue()] = [
            ...(imports[importDeclaration.getModuleSpecifierValue()] || []),
            constantCase(detail.data + "Meta"),
        ];
    }

    return {
        defaultImports: {},
        imports,
        code: (writer: CodeBlockWriter) => {
            if (!detail) {
                throw new Error("panic");
            }
            if (!detail.names.has("Context")) {
                writer.writeLine(`type Context = (`);
                for (const [name, item] of Object.entries(detail.items)) {
                    writer.writeLine(`& WidgetContext<typeof ${item.widget}>`);
                }
                if (detail.names.has("ExtraContext")) {
                    writer.writeLine(`& ExtraContext`);
                }
                writer.writeLine(");");
            } else {
                writer.writeLine(`type SubContext = (`);
                for (const [name, item] of Object.entries(detail.items)) {
                    writer.writeLine(`& WidgetContext<typeof ${item.widget}>`);
                }
                if (detail.names.has("ExtraContext")) {
                    writer.writeLine(`& ExtraContext`);
                }
                writer.writeLine(");");
            }
            if (!detail.names.has("ExtraProps")) {
                writer.writeLine(`type ExtraProps = {}`);
            }

            writer.write(`type BaseState = `).block(() => {
                for (const [name, item] of Object.entries(detail.items)) {
                    writer.writeLine(`${name}: ${item.state_type}`);
                }
                writer.writeLine("initialParameters?: string[]");
            });
            if (detail.names.has("ExtraState")) {
                writer.writeLine(`export type State = BaseState & ExtraState`);
            } else {
                writer.writeLine(`export type State = BaseState`);
            }
            writer.writeLine("");

            writer.writeLine(`type BaseAction = `);
            for (const [member, item] of Object.entries(detail.items)) {
                writer.writeLine(
                    `| {type: '${constantCase(member)}', action: ${
                        item.subaction
                    }}`
                );
                for (const extra of item.extra_actions) {
                    writer.writeLine(
                        `| {type: '${extra.name}', ${extra.type}}`
                    );
                }
            }
            if (some(detail.items, (item) => item.tab)) {
                writer.writeLine(`| {type: 'RESET'}`);
            }
            for (const action of detail.actions) {
                writer.writeLine(`| {type: '${constantCase(action.name)}'`);

                for (const param of action.params) {
                    writer.writeLine(`,${param.name}: ${param.type}`);
                }
                writer.writeLine("}");
            }

            writer.writeLine(";");
            writer.writeLine("");

            writer.writeLine(`export type Action = `);
            if (detail.names.has("ExtraActions")) {
                writer.write(`ExtraActions`);
            }
            writer.writeLine(`| BaseAction`);
            writer.writeLine(";");
            writer.writeLine("");

            writer.writeLine("");

            writer.write(
                `export type Props = WidgetProps<
                    State,
                    Data,
                    Action,
                    ExtraProps
                    >`
            );
            if (detail.names.has("ExtraProps")) {
                writer.writeLine(` & ExtraProps`);
            }
            writer.writeLine("");

            writer
                .write(
                    `function baseValidate(  data: Data, cache: QuickCacheApi)`
                )
                .block(() => {
                    writer.writeLine("const errors: ValidationError[] = []");

                    for (const [member, item] of Object.entries(detail.items)) {
                        if (item.validate) {
                            writer.writeLine(
                                `subvalidate(${item.widget}, ${item.data}, cache, '${member}', errors)`
                            );
                        }
                    }
                    writer.writeLine("return errors");
                });

            writer
                .write(
                    `function baseReduce(state: State, data: Data, action: BaseAction, context: Context): WidgetResult<State, Data>`
                )
                .block(() => {
                    if (detail.names.has("subContext")) {
                        writer.writeLine(
                            `let subcontext: SubContext = subContext(data, context);`
                        );
                    } else {
                        writer.writeLine(`let subcontext = context;`);
                    }
                    writer.write("switch (action.type)").block(() => {
                        for (const [member, item] of Object.entries(
                            detail.items
                        )) {
                            writer
                                .write(`case "${constantCase(member)}":`)
                                .block(() => {
                                    writer.writeLine(
                                        `const inner = ${item.reduce}`
                                    );
                                    writer.write("return").block(() => {
                                        writer.writeLine(
                                            `state: {...state, ${member}: ${item.state_update}},`
                                        );
                                        writer.writeLine(
                                            `data: ${item.data_update}`
                                        );
                                    });
                                });

                            for (const extra_action of item.extra_actions) {
                                writer
                                    .write(
                                        `case "${constantCase(
                                            extra_action.name
                                        )}":`
                                    )
                                    .block(() => {
                                        writer.writeLine(extra_action.impl);
                                    });
                            }
                        }

                        if (some(detail.items, (item) => item.tab)) {
                            writer.write(`case "RESET":`).block(() => {
                                writer.write("return").block(() => {
                                    writer.write("state:").block(() => {
                                        writer.write("...state,");
                                        for (const [
                                            name,
                                            item,
                                        ] of Object.entries(detail.items)) {
                                            if (item.tab) {
                                                writer.write(`${name}: null,`);
                                            }
                                        }
                                    });
                                    writer.writeLine(`, data`);
                                });
                            });
                        }
                        for (const action of detail.actions) {
                            writer.write(
                                `case "${constantCase(action.name)}":`
                            );
                            writer.write(`return ${action.impl}(state, data`);
                            for (const param of action.params) {
                                writer.write(`,action.${param.name}`);
                            }
                            writer.writeLine(")");
                        }
                    });
                });
            writer.write(`export type ReactContextType = `).block(() => {
                writer.writeLine(`state: State,`);
                writer.writeLine(`data: Data,`);
                writer.writeLine(`dispatch: (action: Action) => void,`);
                writer.writeLine(`status: WidgetStatus,`);
            });
            writer.writeLine(
                `export const ReactContext = React.createContext<ReactContextType | undefined>(undefined);`
            );

            writer.write(`export const widgets: Widgets = `).block(() => {
                for (const [member, item] of Object.entries(detail.items)) {
                    if (item.add_widget) {
                        writer
                            .write(
                                `${member}: function(props: WidgetExtraProps<typeof ${item.widget}> & {label?: string, readOnly?: boolean, dispatch?: (action: Action) => void })`
                            )
                            .block(() => {
                                writer.writeLine(
                                    `const context = React.useContext(ReactContext) as ReactContextType;`
                                );
                                writer.writeLine(
                                    `const subdispatch = React.useCallback(action => (props.dispatch || context.dispatch)({type: "${constantCase(
                                        member
                                    )}", action}), [context.dispatch, props.dispatch])`
                                );
                                writer.writeLine(
                                    `const status = React.useMemo(() => subStatus(context.status, "${member}", !!props.readOnly), [context.status, props.readOnly]);`
                                );

                                writer.writeLine(
                                    `return <${
                                        item.widget
                                    }.component state={context.state.${member}} data={context.${
                                        item.data
                                    }}
 status={status} {...props}  dispatch={subdispatch} label={props.label || "${titleCase(
     member
 )}"}/>`
                                );
                            });
                        writer.write(",");
                    }
                }
            });

            writer
                .write(
                    `const Widget: RecordWidget<State, Data, Context, Action, ExtraProps> = `
                )
                .block(() => {
                    writer.writeLine(`reactContext: ReactContext,`);
                    writer.writeLine(`fieldWidgets: widgets,`);
                    writer.writeLine(
                        `dataMeta: ${constantCase(detail.data as string)}_META,`
                    );
                    writer
                        .write(
                            `initialize(data: Data, context: Context, parameters?: string[]): WidgetResult<
                    State,
                    Data
                >`
                        )
                        .block(() => {
                            if (detail.names.has("initialize")) {
                                if (detail.names.has("encodeState")) {
                                    writer.writeLine(
                                        `const result = initialize(data, context, parameters);`
                                    );
                                } else {
                                    writer.writeLine(
                                        `const result = initialize(data, context);`
                                    );
                                }

                                writer.writeLine("data = result.data");
                                writer.writeLine(
                                    "let subparameters: Dictionary<string[]> = (result as any).parameters || {}"
                                );
                            } else {
                                writer.writeLine(
                                    "let subparameters: Dictionary<string[]> = {}"
                                );
                            }

                            if (detail.names.has("subContext")) {
                                writer.writeLine(
                                    `let subcontext: SubContext = subContext(data, context);`
                                );
                            } else {
                                writer.writeLine(`let subcontext = context;`);
                            }

                            for (const [member, item] of Object.entries(
                                detail.items
                            )) {
                                writer.writeLine(`let ${member}State;`);
                                writer.block(() => {
                                    writer.writeLine(
                                        `const inner = ${item.initialize};`
                                    );
                                    writer.writeLine(
                                        `${member}State = ${item.state_update}`
                                    );
                                    writer.writeLine(
                                        `data = ${item.data_update}`
                                    );
                                });
                            }

                            writer.write("let state = ").block(() => {
                                writer.writeLine(
                                    "initialParameters: parameters,"
                                );
                                if (detail.names.has("initialize")) {
                                    writer.writeLine("...result.state,");
                                }
                                for (const member of Object.keys(
                                    detail.items
                                )) {
                                    writer.writeLine(
                                        `${member}: ${member}State,`
                                    );
                                }
                            });

                            writer.write("return").block(() => {
                                if (detail.names.has("postInitialize")) {
                                    writer.writeLine(
                                        `state: postInitialize(data, state, context, parameters)`
                                    );
                                } else {
                                    writer.writeLine("state");
                                }
                                writer.write(", data");
                            });
                        });
                    if (detail.names.has("validate")) {
                        writer.writeLine(`,validate: validate`);
                    } else {
                        writer.writeLine(`,validate: baseValidate`);
                    }

                    if (detail.names.has("encodeState")) {
                        writer.writeLine(`,encodeState: encodeState`);
                    }

                    writer
                        .write(`,component: React.memo((props: Props) =>`)
                        .block(() => {
                            if (some(detail.items, (item) => item.tab)) {
                                writer
                                    .write(`React.useEffect(() => `)
                                    .block(() => {
                                        writer
                                            .write(
                                                `if (props.state.initialParameters)`
                                            )
                                            .block(() => {
                                                writer
                                                    .write(
                                                        "switch(props.state.initialParameters[0])"
                                                    )
                                                    .block(() => {
                                                        for (const [
                                                            name,
                                                            item,
                                                        ] of Object.entries(
                                                            detail.items
                                                        )) {
                                                            if (item.tab) {
                                                                writer.writeLine(
                                                                    `case ${JSON.stringify(
                                                                        name
                                                                    )}:`
                                                                );
                                                                if (
                                                                    item.widget.startsWith(
                                                                        "Embedded"
                                                                    )
                                                                ) {
                                                                    writer.writeLine(
                                                                        `fetchRecord(${
                                                                            item.widget
                                                                        }.dataMeta, props.state.initialParameters[1]).then(record => record && props.dispatch({type: "OPEN_${constantCase(
                                                                            name
                                                                        )}", ${name}: record}));`
                                                                    );
                                                                } else {
                                                                    writer.writeLine(
                                                                        `props.dispatch({ type: "OPEN_${constantCase(
                                                                            name
                                                                        )}" });`
                                                                    );
                                                                }

                                                                writer.writeLine(
                                                                    `break;`
                                                                );
                                                            }
                                                        }
                                                    });
                                            });
                                    })
                                    .writeLine(
                                        ", [props.state.initialParameters]);"
                                    );
                            }

                            writer.write(
                                `return <ReactContext.Provider value={props}><RecordContext meta={${constantCase(
                                    detail.data as string
                                )}_META} value={props.data}>{Component(props)}</RecordContext></ReactContext.Provider>`
                            );
                        })
                        .write(", propCheck)");
                    const hasReduce = detail.names.has("reduce");
                    writer.writeLine(
                        `, reduce: ${hasReduce ? "reduce" : `baseReduce`}`
                    );

                    if (some(detail.items, (item) => item.tab)) {
                        writer.write(`,encodeState: (state) => `).block(() => {
                            for (const [name, item] of Object.entries(
                                detail.items
                            )) {
                                if (item.tab) {
                                    writer
                                        .write(`if (state.${name})`)
                                        .block(() => {
                                            if (
                                                item.widget.startsWith(
                                                    "Embedded"
                                                )
                                            ) {
                                                writer.writeLine(
                                                    `return [${JSON.stringify(
                                                        name
                                                    )}, state.${name}.data.id.uuid];`
                                                );
                                            } else {
                                                writer.writeLine(
                                                    `return [${JSON.stringify(
                                                        name
                                                    )}];`
                                                );
                                            }
                                        });
                                }
                            }
                            writer.writeLine("return []");
                        });
                    }
                });
            writer.writeLine("export default Widget;");

            writer.write(`type Widgets = `).block(() => {
                for (const [member, item] of Object.entries(detail.items)) {
                    if (item.add_widget) {
                        writer.writeLine(
                            `${member}: React.SFC<{label?: string, readOnly?: boolean, dispatch?: (action: Action) => void } & WidgetExtraProps<typeof ${item.widget}>>,`
                        );
                    }
                }
            });
            if (some(detail.items, (item) => item.tab)) {
                const embeds = Object.entries(detail.items).filter(
                    (x) => x[1].tab
                );
                writer
                    .write(
                        `function EmbeddedRecords(props: {${
                            embeds
                                .map(
                                    ([name, item]) =>
                                        `${name}: ${item.embed_options_type!}`
                                )
                                .join(",") +
                            ",children: React.ReactNode,mainTabLabel: string, extraTabWidget?: React.ReactNode"
                        }})`
                    )
                    .block(() => {
                        writer.write(
                            `const context = React.useContext(ReactContext)!;`
                        );
                        for (const [embed, item] of embeds) {
                            writer.writeLine(`const ${embed}Dispatch = React.useCallback((action: ${
                                item.subaction
                            }) => {
                                context.dispatch({type: "${constantCase(
                                    embed
                                )}", action});
                            }, [context.dispatch]);`);
                            writer.writeLine(`const ${embed} = ${item.embed_hook!}(
                                ${item.widget},
                                ${item.embed_data ? "context.data," : ""}
                                context.state.${embed},
                                ${embed}Dispatch,
                                context.status,
                                props.${embed}
                            );`);
                        }

                        writer.write(`return <><div {...TAB_STYLE}>
                {${embeds
                    .map(([embed, _]) => `${embed}.mainComponent ||`)
                    .join(" ")}
                 props.children }
            </div>
            <Pagination style={{ marginBottom: "0px" }}>
                <Pagination.Item
                    active={!(${embeds.map((x) => x[0]).join(" || ")})}
                    onClick={() => {
                        context.dispatch({ type: "RESET" });
                    }}
                >
                    {props.mainTabLabel}
                </Pagination.Item>
                ${embeds.map(([embed, _]) => `{${embed}.tabs}`).join("\n")}
                {props.extraTabWidget}
            </Pagination>
        </>`);
                    });
            }
        },
    };
}
