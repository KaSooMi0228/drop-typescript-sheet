import * as Sentry from "@sentry/node";
if (process.env.NODE_ENV === "production") {
    Sentry.init({
        dsn: "https://c37711c73d4b46e699024949090c4bca@dropsheet.remdal.com/5897301",
        release: process.env.VERSION,
    });
}
