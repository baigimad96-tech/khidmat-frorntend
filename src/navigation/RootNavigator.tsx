import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RegistrationScreen from '../screens/RegistrationScreen';
import LoginScreen from '../screens/LoginScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import ProfileScreen from '../screens/Profile'; 
import ChangePasswordScreen from '../screens/ChangePassword';
import UserManagementScreen from '../screens/UserManagementScreen'; 
import TabNavigator from './TabNavigator';
import AdminAssignmentScreen from '../screens/AdminAssignmentScreen';
import SurveyorTasksScreen from '../screens/SurveyorTasksScreen';
import FillDoneeProfile from '../screens/FillDoneeProfile';




const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Registration" component={RegistrationScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="MainApp" component={TabNavigator} />
      <Stack.Screen name="UserManagement" component={UserManagementScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="ProfileScreenDetail" component={ProfileScreen} />

      {/* ADMIN & SURVEYOR FLOW */}
      <Stack.Screen name="AdminAssignment" component={AdminAssignmentScreen} />
      <Stack.Screen name="SurveyorTasks" component={SurveyorTasksScreen} />
      <Stack.Screen name="FillDoneeProfile" component={FillDoneeProfile} />
    </Stack.Navigator>
  );
}