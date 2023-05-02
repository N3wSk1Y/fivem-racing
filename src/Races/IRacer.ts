export interface IRacer {
    player: number;
    isHost: boolean;
    carHash: number;
    beforeStartPosition: {
        x: number;
        y: number;
        z: number;
    };
}
