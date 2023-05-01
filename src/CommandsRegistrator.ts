interface ICommand {
    name: string;
    note: string;
    arguments: ICommandArgument[];
    handler(source: string, args: string[]): void
}

interface ICommandArgument {
    name: string
    type: "number" | "string"
    validation(source: string, args: string[], errorMessage: string): boolean
}

abstract class CommandsRegistrator {
    public static Register(command: ICommand): void {
            RegisterCommand(
                command.name,
                (source: string, args: string[], errorMessage: string) => {
                    if (args.length !== command.arguments.length) throw new Error(`Команда введена некорректно:\n${command.note}`)
                    for (let i = 0; i < command.arguments.length; i++) {
                        if (!command.arguments[i].validation(source, args, errorMessage)) throw new Error(errorMessage);
                    }
                    command.handler(source, args)
                },
                false
            );
    }
}