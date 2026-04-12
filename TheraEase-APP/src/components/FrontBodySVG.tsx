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
    [ZONES.NECK]: "M 85 90 L 115 90 L 115 110 Q 125 145 155 170 L 45 170 Q 75 145 85 110 Z",
    [ZONES.SHOULDER_RIGHT]: "M 85 110 Q 60 100 30 130 Q 20 150 15 170 L 45 170 Q 75 145 85 110 Z",
    [ZONES.SHOULDER_LEFT]: "M 115 110 Q 140 100 170 130 Q 180 150 185 170 L 155 170 Q 125 145 115 110 Z",
    [ZONES.CHEST]: "M 45 170 L 155 170 Q 150 220 145 270 L 55 270 Q 50 220 45 170 Z",
    [ZONES.ABDOMEN]: "M 55 270 L 145 270 Q 155 300 160 340 Q 150 390 130 390 Q 110 390 100 370 Q 90 390 70 390 Q 50 390 40 340 Q 45 300 55 270 Z"
  };

  const NON_INTERACTIVE_PATHS = [
    "M 85 90 L 115 90 Q 130 85 130 50 A 30 30 0 0 0 70 50 Q 70 85 85 90 Z",
    "M 15 170 Q 10 215 0 260 L 30 260 Q 40 215 45 170 Z",
    "M 185 170 Q 190 215 200 260 L 170 260 Q 160 215 155 170 Z",
    "M 40 340 L 40 410 L 95 410 L 95 350 Z",
    "M 160 340 L 160 410 L 105 410 L 105 350 Z"
  ];

  const DECORATIVE_PATHS = [
    "M 90 120 Q 60 115 40 135",
    "M 110 120 Q 140 115 160 135",
    "M 60 180 Q 80 195 100 185 Q 120 195 140 180",
    "M 98 260 A 2 2 0 1 0 102 260 A 2 2 0 1 0 98 260"
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
