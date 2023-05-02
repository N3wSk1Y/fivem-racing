export class PlayerUtilities {
    public static SendMessageToPlayer(player: number, content: string): void {
        TriggerClientEvent("chat:addMessage", player.toString(), {
            args: [content]
        });
    }

    public static DoesPlayerExist(source: number): boolean {
        return DoesEntityExist(GetPlayerPed(source.toString()));
    }
}