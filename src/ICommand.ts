export interface ICommand {
    name: string,
    isRestricted: boolean,
    execute(source: object, args: string[]): void
}