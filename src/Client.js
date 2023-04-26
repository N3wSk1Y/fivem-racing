"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandsHandler_1 = require("./CommandsHandler");
class Client {
    static Main() {
        CommandsHandler_1.CommandsRegistrator.RegisterCommandsInDirectory("./commands/");
    }
}
Client.Main();
