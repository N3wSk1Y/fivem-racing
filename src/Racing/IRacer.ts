import { IEntityPosition } from "../Utilities/IEntityPosition";
import { Dimension } from "../Dimensions/Dimension";

export interface IRacer {
    player: number;
    isHost: boolean;
    carHash: number;
    beforeStartPosition: IEntityPosition;
}
