console.log("Server version: USING DATE & PULocationID");

import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const app = express();
app.use(cors());

const dbPromise = open({
  filename: './data13.db',
  driver: sqlite3.Database,
});

app.get('/predict', async (req, res) => {
  try {
    const db = await dbPromise;
    const { type , hour, date, PULocationID } = req.query;
    if (!hour || !date || !PULocationID){
      return res.status(400).json({ error: 'Missing hour, date or PULocationID parameter' });
    }

    const tableName = `${type}_pred`;

    const sql = `
      SELECT predicted_level
      FROM ${tableName}
      WHERE hour = ? AND date = ? AND PULocationID = ?
    `;

    const rows = await db.all(sql, [hour, date, PULocationID]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/suggestions', async (req, res) => {
  try {
    const db = await dbPromise;
    const { type, hour, date, PULocationID } = req.query;

    if (!type || !hour || !date || !PULocationID) {
      return res.status(400).json({ error: 'Missing type, hour, date or PULocationID parameter' });
    }

    const tableName = `${type}_pred`;

    // 1. Lấy tọa độ của điểm gốc
    const origin = await db.get(`
      SELECT latitude, longitude
      FROM taxi_zone
      WHERE LocationID = ?
    `, [PULocationID]);

    if (!origin) {
      return res.status(404).json({ error: 'PULocationID not found in taxi_zone' });
    }

    const { latitude: originLat, longitude: originLng } = origin;

    // 2. Lấy toàn bộ điểm và tính predicted_level + distance
    const zones = await db.all(`
      SELECT z.LocationID, z.Zone, z.latitude, z.longitude, p.predicted_level
      FROM taxi_zone z
      LEFT JOIN ${tableName} p
        ON z.LocationID = p.PULocationID AND p.hour = ? AND p.date = ?
      WHERE z.LocationID != ?
    `, [hour, date, PULocationID]);

    // Gán điểm số cho predicted_level
    const levelScore = {
      "Very_Low": 1,
      "Low": 2,
      "Medium": 3,
      "High": 4,
      "Very_High": 5
    };
    function haversine(lat1, lon1, lat2, lon2) {
      const R = 6371;
      const toRad = (deg) => deg * Math.PI / 180;
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
}

    // 3. Tính khoảng cách và xác định max_distance
    const results = zones.map(z => {
      const distance = haversine(originLat, originLng, z.latitude, z.longitude);
      const level = z.predicted_level || "Medium"; // mặc định nếu không có dự đoán
      const predictedValue = levelScore[level] || 3;
      return {
        LocationID: z.LocationID,
        Zone: z.Zone,
        distance,
        predicted_level: level,
        predictedValue,
        latitude: z.latitude,       // 🟢 thêm dòng này
        longitude: z.longitude      
      };
    });

    const maxDistance = Math.max(...results.map(r => r.distance || 0.001)); // tránh chia cho 0

    // 4. Tính điểm số
    results.forEach(r => {
      // Chuẩn hoá predicted level từ 1-5 về 0–1
      const demandScore = (r.predictedValue - 1) / 4;  // từ 0 đến 1

      // Chuẩn hoá khoảng cách ngược lại (gần thì điểm cao)
      const distanceScore = 1 - (r.distance / maxDistance);  // từ 0 đến 1

      // Tính điểm tổng: 50% nhu cầu, 50% khoảng cách
      r.score = 0.5 * demandScore + 0.5 * distanceScore;
    });

    // 5. Lấy top 3 điểm có score cao nhất
    const topSuggestions = results
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ LocationID, Zone, distance, predicted_level, latitude, longitude }) => ({
    LocationID,
    Zone,
    distance,
    predicted_level,
    latitude,
    longitude,
    origin_lat: originLat,   // 🟢 thêm dòng này
    origin_lng: originLng,
    direction_url: `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${originLat},${originLng};${latitude},${longitude}`
  }));

    res.json(topSuggestions);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
