import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, StyleSheet } from 'react-native';
import Dashboard from '../screens/Dashboard';
import ProfileScreen from '../screens/Profile';
import MoreSettingsScreen from '../screens/MoreSettingsScreen';
const Tab = createBottomTabNavigator();

export default function TabNavigator({ route }: any) {
  const { user } = route.params || {};

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#16476A',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: { height: 70, paddingBottom: 10 },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={Dashboard} 
        initialParams={{ user }}
        options={{ tabBarIcon: ({ color }) => <Text style={{fontSize: 20, color}}>🏠</Text> }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        initialParams={{ user }}
        options={{ tabBarIcon: ({ color }) => <Text style={{fontSize: 20, color}}>👤</Text> }}
      />
      <Tab.Screen 
        name="More" 
        component={MoreSettingsScreen} 
        initialParams={{ user }}
        options={{ tabBarIcon: ({ color }) => <Text style={{fontSize: 20, color}}>☰</Text> }}
      />
    </Tab.Navigator>
  );
}