import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../constants/Colors';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'dark';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const getButtonStyle = () => {
    switch (variant) {
      case 'primary':
        return styles.primaryButton;
      case 'secondary':
        return styles.secondaryButton;
      case 'outline':
        return styles.outlineButton;
      case 'dark':
        return styles.darkButton;
      default:
        return styles.primaryButton;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'primary':
        return styles.primaryText;
      case 'secondary':
        return styles.secondaryText;
      case 'outline':
        return styles.outlineText;
      case 'dark':
        return styles.darkText;
      default:
        return styles.primaryText;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled || loading}
      style={[styles.baseButton, getButtonStyle(), disabled && styles.disabledButton, style]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? '#0A1124' : '#FFFFFF'} />
      ) : (
        <Text style={[styles.baseText, getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginVertical: 8,
  },
  primaryButton: {
    backgroundColor: Colors.dark.primary,
  },
  secondaryButton: {
    backgroundColor: Colors.dark.secondary,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#3B82F6',
  },
  darkButton: {
    backgroundColor: '#131C32',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  disabledButton: {
    opacity: 0.5,
  },
  baseText: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: '#0A1124',
  },
  outlineText: {
    color: '#3B82F6',
  },
  darkText: {
    color: '#FFFFFF',
  },
});
