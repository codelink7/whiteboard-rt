package main

import (
	"log"
	"net/http"
)

func main() {

	router := http.NewServeMux()

	fs := http.FileServer(http.Dir("./ui/static"))

	router.Handle("GET /static/", http.StripPrefix("/static", fs))

	router.HandleFunc("GET /", home)

	router.HandleFunc("GET /websocket", handleWebsocket)

	log.Println("Starting server at http://localhost:3000")

	err := http.ListenAndServe("localhost:3000", router)
	if err != nil {
		log.Fatalf("Error starting server: %s", err)
	}
}
