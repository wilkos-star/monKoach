import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, useWindowDimensions, Platform
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { getChapters, getCompletedChapters } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ChevronRight, CheckCircle } from 'lucide-react-native';
import { useAuth } from '@/providers/AuthProvider';

// Copier le type Chapter de l'ancienne version de course-details
type Chapter = {
  id: string;
  course_id: string;
  title: string;
  content: string | null;
  order_index: number;
  created_at: string;
};

// Copier les styles principaux de l'ancienne version de course-details
const getStyles = (scheme: 'light' | 'dark', screenWidth: number) => {
  const colors = Colors[scheme];
  const isWideScreen = screenWidth > 768;

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    contentContainer: { 
        paddingVertical: 0,
        maxWidth: Platform.OS === 'web' ? 800 : undefined,
        width: Platform.OS === 'web' ? '100%' : undefined,
        alignSelf: Platform.OS === 'web' ? 'center' : undefined,
    },
    loader: { marginTop: 50 },
    itemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: isWideScreen ? 30 : 20,
      paddingVertical: isWideScreen ? 20 : 15,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderColor: colors.borderColor,
    },
    itemCompleted: {
    },
    itemTextContainer: {
      flex: 1,
      marginRight: isWideScreen ? 15 : 10,
    },
    chapterIndex: {
      fontSize: isWideScreen ? 17 : 16,
      color: colors.text,
      fontWeight: '600',
      marginRight: isWideScreen ? 12 : 10,
    },
    chapterTitle: {
      fontSize: isWideScreen ? 17 : 16,
      color: colors.text,
    },
    chapterTitleCompleted: {
       color: 'green',
       fontWeight: '500',
    },
    iconCompleted: {
        marginRight: isWideScreen ? 12 : 10,
        width: isWideScreen ? 22 : 20,
        height: isWideScreen ? 22 : 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
      textAlign: 'center',
      marginTop: 50,
      fontSize: isWideScreen ? 18 : 16,
      color: colors.text,
    },
  });
};

// Renommer le composant
export default function ChapterListScreen() {
  const { courseId, title } = useLocalSearchParams<{ courseId: string; title: string }>();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedChapters, setCompletedChapters] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const { width } = useWindowDimensions();
  const styles = getStyles(colorScheme, width);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      if (!courseId || !user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const [chaptersResult, completedResult] = await Promise.all([
        getChapters(courseId),
        getCompletedChapters(user.id, courseId)
      ]);

      if (chaptersResult.data) {
        setChapters(chaptersResult.data as Chapter[]);
      } else {
        console.error("Erreur chapters:", chaptersResult.error);
      }

      if (completedResult.data) {
        setCompletedChapters(completedResult.data);
      } else {
        console.error("Erreur completed chapters:", completedResult.error);
        setCompletedChapters(new Set());
      }
      setLoading(false);
    };
    fetchData();
  }, [courseId, user]);

  const handlePressChapter = (chapterId: string) => {
    if (!courseId) return;
    router.push({ 
        pathname: '/chapter-content', 
        params: { courseId: courseId, chapterId: chapterId, title: title }
    });
  };

  const renderItem = ({ item, index }: { item: Chapter, index: number }) => {
    const isCompleted = completedChapters.has(item.id);
    const iconSize = width > 768 ? 22 : 20;

    return (
      <TouchableOpacity 
        style={[styles.itemContainer, isCompleted && styles.itemCompleted]} 
        onPress={() => handlePressChapter(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.iconCompleted}>
          {isCompleted && (
              <CheckCircle size={iconSize} color="green" />
          )}
        </View>
        <Text style={styles.chapterIndex}>{index + 1}.</Text>
        <View style={styles.itemTextContainer}>
          <Text style={[styles.chapterTitle, isCompleted && styles.chapterTitleCompleted]}>
              {item.title}
          </Text>
        </View>
        <ChevronRight size={iconSize} color={Colors[colorScheme].icon} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}> 
      <Stack.Screen options={{ title: title || 'Chapitres' }} />

      {loading ? (
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} style={styles.loader} />
      ) : (
        <FlatList
          data={chapters}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.contentContainer}
          ListEmptyComponent={<Text style={styles.emptyText}>Aucun chapitre trouvé pour ce cours.</Text>}
        />
      )}
    </View>
  );
} 