import { DimensionsManager } from "./DimensionsManager";

export class Dimension {
    private players: number[] = [];

    public readonly id: number;
    public get Players() {
        return this.players;
    }

    public constructor(id: number) {
        this.id = id;
    }

    public SetPlayerDimensionTo(player: number): void {
        SetPlayerRoutingBucket(player.toString(), this.id);
        this.players.push(player);
    }

    public SetPlayerDimensionToBasic(player: number) : void {
        SetPlayerRoutingBucket(player.toString(), DimensionsManager.basicDimension.id);
        this.players = this.players.filter(el => el != player);
    }
}