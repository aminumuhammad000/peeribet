import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { Colors } from '../constants/Colors';

interface CustomInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  error?: string;
  style?: ViewStyle;
  maxLength?: number;
  autoFocus?: boolean;
}

export const CustomInput: React.FC<CustomInputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  error,
  style,
  maxLength,
  autoFocus = false,
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {/* Label */}
      <Text style={styles.label}>{label}</Text>

      {/* Input wrapper with solid white background */}
      <View style={[styles.inputWrapper, error ? styles.inputErrorBorder : null]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize="none"
          maxLength={maxLength}
          autoFocus={autoFocus}
          style={styles.textInput}
        />

        {/* Eye/Eye-off switch for passwords */}
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            activeOpacity={0.7}
            style={styles.iconContainer}
          >
            {isPasswordVisible ? (
              <Eye size={20} color="#64748B" />
            ) : (
              <EyeOff size={20} color="#64748B" />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Validation error display */}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 8,
  },
  label: {
    color: '#ECEFF1',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ECEFF1',
  },
  inputErrorBorder: {
    borderColor: Colors.dark.red,
    borderWidth: 1.5,
  },
  textInput: {
    flex: 1,
    height: '100%',
    color: '#0A1124',
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  iconContainer: {
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: Colors.dark.red,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 4,
    fontFamily: 'Inter',
  },
});
