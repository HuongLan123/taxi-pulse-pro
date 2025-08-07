import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Car, Navigation, MapPin, Clock, Route, Target } from "lucide-react";

interface Suggestion {
  targetLocation: string;
  reason: string;
  estimatedDemand: string;
  distance: string;
  type: 'move' | 'stay';
  priority: 'high' | 'medium' | 'low';
  direction_url: string;
}

const demandScores: Record<string, number> = {
  'Very Low': 1,
  'Low': 2,
  'Medium': 3,
  'High': 4,
  'Very High': 5,
};

const DriverAssistPanel = () => {
  const [currentLocation, setCurrentLocation] = useState('');
  const [day, setDay] = useState('');
  const [date, setDate] = useState('');
  const [hour, setHour] = useState('');
  const [taxiType, setTaxiType] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const generateSuggestions = async () => {
    if (!currentLocation || !day || !date || !hour || !taxiType) return;
    const bannedGreenZones = [1, 2, 5, 6, 44, 58, 59, 84, 99, 103, 109, 110, 115, 172, 176, 187, 199, 201, 245, 251];
    if (taxiType === 'green' && bannedGreenZones.includes(Number(currentLocation))) {
    alert("🚫 Taxi Green không hoạt động ở khu vực này.");
    return;
  }
    try {
      const response = await fetch(
        `http://localhost:3001/suggestions?type=${taxiType}&hour=${hour}&date=${date}&PULocationID=${currentLocation}`
      );
      const data = await response.json();
      // Lọc các suggestions hợp lệ
    const validSuggestions = data.filter((item: any) => {
      if (taxiType === 'green') {
        return !bannedGreenZones.includes(item.LocationID);
      }
      return true;
    });

    if (taxiType === 'green' && validSuggestions.length === 0) {
      alert("🚫 Không có gợi ý hợp lệ cho Taxi Green tại thời điểm này.");
      return;
    }

    const topValid = validSuggestions.slice(0, 3);
      const mapped: Suggestion[] = topValid.map((item: any, index: number) => {
        const demand = item.predicted_level || 'Medium';
      const demandScore = demandScores[demand] || 3;
        return {
          targetLocation: `${item.Zone} (ID ${item.LocationID})`,
          reason: `Dự đoán nhu cầu ${demand} với khoảng cách ${item.distance.toFixed(4)} đơn vị.`,
          estimatedDemand: demand,
          distance: `${item.distance.toFixed(4)} km`,
          type: item.distance === 0 ? 'stay' : 'move',
          priority: index === 0 ? 'high' : index === 1 ? 'medium' : 'low',
          direction_url: item.direction_url
        };
      });

      setSuggestions(mapped.slice(0, 3));
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu gợi ý:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getDemandColor = (demand: string) => {
    switch (demand) {
      case 'Very High': return 'bg-red-500';
      case 'High': return 'bg-orange-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card border-0 bg-gradient-subtle">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-taxi-dark">
            <Navigation className="w-6 h-6 text-primary" />
            Hỗ trợ tài xế taxi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentLocation" className="text-sm font-medium text-taxi-dark">
                <MapPin className="w-4 h-4 inline mr-1" />
                Vị trí hiện tại
              </Label>
              <Input
                id="currentLocation"
                type="number"
                placeholder="Nhập số địa điểm"
                value={currentLocation}
                onChange={(e) => setCurrentLocation(e.target.value)}
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
            <Label className="text-sm font-medium text-taxi-dark flex items-center gap-2">
              <Car className="w-4 h-4" />
              Loại taxi
            </Label>
            <RadioGroup value={taxiType} onValueChange={setTaxiType}>
  <div className="flex items-center space-x-2 p-3 rounded-lg border border-primary/20 hover:bg-primary/5 transition-colors">
    <RadioGroupItem value="yellow" id="yellow" />
    <Label htmlFor="yellow" className="flex-1 cursor-pointer">
      <div className="font-medium">Taxi vàng</div>
    </Label>
  </div>

  <div className="flex items-center space-x-2 p-3 rounded-lg border border-primary/20 hover:bg-primary/5 transition-colors">
    <RadioGroupItem value="green" id="green" />
    <Label htmlFor="green" className="flex-1 cursor-pointer">
      <div className="font-medium">Taxi xanh</div>
    </Label>
  </div>

  <div className="flex items-center space-x-2 p-3 rounded-lg border border-primary/20 hover:bg-primary/5 transition-colors">
    <RadioGroupItem value="fhvhv" id="booked" />
    <Label htmlFor="booked" className="flex-1 cursor-pointer">
      <div className="font-medium">Taxi được đặt trước</div>
    </Label>
  </div>
</RadioGroup>

          </div>

          <Button 
            onClick={generateSuggestions}
            variant="taxi"
            size="lg"
            className="w-full"
            disabled={!currentLocation || !day || !date || !hour || !taxiType}
          >
            <Route className="w-4 h-4 mr-2" />
            Nhận gợi ý di chuyển
          </Button>
        </CardContent>
      </Card>

      {suggestions.length > 0 && (
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-taxi-dark flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Gợi ý di chuyển
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${getPriorityColor(suggestion.priority)} hover:shadow-elegant transition-all duration-300`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {suggestion.type === 'move' ? (
                          <Navigation className="w-5 h-5 text-taxi-blue" />
                        ) : (
                          <MapPin className="w-5 h-5 text-taxi-success" />
                        )}
                        <h4 className="font-semibold text-taxi-dark">
                          {suggestion.type === 'move' ? 'Di chuyển đến' : 'Ở lại'}: {suggestion.targetLocation}
                        </h4>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        {suggestion.reason}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Nhu cầu:</span>
                          <span
                            className={`px-2 py-1 rounded-full text-white text-xs font-semibold ${getDemandColor(suggestion.estimatedDemand)}`}
                          >
                            {suggestion.estimatedDemand}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Route className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{suggestion.distance}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {suggestion.type === 'move' ? (
                        <Button asChild variant={suggestion.priority === 'high' ? 'success' : 'secondary'} size="sm" className="mb-2">
                          <a href={suggestion.direction_url} target="_blank" rel="noopener noreferrer">
                              Đi ngay
                          </a>
                        </Button>
                      ) : (
                        <Button variant="secondary" size="sm" className="mb-2">
                              Ở lại
                        </Button>
                        )}

                      <div className="text-xs text-muted-foreground capitalize">
                        Ưu tiên {suggestion.priority === 'high' ? 'cao' : suggestion.priority === 'medium' ? 'trung bình' : 'thấp'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gradient-subtle rounded-lg">
              <h4 className="font-semibold text-taxi-dark mb-2 flex items-center gap-2">
                <Car className="w-4 h-4 text-primary" />
                Thông tin taxi
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Vị trí hiện tại:</span>
                  <span className="ml-2 font-medium">Khu vực {currentLocation}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Thời gian:</span>
                  <span className="ml-2 font-medium">{day}, {date} lúc {hour}:00</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Loại taxi:</span>
                  <span className="ml-2 font-medium">
                    {taxiType === 'yellow' ? 'Taxi vàng' :
                    taxiType === 'green' ? 'Taxi xanh' : 'Taxi được đặt trước'}
                  </span>

                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DriverAssistPanel;
