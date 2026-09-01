import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react-native';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastEvent {
  id: number;
  message: string;
  type: ToastType;
}

type ToastListener = (message: string, type?: ToastType) => void;
let globalToastListener: ToastListener | null = null;

export const showToast = (message: string, type: ToastType = 'info') => {
  if (globalToastListener && message) {
    globalToastListener(message, type);
  }
};

export const GlobalToast: React.FC = () => {
  const [toast, setToast] = useState<ToastEvent | null>(null);
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    globalToastListener = (message: string, type: ToastType = 'info') => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setToast({ id: Date.now(), message, type });

      // Animate in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after 2.5 seconds
      timeoutRef.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -80,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setToast(null);
        });
      }, 2500);
    };

    return () => {
      globalToastListener = null;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!toast) return null;

  const getTheme = () => {
    switch (toast.type) {
      case 'success':
        return {
          icon: <CheckCircle2 size={18} color="#00D285" strokeWidth={2.5} />,
          border: 'rgba(0, 210, 133, 0.4)',
          glow: 'rgba(0, 210, 133, 0.15)',
          color: '#00D285',
        };
      case 'error':
        return {
          icon: <AlertCircle size={18} color="#EF4444" strokeWidth={2.5} />,
          border: 'rgba(239, 68, 68, 0.4)',
          glow: 'rgba(239, 68, 68, 0.15)',
          color: '#EF4444',
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={18} color="#F59E0B" strokeWidth={2.5} />,
          border: 'rgba(245, 158, 11, 0.4)',
          glow: 'rgba(245, 158, 11, 0.15)',
          color: '#F59E0B',
        };
      default:
        return {
          icon: <Info size={18} color="#3B82F6" strokeWidth={2.5} />,
          border: 'rgba(59, 130, 246, 0.4)',
          glow: 'rgba(59, 130, 246, 0.15)',
          color: '#3B82F6',
        };
    }
  };

  const theme = getTheme();

  return (
    <View style={styles.outerContainer} pointerEvents="none">
      <Animated.View
        style={[
          styles.toastCard,
          {
            borderColor: theme.border,
            backgroundColor: '#0F172A',
            shadowColor: theme.color,
            transform: [{ translateY }],
            opacity,
          },
        ]}
      >
        <View style={styles.iconBox}>{theme.icon}</View>
        <Text style={styles.toastMessage} numberOfLines={2}>
          {toast.message}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 20 : 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 99999,
    elevation: 99999,
    paddingHorizontal: 20,
  },
  toastCard: {
    maxWidth: 480,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    gap: 12,
  },
  iconBox: {
    flexShrink: 0,
  },
  toastMessage: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 13.5,
    fontWeight: '600',
    fontFamily: 'Inter',
    lineHeight: 18,
  },
});
