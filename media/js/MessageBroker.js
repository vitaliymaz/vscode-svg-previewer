class MessageBroker extends EventEmitter {
    constructor() {
        super();
        window.addEventListener('message', event => {
            const { command, payload } = event.data;
            this.emit(command, payload);
        });
    }
}