import { ICommand } from "./ICommand";

export class CommandsRegistrator {
    public static Register(command: ICommand): void {
            RegisterCommand(
                command.name,
                (source: string, args: string[]) => {
                    try {
                        if (args.length !== command.arguments.length) throw new Error(`Команда введена некорректно:\n${command.note}`)
                        for (let i = 0; i < command.arguments.length; i++) {
                            if (command.arguments[i].type === "number" && isNaN( parseInt(args[i] ))) throw new Error(`${command.arguments[i].name} должен быть числовым`)
                            command.arguments[i].validation?.(source, args)
                        }
                        command.handler(source, args)
                    } catch (e) {
                        console.error(`Ошибка при выполнении команды /${command.name}:\n${e}\n\nПодсказка: ${command.note}`)
                    }
                },
                false
            );
    }
}