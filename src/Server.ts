import "@citizenfx/server";

abstract class LocalUserStorage {
    private static storage: object[] = [];

    public static GetData(player: number): object {
        if (this.storage[player] === undefined)
            LocalUserStorage.SetData(player, {});
        return this.storage[player];
    }

    public static SetData(player: number, content: object): void {
        this.storage[player] = content;
    }

    public static ClearPlayer(player: number): void {
        this.storage[player] = {};
    }
}

abstract class Tools {
    public static SetEntityPosition(
        source: string,
        x: number,
        y: number,
        z: number
    ): void {
        SetEntityCoords(
            GetPlayerPed(source),
            x,
            y,
            z,
            true,
            false,
            true,
            false
        );
    }

    public static GetPlayerPosition(player: number): IPlayerPosition {
        const playerPosition = GetEntityCoords(GetPlayerPed(player.toString()));
        return {
            x: playerPosition[0],
            y: playerPosition[1],
            z: playerPosition[2]
        };
    }

    public static SendMessageToPlayer(player: number, content: string): void {
        TriggerClientEvent("chat:addMessage", player.toString(), {
            args: [content]
        });
    }

    public static RangeRandom(from: number, to: number): number {
        from = Math.ceil(from);
        to = Math.floor(to);
        return Math.floor(Math.random() * (to - from + 1)) + from;
    }

    public static DoesPlayerExist(source: number): boolean {
        return DoesEntityExist(GetPlayerPed(source.toString()));
    }
}

class Race {
    private static races: Race[] = [];
    private static readonly tracks: ITrack[] = [
        {
            name: "airport",
            x: -1536.65,
            y: -1536.65,
            z: 13.92
        },
        {
            name: "zancudo",
            x: -2344.373,
            y: 3267.498,
            z: 32.811
        },
        {
            name: "highway",
            x: 1993.58,
            y: 2563.58,
            z: 54.605
        }
    ];
    private static readonly maxPlayersInRace = 16;

    private readonly id: number;
    private readonly track: ITrack;
    private readonly carType: string;
    private readonly carsColor: number;
    private readonly maxPlayers: number;
    private readonly raceTime: number = 20000;

    private hostPlayer: number;
    private racers: IRacer[] = [];
    private raceStarted: boolean = false;

    private constructor(
        track: ITrack,
        carType: string,
        carsColor: number,
        maxPlayers: number,
        hostPlayer: number
    ) {
        this.id = Race.races.length;
        this.track = track;
        this.carType = carType;
        this.carsColor = carsColor;
        this.maxPlayers = maxPlayers;
        this.hostPlayer = hostPlayer;

        this.AddRacer(hostPlayer, true);
    }

    private AddRacer(player: number, isHost: boolean): void {
        const playerPosition = Tools.GetPlayerPosition(player);
        const car = CreateVehicle(
            this.carType,
            Tools.RangeRandom(this.track.x - 50, this.track.x + 50),
            Tools.RangeRandom(this.track.y - 50, this.track.y + 50),
            this.track.z,
            0,
            true,
            true
        );

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

        Tools.SendMessageToPlayer(
            player,
            "Вы добавлены в гонку, ожидайте начала."
        );
    }

    private LeaveRace(player: number): void {
        const racer = this.racers.find((el) => el.player === player);
        if (racer === undefined) throw new Error("Игрок не участвует в гонке.");
        if (this.racers.length == 2) {
            this.EndRace();
            return;
        }

        DeleteEntity(racer.carHash);
        Tools.SetEntityPosition(
            player.toString(),
            racer.beforeStartPosition.x,
            racer.beforeStartPosition.y,
            racer.beforeStartPosition.z
        );
        this.racers = this.racers.filter((el) => el.player !== player);

        if (racer.player === this.hostPlayer && this.raceStarted) {
            const newHost = this.racers[0];
            this.hostPlayer = newHost.player;
            this.racers[0].isHost = true;
        }

        LocalUserStorage.ClearPlayer(player);
    }

    private StartRace(): void {
        for (let i = 0; i < this.racers.length; i++) {
            const racer = this.racers[i];
            FreezeEntityPosition(racer.carHash, false);

            const coords = GetEntityCoords(racer.carHash);
            SetEntityCoords(
                racer.carHash,
                coords[0],
                coords[1],
                coords[2] + 3,
                true,
                false,
                true,
                false
            );
            Tools.SendMessageToPlayer(
                this.racers[i].player,
                `Гонка началась, она продлится ${this.raceTime / 1000} секунд`
            );
        }
        this.raceStarted = true;

        setTimeout(() => this.EndRace(), this.raceTime);
    }

    private EndRace(): void {
        for (let i = 0; i < this.racers.length; i++) {
            const racer = this.racers[i];
            this.LeaveRace(racer.player);
            Tools.SendMessageToPlayer(racer.player, `Гонка завершена!`);
        }
    }

    private RaceInvite(player: number): void {
        if (!DoesEntityExist(player)) throw new Error("Игрок не на сервере.");
        this.AddRacer(player, false);
    }

    private static DoesTakePartInAnyRace(player: number): boolean {
        const userData = LocalUserStorage.GetData(player);
        return Object.keys(userData).length !== 0;
    }

    public static RegisterCommands(): void {
        RegisterCommand(
            "createrace",
            (source: string, args: string[]) => {
                if (Race.DoesTakePartInAnyRace(parseInt(source)))
                    throw new Error("Игрок уже участвует в гонке");
                if (args.length != 4)
                    throw new Error(
                        `Команда введена некорректно:\n/createrace [трасса] [название машины, которую будут использовать игроки] [цвет машины] [максимальное количество игроков (2-${Race.maxPlayersInRace})]`
                    );
                if (!this.DoesTrackExist(args[0]))
                    throw new Error(`Карты ${args[0]} не существует.`);
                if (!(parseInt(args[3]) >= 1 && parseInt(args[3]) <= Race.maxPlayersInRace))
                    throw new Error(
                        `Максимальное количество игроков должно быть в диапазоне от 2 до ${Race.maxPlayersInRace}.`
                    );

                this.races.push(
                    new Race(
                        this.tracks.filter((el) => el.name === args[0])[0],
                        args[1],
                        parseInt(args[2]),
                        parseInt(args[3]),
                        parseInt(source)
                    )
                );
            },
            false
        );

        RegisterCommand(
            "leaverace",
            (source: string, args: string[]) => {
                const userData = LocalUserStorage.GetData(parseInt(source));
                if (Object.keys(userData).length == 0)
                    throw new Error("Вы не находитесь в гонке.");
                Race.races
                    .filter((el) => el.id === (userData as any).race.race_id)[0]
                    .LeaveRace(parseInt(source));
            },
            false
        );

        RegisterCommand(
            "startrace",
            (source: string, args: string[]) => {
                const userData = LocalUserStorage.GetData(parseInt(source));
                if (Object.keys(userData).length == 0)
                    throw new Error("Вы не находитесь в гонке.");

                const race = Race.races[(userData as any).race.race_id];
                if (race.hostPlayer !== parseInt(source))
                    throw new Error("Вы не являетесь хостом гонки.");
                if (race.racers.length < race.maxPlayers)
                    throw new Error(
                        `Недостаточно игроков для старта гонки [${race.racers.length}/${race.maxPlayers}]`
                    );

                race.StartRace();
            },
            false
        );

        RegisterCommand(
            "endrace",
            (source: string, args: string[]) => {
                if (!this.DoesTakePartInAnyRace(parseInt(source)))
                    throw new Error("Вы не находитесь в гонке.");

                const userData = LocalUserStorage.GetData(parseInt(source));
                const race = Race.races[(userData as any).race.race_id];
                if (race.hostPlayer !== parseInt(source))
                    throw new Error("Вы не являетесь хостом гонки.");
                if (!race.raceStarted) throw new Error("Гонка еще не началась");

                race.EndRace();
            },
            false
        );

        RegisterCommand(
            "raceinvite",
            (source: string, args: string[]) => {
                if (!this.DoesTakePartInAnyRace(parseInt(source)))
                    throw new Error("Вы не находитесь в гонке.");
                if (args.length !== 1)
                    throw new Error(
                        "Команда введена некорректно:\n/raceinvite [id игрока]"
                    );

                const invitedPlayer = parseInt(args[0]);
                if (!Tools.DoesPlayerExist(invitedPlayer))
                    throw new Error("Игрок не на сервере.");
                if (this.DoesTakePartInAnyRace(invitedPlayer))
                    throw new Error("Игрок уже участвует в гонке.");

                const userData = LocalUserStorage.GetData(parseInt(source));
                const race = Race.races[(userData as any).race.race_id];
                race.RaceInvite(invitedPlayer);
            },
            false
        );
    }

    private static DoesTrackExist(track: string): boolean {
        for (let i = 0; i < this.tracks.length; i++) {
            if (this.tracks[i].name === track) return true;
        }
        return false;
    }
}

abstract class Server {
    public static Main(): void {
        Race.RegisterCommands();

        RegisterCommand(
            "coords",
            (source: string) => {
                const coords = GetEntityCoords(GetPlayerPed(source));
                Tools.SendMessageToPlayer(
                    parseInt(source),
                    `X: ${coords[0]}, Y: ${coords[1]}, Z: ${coords[2]}`
                );
            },
            false
        );
    }
}

Server.Main();
