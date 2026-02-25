import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
// Dono dashboards import karein
import Dashboard from '../screens/Dashboard'; 
import DonorDashboard from '../screens/DonorDashboard'; 
import ProfileScreen from '../screens/Profile';
import MoreSettingsScreen from '../screens/MoreSettingsScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator({ route }: any) {
  const { user } = route.params || {};
  const userRole = user?.user?.role?.toUpperCase(); // Role extraction

  // Role ke basis pe Dashboard component select karna
  const DashboardComponent = userRole === 'ADMIN' ? Dashboard : DonorDashboard;

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
        component={DashboardComponent} 
        initialParams={{ user }}
        options={{ 
          tabBarLabel: userRole === 'ADMIN' ? 'Admin Hub' : 'Home',
          tabBarIcon: ({ color }) => <Text style={{fontSize: 20, color}}>🏠</Text> 
        }}
      />
      {/* Baki tabs same rahenge */}
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