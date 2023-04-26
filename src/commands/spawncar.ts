export = {
    name: 'spawncar',
    isResctricted: false,
    execute (source: object, args: string[]): void {
        emit('chat:addMessage', {
            args: [`I wish I could spawn this ${(args.length > 0 ? `${args[0]} or` : ``)} adder but my owner was too lazy. :(`]
        });
    }
}
