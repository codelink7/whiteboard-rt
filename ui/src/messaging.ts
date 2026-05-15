export enum MessageType {
    NewCanvas,
    ConnectToCanvas,
    CanvasCreated,
	UserCreated,
    CursorUpdate,
    CanvasEvent
}

export interface Message {
    type: MessageType
    data: any
}