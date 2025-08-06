import pandas as pd
import sqlite3
import requests
import time

# === CONFIG ===
DB_FILE = 'zones.db'
TABLE_NAME = 'taxi_zone'
USER_AGENT = "ZoneGeocoderScript/1.0 (your_email@example.com)"  # Bắt buộc theo Nominatim policy

# === BƯỚC 1: Đọc dữ liệu từ DB ===
conn = sqlite3.connect(DB_FILE)
df = pd.read_sql_query(f"SELECT * FROM {TABLE_NAME}", conn)

# === BƯỚC 2: Hàm gọi Nominatim để lấy tọa độ ===
def get_coordinates_nominatim(address):
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        'q': address,
        'format': 'json',
        'limit': 1,
    }
    headers = {
        'User-Agent': USER_AGENT
    }
    response = requests.get(url, params=params, headers=headers)
    data = response.json()
    
    if data:
        lat = float(data[0]['lat'])
        lon = float(data[0]['lon'])
        return lat, lon
    else:
        return None, None

# === BƯỚC 3: Lặp qua các Zone ===
latitudes = []
longitudes = []

for idx, row in df.iterrows():
    address = f"{row['Zone']}, {row['Borough']}, New York City"
    lat, lon = get_coordinates_nominatim(address)
    print(f"[{idx+1}] {address} → {lat}, {lon}")
    latitudes.append(lat)
    longitudes.append(lon)
    time.sleep(1)  # Nominatim yêu cầu: max 1 request mỗi giây

df['latitude'] = latitudes
df['longitude'] = longitudes

# === BƯỚC 4: Ghi trở lại DB ===
df.to_sql(TABLE_NAME, conn, if_exists='replace', index=False)
conn.close()
print("✅ Đã cập nhật DB với tọa độ.")
