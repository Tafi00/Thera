import React from 'react';
import Svg, { Path, G } from 'react-native-svg';
import { View, StyleSheet } from 'react-native';

interface FrontBodySVGProps {
  onAreaPress: (areaId: string) => void;
  selectedArea: string | null;
  selectedAreas: Record<string, number>;
  getPainColor: (level: number) => string;
}

export default function FrontBodySVG({
  onAreaPress,
  selectedArea,
  selectedAreas,
  getPainColor,
}: FrontBodySVGProps) {
  
  const ZONES = {
    NECK: 'neck',
    SHOULDER_LEFT: 'shoulder_left',
    SHOULDER_RIGHT: 'shoulder_right',
    CHEST: 'chest',
    ABDOMEN: 'abdomen'
  };

  const ZONES_PATHS = {
    [ZONES.NECK]: "M 85 90 L 115 90 L 115 110 L 85 110 Z",
    [ZONES.SHOULDER_RIGHT]: "M 85 110 Q 60 100 30 130 Q 20 150 15 170 L 45 170 Q 75 145 85 110 Z",
    [ZONES.SHOULDER_LEFT]: "M 115 110 Q 140 100 170 130 Q 180 150 185 170 L 155 170 Q 125 145 115 110 Z",
    [ZONES.CHEST]: "M 85 110 L 115 110 Q 125 145 155 170 Q 150 220 145 270 L 55 270 Q 50 220 45 170 Q 75 145 85 110 Z",
    [ZONES.ABDOMEN]: "M 55 270 L 145 270 L 152 325 L 100 340 L 48 325 Z"
  };

  const NON_INTERACTIVE_PATHS = [
    "M 85 90 L 115 90 Q 130 85 130 50 A 30 30 0 0 0 70 50 Q 70 85 85 90 Z",
    "M 15 170 Q 10 215 0 260 L 30 260 Q 40 215 45 170 Z",
    "M 185 170 Q 190 215 200 260 L 170 260 Q 160 215 155 170 Z",
    "M 40 340 L 40 460 L 95 460 L 95 367.5 Z",
    "M 160 340 L 160 460 L 105 460 L 105 367.5 Z",
    "M 48 325 L 100 340 L 152 325 L 160 340 L 100 370 L 40 340 Z" // Pelvis (Hông/Bẹn)
  ];

  const DECORATIVE_PATHS = [
    // Khuôn mặt (Mắt và Miệng)
    "M 90 65 A 1 1 0 1 0 92 65 A 1 1 0 1 0 90 65",
    "M 108 65 A 1 1 0 1 0 110 65 A 1 1 0 1 0 108 65",
    "M 95 78 Q 100 83 105 78",

    // Xương đòn
    "M 90 120 Q 60 115 40 135",
    "M 110 120 Q 140 115 160 135",
    
    // Ngực
    "M 60 180 Q 80 195 100 185 Q 120 195 140 180",
    
    // Rốn (dời xuống bụng một chút)
    "M 98 285 A 2 2 0 1 0 102 285 A 2 2 0 1 0 98 285",

    // Đường bẹn (Groin) - Xóa bớt path cũ vì path mới của Abdomen đã thể hiện chữ V rồi
    // Giữ lại 1 đường rãnh nhẹ cho giống đồ giải phẫu
    "M 100 345 L 100 370"
  ];

  const getFillColor = (zoneId: string) => {
    if (selectedArea) {
      if (zoneId === selectedArea) return '#BFDBFE'; 
      return '#F8FAFC'; 
    }
    if (selectedAreas[zoneId] !== undefined) return getPainColor(selectedAreas[zoneId]);
    return '#F1F5F9'; 
  };

  const getStrokeColor = (zoneId: string) => {
    if (selectedArea && zoneId === selectedArea) return '#3B82F6';
    if (!selectedArea && selectedAreas[zoneId] !== undefined) return getPainColor(selectedAreas[zoneId]);
    return '#CBD5E1';
  };

  return (
    <View style={styles.container}>
      <Svg width="100%" height="100%" viewBox="0 -20 200 500" fill="none">
        <G strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          {NON_INTERACTIVE_PATHS.map((pathData, index) => (
            <Path key={`static-${index}`} d={pathData} fill="#F8FAFC" stroke="#CBD5E1" />
          ))}
          {DECORATIVE_PATHS.map((pathData, index) => (
            <Path key={`decor-${index}`} d={pathData} fill="none" stroke="#CBD5E1" strokeWidth="1.5" />
          ))}
          {Object.entries(ZONES_PATHS).map(([zoneId, pathData]) => (
            <Path
              key={zoneId}
              d={pathData}
              fill={getFillColor(zoneId)}
              stroke={getStrokeColor(zoneId)}
              onPress={() => onAreaPress(zoneId)}
              {...{ activeOpacity: 0.7 }}
            />
          ))}
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 480,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  }
});
