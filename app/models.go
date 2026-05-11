package main

type Vec2 struct {
	X float32 `json:"x"`
	Y float32 `json:"y"`
}

type RoomData struct {
	Id           string `json:"id"`
	CameraTarget Vec2   `json:"cameraTarget"`
}