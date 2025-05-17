import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, useWindowDimensions, Animated } from 'react-native';
import { Colors } from '@/constants/Colors'; // Ajustez le chemin si nécessaire
import { useColorScheme } from '@/hooks/useColorScheme'; // Ajustez le chemin si nécessaire

const ObjectifSqueletteItem = () => {
  const colorScheme = useColorScheme() ?? 'light';
  const { width } = useWindowDimensions();
  const isWideScreen = width > 768;

  const skeletonColor = Colors[colorScheme].card; // Ou une couleur grise dédiée comme Colors[colorScheme].border ou #e0e0e0
  const highlightColor = Colors[colorScheme].background; // Pour une éventuelle animation de balayage

  // Animation
  const pulseAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true, // Utiliser le pilote natif pour de meilleures performances
        }),
        Animated.timing(pulseAnimation, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnimation]);

  const animatedOpacity = pulseAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1], // Faire varier l'opacité entre 0.5 et 1
  });

  const styles = StyleSheet.create({
    itemContainer: {
      backgroundColor: Colors[colorScheme].card,
      borderRadius: isWideScreen ? 12 : 10,
      padding: isWideScreen ? 20 : 15,
      marginBottom: isWideScreen ? 20 : 15,
      borderWidth: 1,
      borderColor: Colors[colorScheme].borderColor,
      flexDirection: 'row',
      alignItems: 'center',
    },
    itemContent: {
      flex: 1,
      marginRight: isWideScreen ? 10 : 5,
    },
    skeletonBlock: {
      backgroundColor: skeletonColor,
      borderRadius: 4,
    },
    titleSkeleton: {
      height: isWideScreen ? 22 : 20,
      width: '70%',
      marginBottom: isWideScreen ? 12 : 10,
    },
    detailSkeleton: {
      height: isWideScreen ? 16 : 14,
      width: '50%',
      marginBottom: isWideScreen ? 7 : 5,
    },
    menuButtonSkeleton: {
      width: isWideScreen ? 24 : 22,
      height: isWideScreen ? 24 : 22,
      padding: isWideScreen ? 12 : 10,
    },
  });

  return (
    <View style={styles.itemContainer}>
      <View style={styles.itemContent}>
        <Animated.View style={[styles.skeletonBlock, styles.titleSkeleton, { opacity: animatedOpacity }]} />
        <Animated.View style={[styles.skeletonBlock, styles.detailSkeleton, { opacity: animatedOpacity }]} />
        <Animated.View style={[styles.skeletonBlock, styles.detailSkeleton, { width: '40%', opacity: animatedOpacity }]} />
      </View>
      <Animated.View style={[styles.skeletonBlock, styles.menuButtonSkeleton, { opacity: animatedOpacity }]} />
    </View>
  );
};

export default ObjectifSqueletteItem; 