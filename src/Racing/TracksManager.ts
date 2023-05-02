import { ITrack } from "./ITrack";

export class TracksManager {
    private readonly tracks: ITrack[];

    public get Tracks() {
        return this.tracks;
    }

    public constructor(tracks: ITrack[]) {
        this.tracks = tracks;
    }

    public DoesTrackExist(track: string): boolean {
        for (let i = 0; i < this.tracks.length; i++) {
            if (this.tracks[i].name === track) return true;
        }
        return false;
    }
}