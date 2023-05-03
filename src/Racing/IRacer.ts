import { IEntityPosition } from "../Utilities/IEntityPosition";

export interface IRacer {
    player: number;
    isHost: boolean;
    carHash: number;
    beforeStartPosition: IEntityPosition;
}
