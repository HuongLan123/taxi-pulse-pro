import fs from 'fs';
import sqlite3pkg from 'sqlite3';
import csv from 'csv-parser';
import fetch from 'node-fetch'; // Dùng để gọi API OpenStreetMap

const sqlite3 = sqlite3pkg.verbose();

const DB_FILE = './data13.db';
const CSV_FILE = './fhvhv-010125.csv';
const CSV1_FILE = './green_taxi_predictions.csv';
const CSV2_FILE = './predictions.csv';
const CSV3_FILE = './taxi_zone_lookup (1).csv';

// Xóa DB cũ nếu tồn tại
if (fs.existsSync(DB_FILE)) fs.unlinkSync(DB_FILE);

// Tạo DB mới
const db = new sqlite3.Database(DB_FILE);

let stmt, stmt1, stmt2, stmt3;

db.serialize(() => {
  // Tạo bảng taxi_zone với tọa độ
  db.run(`CREATE TABLE taxi_zone (
    LocationID INTEGER,
    Borough TEXT,
    Zone TEXT,
    service_zone TEXT,
    latitude REAL,
    longitude REAL
  )`);

  db.run(`CREATE TABLE yellow_pred (
    PULocationID INTEGER,
    hour INTEGER,
    date TEXT,
    day_of_week INTEGER,
    predicted_level TEXT,
    FOREIGN KEY (PULocationID) REFERENCES taxi_zone(LocationID)
  )`);

  db.run(`CREATE TABLE fhvhv_pred (
    PULocationID INTEGER,
    hour INTEGER,
    date TEXT,
    day_of_week INTEGER,
    predicted_level TEXT,
    FOREIGN KEY (PULocationID) REFERENCES taxi_zone(LocationID)
  )`);

  db.run(`CREATE TABLE green_pred (
    PULocationID INTEGER,
    hour INTEGER,
    date TEXT,
    day_of_week INTEGER,
    predicted_level TEXT,
    FOREIGN KEY (PULocationID) REFERENCES taxi_zone(LocationID)
  )`);

  stmt  = db.prepare('INSERT INTO taxi_zone (LocationID, Borough, Zone, service_zone, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?)');
  stmt1 = db.prepare('INSERT INTO yellow_pred (PULocationID, hour, date, day_of_week, predicted_level) VALUES (?, ?, ?, ?, ?)');
  stmt2 = db.prepare('INSERT INTO fhvhv_pred (PULocationID, hour, date, day_of_week, predicted_level) VALUES (?, ?, ?, ?, ?)');
  stmt3 = db.prepare('INSERT INTO green_pred (PULocationID, hour, date, day_of_week, predicted_level) VALUES (?, ?, ?, ?, ?)');
});

// Delay 1s để tránh bị chặn API
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Hàm gọi API lấy tọa độ từ tên khu vực và borough
const getCoordinates = async (zone, borough) => {
  const query = encodeURIComponent(`${zone}`);
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'ZoneGeocoder/1.0 (your@email.com)' }
    });
    const data = await res.json();
    if (data && data.length > 0) {
      const { lat, lon } = data[0];
      return [parseFloat(lat), parseFloat(lon)];
    } else {
      return [null, null];
    }
  } catch (error) {
    console.error(`❌ Lỗi khi lấy tọa độ cho ${zone}:`, error);
    return [null, null];
  }
};

// Đọc và insert taxi_zone kèm tọa độ
const importTaxiZonesWithCoordinates = async () => {
  const records = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(CSV3_FILE)
      .pipe(csv())
      .on('data', (row) => records.push(row))
      .on('end', async () => {
        for (const row of records) {
          const LocationID = parseInt(row.LocationID);
          const Borough = row.Borough;
          const Zone = row.Zone;
          const service_zone = row.service_zone;

          const [lat, lon] = await getCoordinates(Zone, Borough);
          stmt.run(LocationID, Borough, Zone, service_zone, lat, lon);
          console.log(`✅ Đã lưu: ${Zone} (${LocationID}) - [${lat}, ${lon}]`);
          await delay(1000); // tránh spam API
        }
        resolve();
      })
      .on('error', reject);
  });
};

// Load CSV bình thường
const loadCSVToDB = (filePath, insertStmt, transformRow) => {
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        try {
          const values = transformRow(row);
          insertStmt.run(values);
        } catch (err) {
          console.error(`❌ Lỗi xử lý dòng: ${JSON.stringify(row)}`, err);
        }
      })
      .on('end', () => {
        console.log(`✅ Đã load xong file ${filePath}`);
        resolve();
      })
      .on('error', reject);
  });
};

// Gọi toàn bộ import
const importAll = async () => {
  try {
    await importTaxiZonesWithCoordinates();

    await loadCSVToDB(CSV1_FILE, stmt3, (row) => [
      parseInt(row.PULocationID),
      parseInt(row.hour),
      row.date,
      parseInt(row.day_of_week),
      row.predicted_level
    ]);

    await loadCSVToDB(CSV2_FILE, stmt1, (row) => [
      parseInt(row.PULocationID),
      parseInt(row.hour),
      row.date,
      parseInt(row.day_of_week),
      row.predicted_level
    ]);

    await loadCSVToDB(CSV_FILE, stmt2, (row) => [
      parseInt(row.PULocationID),
      parseInt(row.hour),
      row.date,
      parseInt(row.day_of_week),
      row.predicted_level
    ]);

    console.log("✅ Tất cả dữ liệu đã được nạp vào SQLite thành công.");
  } catch (err) {
    console.error("❌ Lỗi khi nạp dữ liệu:", err);
  } finally {
    stmt.finalize();
    stmt1.finalize();
    stmt2.finalize();
    stmt3.finalize();
    db.close();
  }
};

importAll();
