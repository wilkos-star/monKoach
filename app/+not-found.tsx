import React from 'react';
import { Link, Stack } from 'expo-router';
import { StyleSheet, useWindowDimensions } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function NotFoundScreen() {
  const { width } = useWindowDimensions();
  const isWideScreen = width > 768;

  const titleType = isWideScreen ? "title" : "title";
  const linkTextType = isWideScreen ? "link" : "link";

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <ThemedView style={[
        styles.container,
        isWideScreen && styles.containerWide
      ]}>
        <ThemedText type={titleType}>This screen doesn't exist.</ThemedText>
        <Link href="/" style={[styles.link, isWideScreen && styles.linkWide]}>
          <ThemedText type={linkTextType}>Go to home screen!</ThemedText>
        </Link>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  containerWide: {
    padding: 40,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkWide: {
    marginTop: 25,
    paddingVertical: 20,
  },
});
