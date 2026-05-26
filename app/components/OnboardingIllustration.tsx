import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Rect, Path, Defs, LinearGradient, Stop, Ellipse } from 'react-native-svg';

export const OnboardingIllustration: React.FC = () => {
  return (
    <View style={styles.container}>
      <Svg width="260" height="200" viewBox="0 0 260 200" fill="none">
        <Defs>
          {/* Arrow Gradient */}
          <LinearGradient id="arrowGrad" x1="60" y1="100" x2="200" y2="100" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#00D285" />
            <Stop offset="0.5" stopColor="#00FFA8" />
            <Stop offset="1" stopColor="#00D285" />
          </LinearGradient>
          {/* Jersey Gradients */}
          <LinearGradient id="jerseyGrad" x1="60" y1="75" x2="90" y2="120" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#3B82F6" />
            <Stop offset="1" stopColor="#1E40AF" />
          </LinearGradient>
          <LinearGradient id="jerseyGradRight" x1="170" y1="75" x2="200" y2="120" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#3B82F6" />
            <Stop offset="1" stopColor="#1E40AF" />
          </LinearGradient>
        </Defs>

        {/* Double-Headed Horizontal Arrow */}
        {/* Left arrowhead */}
        <Path d="M 103 100 L 120 85 V 115 Z" fill="url(#arrowGrad)" />
        {/* Right arrowhead */}
        <Path d="M 157 100 L 140 85 V 115 Z" fill="url(#arrowGrad)" />
        {/* Shaft */}
        <Rect x="115" y="93" width="30" height="14" fill="url(#arrowGrad)" />

        {/* Soccer ball in the exact center */}
        <Circle cx="130" cy="100" r="16" fill="#FFFFFF" stroke="#050811" strokeWidth="2.5" />
        {/* Pentagons */}
        <Path d="M 130 94 L 135 97.5 L 133 102.5 L 127 102.5 L 125 97.5 Z" fill="#050811" />
        <Path d="M 130 94 L 130 84" stroke="#050811" strokeWidth="1.5" />
        <Path d="M 135 97.5 L 143 95.5" stroke="#050811" strokeWidth="1.5" />
        <Path d="M 133 102.5 L 137 110.5" stroke="#050811" strokeWidth="1.5" />
        <Path d="M 127 102.5 L 123 110.5" stroke="#050811" strokeWidth="1.5" />
        <Path d="M 125 97.5 L 117 95.5" stroke="#050811" strokeWidth="1.5" />
        {/* Corner pentagons */}
        <Path d="M 125 85 L 135 85 L 130 89 Z" fill="#050811" />
        <Path d="M 144 98.5 L 141.5 105 L 139 100 Z" fill="#050811" />
        <Path d="M 116 98.5 L 118.5 105 L 121 100 Z" fill="#050811" />
        <Path d="M 130 115.5 L 133 110.5 L 127 110.5 Z" fill="#050811" />

        {/* LEFT PLAYER */}
        {/* Shadow */}
        <Ellipse cx="85" cy="178" rx="20" ry="3" fill="#050811" opacity="0.6" />
        {/* Legs & Shoes */}
        <Rect x="79" y="145" width="4" height="23" fill="#FFD5C6" />
        <Rect x="79" y="133" width="4" height="12" fill="#3B82F6" /> {/* Sock */}
        <Path d="M 76 168 Q 78 168 83 172 H 75 Z" fill="#050811" /> {/* Shoe */}
        
        <Rect x="87" y="145" width="4" height="23" fill="#FFD5C6" />
        <Rect x="87" y="133" width="4" height="12" fill="#3B82F6" /> {/* Sock */}
        <Path d="M 84 168 Q 86 168 91 172 H 83 Z" fill="#050811" /> {/* Shoe */}

        {/* Shorts */}
        <Path d="M 74 120 H 96 V 135 H 87 V 131 H 83 V 135 H 74 Z" fill="#131C32" />

        {/* Jersey Body */}
        <Path d="M 76 75 H 94 L 97 121 H 73 Z" fill="url(#jerseyGrad)" />
        {/* Left Sleeve */}
        <Path d="M 76 75 L 70 88 H 75 L 80 78 Z" fill="url(#jerseyGrad)" />
        <Rect x="70" y="88" width="5" height="12" fill="#FFD5C6" /> {/* Arm */}
        {/* Right Sleeve */}
        <Path d="M 94 75 L 100 88 H 95 L 90 78 Z" fill="url(#jerseyGrad)" />
        <Rect x="95" y="88" width="5" height="12" fill="#FFD5C6" /> {/* Arm */}

        {/* Neck */}
        <Rect x="83" y="70" width="4" height="6" fill="#FFD5C6" />
        {/* Head */}
        <Circle cx="85" cy="62" r="10" fill="#FFD5C6" />
        {/* Hair */}
        <Path d="M 75 62 C 75 50, 95 50, 95 62 L 95 58 C 95 52, 75 52, 75 58 Z" fill="#1C2541" />
        <Path d="M 75 58 C 75 48, 95 48, 95 58 C 91 50, 79 50, 75 58" fill="#1C2541" />


        {/* RIGHT PLAYER */}
        {/* Shadow */}
        <Ellipse cx="175" cy="178" rx="20" ry="3" fill="#050811" opacity="0.6" />
        {/* Legs & Shoes */}
        <Rect x="169" y="145" width="4" height="23" fill="#FFD5C6" />
        <Rect x="169" y="133" width="4" height="12" fill="#3B82F6" /> {/* Sock */}
        <Path d="M 166 168 Q 168 168 173 172 H 165 Z" fill="#050811" /> {/* Shoe */}
        
        <Rect x="177" y="145" width="4" height="23" fill="#FFD5C6" />
        <Rect x="177" y="133" width="4" height="12" fill="#3B82F6" /> {/* Sock */}
        <Path d="M 174 168 Q 176 168 181 172 H 173 Z" fill="#050811" /> {/* Shoe */}

        {/* Shorts */}
        <Path d="M 164 120 H 186 V 135 H 177 V 131 H 173 V 135 H 164 Z" fill="#131C32" />

        {/* Jersey Body */}
        <Path d="M 166 75 H 184 L 187 121 H 163 Z" fill="url(#jerseyGradRight)" />
        {/* Left Sleeve */}
        <Path d="M 166 75 L 160 88 H 165 L 170 78 Z" fill="url(#jerseyGradRight)" />
        <Rect x="160" y="88" width="5" height="12" fill="#FFD5C6" /> {/* Arm */}
        {/* Right Sleeve */}
        <Path d="M 184 75 L 190 88 H 185 L 180 78 Z" fill="url(#jerseyGradRight)" />
        <Rect x="185" y="88" width="5" height="12" fill="#FFD5C6" /> {/* Arm */}

        {/* Neck */}
        <Rect x="173" y="70" width="4" height="6" fill="#FFD5C6" />
        {/* Head */}
        <Circle cx="175" cy="62" r="10" fill="#FFD5C6" />
        {/* Hair */}
        <Path d="M 165 62 C 165 50, 185 50, 185 62 L 185 58 C 185 52, 165 52, 165 58 Z" fill="#8B4513" />
        <Path d="M 165 58 C 165 48, 185 48, 185 58 C 181 50, 169 50, 165 58" fill="#8B4513" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
});
