import { TracksManager } from "./TracksManager";
import { Race } from "./Race";
import { CommandsRegistrator } from "../Commands/CommandsRegistrator";
import { LocalUserStorage } from "../Utilities/LocalUserStorage";
import { EntityUtilities } from "../Utilities/EntityUtilities";
import { PlayerUtilities } from "../Utilities/PlayerUtilities";
import { DimensionsManager } from "../Dimensions/DimensionsManager";
import { Dimension } from "../Dimensions/Dimension";

export class RacingManager {
    private races: Race[] = [];
    private readonly tracksManager: TracksManager;

    public constructor(tracksManager: TracksManager) {
        this.tracksManager = tracksManager;
    }

    private AddRace(race: Race): void {
        this.races.push(race);
    }

    private DoesTakePartInAnyRace(player: number): boolean {
        const userData = LocalUserStorage.GetData(player);
        return Object.keys(userData).length !== 0;
    }

    public RegisterCommands(): void {
        const racingManager = this;
        CommandsRegistrator.Register({
            arguments: [
                {
                    name: "трасса",
                    type: "string",
                    validation(source: string, args: string[]) {
                        if (!racingManager.tracksManager.DoesTrackExist(args[0]))
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
            ], name: "createrace", note: "/createrace [трасса] [название машины, которую будут использовать игроки] [цвет машины] [максимальное количество игроков (2-16)]",
            handler(source: string, args: string[]): void {
                if (racingManager.DoesTakePartInAnyRace(parseInt(source)))
                    throw new Error("Игрок уже участвует в гонке");
                racingManager.AddRace(
                    new Race(
                        racingManager.races.length,
                        racingManager.tracksManager.Tracks.filter((el) => el.name === args[0])[0],
                        args[1],
                        parseInt(args[2]),
                        parseInt(args[3]),
                        parseInt(source),
                        DimensionsManager.AddDimension(new Dimension(DimensionsManager.dimensions.length))
                    )
                );
            }
        })

        CommandsRegistrator.Register({
            arguments: [], name: "leaverace", note: "/leaverace",
            handler(source: string, args: string[]): void {
                const userData = LocalUserStorage.GetData(parseInt(source));
                if (!racingManager.DoesTakePartInAnyRace(parseInt(source)))
                    throw new Error("Вы не находитесь в гонке.");
                racingManager.races
                    .filter((el) => el.id === (userData as any).race.race_id)[0]
                    .LeaveRace(parseInt(source));
            }
        })

        CommandsRegistrator.Register({
            arguments: [], name: "startrace", note: "/startrace",
            handler(source: string, args: string[]): void {
                const userData = LocalUserStorage.GetData(parseInt(source));
                if (!racingManager.DoesTakePartInAnyRace(parseInt(source)))
                    throw new Error("Вы не находитесь в гонке.");

                const race = racingManager.races[(userData as any).race.race_id];
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
                if (!racingManager.DoesTakePartInAnyRace(parseInt(source)))
                    throw new Error("Вы не находитесь в гонке.");

                const userData = LocalUserStorage.GetData(parseInt(source));
                const race = racingManager.races[(userData as any).race.race_id];
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
                    if (!PlayerUtilities.DoesPlayerExist(invitedPlayer))
                        throw new Error("Игрок не на сервере.");
                    if (racingManager.DoesTakePartInAnyRace(invitedPlayer))
                        throw new Error("Игрок уже участвует в гонке.");
                }
            }], name: "raceinvite", note: "/raceinvite [id игрока]",
            handler: (source: string, args: string[], racingManager: RacingManager = this): void => {
                if (!racingManager.DoesTakePartInAnyRace(parseInt(source)))
                    throw new Error("Вы не находитесь в гонке.");

                const userData = LocalUserStorage.GetData(parseInt(source));
                const race = this.races[(userData as any).race.race_id];
                const invitedPlayer = parseInt(args[0]);
                race.RaceInvite(invitedPlayer);
            }
        })
    }
}