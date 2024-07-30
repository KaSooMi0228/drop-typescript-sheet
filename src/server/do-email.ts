import Holidays from "date-holidays";
import * as nunjucks from "nunjucks";
import { calcAddressLineFormatted } from "../app/address";
import {
    CustomerSurveyJSON,
    JSONToCustomerSurvey,
} from "../app/project/customer-survey/table";
import { JSONToProject, ProjectJSON } from "../app/project/table";
import { databasePool } from "../clay/server/databasePool";
import { ServerError } from "../clay/server/error";
import patchRecord from "../clay/server/patchRecord";
import { select, str } from "../clay/server/squel";
import { genUUID } from "../clay/uuid";
import { sendEmail } from "./email";
import { ROOT_USER } from "./root-user";
import { quickReadRecord } from "./util";

const htmlToFormattedText = require("html-to-formatted-text");
nunjucks.configure("templates", { autoescape: true });

async function main() {
    const holidays = new Holidays({
        country: "Canada",
        state: "BC",
    });

    if (holidays.isHoliday(new Date())) {
        console.log("Holiday, Skipping Emails");
        return;
    }

    const { pool, context } = await databasePool;

    const client = await pool.connect();
    try {
        console.log("sending out surveys");
        {
            const query = select()
                .from("customer_surveys")
                .field("id")
                .field("project")
                .field(str("(customer_surveys.contact).email"), "email")
                .where("not sent");

            const result = await client.query(query.toParam());

            for (const row of result.rows) {
                const project = await quickReadRecord("Project", row.project);
                const survey = await quickReadRecord("CustomerSurvey", row.id)!;

                if (!project) {
                    return;
                }

                const html = nunjucks.render("survey-link.html", {
                    link: "https://dropsheet.remdal.com/survey/" + row.id,
                    survey: JSONToCustomerSurvey(survey as CustomerSurveyJSON),
                    address: calcAddressLineFormatted(
                        JSONToProject(project as ProjectJSON).siteAddress
                    ),
                });
                const text = htmlToFormattedText(html);
                await sendEmail({
                    to: row.email,
                    from: "info@remdal.com",
                    subject:
                        "We want your feedback on your recent Remdal project",
                    html,
                    text,
                });

                await patchRecord({
                    client,
                    context,
                    tableName: "CustomerSurvey",
                    id: row.id,
                    user: ROOT_USER,
                    form: "Survey Sender",
                    dateTime: new Date(),
                    override: false,
                    patches: [
                        {
                            sent: [false, true],
                        },
                    ],
                    patchIds: [genUUID()],
                });
            }
        }
        console.log("send out survey reminders");
        {
            const query = select()
                .from("customer_surveys")
                .field("id")
                .field("project")
                .field(str("(customer_surveys.contact).email"), "email")
                .where("not reminder_sent")
                .where("date is null")
                .where(
                    "added_date_time < current_timestamp - interval '3 days'"
                );

            const result = await client.query(query.toParam());

            for (const row of result.rows) {
                const project = await quickReadRecord("Project", row.project);

                if (!project) {
                    return;
                }

                const html = nunjucks.render("survey-link-reminder.html", {
                    link: "https://dropsheet.remdal.com/survey/" + row.id,
                    address: calcAddressLineFormatted(
                        JSONToProject(project as ProjectJSON).siteAddress
                    ),
                });
                const text = htmlToFormattedText(html);
                await sendEmail({
                    to: row.email,
                    from: "info@remdal.com",
                    subject:
                        "REMINDER: Complete your survey of your recent Remdal project",
                    html,
                    text,
                });

                await patchRecord({
                    client,
                    context,
                    tableName: "CustomerSurvey",
                    id: row.id,
                    user: ROOT_USER,
                    form: "Survey Sender",
                    dateTime: new Date(),
                    override: false,
                    patches: [
                        {
                            reminderSent: [false, true],
                        },
                    ],
                    patchIds: [genUUID()],
                });
            }
        }
    } catch (error) {
        if (error instanceof ServerError) {
            console.log(JSON.stringify(error.detail));
            console.error(error.detail);
        } else {
            throw error;
        }
    } finally {
        client.release();
    }
    process.exit(0);
}
main()
    .then(() => console.log("Finished"))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
