import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Home, Landmark, TrendingUp, Wallet, User } from 'lucide-react-native';
import { authService } from '../../services/apiService';

export default function TabsLayout() {
  const router = useRouter();

  useEffect(() => {
    const verifyAuth = async () => {
      const isAuth = await authService.isAuthenticated();
      if (!isAuth) {
        router.replace('/signin');
      }
    };
    verifyAuth();
  }, [router]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.dark.primary,
        tabBarInactiveTintColor: Colors.dark.placeholder,
        tabBarStyle: {
          backgroundColor: '#131C32', // Matches card elevation slate
          borderTopWidth: 0,
          height: 52,
          paddingBottom: 4,
          paddingTop: 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          fontFamily: 'Inter',
          marginTop: -2,
          marginBottom: 4,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="market"
        options={{
          title: 'Market',
          tabBarIcon: ({ color, size }) => <Landmark size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="trades"
        options={{
          title: 'Trades',
          tabBarIcon: ({ color, size }) => <TrendingUp size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color, size }) => <Wallet size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
