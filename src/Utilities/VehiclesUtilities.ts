import { IEntityPosition } from "./IEntityPosition";
import { MathsUtilities } from "./MathsUtilities";

export class VehiclesUtilities {
    public static CreateVehicle(carType: string, position: IEntityPosition): number {
        return CreateVehicle(
            carType,
            position.x,
            position.y,
            position.z,
            0,
            true,
            true
        );
    }

    public static FreezeVehicle(vehicle: number): void {
        FreezeEntityPosition(vehicle, true);
    }

    public static UnFreezeVehicle(vehicle: number): void {
        FreezeEntityPosition(vehicle, false);
    }

    public static LockVehicleDoors(vehicle: number): void {
        SetVehicleDoorsLocked(vehicle, 4);
    }
}