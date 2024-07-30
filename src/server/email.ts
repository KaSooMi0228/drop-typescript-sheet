import SendGrid from "@sendgrid/mail";

SendGrid.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendEmail(message: SendGrid.MailDataRequired) {
    if (process.env.NODE_ENV !== "production") {
        message.subject! += message.to;
        message.to = "winstonewert@gmail.com";
    }
    await SendGrid.send(message);
}
