import {CommandsRegistrator} from "./CommandsHandler";

abstract class Client {
    public static Main(): void {
        CommandsRegistrator.RegisterCommandsInDirectory("./commands/")
    }
}

Client.Main();