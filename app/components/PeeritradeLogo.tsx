import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

interface PeeritradeLogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

export const PeeritradeLogo: React.FC<PeeritradeLogoProps> = ({ size = 'medium' }) => {
  let width = 180;
  let height = 48;

  if (size === 'small') {
    width = 130;
    height = 35;
  } else if (size === 'large') {
    width = 250;
    height = 66;
  }

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/peeitrade_logo.png')}
        style={{ width, height }}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
