from datetime import datetime
from db import db, rows_to_list, row_to_dict

def add_truck(truck):
    with db() as conn:
        conn.execute(
            """INSERT INTO exchange_transporters (name, phone, vehicle_type, capacity_kg, lat, lon)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (truck["ownerName"], truck["phone"], truck["vehicle_type"], truck["capacityTons"]*1000, 0, 0)
        )
    return truck

def get_available_trucks():
    with db() as conn:
        rows = conn.execute("SELECT id as \"truckId\", name as \"ownerName\", phone, vehicle_type as \"type\", capacity_kg/1000.0 as \"capacityTons\", lat, lon FROM exchange_transporters").fetchall()
        trucks = rows_to_list(rows)
        # Add a mock 'available' flag for the UI
        for t in trucks:
            t["available"] = True
        return trucks

def book_truck(data):
    with db() as conn:
        # Create an entry in exchange_orders to represent the booking
        conn.execute(
            """INSERT INTO exchange_orders (importer_name, importer_phone, address, crop, qty_kg, lat, lon, status)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            ("Onlyfarmer User", "Booking", "Farm location", data["crop"], data["expectedYieldTons"]*1000, 0, 0, 'CONFIRMED')
        )
        
        booking = {
            **data,
            "timestamp": datetime.utcnow().isoformat(),
            "status": "CONFIRMED"
        }
        return booking
