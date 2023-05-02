import { IEntityPosition } from "./IEntityPosition";

export class EntityUtilities {
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

    public static GetEntityPosition(player: number): IEntityPosition {
        const playerPosition = GetEntityCoords(GetPlayerPed(player.toString()));
        return {
            x: playerPosition[0],
            y: playerPosition[1],
            z: playerPosition[2]
        };
    }
}