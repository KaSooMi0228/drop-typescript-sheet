if (process.env.NODE_ENV !== "production") {
    //require("webpack-dev-server/client?http://localhost:8080/");
    //    window.confirm = () => true
}
require("bootswatch/dist/cerulean/bootstrap.css");
require("./client");
