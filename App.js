import 'react-native-gesture-handler';
import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Text, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';

import SplashScreen from './src/screens/SplashScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import HomeScreen from './src/screens/HomeScreen';
import SOSScreen from './src/screens/SOSScreen';
import ChatbotScreen from './src/screens/ChatbotScreen';
import ServicesScreen from './src/screens/ServicesScreen';
import CrashShieldScreen from './src/screens/CrashShieldScreen';
import ParamedicCardScreen from './src/screens/ParamedicCardScreen';
import HazmatScreen from './src/screens/HazmatScreen';
import NightBeaconScreen from './src/screens/NightBeaconScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import GuidesScreen from './src/screens/GuidesScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabIcon({ icon, focused }) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#FF1744',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.35)',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
      }}
    >
      <Tab.Screen name="Navigate" component={HomeScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🗺️" focused={focused} /> }} />
      <Tab.Screen name="SOS" component={SOSScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🆘" focused={focused} />,
          tabBarLabelStyle: { fontSize: 10, fontWeight: '900', color: '#FF1744' },
        }} />
      <Tab.Screen name="AI Chat" component={ChatbotScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🤖" focused={focused} /> }} />
      <Tab.Screen name="Services" component={ServicesScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🏥" focused={focused} /> }} />
      <Tab.Screen name="Settings" component={SettingsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="⚙️" focused={focused} /> }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [splashDone,  setSplashDone]  = useState(false);
  const [welcomed,    setWelcomed]    = useState(false);

  if (!splashDone) {
    return <SplashScreen onDone={() => setSplashDone(true)} />;
  }

  if (!welcomed) {
    return (
      <WelcomeScreen
        onDone={() => {
          Speech.stop();
          setWelcomed(true);
        }}
      />
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#080C14" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_bottom' }}>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="CrashShield" component={CrashShieldScreen} />
          <Stack.Screen name="ParamedicCard" component={ParamedicCardScreen} />
          <Stack.Screen name="Hazmat" component={HazmatScreen} />
          <Stack.Screen name="NightBeacon" component={NightBeaconScreen} />
          <Stack.Screen name="Guides" component={GuidesScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0D1421',
    borderTopColor: 'rgba(255,23,68,0.2)',
    borderTopWidth: 1,
    height: 68,
    paddingBottom: 8,
    paddingTop: 4,
    elevation: 20,
    shadowColor: '#FF1744',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
  },
  tabIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  tabIconActive: {
    backgroundColor: 'rgba(255,23,68,0.15)',
    shadowColor: '#FF1744',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
});
