export class VehiclesUtilities {
    public static FreezeVehicle(vehicle: number){
        FreezeEntityPosition(vehicle, true);
    }

    public static UnFreezeVehicle(vehicle: number){
        FreezeEntityPosition(vehicle, false);
    }

    public static LockVehicleDoors(vehicle: number){
        SetVehicleDoorsLocked(vehicle, 4);
    }
}