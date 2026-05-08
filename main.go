package main

import (
	"crypto/sha1"
	"encoding/base64"
	"fmt"
	"log"
	"net"
	"net/http"
	"time"
)

func readLoop(conn net.Conn) {
	for {
		buf := make([]byte, 4096)

		n, err := conn.Read(buf)
		if err != nil {
			return
		}

		fmt.Println("Received: ", n, buf[:n])
	}
}

func writeLoop(conn net.Conn, out <-chan []byte) {
	for msg := range out {
		frame := []byte{
			0x81,
			byte(len(msg)),
		}
		frame = append(frame, msg...)
		conn.Write(frame)
	}
}

func main() {

	router := http.NewServeMux()

	fs := http.FileServer(http.Dir("./ui/static"))

	router.Handle("GET /static/", http.StripPrefix("/static", fs))

	router.HandleFunc("GET /", home)

	router.HandleFunc("GET /websocket", func(w http.ResponseWriter, r *http.Request) {
		const wsMagicString = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
		wsKey := r.Header.Get("Sec-WebSocket-Key")

		hasher := sha1.New()
		hasher.Write([]byte(wsKey + wsMagicString))

		sha1Sum := hasher.Sum(nil)

		acceptKey := base64.StdEncoding.EncodeToString(sha1Sum)

		w.Header().Add("Sec-WebSocket-Accept", acceptKey)
		w.Header().Add("Connection", "Upgrade")
		w.Header().Add("Upgrade", "websocket")
		w.WriteHeader(http.StatusSwitchingProtocols)

		// hijack tcp
		hj, ok := w.(http.Hijacker)
		if !ok {
			return
		}

		conn, _, err := hj.Hijack()
		if err != nil {
			log.Print(err.Error())
		}

		var outgoing chan []byte = make(chan []byte)

		go readLoop(conn)
		go writeLoop(conn, outgoing)

		outgoing <- []byte("Hello")

		time.Sleep(5 * time.Second)
		outgoing <- []byte("{\"name\":\"Void\"}")
	})

	log.Println("Starting server at http://localhost:3000")

	err := http.ListenAndServe("localhost:3000", router)
	if err != nil {
		log.Fatalf("Error starting server: %s", err)
	}
}
