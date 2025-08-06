import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, MapPin, Clock, BarChart3 } from "lucide-react";

interface PredictionData {
  location: string;
  time: string;
  demand: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';
  percentage: number;
  color: string;
}

const PredictionPanel = () => {
  const [location, setLocation] = useState('');
  const [day, setDay] = useState('');
  const [date, setDate] = useState('');
  const [hour, setHour] = useState('');
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [taxiType, setTaxiType] = useState('yellow'); // mặc định taxi vàng
  const demandLevels = [
    { level: 'Very Low', color: 'bg-gray-400', percentage: 10 },
    { level: 'Low', color: 'bg-blue-400', percentage: 25 },
    { level: 'Medium', color: 'bg-yellow-400', percentage: 50 },
    { level: 'High', color: 'bg-orange-400', percentage: 75 },
    { level: 'Very High', color: 'bg-red-400', percentage: 90 },
  ];

  const generatePrediction = async () => {
  if (!location || !date || !hour) return;

  try {
    const res = await fetch(`http://localhost:3001/predict?type=${taxiType}&hour=${hour}&date=${date}&PULocationID=${location}`);
    const data = await res.json();

    if (!data || data.length === 0 || !data[0].predicted_level) {
      alert("Không có dữ liệu dự đoán!");
      return;
    }

    const levelMap = {
      'Very_Low': { level: 'Very Low', color: 'bg-gray-400', percentage: 10 },
      'Low': { level: 'Low', color: 'bg-blue-400', percentage: 25 },
      'Medium': { level: 'Medium', color: 'bg-yellow-400', percentage: 50 },
      'High': { level: 'High', color: 'bg-orange-400', percentage: 75 },
      'Very_High': { level: 'Very High', color: 'bg-red-400', percentage: 90 },
    };

    const predicted = data[0].predicted_level;
    const mapped = levelMap[predicted] || levelMap['Medium']; // fallback nếu không match

    const newPrediction: PredictionData = {
      location,
      time: `${day}, ${date} lúc ${hour}:00`,
      demand: mapped.level as any,
      percentage: mapped.percentage,
      color: mapped.color,
    };

    setPredictions(prev => [newPrediction, ...prev.slice(0, 4)]);
  } catch (err) {
    console.error("Lỗi khi gọi API:", err);
    alert("Lỗi khi truy xuất dự đoán.");
  }
};


  const getDemandIcon = (demand: string) => {
    switch (demand) {
      case 'Very High':
        return <TrendingUp className="w-5 h-5 text-red-500" />;
      case 'High':
        return <BarChart3 className="w-5 h-5 text-orange-500" />;
      default:
        return <BarChart3 className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card border-0 bg-gradient-subtle">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-taxi-dark">
            <TrendingUp className="w-6 h-6 text-primary" />
            Dự đoán chuyến đi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-medium text-taxi-dark">
                <MapPin className="w-4 h-4 inline mr-1" />
                Địa điểm (số)
              </Label>
              <Input
                id="location"
                type="number"
                placeholder="Nhập số địa điểm"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="border-primary/20 focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="day" className="text-sm font-medium text-taxi-dark">
                <Clock className="w-4 h-4 inline mr-1" />
                Thứ
              </Label>
              <Select value={day} onValueChange={setDay}>
                <SelectTrigger className="border-primary/20 focus:border-primary">
                  <SelectValue placeholder="Chọn thứ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Thứ 2">Thứ 2</SelectItem>
                  <SelectItem value="Thứ 3">Thứ 3</SelectItem>
                  <SelectItem value="Thứ 4">Thứ 4</SelectItem>
                  <SelectItem value="Thứ 5">Thứ 5</SelectItem>
                  <SelectItem value="Thứ 6">Thứ 6</SelectItem>
                  <SelectItem value="Thứ 7">Thứ 7</SelectItem>
                  <SelectItem value="Chủ nhật">Chủ nhật</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-medium text-taxi-dark">Ngày</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border-primary/20 focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hour" className="text-sm font-medium text-taxi-dark">Giờ</Label>
              <Select value={hour} onValueChange={setHour}>
                <SelectTrigger className="border-primary/20 focus:border-primary">
                  <SelectValue placeholder="Chọn giờ" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => (
                    <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                      {i.toString().padStart(2, '0')}:00
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-3">
  <Label className="text-sm font-medium text-taxi-dark">Loại taxi</Label>
  <div className="flex gap-4">
    <div className="flex items-center space-x-2">
      <input
        type="radio"
        id="yellow"
        name="taxiType"
        value="yellow"
        checked={taxiType === 'yellow'}
        onChange={() => setTaxiType('yellow')}
        className="accent-yellow-500"
      />
      <Label htmlFor="yellow">Taxi vàng</Label>
    </div>
    <div className="flex items-center space-x-2">
      <input
        type="radio"
        id="green"
        name="taxiType"
        value="green"
        checked={taxiType === 'green'}
        onChange={() => setTaxiType('green')}
        className="accent-green-500"
      />
      <Label htmlFor="green">Taxi xanh</Label>
    </div>
    <div className="flex items-center space-x-2">
      <input
        type="radio"
        id="fhvhv"
        name="taxiType"
        value="fhvhv"
        checked={taxiType === 'fhvhv'}
        onChange={() => setTaxiType('fhvhv')}
        className="accent-blue-500"
      />
      <Label htmlFor="fhvhv">Đặt trước</Label>
    </div>
  </div>
</div>

          <Button 
            onClick={generatePrediction}
            variant="taxi"
            size="lg"
            className="w-full"
            disabled={!location || !day || !date || !hour || !taxiType}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Dự đoán nhu cầu
          </Button>
        </CardContent>
      </Card>

      {predictions.length > 0 && (
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-taxi-dark">Kết quả dự đoán</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {predictions.map((prediction, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg bg-gradient-subtle border border-primary/10 hover:shadow-elegant transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    {getDemandIcon(prediction.demand)}
                    <div>
                      <p className="font-semibold text-taxi-dark">
                        Địa điểm {prediction.location}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {prediction.time}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-3 py-1 rounded-full text-white text-xs font-semibold ${prediction.color}`}
                      >
                        {prediction.demand}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {prediction.percentage}% nhu cầu
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <h4 className="font-semibold text-taxi-dark mb-3">Thang đo nhu cầu:</h4>
              <div className="grid grid-cols-5 gap-2">
                {demandLevels.map((level) => (
                  <div key={level.level} className="text-center">
                    <div className={`h-3 rounded-full ${level.color} mb-1`}></div>
                    <p className="text-xs text-muted-foreground">{level.level}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PredictionPanel;