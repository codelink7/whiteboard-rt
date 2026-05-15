package main

type Vec2 struct {
	X float32 `json:"x"`
	Y float32 `json:"y"`
}

type User struct {
	Id              string `json:"id"`
	CurrentCanvasId string `json:"current_room_id"`
	Present         bool   `json:"present"`
	CursorPosition  Vec2   `json:"cursor_pos"`
}

type ShapeType int

const (
	Rect ShapeType = iota
	Circle
	Line
	Path
)

type Shape struct {
	Id       string
	Type     ShapeType
	Position Vec2
	Size     Vec2
	Radius   float32
	Filled   bool
	Points   []Vec2
	Text     Text
	Color    uint
}

type Text struct {
	Id       string
	Size     int
	Position Vec2
	Color    uint
}

type BrushStroke struct {
	Id        string
	LineWidth float32
	Points    []Vec2
	Color     uint
}

type CanvasData struct {
	Shapes       []*Shape
	Text         []*Text
	BrushStrokes []*BrushStroke
}

type EventType int

const (
	CreatRect EventType = iota
)

type Event struct {
	UserId    string    `json:"user_id"`
	Timestamp int64     `json:"timestamp"`
	Type      EventType `json:"type"`
	Value     []byte    `json:"value"`
}

type Canvas struct {
	Id       string      `json:"id"`
	OwnerId  string      `json:"owner_id"`
	Snapshot *CanvasData `json:"snapshot"`
	EventLog []*Event    `json:"event_log"`
}

var (
	users       []*User   // users table
	canvases    []*Canvas // canvases table
	socketRooms []*Room
)
