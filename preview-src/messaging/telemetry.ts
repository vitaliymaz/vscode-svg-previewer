import messageBroker from './';

const TELEMETRY_EVENT_ZOOM = 'zoom';
const TELEMETRY_EVENT_CHANGE_BACKGROUND = 'changeBackground';

class TelemetryReporter {
    sendZoomEvent(type: string) {
        messageBroker.send({
            command: 'sendTelemetryEvent',
            payload: {
                eventName: TELEMETRY_EVENT_ZOOM,
                properties: { type }
            }
        });
    }

    sendChangeBackgroundEvent(color: string) {
        messageBroker.send({
            command: 'sendTelemetryEvent',
            payload: {
                eventName: TELEMETRY_EVENT_CHANGE_BACKGROUND,
                properties: { color }
            }
        });
    }
}

export default new TelemetryReporter();