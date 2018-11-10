interface IMessage {
    command: string;
    payload: any;
}

interface IUpdatePreviewPayload {
    uri: string;
    data: string;
}

export function updatePreview(payload: IUpdatePreviewPayload) : IMessage {
    return {
        command: 'source:update',
        payload
    };
}