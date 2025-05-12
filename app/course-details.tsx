import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  useWindowDimensions, TouchableOpacity // Ajouter TouchableOpacity
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router'; // Ajouter useRouter
import { getCourseById } from '@/lib/supabase'; // Changer pour getCourseById
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import ReactMarkdown from 'react-native-markdown-display'; // Pour afficher le contenu

// Type pour les détails du Cours (similaire à Course dans courses.tsx)
type CourseDetails = {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  url_logo: string | null;
};

export default function CourseDetailsScreen() {
  const { courseId, title: paramTitle } = useLocalSearchParams<{ courseId: string; title: string }>(); // Renommer title pour éviter conflit
  const [courseDetails, setCourseDetails] = useState<CourseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme() ?? 'light';
  const styles = getStyles(colorScheme);
  const { width } = useWindowDimensions();
  const markdownStyles = getMarkdownStyles(Colors[colorScheme], width);
  const router = useRouter();

  useEffect(() => {
    const fetchCourseDetails = async () => {
      if (!courseId) return;
      setLoading(true);
      const { data, error } = await getCourseById(courseId);
      if (data) {
        setCourseDetails(data as CourseDetails);
      } else {
        console.error("Erreur lors de la récupération des détails du cours:", error);
        // Afficher une erreur à l'utilisateur ?
      }
      setLoading(false);
    };
    fetchCourseDetails();
  }, [courseId]);

  const handleStartCourse = () => {
      if (!courseDetails) return; // Sécurité
      router.push({ 
        pathname: '/chapter-list', // Nouvelle route pour la liste des titres
        params: { courseId: courseDetails.id, title: courseDetails.title } // Passer les mêmes params
      });
  };

  // Utiliser le titre du cours chargé, ou celui des params en fallback
  const displayTitle = courseDetails?.title || paramTitle || 'Détails du Cours';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Stack.Screen options={{ title: displayTitle }} />

      {loading ? (
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} style={styles.loader} />
      ) : courseDetails ? (
        <>
          {/* Titre du cours (redondant avec header mais peut être stylé différemment) */}
          {/* <Text style={styles.courseTitle}>{displayTitle}</Text> */}
          
          {/* Description formatée en Markdown */}
          {courseDetails.description ? (
            <View style={styles.descriptionContainer}>
              <ReactMarkdown style={markdownStyles}>
                {courseDetails.description}
              </ReactMarkdown>
            </View>
          ) : (
            <Text style={styles.noDescriptionText}>Aucune description disponible pour ce cours.</Text>
          )}

          {/* Bouton Démarrer */}
          <TouchableOpacity 
            style={styles.startButton}
            onPress={handleStartCourse}
            activeOpacity={0.7}
          >
            <Text style={styles.startButtonText}>Démarrer le cours</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={styles.emptyText}>Impossible de charger les détails du cours.</Text>
      )}
    </ScrollView>
  );
}

// Styles Markdown adaptés
const getMarkdownStyles = (colors: typeof Colors.light | typeof Colors.dark, screenWidth: number) => StyleSheet.create({
  body: { color: colors.text, fontSize: 16, lineHeight: 24 },
  heading1: { fontSize: 24, fontWeight: 'bold', color: colors.textPrimary, marginTop: 15, marginBottom: 10, borderBottomWidth: 1, borderColor: colors.borderColor, paddingBottom: 5 },
  heading2: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary, marginTop: 10, marginBottom: 8 },
  paragraph: { marginBottom: 10, flexWrap: 'wrap' },
  bullet_list_icon: { color: colors.tint, marginRight: 8 }, 
  ordered_list_icon: { color: colors.tint, marginRight: 8, fontWeight: 'bold'},
  list_item: { marginBottom: 5, flexDirection: 'row', alignItems: 'flex-start' }, // Pour un meilleur alignement des listes
  // Ajuster la largeur max des images au conteneur
  image: { maxWidth: screenWidth - 40, alignSelf: 'center', marginVertical: 10 }, 
  link: { color: colors.tint, textDecorationLine: 'underline' }, 
  strong: { fontWeight: 'bold' },
  em: { fontStyle: 'italic' },
  // Ajouter d'autres styles si nécessaire (code, blockquote, etc.)
});

// Styles
const getStyles = (scheme: 'light' | 'dark') => {
  const colors = Colors[scheme];
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    contentContainer: { padding: 20 },
    loader: { marginTop: 50 },
    // courseTitle: { // Si on veut un titre dans le contenu
    //   fontSize: 26,
    //   fontWeight: 'bold',
    //   color: colors.textPrimary,
    //   marginBottom: 20,
    //   textAlign: 'center',
    // },
    descriptionContainer: {
      backgroundColor: colors.card,
      padding: 15,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.borderColor,
      marginBottom: 30,
    },
    noDescriptionText: {
      fontSize: 16,
      color: colors.text,
      fontStyle: 'italic',
      textAlign: 'center',
      marginBottom: 30,
    },
    startButton: {
      backgroundColor: colors.tint,
      paddingVertical: 15,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    },
    startButtonText: {
      color: colors.buttonText,
      fontSize: 18,
      fontWeight: 'bold',
    },
    emptyText: {
      textAlign: 'center',
      marginTop: 50,
      fontSize: 16,
      color: colors.text,
    },
  });
}; 