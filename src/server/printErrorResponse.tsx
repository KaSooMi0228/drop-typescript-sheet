import Decimal from "decimal.js";
import distance from "levenshtein-edit-distance";
import ReactDOMServer from "react-dom/server";
import { titleCase } from "title-case";
import { Phone } from "../clay/phone";
import * as React from "react";

const jexl = require("../../jexl") as any;

function generatePossibleExpressions(
    result: [string, string, string][],
    prefix: string,
    scope: any
) {
    if (scope === null) {
        result.push([prefix + "", "", ""]);
    } else if (scope instanceof Phone) {
        result.push([prefix + "", scope.format(), ""]);
    } else if (scope instanceof Decimal) {
        result.push([prefix + "|money", jexl._transforms.money(scope), ""]);
        result.push([
            prefix + "|percentage",
            jexl._transforms.percentage(scope),
            "",
        ]);
    } else if (scope instanceof Date) {
        result.push([
            prefix + "|longDate",
            jexl._transforms.longDate(scope),
            "",
        ]);
    } else if (Array.isArray(scope)) {
        result.push([prefix, "", "(list of items)"]);
    } else if (typeof scope === "object" && scope != null) {
        for (const [key, value] of Object.entries(scope)) {
            if (key === "id" || key === "recordVersion") {
                continue;
            }
            generatePossibleExpressions(
                result,
                prefix ? prefix + "." + key : key,
                value
            );
        }
    } else if (typeof scope === "string") {
        result.push([prefix, scope, ""]);
    } else if (typeof scope === "number" || typeof scope === "boolean") {
        result.push([prefix, `${scope}`, ""]);
    } else {
        console.log("WHAT", scope);
    }
}

function DiagnoseScopeFail(props: { detail: any }) {
    const expressions: [string, string, string][] = [];
    generatePossibleExpressions(expressions, "", props.detail.scope);
    expressions.sort(
        (a, b) =>
            distance(a[0], props.detail.tag) - distance(b[0], props.detail.tag)
    );

    return (
        <>
            <div className="alert alert-warning" role="alert">
                The template contained the invalid code:{" "}
                <code>{props.detail.tag}</code>. The following are valid codes:
            </div>

            <table className="table">
                {expressions.map((expression) => (
                    <tr>
                        <td>
                            <code>{expression[0]}</code>
                        </td>
                        <td>
                            {expression[1]}
                            {expression[2]}
                        </td>
                    </tr>
                ))}
            </table>
        </>
    );
}

function MultiError(props: { detail: any }) {
    return (
        <>
            {props.detail.errors.map((error: any) => (
                <div className="alert alert-warning" role="alert">
                    {error.message} {error.properties.explanation} (
                    <code>{error.properties.context}</code>)
                </div>
            ))}
        </>
    );
}

function MissingLeftTag(props: { detail: any }) {
    return (
        <>
            <div className="alert alert-warning" role="alert">
                The following code is not valid{" "}
                <code>{props.detail.part.raw}</code> because{" "}
                {props.detail.explanation}
            </div>
        </>
    );
}

function ShowError(props: { detail: any }) {
    switch (props.detail.id) {
        case "scopeparser_execution_failed":
            return <DiagnoseScopeFail detail={props.detail} />;
        case "multi_error":
            return <MultiError detail={props.detail} />;
        case "no_xml_tag_found_at_left":
        case "no_xml_tag_found_at_right":
            return <MissingLeftTag detail={props.detail} />;
        default:
            return (
                <div className="alert alert-warning" role="alert">
                    Unknown error: {props.detail.id}
                </div>
            );
    }
}

function ErrorReport(props: { parts: string[]; detail: any }) {
    return (
        <html>
            <head>
                <link
                    rel="stylesheet"
                    href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css"
                />
                <script src="https://code.jquery.com/jquery-3.5.1.min.js" />
                <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.bundle.min.js"></script>
            </head>
            <body>
                <div className="container" style={{ marginTop: "2em" }}>
                    <div className="alert alert-danger" role="alert">
                        There was a problem trying to print{" "}
                        {titleCase(props.parts[1])}.
                    </div>
                    <ShowError detail={props.detail} />

                    <div className="card">
                        <div className="card-body">
                            <h5 className="card-title">
                                <a
                                    className="btn btn-danger"
                                    data-toggle="collapse"
                                    href="#technical-information"
                                >
                                    Show Technical Information
                                </a>
                            </h5>
                            <pre
                                className="collapse"
                                id="technical-information"
                            >
                                {JSON.stringify(
                                    {
                                        parts: props.parts,
                                        ...props.detail,
                                    },
                                    null,
                                    4
                                )}
                            </pre>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}

export default function printErrorResponse(parts: string[], detail: any) {
    return ReactDOMServer.renderToStaticMarkup(
        <ErrorReport parts={parts} detail={detail} />
    );
}
