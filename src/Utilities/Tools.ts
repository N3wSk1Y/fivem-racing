import { IPlayerPosition } from "./IPlayerPosition";

export class Tools {
    public static SetEntityPosition(
        source: string,
        x: number,
        y: number,
        z: number
    ): void {
        SetEntityCoords(
            GetPlayerPed(source),
            x,
            y,
            z,
            true,
            false,
            true,
            false
        );
    }

    public static GetPlayerPosition(player: number): IPlayerPosition {
        const playerPosition = GetEntityCoords(GetPlayerPed(player.toString()));
        return {
            x: playerPosition[0],
            y: playerPosition[1],
            z: playerPosition[2]
        };
    }

    public static SendMessageToPlayer(player: number, content: string): void {
        TriggerClientEvent("chat:addMessage", player.toString(), {
            args: [content]
        });
    }

    public static RangeRandom(from: number, to: number): number {
        from = Math.ceil(from);
        to = Math.floor(to);
        return Math.floor(Math.random() * (to - from + 1)) + from;
    }

    public static DoesPlayerExist(source: number): boolean {
        return DoesEntityExist(GetPlayerPed(source.toString()));
    }
}