import { EntityUtilities } from "../Utilities/EntityUtilities";
import { LocalUserStorage } from "../Utilities/LocalUserStorage";
import { ITrack } from "./ITrack";
import { IRacer } from "./IRacer";
import { VehiclesUtilities } from "../Utilities/VehiclesUtilities";
import { PlayerUtilities } from "../Utilities/PlayerUtilities";
import { MathsUtilities } from "../Utilities/MathsUtilities";

export class Race {
    public readonly id: number;
    public readonly track: ITrack;
    public readonly carType: string;
    public readonly carsColor: number;
    public readonly maxPlayers: number;
    public readonly raceTime: number = 20000;

    public hostPlayer: number;
    public racers: IRacer[] = [];
    public raceStarted: boolean = false;

    public constructor(
        id: number,
        track: ITrack,
        carType: string,
        carsColor: number,
        maxPlayers: number,
        hostPlayer: number
    ) {
        this.id = id;
        this.track = track;
        this.carType = carType;
        this.carsColor = carsColor;
        this.maxPlayers = maxPlayers;
        this.hostPlayer = hostPlayer;

        this.AddRacer(hostPlayer, true);
    }

    public AddRacer(player: number, isHost: boolean): void {
        const playerPosition = EntityUtilities.GetEntityPosition(player);
        const car = VehiclesUtilities.CreateVehicle(this.carType, {
            x: MathsUtilities.RangeRandom(this.track.x - 50, this.track.x + 50),
            y:  MathsUtilities.RangeRandom(this.track.y - 50, this.track.y + 50),
            z: this.track.z
        })

        SetVehicleColours(car, this.carsColor, this.carsColor);
        SetPedIntoVehicle(player, car, 0);
        VehiclesUtilities.LockVehicleDoors(car);
        VehiclesUtilities.FreezeVehicle(car);

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

        PlayerUtilities.SendMessageToPlayer(
            player,
            "Вы добавлены в гонку, ожидайте начала."
        );
    }

    public LeaveRace(player: number): void {
        const racer = this.racers.find((el) => el.player === player);
        if (racer === undefined) throw new Error("Игрок не участвует в гонке.");
        if (this.racers.length == 2) {
            this.EndRace();
            return;
        }

        DeleteEntity(racer.carHash);
        EntityUtilities.SetEntityPosition(
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

    public StartRace(): void {
        for (let i = 0; i < this.racers.length; i++) {
            const racer = this.racers[i];
            VehiclesUtilities.UnFreezeVehicle(racer.carHash)

            const coords = GetEntityCoords(racer.carHash);
            EntityUtilities.SetEntityPosition(
                racer.carHash.toString(),
                coords[0],
                coords[1],
                coords[2] + 3
            );
            PlayerUtilities.SendMessageToPlayer(
                this.racers[i].player,
                `Гонка началась, она продлится ${this.raceTime / 1000} секунд`
            );
        }
        this.raceStarted = true;

        setTimeout(() => this.EndRace(), this.raceTime);
    }

    public EndRace(): void {
        for (let i = 0; i < this.racers.length; i++) {
            const racer = this.racers[i];
            this.LeaveRace(racer.player);
            PlayerUtilities.SendMessageToPlayer(racer.player, `Гонка завершена!`);
        }
    }

    public RaceInvite(player: number): void {
        if (!DoesEntityExist(player)) throw new Error("Игрок не на сервере.");
        this.AddRacer(player, false);
    }
}