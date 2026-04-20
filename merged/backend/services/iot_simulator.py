import random
import time

def generate_sensor_data():
    return {
        "N": round(random.uniform(10, 120), 2),
        "P": round(random.uniform(5, 90), 2),
        "K": round(random.uniform(5, 90), 2),
        "temperature": round(random.uniform(18, 40), 2),
        "humidity": round(random.uniform(40, 90), 2),
        "ph": round(random.uniform(5.5, 7.5), 2),
        "rainfall": round(random.uniform(20, 200), 2),
        "timestamp": time.time()
    }
