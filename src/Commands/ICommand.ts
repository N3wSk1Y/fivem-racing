import { ICommandArgument } from "./ICommandArgument";

export interface ICommand {
    name: string;
    note: string;
    arguments: ICommandArgument[];
    handler(source: string, args: string[]): void
}