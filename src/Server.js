"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@citizenfx/server");
class LocalUserStorage {
    static GetData(player) {
        if (this.storage[player] === null)
            LocalUserStorage.SetData(player, {});
        return this.storage[player];
    }
    static SetData(player, content) {
        this.storage[player] = {
            "playerId": player,
            "data": content
        };
    }
    static ClearPlayer(player) {
        this.storage.filter(el => el.playerId !== player);
    }
    static HandlePlayersJoining() {
        onNet("playerJoining", (source) => {
            this.SetData(parseInt(source), {});
        });
    }
}
LocalUserStorage.storage = [];
class Tools {
    static SetPlayerPosition(source, x, y, z) {
        SetEntityCoords(GetPlayerPed(source), x, y, z, true, false, true, false);
    }
    static GetPlayerPosition(player) {
        const playerPosition = GetEntityCoords(GetPlayerPed(player));
        return {
            x: playerPosition[0],
            y: playerPosition[1],
            z: playerPosition[2]
        };
    }
    static SendMessageToPlayer(player, content) {
        TriggerClientEvent("chat:addMessage", player, {
            args: [
                content
            ]
        });
    }
    static RangeRandom(from, to) {
        from = Math.ceil(from);
        to = Math.floor(to);
        return Math.floor(Math.random() * (to - from + 1)) + from;
    }
}
class Race {
    constructor(track, carType, carsColor, maxPlayers, hostPlayer) {
        this.racers = [];
        this.id = this.racers.length;
        this.track = track;
        this.carType = carType;
        this.carsColor = carsColor;
        this.maxPlayers = maxPlayers;
        this.hostPlayer = hostPlayer;
        this.AddRacer(hostPlayer, true);
    }
    AddRacer(player, isHost) {
        const playerPosition = Tools.GetPlayerPosition(player);
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
        });
        LocalUserStorage.SetData(parseInt(player), {
            "race": {
                "race_id": this.id,
                "racer_id": this.racers.length - 1,
                "isHost": isHost
            }
        });
        Tools.SendMessageToPlayer(player, "Вы добавлены в гонку, ожидайте начала.");
    }
    static RegisterCommands() {
        RegisterCommand('createrace', (source, args) => {
            if (args.length != 4)
                throw new Error("Команда введена некорректно:\n/createrace [трасса] [название машины, которую будут использовать игроки] [цвет машины] [максимальное количество игроков (2-16)]");
            if (!this.IsTrackExist(args[0]))
                throw new Error(`Карты ${args[0]} не существует.`);
            if (!(parseInt(args[3]) >= 2 && parseInt(args[3]) <= 16))
                throw new Error("Максимальное количество игроков должно быть в диапазоне от 2 до 16.");
            this.races.push(new Race(this.tracks.filter(el => el.name === args[0])[0], args[1], parseInt(args[2]), parseInt(args[3]), source));
        }, false);
    }
    static IsTrackExist(track) {
        for (let i = 0; i < this.tracks.length; i++) {
            if (this.tracks[i].name === track)
                return true;
        }
        return false;
    }
}
Race.races = [];
Race.tracks = [
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
];
class Server {
    static Main() {
        LocalUserStorage.HandlePlayersJoining();
        Race.RegisterCommands();
        RegisterCommand('coords', (source) => {
            const coords = GetEntityCoords(GetPlayerPed(source));
            Tools.SendMessageToPlayer(source, `X: ${coords[0]}, Y: ${coords[1]}, Z: ${coords[2]}`);
        }, false);
    }
}
Server.Main();
