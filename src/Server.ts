import "@citizenfx/server";
import { Race } from "./Races/Race";

class Server {
    public static Main(): void {
        Race.RegisterCommands();
    }
}

Server.Main();
