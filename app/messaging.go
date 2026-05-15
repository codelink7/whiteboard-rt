package main

type MessageType int

const (
	NewCanvas MessageType = iota
	ConnectToCanvas
	CanvasCreated
	UserCreated
	CursorUpdate
	CanvasEvent
)

type Message struct {
	Type MessageType `json:"type"`
	Data any         `json:"data"`
}

type NewCanvasMessage struct {
	UserId string `json:"user_id"`
}

type ConnectToCanvasMessage struct {
	UserId   string `json:"user_id"`
	CanvasId string `json:"canvas_id"`
}

type CanvasCreatedMessage struct {
	Canvas Canvas `json:"canvas"`
}

type UserCreatedMessage struct {
	User User `json:"user"`
}

type CursorUpdateMessage struct {
	UserId         string `json:"user_id"`
	CursorPosition Vec2   `json:"cursor_pos"`
	Disconnected   bool   `json:"disconnected"`
}
