import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, useWindowDimensions, Animated } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const CoursSqueletteItem = () => {
  const colorScheme = useColorScheme() ?? 'light';
  const { width } = useWindowDimensions();
  const isWideScreen = width > 768;

  const skeletonColor = Colors[colorScheme].card;
  const pulseAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
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
    outputRange: [0.5, 1],
  });

  const styles = StyleSheet.create({
    itemContainer: {
      backgroundColor: Colors[colorScheme].card,
      borderRadius: isWideScreen ? 12 : 10,
      padding: isWideScreen ? 18 : 12,
      marginBottom: isWideScreen ? 18 : 12,
      borderWidth: 1,
      borderColor: Colors[colorScheme].borderColor,
      flexDirection: 'row',
      alignItems: 'center',
    },
    logoSkeleton: {
      width: isWideScreen ? 60 : 50,
      height: isWideScreen ? 60 : 50,
      borderRadius: isWideScreen ? 10 : 8,
      marginRight: isWideScreen ? 18 : 15,
      backgroundColor: skeletonColor, 
    },
    itemContent: {
      flex: 1,
    },
    titleSkeleton: {
      height: isWideScreen ? 20 : 18,
      width: '80%',
      backgroundColor: skeletonColor,
      borderRadius: 4,
      marginBottom: isWideScreen ? 8 : 6, // Espace si vous aviez une sous-ligne
    },
    // Si vous aviez une ligne de description, ajoutez un skeletonBlock pour elle aussi
    // descriptionSkeleton: {
    //   height: isWideScreen ? 14 : 12,
    //   width: '60%',
    //   backgroundColor: skeletonColor,
    //   borderRadius: 4,
    // },
  });

  return (
    <Animated.View style={[styles.itemContainer, { opacity: animatedOpacity }]}>
      <View style={styles.logoSkeleton} />
      <View style={styles.itemContent}>
        <View style={styles.titleSkeleton} />
        {/* <View style={styles.descriptionSkeleton} /> */}
      </View>
    </Animated.View>
  );
};

export default CoursSqueletteItem; 