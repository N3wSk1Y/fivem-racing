import { Tools } from "../Utilities/Tools";
import { LocalUserStorage } from "../Utilities/LocalUserStorage";
import { ITrack } from "./ITrack";
import { IRacer } from "./IRacer";
import { CommandsRegistrator } from "../Commands/CommandsRegistrator";

export class Race {
    private static races: Race[] = [];
    private static readonly tracks: ITrack[] = require("./tracks.json")

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
        CommandsRegistrator.Register({
            arguments: [
                {
                    name: "трасса",
                    type: "string",
                    validation(source: string, args: string[]) {
                        if (!Race.DoesTrackExist(args[0]))
                            throw new Error(`Трассы ${args[0]} не существует.`);
                    }
                },
                {
                    name: "автомобиль участников",
                    type: "string",
                },
                {
                    name: "цвет автомобилей",
                    type: "number",
                },
                {
                    name: "максимальное количество игроков",
                    type: "number",
                    validation(source: string, args: string[]) {
                        if (!(parseInt(args[3]) >= 1 && parseInt(args[3]) <= 16))
                            throw new Error(
                                `Максимальное количество игроков должно быть в диапазоне от 2 до ${16}.`
                            );
                    },
                }
            ], name: "createrace", note: "/createrace [трасса] [название машины, которую будут использовать игроки] [цвет машины] [максимальное количество игроков (2-16)]", handler(source: string, args: string[]): void {
                if (Race.DoesTakePartInAnyRace(parseInt(source)))
                    throw new Error("Игрок уже участвует в гонке");
                Race.races.push(
                    new Race(
                        Race.tracks.filter((el) => el.name === args[0])[0],
                        args[1],
                        parseInt(args[2]),
                        parseInt(args[3]),
                        parseInt(source)
                    )
                );
            }
        })

        CommandsRegistrator.Register({
            arguments: [], name: "leaverace", note: "/leaverace", handler(source: string, args: string[]): void {
                const userData = LocalUserStorage.GetData(parseInt(source));
                if (!Race.DoesTakePartInAnyRace(parseInt(source)))
                    throw new Error("Вы не находитесь в гонке.");
                Race.races
                    .filter((el) => el.id === (userData as any).race.race_id)[0]
                    .LeaveRace(parseInt(source));
            }
        })

        CommandsRegistrator.Register({
            arguments: [], name: "startrace", note: "/startrace", handler(source: string, args: string[]): void {
                const userData = LocalUserStorage.GetData(parseInt(source));
                if (!Race.DoesTakePartInAnyRace(parseInt(source)))
                    throw new Error("Вы не находитесь в гонке.");

                const race = Race.races[(userData as any).race.race_id];
                if (race.hostPlayer !== parseInt(source))
                    throw new Error("Вы не являетесь хостом гонки.");
                if (race.racers.length < race.maxPlayers)
                    throw new Error(
                        `Недостаточно игроков для старта гонки [${race.racers.length}/${race.maxPlayers}]`
                    );

                race.StartRace();
            }
        })

        CommandsRegistrator.Register({
            arguments: [], name: "endrace", note: "/endrace", handler(source: string, args: string[]): void {
                if (!Race.DoesTakePartInAnyRace(parseInt(source)))
                    throw new Error("Вы не находитесь в гонке.");

                const userData = LocalUserStorage.GetData(parseInt(source));
                const race = Race.races[(userData as any).race.race_id];
                if (race.hostPlayer !== parseInt(source))
                    throw new Error("Вы не являетесь хостом гонки.");
                if (!race.raceStarted) throw new Error("Гонка еще не началась");

                race.EndRace();
            }
        })

        CommandsRegistrator.Register({
            arguments: [{
                name: "id игрока",
                type: "number",
                validation(source: string, args: string[]): void {
                    const invitedPlayer = parseInt(args[0]);
                    if (!Tools.DoesPlayerExist(invitedPlayer))
                        throw new Error("Игрок не на сервере.");
                    if (Race.DoesTakePartInAnyRace(invitedPlayer))
                        throw new Error("Игрок уже участвует в гонке.");
                }
            }], name: "raceinvite", note: "/raceinvite [id игрока]", handler(source: string, args: string[]): void {
                if (!Race.DoesTakePartInAnyRace(parseInt(source)))
                    throw new Error("Вы не находитесь в гонке.");

                const userData = LocalUserStorage.GetData(parseInt(source));
                const race = Race.races[(userData as any).race.race_id];
                const invitedPlayer = parseInt(args[0]);
                race.RaceInvite(invitedPlayer);
            }
        })
    }

    private static DoesTrackExist(track: string): boolean {
        for (let i = 0; i < this.tracks.length; i++) {
            if (this.tracks[i].name === track) return true;
        }
        return false;
    }
}