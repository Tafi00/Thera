import React from 'react';
import Svg, { Path, G } from 'react-native-svg';
import { View, StyleSheet } from 'react-native';

interface BackBodySVGProps {
  onAreaPress: (areaId: string) => void;
  selectedArea: string | null;
  selectedAreas: Record<string, number>;
  getPainColor: (level: number) => string;
}

export default function BackBodySVG({
  onAreaPress,
  selectedArea,
  selectedAreas,
  getPainColor,
}: BackBodySVGProps) {
  
  // The IDs match our updated body areas (Neck, Left Shoulder, Right Shoulder, Back, Glutes)
  const ZONES = {
    NECK: 'neck',
    SHOULDER_LEFT: 'shoulder_left',
    SHOULDER_RIGHT: 'shoulder_right',
    LOWER_BACK: 'lower_back', // Used for the broad back region
    GLUTES: 'glutes' // Added for the gluteal/hip region
  };

  const ZONES_PATHS = {
    // Zone 1: Neck & upper back
    [ZONES.NECK]: "M 85 90 L 115 90 L 115 110 Q 125 145 155 170 L 45 170 Q 75 145 85 110 Z",
    
    // Zone 2: Left Shoulder
    [ZONES.SHOULDER_LEFT]: "M 85 110 Q 60 100 30 130 Q 20 150 15 170 L 45 170 Q 75 145 85 110 Z",
    
    // Zone 3: Right Shoulder
    [ZONES.SHOULDER_RIGHT]: "M 115 110 Q 140 100 170 130 Q 180 150 185 170 L 155 170 Q 125 145 115 110 Z",
    
    // Zone 4: Back (Mid/Lower)
    [ZONES.LOWER_BACK]: "M 45 170 L 155 170 Q 150 220 145 270 L 55 270 Q 50 220 45 170 Z",
    
    // Zone 5: Glutes/Hip
    [ZONES.GLUTES]: "M 55 270 L 145 270 Q 155 300 160 340 Q 150 390 130 390 Q 110 390 100 370 Q 90 390 70 390 Q 50 390 40 340 Q 45 300 55 270 Z"
  };

  const NON_INTERACTIVE_PATHS = [
    "M 85 90 L 115 90 Q 130 85 130 50 A 30 30 0 0 0 70 50 Q 70 85 85 90 Z", // Đầu
    "M 15 170 Q 10 215 0 260 L 30 260 Q 40 215 45 170 Z", // Tay trái
    "M 185 170 Q 190 215 200 260 L 170 260 Q 160 215 155 170 Z", // Tay phải
    "M 40 340 L 40 410 L 95 410 L 95 350 Z", // Chân trái (đã cắt ngắn)
    "M 160 340 L 160 410 L 105 410 L 105 350 Z" // Chân phải (đã cắt ngắn)
  ];

  const getFillColor = (zoneId: string) => {
    // Nếu đang trong chế độ chọn mức độ đau cho một vùng cụ thể
    if (selectedArea) {
      if (zoneId === selectedArea) {
        return '#BFDBFE'; // Màu xanh dương nhạt (giống #93C5FD) nổi bật lúc vừa tap
      }
      return '#F8FAFC'; // Các vùng khác nền xám rất nhạt
    }

    // Nếu không mở popup, hiển thị màu theo mức đau đã lưu
    if (selectedAreas[zoneId] !== undefined) {
      return getPainColor(selectedAreas[zoneId]);
    }

    return '#F1F5F9'; // Màu mặc định cho vùng chưa được chọn
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
          {/* Static body parts */}
          {NON_INTERACTIVE_PATHS.map((pathData, index) => (
            <Path key={`static-${index}`} d={pathData} fill="#F8FAFC" stroke="#CBD5E1" />
          ))}
          
          {/* Interactive areas */}
          {Object.entries(ZONES_PATHS).map(([zoneId, pathData]) => {
            return (
              <Path
                key={zoneId}
                d={pathData}
                fill={getFillColor(zoneId)}
                stroke={getStrokeColor(zoneId)}
                onPress={() => onAreaPress(zoneId)}
                {...{
                  // work-around for tap highlight effect
                  activeOpacity: 0.7
                }}
              />
            );
          })}
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 480, // Tăng chiều cao để fit tay chân
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  }
});
