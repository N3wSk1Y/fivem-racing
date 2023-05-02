export class MathsUtilities {
    public static RangeRandom(from: number, to: number): number {
        from = Math.ceil(from);
        to = Math.floor(to);
        return Math.floor(Math.random() * (to - from + 1)) + from;
    }
}