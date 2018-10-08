class MessageBroker extends EventEmitter {
    constructor() {
        super();
        window.addEventListener('message', event => {
            console.log('got message');
            const { command, payload } = event.data;
            this.emit(command, payload);
        });
    }
}