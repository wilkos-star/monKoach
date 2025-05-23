import { Tabs, useRouter, useSegments, usePathname } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { Target, User, BookOpen, MessageCircle, Home } from 'lucide-react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import CustomInstallPrompt from '../../components/CustomInstallPrompt';
import { useAuth } from '@/providers/AuthProvider';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) {
      return;
    }

    // La logique de redirection vers AdditionalInfoScreen a été déplacée 
    // vers les écrans d'authentification (ex: VerificationScreen)
    // ou devrait être gérée par un layout racine si une protection globale est nécessaire.
    // if (user && (!user.email || !user.nom) && pathname !== '/auth/AdditionalInfoScreen') {
    //   console.log('(tabs)/_layout: User profile incomplete, redirecting to AdditionalInfoScreen from:', pathname, user);
    //   router.replace('/auth/AdditionalInfoScreen');
    // } else 
    if (!user && pathname !== '/auth/PhoneNumberScreen' && pathname !== '/auth/VerificationScreen' && pathname !== '/auth/AdditionalInfoScreen' && pathname !== '/auth/auth') {
      // Ce console.log est utile pour le débogage, pour s'assurer que le layout racine gère bien la redirection des non-connectés.
      console.log('(tabs)/_layout: No user, not on auth screen. Root layout should handle redirection to login.', pathname);
    }
  }, [user, loading, router, pathname]);

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              position: 'absolute',
            },
            default: {},
          }),
        }}>
        <Tabs.Screen
          name="accueil"
          options={{
            title: 'Accueil',
            tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Chat',
            tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="grands-objectifs"
          options={{
            title: 'Objectifs',
            tabBarIcon: ({ color, size }) => <Target color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="courses"
          options={{
            title: 'Cours',
            tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          }}
        />
      </Tabs>
      <CustomInstallPrompt />
    </>
  );
}
