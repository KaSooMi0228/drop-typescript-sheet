import { find } from "lodash";
import { stringify } from "querystring";
import * as React from "react";
import { Button, Table } from "react-bootstrap";
import Modal from "react-modal";
import { Link } from "../../clay/link";
import { useQuickAllRecords } from "../../clay/quick-cache";
import { ContactDetail, emptyContactDetail } from "../contact/table";
import { User, USER_META } from "../user/table";
import { Project } from "./table";

function EmailContactRow(props: {
    contact: ContactDetail;
    emails: string[];
    setEmails: (emails: string[]) => void;
}) {
    const onCheckChange = React.useCallback(
        (event) => {
            if (event.target.checked) {
                props.setEmails([...props.emails, props.contact.email]);
            } else {
                props.setEmails(
                    props.emails.filter((x) => x != props.contact.email)
                );
            }
        },
        [props.emails, props.setEmails, props.contact]
    );
    return (
        <tr>
            <td>
                {props.contact.email && (
                    <input
                        type="checkbox"
                        style={{ width: "1em", height: "1em" }}
                        onChange={onCheckChange}
                        checked={
                            props.emails.indexOf(props.contact.email) !== -1
                        }
                    />
                )}{" "}
                {props.contact.name}
            </td>
            <td>{props.contact.email}</td>
        </tr>
    );
}

export function launchEmail(props: {
    emails: string[];
    subject: string;
    bcc: string;
}) {
    const href = `mailto:${props.emails.join(";")}?${stringify({
        subject: props.subject,
        bcc: props.bcc,
    })}`;
    const emailWindow = window.open(href);
    // This magic incantation attempts to close the resulting popup window if it opened an external
    // program (Outlook)
    const checkClose = function () {
        try {
            // If I can access the href, it means the link ended opening an external program, we can remove it
            emailWindow?.location.href;
            return emailWindow?.close();
        } catch (error) {}
    };
    // check for it after 5 seconds
    let timer = setTimeout(checkClose, 5000);
    let checkLoaded: any = null;
    try {
        checkLoaded = function () {
            // once its loaded, reset the timer to 2 seconds
            clearTimeout(timer);
            timer = setTimeout(checkClose, 2000);
        };
        // Reset the time anytime something happens until it finishes
        emailWindow!.onload = checkLoaded;
        ["DomContentLoaded", "load", "beforeunload", "unload"].map((event) =>
            emailWindow?.addEventListener(event, checkLoaded!)
        );
    } catch (error) {
        // An error probably means we aren't allowed to access the information, because its an web based email client
        return checkLoaded!();
    }
}

function SendEmailPopup(props: {
    project: Project;
    subject: string;
    prefix?: string;
    close: () => void;
    tag?: () => Promise<void>;
}) {
    const [emails, setEmails] = React.useState<string[]>([]);
    const startEmail = React.useCallback(async () => {
        if (props.tag) {
            await props.tag();
        }
        launchEmail({
            emails,
            subject: `${props.project.customer} - ${props.project.siteAddress.line1} - ${props.project.projectNumber} > ${props.subject}`,
            bcc: `project-${props.prefix || ""}${
                props.project.projectNumber
            }@dropsheet.remdal.com`,
        });

        props.close();
    }, [emails, props.subject, props.project, props.close]);
    const users = useQuickAllRecords(USER_META) || [];

    const added = new Set<Link<User>>([]);
    const userContacts: ContactDetail[] = [];
    for (const personnel of props.project.personnel) {
        if (!added.has(personnel.user)) {
            added.add(personnel.user);
            const user = find(users, (user) => user.id.uuid === personnel.user);
            if (user) {
                userContacts.push({
                    ...emptyContactDetail(),
                    name: user.name,
                    email: user.accountEmail,
                });
            }
        }
    }

    return (
        <Modal isOpen={true} onRequestClose={props.close}>
            <Table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                    </tr>
                </thead>
                <tbody>
                    {props.project.billingContacts.map((contact, index) => (
                        <EmailContactRow
                            contact={contact}
                            key={index}
                            emails={emails}
                            setEmails={setEmails}
                        />
                    ))}
                    {props.project.contacts.map((contact, index) => (
                        <EmailContactRow
                            contact={contact}
                            key={index}
                            emails={emails}
                            setEmails={setEmails}
                        />
                    ))}
                    {userContacts.map((contact, index) => (
                        <EmailContactRow
                            contact={contact}
                            key={index}
                            emails={emails}
                            setEmails={setEmails}
                        />
                    ))}
                </tbody>
            </Table>
            <Button onClick={startEmail}>Generate Email</Button>
        </Modal>
    );
}

export function EmailPopupButton(props: {
    subject: string;
    children: React.ReactNode;
    project: Project;
    prefix?: string;
    tag?: () => Promise<void>;
}) {
    const [emailSubject, setEmailSubject] = React.useState<string | null>(null);
    const closeEmailPopup = React.useCallback(
        () => setEmailSubject(null),
        [setEmailSubject]
    );

    return (
        <>
            {emailSubject !== null && (
                <SendEmailPopup
                    prefix={props.prefix}
                    project={props.project}
                    subject={emailSubject}
                    close={closeEmailPopup}
                    tag={props.tag}
                />
            )}
            <Button
                onClick={() => setEmailSubject(props.subject)}
                style={{ marginRight: "20px" }}
            >
                {props.children}
            </Button>
        </>
    );
}
