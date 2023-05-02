export class LocalUserStorage {
    private static storage: object[] = [];

    public static GetData(player: number): object {
        if (LocalUserStorage.storage[player] === undefined)
            LocalUserStorage.SetData(player, {});
        return LocalUserStorage.storage[player];
    }

    public static SetData(player: number, content: object): void {
        LocalUserStorage.storage[player] = content;
    }

    public static ClearPlayer(player: number): void {
        LocalUserStorage.storage[player] = {};
    }
}