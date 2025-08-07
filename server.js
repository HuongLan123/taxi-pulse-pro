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
    const { type, hour, date, PULocationID } = req.query;
    if (!hour || !date || !PULocationID) {
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

    // Lấy toạ độ điểm gốc
    const origin = await db.get(`
      SELECT latitude, longitude, Zone
      FROM taxi_zone
      WHERE LocationID = ?
    `, [PULocationID]);

    if (!origin || origin.latitude == null || origin.longitude == null) {
      return res.status(404).json({ error: 'PULocationID invalid or missing coordinates' });
    }

    const { latitude: originLat, longitude: originLng, Zone: originZone } = origin;

    const levelScore = {
      "Very_Low": 1,
      "Low": 2,
      "Medium": 3,
      "High": 4,
      "Very_High": 5
    };

    const speedMap = {
      yellow: 17.29 * 1.60934,
      green: 53.99 * 1.60934,
      fhvhv: 15.15 * 1.60934
    };
    const speed = speedMap[type] || 30;
    const correctionFactor = 1.3;

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

    // Lấy tất cả zone hợp lệ (không phải điểm hiện tại)
    const zones = await db.all(`
      SELECT LocationID, Zone, latitude, longitude
      FROM taxi_zone
      WHERE LocationID != ?
        AND latitude IS NOT NULL
        AND longitude IS NOT NULL
    `, [PULocationID]);

    // Lấy predicted level cho điểm hiện tại
    const selfPrediction = await db.get(`
      SELECT predicted_level
      FROM ${tableName}
      WHERE hour = ? AND date = ? AND PULocationID = ?
    `, [hour, date, PULocationID]);

    const selfLevel = selfPrediction?.predicted_level || "Medium";
    const selfPredictedValue = levelScore[selfLevel] || 3;

    // Khởi tạo kết quả với điểm hiện tại (ở lại)
    const results = [{
      LocationID: parseInt(PULocationID),
      Zone: originZone,
      distance: 0,
      predicted_level: selfLevel,
      predictedValue: selfPredictedValue,
      latitude: originLat,
      longitude: originLng,
      stayHere: true // 🟢 Đánh dấu để phân biệt
    }];

    // Với các zone khác, tính khoảng cách, thời gian và nhu cầu
    const others = await Promise.all(zones.map(async (z) => {
      const distance = haversine(originLat, originLng, z.latitude, z.longitude) * correctionFactor;
      const travelTime = distance / speed;
      const arrivalHour = Math.floor((parseInt(hour) + travelTime)) % 24;

      const prediction = await db.get(`
        SELECT predicted_level
        FROM ${tableName}
        WHERE PULocationID = ? AND hour = ? AND date = ?
      `, [z.LocationID, arrivalHour, date]);

      const level = prediction?.predicted_level || "Medium";
      const predictedValue = levelScore[level] || 3;

      return {
        LocationID: z.LocationID,
        Zone: z.Zone,
        distance,
        predicted_level: level,
        predictedValue,
        latitude: z.latitude,
        longitude: z.longitude,
        stayHere: false
      };
    }));

    results.push(...others);

    const maxDistance = Math.max(...results.map(r => r.distance || 0.001));

    // Tính điểm số
    results.forEach(r => {
      const demandScore = (r.predictedValue - 1) / 4;
      const distanceScore = 1 - (r.distance / maxDistance);
      r.score = 0.5 * demandScore + 0.5 * distanceScore;
    });

    const topSuggestions = results
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ LocationID, Zone, distance, predicted_level, latitude, longitude, stayHere }) => ({
        LocationID,
        Zone,
        distance,
        predicted_level,
        latitude,
        longitude,
        origin_lat: originLat,
        origin_lng: originLng,
        type: stayHere ? 'stay' : 'move',
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
