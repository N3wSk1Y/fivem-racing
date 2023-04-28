import "@citizenfx/server";
import {IStorageField} from "./IStorageField";

abstract class LocalUserStorage {
    private static storage: IStorageField[] = [];

    public static GetData(player: number): IStorageField {
        if (this.storage[player] === null) LocalUserStorage.SetData(player, {});
        return this.storage[player];
    }

    public static SetData(player: number, content: object): void {
        this.storage[player] = {
            "playerId": player,
            "data": content
        }
    }

    public static ClearPlayer(player: number): void {
        this.storage.filter(el => el.playerId !== player);
    }

    public static HandlePlayersJoining(): void {
        onNet("playerJoining", (source: string) => {
            this.SetData(parseInt(source), {});
        })
    }
}

abstract class Tools {
    public static SetPlayerPosition(source: string, x: number, y: number, z: number): void {
        SetEntityCoords(GetPlayerPed(source), x, y, z, true, false, true, false);
    }

    public static GetPlayerPosition(player: string): IPlayerPosition {
        const playerPosition = GetEntityCoords(GetPlayerPed(player));
        return {
            x: playerPosition[0],
            y: playerPosition[1],
            z: playerPosition[2]
        }
    }

    public static SendMessageToPlayer(player: string, content: string): void {
        TriggerClientEvent("chat:addMessage", player, {
            args: [
                content
            ]
        })
    }

    public static RangeRandom(from: number, to: number): number {
        from = Math.ceil(from);
        to = Math.floor(to);
        return Math.floor(Math.random() * (to - from + 1)) + from;
    }
}

class Race {
    private static races: Race[] = [];
    private static readonly tracks: ITrack[] = [
        {
            "name": "airport",
            "x": 0,
            "y": 0,
            "z": 0
        },
        {
            "name": "zancudo",
            "x": -2344.373,
            "y": 3267.498,
            "z": 32.811
        },
        {
            "name": "highway",
            "x": 0,
            "y": 0,
            "z": 0
        }
    ]

    private readonly id: number;
    private readonly track: ITrack;
    private readonly carType: string;
    private readonly carsColor: number;
    private readonly maxPlayers: number;

    private hostPlayer: string;
    private racers: IRacer[] = [];

    private constructor(track: ITrack, carType: string, carsColor: number, maxPlayers: number, hostPlayer: string) {
        this.id = this.racers.length;
        this.track = track;
        this.carType = carType;
        this.carsColor = carsColor;
        this.maxPlayers = maxPlayers;
        this.hostPlayer = hostPlayer;

        this.AddRacer(hostPlayer, true);
    }

    private AddRacer(player: string, isHost: boolean): void {
        const playerPosition = Tools.GetPlayerPosition(player)
        const car = CreateVehicle(this.carType, Tools.RangeRandom(this.track.x - 50, this.track.x + 50), Tools.RangeRandom(this.track.y - 50, this.track.y + 50), this.track.z, 0, true, true);

        SetVehicleColours(car, this.carsColor, this.carsColor);
        SetPedIntoVehicle(parseInt(player), car, 0);
        FreezeEntityPosition(parseInt(player), true);

        this.racers.push({
            "player": parseInt(player),
            "isHost": isHost,
            "carHash": car,
            "beforeStartPosition": {
                "x": playerPosition.x,
                "y": playerPosition.y,
                "z": playerPosition.z
            }
        })

        LocalUserStorage.SetData(parseInt(player), {
            "race": {
                "race_id": this.id,
                "racer_id": this.racers.length - 1,
                "isHost": isHost
            }
        })

        Tools.SendMessageToPlayer(player, "Вы добавлены в гонку, ожидайте начала.");
    }

    private LeaveRace(player: string): void {
        // TODO: Закончить выход из гонки (удаление авто, телепортация на beforeStartPosition, удаление из racers, очистка LocalUserStorage
    }

    public static RegisterCommands(): void {
        RegisterCommand('createrace', (source: string, args: string[]) => {
            if (args.length != 4) throw new Error("Команда введена некорректно:\n/createrace [трасса] [название машины, которую будут использовать игроки] [цвет машины] [максимальное количество игроков (2-16)]");
            if (!this.IsTrackExist(args[0])) throw new Error(`Карты ${args[0]} не существует.`);
            if (!(parseInt(args[3]) >= 2 && parseInt(args[3]) <= 16)) throw new Error("Максимальное количество игроков должно быть в диапазоне от 2 до 16.");

            this.races.push(new Race(this.tracks.filter(el => el.name === args[0])[0], args[1], parseInt(args[2]), parseInt(args[3]), source));
        }, false);

        RegisterCommand('leaverace', (source: string, args: string[]) => {
            const storageData = LocalUserStorage.GetData(parseInt(source)).data.race;
            if (storageData === undefined) throw new Error("Вы не находитесь в гонке.");


        }, false);
    }

    private static IsTrackExist(track: string): boolean {
        for (let i = 0; i < this.tracks.length; i++) {
            if (this.tracks[i].name === track)
                return true;
        }
        return false;
    }
}

abstract class Server {
    public static Main(): void {
        LocalUserStorage.HandlePlayersJoining();
        Race.RegisterCommands();

        RegisterCommand('coords', (source: string) => {
            const coords = GetEntityCoords(GetPlayerPed(source))
            Tools.SendMessageToPlayer(source, `X: ${coords[0]}, Y: ${coords[1]}, Z: ${coords[2]}`);
        }, false)
    }
}

Server.Main();