import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors } from '../constants/Colors';

interface PeeritradeLogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

export const PeeritradeLogo: React.FC<PeeritradeLogoProps> = ({ size = 'medium', showText = true }) => {
  // Size calculations
  let iconSize = 48;
  let fontSize = 24;
  let subtitleSize = 9;
  let gap = 12;

  if (size === 'small') {
    iconSize = 36;
    fontSize = 18;
    subtitleSize = 7;
    gap = 8;
  } else if (size === 'large') {
    iconSize = 72;
    fontSize = 32;
    subtitleSize = 11;
    gap = 16;
  }

  return (
    <View style={[styles.container, size === 'large' ? styles.columnContainer : styles.rowContainer]}>
      {/* Custom Vector Icon */}
      <View style={{ width: iconSize, height: iconSize }}>
        <Svg width="100%" height="100%" viewBox="0 0 64 64" fill="none">
          <Defs>
            <LinearGradient id="boxGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#0B132B" />
              <Stop offset="1" stopColor="#1C2541" />
            </LinearGradient>
            <LinearGradient id="borderGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#3B82F6" />
              <Stop offset="0.5" stopColor="#00E5FF" />
              <Stop offset="1" stopColor="#00D285" />
            </LinearGradient>
            <LinearGradient id="blueArrowGrad" x1="14" y1="38" x2="52" y2="18" gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#3B82F6" />
              <Stop offset="1" stopColor="#00D2FF" />
            </LinearGradient>
            <LinearGradient id="greenArrowGrad" x1="22" y1="32" x2="54" y2="12" gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#00B876" />
              <Stop offset="1" stopColor="#00D285" />
            </LinearGradient>
          </Defs>

          {/* Rounded square container background */}
          <Rect x="2" y="2" width="60" height="60" rx="14" fill="url(#boxGrad)" stroke="url(#borderGrad)" strokeWidth="3" />

          {/* Soccer ball on bottom-left */}
          <Circle cx="21" cy="43" r="10" fill="#FFFFFF" />
          {/* Inner details to mock soccer stitches */}
          <Path d="M 21 38 L 24 40.5 L 23 44.5 L 19 44.5 L 18 40.5 Z" fill="#0B132B" />
          <Path d="M 21 38 L 21 33" stroke="#0B132B" strokeWidth="1" />
          <Path d="M 24 40.5 L 28 39.5" stroke="#0B132B" strokeWidth="1" />
          <Path d="M 23 44.5 L 25 49" stroke="#0B132B" strokeWidth="1" />
          <Path d="M 19 44.5 L 17 49" stroke="#0B132B" strokeWidth="1" />
          <Path d="M 18 40.5 L 14 39.5" stroke="#0B132B" strokeWidth="1" />
          
          <Path d="M 16 33.5 L 20 33 L 18 36 Z" fill="#0B132B" />
          <Path d="M 28.5 42 L 26.5 45.5 L 25.5 41 Z" fill="#0B132B" />
          <Path d="M 13.5 42 L 15.5 45.5 L 16.5 41 Z" fill="#0B132B" />
          <Path d="M 21 51.5 L 23 49 L 19 49 Z" fill="#0B132B" />

          {/* Electric Blue Uptrend Arrow */}
          <Path 
            d="M 14 38 L 26 26 L 36 34 L 50 20" 
            stroke="url(#blueArrowGrad)" 
            strokeWidth="4" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          {/* Blue Arrow Head */}
          <Path 
            d="M 42 20 H 50 V 28" 
            stroke="url(#blueArrowGrad)" 
            strokeWidth="4" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />

          {/* Mint Green Uptrend Arrow (Parallel and offset to the right/top) */}
          <Path 
            d="M 22 32 L 31 20 L 40 28 L 52 14" 
            stroke="url(#greenArrowGrad)" 
            strokeWidth="4.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          {/* Green Arrow Head */}
          <Path 
            d="M 44 14 H 52 V 22" 
            stroke="url(#greenArrowGrad)" 
            strokeWidth="4.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        </Svg>
      </View>

      {/* Brand Text styling */}
      {showText && (
        <View style={size === 'large' ? styles.textContainerCenter : [styles.textContainerSide, { marginLeft: gap }]}>
          <Text style={[styles.brandText, { fontSize }]}>
            Peeri<Text style={styles.brandAccent}>trade</Text>
          </Text>
          <Text style={[styles.subtitle, { fontSize: subtitleSize, letterSpacing: size === 'large' ? 4 : 2 }]}>
            TRADE • WIN • REPEAT.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContainer: {
    flexDirection: 'row',
  },
  columnContainer: {
    flexDirection: 'column',
  },
  textContainerSide: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  textContainerCenter: {
    marginTop: 16,
    alignItems: 'center',
  },
  brandText: {
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  brandAccent: {
    color: Colors.dark.primary,
  },
  subtitle: {
    fontWeight: 'bold',
    color: '#4FA3F7', // Cyan/light blue subtitle
    marginTop: 2,
  },
});
