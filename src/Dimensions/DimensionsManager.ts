import { Dimension } from "./Dimension";

export class DimensionsManager {
    public static dimensions: Dimension[] = [];
    public static basicDimension: Dimension = new Dimension(0);

    public static SetPlayerDimensionToBasic(player: number): void {
        SetPlayerRoutingBucket(player.toString(), this.basicDimension.id);
    }

    public static AddDimension(dimension: Dimension): Dimension {
        this.dimensions.push(dimension);
        return dimension;
    }
}