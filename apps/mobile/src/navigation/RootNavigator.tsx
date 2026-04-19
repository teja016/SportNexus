import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useAuthStore } from '../store/authStore'

import SplashScreen from '../screens/auth/SplashScreen'
import OnboardingScreen from '../screens/auth/OnboardingScreen'
import AuthLandingScreen from '../screens/auth/AuthLandingScreen'
import LoginScreen from '../screens/auth/LoginScreen'
import RegisterScreen from '../screens/auth/RegisterScreen'
import OTPVerifyScreen from '../screens/auth/OTPVerifyScreen'
import LocationSetupScreen from '../screens/auth/LocationSetupScreen'
import MainTabNavigator from './MainTabNavigator'
import AcademyDetailScreen from '../screens/main/AcademyDetailScreen'
import EnrollmentDetailScreen from '../screens/main/EnrollmentDetailScreen'
import SlotsScreen from '../screens/main/SlotsScreen'
import SlotConfirmScreen from '../screens/enrollment/SlotConfirmScreen'
import TransportOptionScreen from '../screens/enrollment/TransportOptionScreen'
import PaymentScreen from '../screens/enrollment/PaymentScreen'
import BookingSuccessScreen from '../screens/enrollment/BookingSuccessScreen'
import TransitTrackingScreen from '../screens/main/TransitTrackingScreen'
import EditProfileScreen from '../screens/main/EditProfileScreen'

const Stack = createNativeStackNavigator()

const headerStyle = {
  headerShown: true,
  headerStyle: { backgroundColor: '#fff' },
  headerTintColor: '#0D9488',
  headerTitleStyle: { fontWeight: '700' as const, color: '#111827' },
  headerShadowVisible: false,
}

export default function RootNavigator() {
  const { isAuthenticated, isOnboarded, locationSetup } = useAuthStore()

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isOnboarded ? (
          <>
            <Stack.Screen name="Splash"    component={SplashScreen} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          </>
        ) : !isAuthenticated ? (
          <>
            <Stack.Screen name="AuthLanding" component={AuthLandingScreen} />
            <Stack.Screen name="Login"       component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register"    component={RegisterScreen} options={{ headerShown: false }} />
            <Stack.Screen name="OTPVerify"   component={OTPVerifyScreen} options={{ ...headerStyle, title: 'Verify OTP' }} />
          </>
        ) : !locationSetup ? (
          <Stack.Screen name="LocationSetup" component={LocationSetupScreen} />
        ) : (
          <>
            <Stack.Screen name="MainTabs"  component={MainTabNavigator} />
            <Stack.Screen
              name="AcademyDetail"
              component={AcademyDetailScreen}
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen name="EnrollmentDetail" component={EnrollmentDetailScreen} options={{ ...headerStyle, title: 'Enrollment Details' }} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ ...headerStyle, title: 'Edit Profile' }} />
            <Stack.Screen name="Slots" component={SlotsScreen} options={{ ...headerStyle, title: 'Select Slots' }} />
            <Stack.Screen name="SlotConfirm" component={SlotConfirmScreen} options={{ ...headerStyle, title: 'Confirm Booking' }} />
            <Stack.Screen name="TransportOption" component={TransportOptionScreen} options={{ ...headerStyle, title: 'Transport' }} />
            <Stack.Screen name="Payment" component={PaymentScreen} options={{ ...headerStyle, title: 'Payment' }} />
            <Stack.Screen
              name="BookingSuccess"
              component={BookingSuccessScreen}
              options={{ gestureEnabled: false, animation: 'fade' }}
            />
            <Stack.Screen
              name="TransitTracking"
              component={TransitTrackingScreen}
              options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
