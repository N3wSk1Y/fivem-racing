import * as fs from "fs";
import "@citizenfx/client";
import {ICommand} from "./ICommand";

export abstract class CommandsRegistrator {
    public static RegisterCommandsInDirectory(directoryPath: string): void {
        try {
            const commands = fs.readdirSync(directoryPath).filter(f => f.endsWith('.js'));
            if (commands.length == 0)
                throw new Error(`No commands has been found in ${directoryPath}.`);
            else
                CommandsRegistrator.initializeCommands(directoryPath, commands);
        } catch (error) {
            console.error(error);
        }
    }

    private static initializeCommands(directoryPath: string, commands: string[]): void {
        for (const file of commands) {
            console.log("Initializing: " + file)
            const command: ICommand = require(directoryPath + file)
            RegisterCommand(command.name, (source: object, args: string[]) => command.execute(source, args), command.isRestricted);
        }
    }
}