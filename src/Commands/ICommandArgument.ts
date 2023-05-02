export interface ICommandArgument {
    name: string
    type: "number" | "string"
    validation?(source: string, args: string[]): void
}