import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Navigation, Car } from "lucide-react";
import PredictionPanel from "@/components/PredictionPanel";
import DriverAssistPanel from "@/components/DriverAssistPanel";

const Index = () => {
  const [activeTab, setActiveTab] = useState("prediction");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-taxi text-taxi-dark py-8 px-6 shadow-taxi">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
              <Car className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">SMART DRIVE</h1>
              <p className="text-taxi-dark/80 text-lg">Hệ thống điều phối taxi thông minh</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white shadow-card border-0 p-1 h-auto">
            <TabsTrigger
              value="prediction"
              className="flex items-center gap-2 px-6 py-3 data-[state=active]:bg-gradient-taxi data-[state=active]:text-taxi-dark data-[state=active]:shadow-taxi transition-all duration-300"
            >
              <TrendingUp className="w-4 h-4" />
              Dự đoán chuyến đi
            </TabsTrigger>
            <TabsTrigger
              value="driver-assist"
              className="flex items-center gap-2 px-6 py-3 data-[state=active]:bg-gradient-taxi data-[state=active]:text-taxi-dark data-[state=active]:shadow-taxi transition-all duration-300"
            >
              <Navigation className="w-4 h-4" />
              Hỗ trợ tài xế
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prediction" className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-taxi-dark mb-2">Dự đoán nhu cầu chuyến đi</h2>
              <p className="text-muted-foreground">
                Nhập thời gian và địa điểm để dự đoán nhu cầu gọi taxi
              </p>
            </div>
            <PredictionPanel />
          </TabsContent>

          <TabsContent value="driver-assist" className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-taxi-dark mb-2">Hỗ trợ điều phối tài xế</h2>
              <p className="text-muted-foreground">
                Gợi ý di chuyển thông minh theo khu vực có nhu cầu cao
              </p>
            </div>
            <DriverAssistPanel />
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <footer className="bg-taxi-dark text-white py-8 px-6 mt-16">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Car className="w-6 h-6 text-primary" />
            <span className="text-xl font-semibold">SMART DRIVE</span>
          </div>
          <p className="text-white/80">
            Hệ thống điều phối taxi thông minh - Tối ưu hóa hiệu quả vận hành
          </p>
          <div className="mt-4 text-sm text-white/60">
            © 2024 Taxi Pulse Pro. Phát triển để cải thiện dịch vụ taxi.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
