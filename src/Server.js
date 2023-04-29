"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@citizenfx/server");
class LocalUserStorage {
    static GetData(player) {
        if (this.storage[player] === undefined)
            LocalUserStorage.SetData(player, {});
        return this.storage[player];
    }
    static SetData(player, content) {
        this.storage[player] = content;
    }
    static ClearPlayer(player) {
        this.storage[player] = {};
    }
}
LocalUserStorage.storage = [];
class Tools {
    static SetEntityPosition(source, x, y, z) {
        SetEntityCoords(GetPlayerPed(source), x, y, z, true, false, true, false);
    }
    static GetPlayerPosition(player) {
        const playerPosition = GetEntityCoords(GetPlayerPed(player.toString()));
        return {
            x: playerPosition[0],
            y: playerPosition[1],
            z: playerPosition[2]
        };
    }
    static SendMessageToPlayer(player, content) {
        TriggerClientEvent("chat:addMessage", player.toString(), {
            args: [content]
        });
    }
    static RangeRandom(from, to) {
        from = Math.ceil(from);
        to = Math.floor(to);
        return Math.floor(Math.random() * (to - from + 1)) + from;
    }
    static DoesPlayerExist(source) {
        return DoesEntityExist(GetPlayerPed(source.toString()));
    }
}
class Race {
    constructor(track, carType, carsColor, maxPlayers, hostPlayer) {
        this.raceTime = 20000;
        this.racers = [];
        this.raceStarted = false;
        this.id = Race.races.length;
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
        SetPedIntoVehicle(player, car, 0);
        SetVehicleDoorsLocked(car, 4);
        FreezeEntityPosition(car, true);
        this.racers.push({
            player: player,
            isHost: isHost,
            carHash: car,
            beforeStartPosition: {
                x: playerPosition.x,
                y: playerPosition.y,
                z: playerPosition.z
            }
        });
        LocalUserStorage.SetData(player, {
            race: {
                race_id: this.id,
                racer_id: this.racers.length - 1
            }
        });
        Tools.SendMessageToPlayer(player, "Вы добавлены в гонку, ожидайте начала.");
    }
    LeaveRace(player) {
        const racer = this.racers.find((el) => el.player === player);
        if (racer === undefined)
            throw new Error("Игрок не участвует в гонке.");
        if (this.racers.length == 2) {
            this.EndRace();
            return;
        }
        DeleteEntity(racer.carHash);
        Tools.SetEntityPosition(player.toString(), racer.beforeStartPosition.x, racer.beforeStartPosition.y, racer.beforeStartPosition.z);
        this.racers = this.racers.filter((el) => el.player !== player);
        if (racer.player === this.hostPlayer && this.raceStarted) {
            const newHost = this.racers[0];
            this.hostPlayer = newHost.player;
            this.racers[0].isHost = true;
        }
        LocalUserStorage.ClearPlayer(player);
    }
    StartRace() {
        for (let i = 0; i < this.racers.length; i++) {
            const racer = this.racers[i];
            FreezeEntityPosition(racer.carHash, false);
            const coords = GetEntityCoords(racer.carHash);
            SetEntityCoords(racer.carHash, coords[0], coords[1], coords[2] + 3, true, false, true, false);
            Tools.SendMessageToPlayer(this.racers[i].player, `Гонка началась, она продлится ${this.raceTime / 1000} секунд`);
        }
        this.raceStarted = true;
        setTimeout(() => this.EndRace(), this.raceTime);
    }
    EndRace() {
        for (let i = 0; i < this.racers.length; i++) {
            const racer = this.racers[i];
            this.LeaveRace(racer.player);
            Tools.SendMessageToPlayer(racer.player, `Гонка завершена!`);
        }
    }
    RaceInvite(player) {
        if (!DoesEntityExist(player))
            throw new Error("Игрок не на сервере.");
        this.AddRacer(player, false);
    }
    static DoesTakePartInAnyRace(player) {
        const userData = LocalUserStorage.GetData(player);
        return Object.keys(userData).length !== 0;
    }
    static RegisterCommands() {
        RegisterCommand("createrace", (source, args) => {
            if (Race.DoesTakePartInAnyRace(parseInt(source)))
                throw new Error("Игрок уже участвует в гонке");
            if (args.length != 4)
                throw new Error("Команда введена некорректно:\n/createrace [трасса] [название машины, которую будут использовать игроки] [цвет машины] [максимальное количество игроков (2-16)]");
            if (!this.DoesTrackExist(args[0]))
                throw new Error(`Карты ${args[0]} не существует.`);
            if (!(parseInt(args[3]) >= 1 && parseInt(args[3]) <= 16))
                throw new Error("Максимальное количество игроков должно быть в диапазоне от 2 до 16.");
            this.races.push(new Race(this.tracks.filter((el) => el.name === args[0])[0], args[1], parseInt(args[2]), parseInt(args[3]), parseInt(source)));
        }, false);
        RegisterCommand("leaverace", (source, args) => {
            const userData = LocalUserStorage.GetData(parseInt(source));
            if (Object.keys(userData).length == 0)
                throw new Error("Вы не находитесь в гонке.");
            Race.races
                .filter((el) => el.id === userData.race.race_id)[0]
                .LeaveRace(parseInt(source));
        }, false);
        RegisterCommand("startrace", (source, args) => {
            const userData = LocalUserStorage.GetData(parseInt(source));
            if (Object.keys(userData).length == 0)
                throw new Error("Вы не находитесь в гонке.");
            const race = Race.races[userData.race.race_id];
            if (race.hostPlayer !== parseInt(source))
                throw new Error("Вы не являетесь хостом гонки.");
            if (race.racers.length < race.maxPlayers)
                throw new Error(`Недостаточно игроков для старта гонки [${race.racers.length}/${race.maxPlayers}]`);
            race.StartRace();
        }, false);
        RegisterCommand("endrace", (source, args) => {
            if (!this.DoesTakePartInAnyRace(parseInt(source)))
                throw new Error("Вы не находитесь в гонке.");
            const userData = LocalUserStorage.GetData(parseInt(source));
            const race = Race.races[userData.race.race_id];
            if (race.hostPlayer !== parseInt(source))
                throw new Error("Вы не являетесь хостом гонки.");
            if (!race.raceStarted)
                throw new Error("Гонка еще не началась");
            race.EndRace();
        }, false);
        RegisterCommand("raceinvite", (source, args) => {
            if (!this.DoesTakePartInAnyRace(parseInt(source)))
                throw new Error("Вы не находитесь в гонке.");
            if (args.length !== 1)
                throw new Error("Команда введена некорректно:\n/raceinvite [id игрока]");
            const invitedPlayer = parseInt(args[0]);
            if (!Tools.DoesPlayerExist(invitedPlayer))
                throw new Error("Игрок не на сервере.");
            if (this.DoesTakePartInAnyRace(invitedPlayer))
                throw new Error("Игрок уже участвует в гонке.");
            const userData = LocalUserStorage.GetData(parseInt(source));
            const race = Race.races[userData.race.race_id];
            race.RaceInvite(invitedPlayer);
        }, false);
    }
    static DoesTrackExist(track) {
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
        name: "airport",
        x: -1088.68,
        y: -2844.33,
        z: 27.71
    },
    {
        name: "zancudo",
        x: -2344.373,
        y: 3267.498,
        z: 32.811
    },
    {
        name: "highway",
        x: 0,
        y: 0,
        z: 0
    }
];
class Server {
    static Main() {
        Race.RegisterCommands();
        RegisterCommand("coords", (source) => {
            const coords = GetEntityCoords(GetPlayerPed(source));
            Tools.SendMessageToPlayer(parseInt(source), `X: ${coords[0]}, Y: ${coords[1]}, Z: ${coords[2]}`);
        }, false);
    }
}
Server.Main();
