import "@citizenfx/server";
import { RacingManager } from "./Racing/RacingManager";
import { TracksManager } from "./Racing/TracksManager";
import { DimensionsManager } from "./Dimensions/DimensionsManager";

class Server {
    public static Main(): void {
        const racingManager = new RacingManager(
            new TracksManager(require("./Racing/tracks.json"))
        );
        racingManager.RegisterCommands();
    }
}

Server.Main();
