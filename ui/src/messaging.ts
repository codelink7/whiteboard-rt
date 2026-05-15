export enum MessageType {
    NewCanvas,
    ConnectToCanvas,
    CanvasCreated,
	UserCreated,
    CursorUpdate
}

export interface Message {
    type: MessageType
    data: string
}