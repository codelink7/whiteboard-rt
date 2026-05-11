package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

var clients = make(map[*websocket.Conn]bool)      // Connected clients
var roomBroadcasts = make(map[string]chan []byte) // Broadcast channel
var mutex = &sync.Mutex{}                         // Protect clients map

func handleWebsocket(w http.ResponseWriter, r *http.Request) {
	// Upgrade the HTTP connection to a WebSocket connection
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println("Error upgrading:", err)
		return
	}
	defer conn.Close()

	userId := userIdCounter
	userIdCounter++
	log.Println("User ", userId)

	go handleConnection(conn, userId)
}

func handleConnection(conn *websocket.Conn, userId int) {
	for {
		// Read message from the client
		_, message, err := conn.ReadMessage()
		if err != nil {
			fmt.Println("Error reading message:", err)
			break
		}
		fmt.Printf("Received: %s\n", message)

		var jsonData RoomData
		json.Unmarshal(message, &jsonData)

		roomId := jsonData.Id
		rooms[roomId] = jsonData
		userRoom[userId] = roomId

		if roomUsers[roomId] != nil {
			roomUsers[roomId][userId] = true
		} else {
			roomUsers[roomId] = make(map[int]any)
			roomUsers[roomId][userId] = true
		}

		for k, v := range userOutChannels {
			if k != userId {
				_, exists := roomUsers[roomId][k]
				if exists {
					v <- []byte("updated")
				}
			}
		}
		// fmt.Printf("Received: %s\n", message)
		// Echo the message back to the client
		// if err := conn.WriteMessage(websocket.TextMessage, message); err != nil {
		// 	fmt.Println("Error writing message:", err)
		// 	break
		// }

		for msg := range userOutChannels[userId] {
			if string(msg) == "updated" {
				data, err := json.Marshal(rooms[userRoom[userId]])
				if err != nil {
					log.Println(err)
				}
				if err := conn.WriteMessage(websocket.TextMessage, data); err != nil {
					fmt.Println("Error writing message:", err)
					break
				}
			}
		}
	}
}
