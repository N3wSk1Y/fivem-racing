import "@citizenfx/server";
import { RacingManager } from "./Racing/RacingManager";
import { TracksManager } from "./Racing/TracksManager";

class Server {
    public static Main(): void {
        const raceManager = new RacingManager(
            new TracksManager(require("./Racing/tracks.json"))
        );
        raceManager.RegisterCommands();
    }
}

Server.Main();
