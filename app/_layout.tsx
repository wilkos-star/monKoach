import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { MenuProvider } from 'react-native-popup-menu';
import { ActivityIndicator, View } from 'react-native';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function InitialLayout() {
  const { user, loading: authLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;

    const currentRoute = segments.join('/') || 'welcome';
    const isAuthScreen = segments[0] === 'auth';
    const isWelcomeScreen = currentRoute === 'welcome';

    if (user) {
      if (user.nom && user.email) {
        if (isAuthScreen || isWelcomeScreen) {
          console.log('(RootLayout) User authenticated, profile complete, redirecting from auth/welcome to /accueil');
          router.replace('/(tabs)/accueil');
        }
      } else {
        if (currentRoute !== 'auth/AdditionalInfoScreen') {
          console.log('(RootLayout) User authenticated, profile incomplete, redirecting to /auth/AdditionalInfoScreen');
          router.replace({
            pathname: '/auth/AdditionalInfoScreen',
            params: { 
              userId: user.id, 
              authToken: user.auth_token, 
              phoneNumber: user.phone_number, 
              currentNom: user.nom || ''
            }
          });
        }
      }
    } else {
      if (!isAuthScreen && !isWelcomeScreen) {
        console.log('User not authenticated, redirecting to /welcome');
        router.replace('/welcome');
      } else if (isWelcomeScreen && segments.length === 1) {
        console.log('User not authenticated, on /welcome screen.');
      }
    }
    SplashScreen.hideAsync();

  }, [user, authLoading, segments, router]);

  if (authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.light.background }}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="auth/auth" options={{ headerShown: false }} />
      <Stack.Screen name="auth/EmailAuthScreen" options={{ headerShown: false }} />
      <Stack.Screen name="auth/VerificationScreen" options={{ headerShown: false }} />
      <Stack.Screen name="auth/AdditionalInfoScreen" options={{ title: "Complétez Votre Profil", headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="outil30jours" options={{ headerShown: false }} />
      <Stack.Screen name="objectif-details" />
      <Stack.Screen name="course-details" />
      <Stack.Screen name="chapter-list" />
      <Stack.Screen name="chapter-content" />
      <Stack.Screen name="certificates" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    if (fontsLoaded || fontError) {
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <MenuProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <InitialLayout />
          <StatusBar style="auto" />
          {isClient && <Toast />}
        </ThemeProvider>
      </MenuProvider>
    </AuthProvider>
  );
}
