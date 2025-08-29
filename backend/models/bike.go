package models

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
    "strconv"

	"github.com/gorilla/mux"
	_ "github.com/lib/pq"
)

type Vehicle struct {
	ID      int	`json:"id"`
	Make    string	`json:"make"`
	Model   string	`json:"model"`
	Year    int	`json:"year"`
	Mileage int	`json:"mileage"`
}

type DetailedServiceRecord struct {
	ServiceID       int `json:"service_id"`
	Vehicle_id int	`json:"vehicle_id"`
	Service_date string `json:"service_date"`
	PartCode        string `json:"part_code"`
	//PartDescription string ``
	Rate            float64	`json:"rate"`
	TaxableAmount   float64	`json:"taxable_amount"`
	FinalAmount     float64	`json:"final_amount"`
}

var DB *sql.DB

func InitDB(database *sql.DB) {
	DB = database
}

// DB nil check
func DBNilCheck(w http.ResponseWriter)bool{
	if DB==nil{
		http.Error(w, "database not initialized", http.StatusInternalServerError)
		return false
	}
	return true
}

// handler function for route w.Header().Set("Content-type","application/json")
func GetVehicles(w http.ResponseWriter, r *http.Request) {
	if !DBNilCheck(w) {
		return
	}

	query := `SELECT id,make,model,year,mileage FROM owned_vehicles`

	//Executing the query
	rows, err := DB.Query(query)

	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
	}

	if DB == nil {
		http.Error(w, "Database connection not initialized", http.StatusInternalServerError)
		return
	}

	//Declaring an instance bike of struct Bike
	var bike Vehicle

	// Declaring a slice bikes to hold the details of bike
	var bikes []Vehicle

	for rows.Next() {
		err := rows.Scan(&bike.ID, &bike.Make, &bike.Model, &bike.Year, &bike.Mileage)
		if err != nil {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}
		bikes = append(bikes, bike)
	}

	defer rows.Close()

	w.Header().Set("Content-type", "application/json")
	json.NewEncoder(w).Encode(bikes)

}


//Handler function for route r.HandleFunc("/Bikes/{id}", models.GetBike).Methods("GET")
func GetVehicle(w http.ResponseWriter, r *http.Request) {

	if !DBNilCheck(w) {
		return
	}

	//Fetching ID from URL using mux.vars
	vars := mux.Vars(r)
	id:= vars["id"]
	query := `SELECT id,make,model,year,mileage FROM owned_vehicles WHERE id=$1`

	//Executing the query
	rows := DB.QueryRow(query,id)

	var bike Vehicle

		err := rows.Scan(&bike.ID, &bike.Make, &bike.Model, &bike.Year, &bike.Mileage)


		if err != nil {
			http.Error(w, "Bike not found..", http.StatusNotFound)
			return
		}
		//bikes = append(bikes, bike)
		w.Header().Set("Content-type", "application/json")
		json.NewEncoder(w).Encode(bike)
}


// Handler function for route r.HandleFunc("/Bike/{id}", models.ViewMaintenenceRecord).Methods("GET")
func ViewMaintenenceRecord(w http.ResponseWriter, r *http.Request) {
	if !DBNilCheck(w) {
		return
	}

	vars := mux.Vars(r)
	idstr := vars["id"]
	id, err := strconv.Atoi(idstr)
	if err!=nil{
		http.Error(w, "invalid vehicle id", http.StatusBadRequest)
		return
	}

	query := `SELECT serviceid, vehicleid, service_date, partcode, rate, taxable_amount, final_amount
			FROM detailed_service_record
			WHERE vehicleid=$1`

	// Executing the query
	rows, err:= DB.Query(query,id)

	if err !=nil{
		http.Error(w,"error in recieving records", http.StatusInternalServerError)
		log.Println("DB query error:", err)
		return
	}
	defer rows.Close()

	var dsr DetailedServiceRecord
	var Service_record []DetailedServiceRecord

	// Records are multiple so using for loop
	for rows.Next(){
		err:= rows.Scan(
			&dsr.ServiceID,
			&dsr.Vehicle_id,
			& dsr.Service_date,
			&dsr.PartCode,
			&dsr.Rate,
			&dsr.TaxableAmount,
			&dsr.FinalAmount,)

		if err!=nil{
			http.Error(w,"Error scanning record..", http.StatusInternalServerError)
			log.Println("DB query error: ",err)
			return
		}

		Service_record = append(Service_record, dsr)
	}
	
	
	w.Header().Set("Content-type", "application/json")
	json.NewEncoder(w).Encode(Service_record)
}


// Function for View Maintainence Record by Vehicle ID and Service ID
func ViewMaintenenceRecordByvsid(w http.ResponseWriter, r *http.Request){
	if !DBNilCheck(w) {
		return
	}

	Vars := mux.Vars(r)
	vidstr := Vars["vid"]
	sidstr := Vars["sid"]

	vid, err :=strconv.Atoi(vidstr)
	if err!=nil{
		http.Error(w, "invalid vehicle id", http.StatusBadRequest)
		return
	}

	sid, err := strconv.Atoi(sidstr)
	if err !=nil{
		http.Error(w, "invalid vehicle id", http.StatusBadRequest)
		return
	}

	query := `SELECT serviceid, vehicleid, service_date, partcode, rate, taxable_amount, final_amount 
				FROM detailed_service_record
				WHERE vehicleid=$1 AND serviceid=$2`

	// Executing the query
	rows, err := DB.Query(query,vid,sid)
 
	
	if err!=nil{
		http.Error(w,"error in recieving records", http.StatusInternalServerError)
		log.Println("DB query error:", err)
		return
	}

	var detailRecord DetailedServiceRecord
	var service_record []DetailedServiceRecord

	for rows.Next(){
		err:= rows.Scan(
			&detailRecord.ServiceID,
			&detailRecord.Vehicle_id,
			&detailRecord.Service_date,
			&detailRecord.PartCode,
			&detailRecord.Rate,
			&detailRecord.TaxableAmount,
			&detailRecord.FinalAmount,
		)

	if err!=nil{
			http.Error(w,"Error scanning record..", http.StatusInternalServerError)
			log.Println("DB query error: ",err)
			return
			} 
			service_record=append(service_record, detailRecord)
	}

	defer rows.Close()
	
	w.Header().Set("Content-type", "application/json")
	json.NewEncoder(w).Encode(service_record)
}


// Handler function to add a new maintenance record with IDs from URL
func AddMaintenanceRecord(w http.ResponseWriter, r *http.Request) {
	if !DBNilCheck(w) {
		return
	}

    vars := mux.Vars(r)
    vid := vars["vid"]
    sid := vars["sid"]

    // Parse vehicle ID and service ID as integers
    vehicleID, err := strconv.Atoi(vid)
    if err != nil {
        http.Error(w, "Invalid vehicle ID", http.StatusBadRequest)
        return
    }

    serviceID, err := strconv.Atoi(sid)
    if err != nil {
        http.Error(w, "Invalid service ID", http.StatusBadRequest)
        return
    }

    // Decode JSON body for other fields
    var record DetailedServiceRecord
    err = json.NewDecoder(r.Body).Decode(&record)
    if err != nil {
        http.Error(w, "Invalid request payload", http.StatusBadRequest)
        return
    }

    // Set IDs explicitly from URL
    record.Vehicle_id = vehicleID
    record.ServiceID = serviceID

    // Prepare SQL INSERT statement
    query := `
        INSERT INTO detailed_service_record 
        (serviceid, vehicleid, service_date, partcode, rate, taxable_amount, final_amount)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
    `

    // Execute the insert
    _, err = DB.Exec(
        query,
        record.ServiceID,
        record.Vehicle_id,
        record.Service_date,
        record.PartCode,
        record.Rate,
        record.TaxableAmount,
        record.FinalAmount,
    )
    if err != nil {
        log.Println("Error inserting record:", err)
        http.Error(w, "Failed to insert record", http.StatusInternalServerError)
        return
    }

    // Send JSON response
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "message": "Record inserted successfully",
        "record":  record,
    })
}
