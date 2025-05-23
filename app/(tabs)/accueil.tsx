import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { MessageCircle, Target, BookOpen, User, Home, Briefcase } from 'lucide-react-native'; // Assurez-vous que lucide-react-native est installé

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

// Définir un type plus précis pour les chemins de navigation reconnus par Expo Router
// Cela peut être étendu si vous avez d'autres routes hors des onglets.
type AppPath = 
  | '/(tabs)/chat' 
  | '/(tabs)/grands-objectifs' 
  | '/(tabs)/courses' 
  | '/outil30jours';

type NavItem = {
  name: AppPath;
  label: string;
  icon: React.ElementType;
  color?: string; // Pour une couleur spécifique si besoin
};

const navItems: NavItem[] = [
  { name: '/(tabs)/chat', label: 'Chat avec Koach', icon: MessageCircle },
  { name: '/outil30jours', label: '1 Outil 30 Jours', icon: Briefcase },
  { name: '/(tabs)/grands-objectifs', label: 'Mes Objectifs', icon: Target },
  { name: '/(tabs)/courses', label: 'Mes Cours', icon: BookOpen },
];

export default function AccueilScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const { width } = useWindowDimensions();
  const styles = getStyles(colorScheme, width);
  const iconColor = Colors[colorScheme].text;

  const handlePress = (path: AppPath) => {
    router.push(path);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.headerContainer}>
          <Home size={width > 768 ? 48 : 40} color={Colors[colorScheme].tint} />
          <ThemedText type="title" style={styles.title}>
            Bienvenue !
          </ThemedText>
          <ThemedText type="subtitle" style={styles.subtitle}>
            Que souhaitez-vous faire aujourd'hui ?
          </ThemedText>
        </View>

        <View style={styles.gridContainer}>
          {navItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <TouchableOpacity
                key={item.name}
                style={styles.gridItem}
                onPress={() => handlePress(item.name)}
                activeOpacity={0.7}
              >
                <View style={styles.iconContainer}>
                  <IconComponent size={width > 768 ? 40 : 32} color={item.color || Colors[colorScheme].tint} />
                </View>
                <ThemedText style={styles.gridItemText}>{item.label}</ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const getStyles = (scheme: 'light' | 'dark', screenWidth: number) => {
  const colors = Colors[scheme];
  const isWideScreen = screenWidth > 768;

  return StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollViewContent: {
      padding: isWideScreen ? 30 : 20,
      alignItems: 'center',
    },
    headerContainer: {
      alignItems: 'center',
      marginBottom: isWideScreen ? 40 : 30,
    },
    title: {
      marginTop: isWideScreen ? 20 : 15,
      fontSize: isWideScreen ? 32 : 28,
      textAlign: 'center',
    },
    subtitle: {
      marginTop: 10,
      fontSize: isWideScreen ? 18 : 16,
      textAlign: 'center',
      color: colors.text,
    },
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-around',
      width: '100%',
      maxWidth: 800, // Max width for the grid
    },
    gridItem: {
      backgroundColor: colors.card,
      borderRadius: 15,
      padding: isWideScreen ? 25 : 20,
      alignItems: 'center',
      justifyContent: 'center',
      width: isWideScreen ? '45%' : '46%', // Adjust for spacing
      marginBottom: isWideScreen ? 25 : 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 5,
      elevation: 3,
      minHeight: isWideScreen ? 160 : 140,
    },
    iconContainer: {
      marginBottom: 15,
      padding: 15,
      backgroundColor: colors.background, // Slightly different background for icon
      borderRadius: 50, // Circular background for icon
    },
    gridItemText: {
      fontSize: isWideScreen ? 16 : 14,
      fontWeight: '600',
      textAlign: 'center',
      color: colors.text,
    },
  });
}; 