//Modified Main function

package main

import (
	"bikemaintanence/data"
	"bikemaintanence/models"
	"database/sql"
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/mux"
)

var db *sql.DB

// --- CORS middleware added at package level ---
func enableCORS(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		h.ServeHTTP(w, r)
	})
}

func main() {
	// Connection to a database
	db = data.DB_connection()
	defer db.Close()
	models.InitDB(db)

	// Creating a new router
	r := mux.NewRouter()

	// Registering routes and Handlers
	r.HandleFunc("/vehicles", models.GetVehicles).Methods("GET")
	r.HandleFunc("/vehicle/{id}", models.GetVehicle).Methods("GET")
	r.HandleFunc("/vehicle/{id}/viewmaintenance", models.ViewMaintenenceRecord).Methods("GET") // View Bike Record
	r.HandleFunc("/vehicle/{vid}/{sid}/viewmaintenancebyvidsid", models.ViewMaintenenceRecordByvsid).Methods("GET")
	r.HandleFunc("/vehicle/{vid}/{sid}/addmaintenance", models.AddMaintenanceRecord).Methods("POST") // Add bike record

	// Start server on port 8080 with CORS enabled
	fmt.Println("starting server on http://localhost:8080...")
	handler := enableCORS(r)
	log.Fatal(http.ListenAndServe(":8080", handler))
}
