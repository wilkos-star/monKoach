import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  View, Text, SectionList, StyleSheet, ActivityIndicator, 
  RefreshControl, TouchableOpacity, Image, useWindowDimensions, Platform, 
  LayoutAnimation, UIManager, Animated, Pressable
} from 'react-native';
import { getCourses, getUserStartedCourseIds, getChapters, getCompletedChapters } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';
import { BookOpen } from 'lucide-react-native';
import { useAuth } from '@/providers/AuthProvider';
import { useIsFocused } from '@react-navigation/native';
import CoursSqueletteItem from '@/components/ui/skeletons/CoursSqueletteItem';

// Type pour les cours
type Course = {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  url_logo: string | null;
};

// Activer LayoutAnimation pour Android (à faire une seule fois, typiquement au chargement du module)
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function CoursesScreen() {
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [startedCourseIds, setStartedCourseIds] = useState<Set<string>>(new Set());
  const [completedCourseIds, setCompletedCourseIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const { width } = useWindowDimensions(); // Get screen width
  const styles = getStyles(colorScheme, width); // Pass width to styles
  const router = useRouter();
  const isFocused = useIsFocused(); // Hook pour savoir si l'écran est focus
  const opacity = useRef(new Animated.Value(0)).current; // Valeur animée pour l'opacité
  const colors = Colors[colorScheme]; // 'colors' is defined here for the component
  const isWideScreen = width > 768; // 'isWideScreen' is defined here

  useEffect(() => {
    if (isFocused) {
      // Fondu en entrée quand l'écran est focus
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300, // Durée de l'animation en ms
        useNativeDriver: true, // Important pour la performance
      }).start();
    } else {
      // (Optionnel) Fondu en sortie quand l'écran perd le focus
      // Si vous ne voulez pas de fondu en sortie, vous pouvez omettre ce else
      // ou simplement mettre opacity à 0 directement si l'écran doit être "caché" rapidement
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150, 
        useNativeDriver: true,
      }).start();
    }
  }, [isFocused, opacity]);

  const fetchData = async () => {
    if (!user) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); // Animer la disparition
      setAllCourses([]);
      setStartedCourseIds(new Set());
      setCompletedCourseIds(new Set());
      setLoading(false);
      return;
    }
    // Ne pas mettre setLoading(true) ici si on veut animer l'apparition depuis un état vide
    // Si on veut une animation sur le changement de données après chargement, c'est ok.
    // Pour un effet d'apparition initial, LayoutAnimation doit être appelé avant que les données n'arrivent
    // et que le loading devienne false.

    try {
      const [coursesResult, startedResult] = await Promise.all([
        getCourses(),
        getUserStartedCourseIds(user.id)
      ]);

      let coursesFromState: Course[] = [];
      if (coursesResult.data) {
        coursesFromState = coursesResult.data as Course[];
      } else {
        console.error("Erreur cours:", coursesResult.error);
        // coursesFromState reste []
      }

      let currentStartedIds = new Set<string>();
      if (startedResult.data) {
        currentStartedIds = startedResult.data;
      } else {
        console.error("Erreur cours commencés:", startedResult.error);
      }

      let currentCompletedIds = new Set<string>();
      if (user && coursesFromState.length > 0) {
        const completedPromises = coursesFromState.map(async (course) => {
          const [allChaptersResult, completedChaptersResult] = await Promise.all([
            getChapters(course.id),
            getCompletedChapters(user.id, course.id)
          ]);
          const totalChaptersCount = allChaptersResult.data?.length || 0;
          const completedChaptersCount = completedChaptersResult.data?.size || 0;
          if (totalChaptersCount > 0 && totalChaptersCount === completedChaptersCount) {
            return course.id;
          }
          return null;
        });
        const resolvedCompletedIds = await Promise.all(completedPromises);
        currentCompletedIds = new Set(resolvedCompletedIds.filter(id => id !== null) as string[]);
      } 
      
      // Configurer l'animation AVANT de mettre à jour les états qui affectent la liste
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setAllCourses(coursesFromState);
      setStartedCourseIds(currentStartedIds);
      setCompletedCourseIds(currentCompletedIds); 

    } catch (error) {
        console.error("Erreur globale dans fetchData:", error);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); // Animer vers l'état vide en cas d'erreur
        setAllCourses([]);
        setStartedCourseIds(new Set());
        setCompletedCourseIds(new Set());
    } finally {
        // setLoading(false) ici si l'animation doit se produire avant que le loader disparaisse
        // Ou après si l'animation est sur le contenu lui-même pendant que le loader est déjà parti.
        // Pour l'effet le plus visible, on anime le changement de contenu.
        setLoading(false); 
    }
  };

  useEffect(() => {
    if (isFocused) { // Charger les données seulement si l'écran est focus
      setLoading(true); 
      fetchData();
    }
    // Si vous voulez que les données se vident quand on quitte l'onglet (pour forcer le rechargement complet avec animation)
    // else { 
    //   setAllCourses([]); 
    //   setStartedCourseIds(new Set()); 
    //   setCompletedCourseIds(new Set()); 
    //   setLoading(false); // ou true si vous voulez un loader au retour
    // }
  }, [user, isFocused]); // Ajout de isFocused ici

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [user]); // Inclure user dans les dépendances de rafraîchissement

  const handlePressCourse = (courseId: string, courseTitle: string) => {
    // Vérifier si le cours est dans la liste des cours commencés
    if (startedCourseIds.has(courseId)) {
      // Naviguer directement à la liste des chapitres
      router.push({ 
        pathname: '/chapter-list', 
        params: { courseId: courseId, title: courseTitle }
      });
    } else {
      // Naviguer à la page de détails (description + bouton démarrer)
      router.push({ 
        pathname: '/course-details', 
        params: { courseId: courseId, title: courseTitle }
      });
    }
  };

  // Séparer les cours en sections avec useMemo
  const courseSections = useMemo(() => {
    const completed = allCourses.filter(course => completedCourseIds.has(course.id));
    const inProgress = allCourses.filter(course => startedCourseIds.has(course.id) && !completedCourseIds.has(course.id));
    const available = allCourses.filter(course => !startedCourseIds.has(course.id) && !completedCourseIds.has(course.id));
    
    const sections = [];
    if (completed.length > 0) {
      sections.push({ title: 'Cours Terminés', data: completed });
    }
    if (inProgress.length > 0) {
      sections.push({ title: 'Mes Cours (En cours)', data: inProgress });
    }
    if (available.length > 0) {
      sections.push({ title: 'Autres Cours Disponibles', data: available });
    }
    return sections;
  }, [allCourses, startedCourseIds, completedCourseIds]);

  const renderItem = ({ item }: { item: Course }) => (
    <Pressable 
      style={({ pressed }) => [
        styles.itemContainer,
        {
          opacity: pressed ? 0.7 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }], // Slightly less scale for list items
        },
      ]}
      onPress={() => handlePressCourse(item.id, item.title)}
    >
      {/* Afficher le logo si url_logo existe, sinon une icône placeholder */}
      {item.url_logo ? (
        <Image source={{ uri: item.url_logo }} style={styles.courseLogo} resizeMode="cover" />
      ) : (
        <View style={styles.logoPlaceholder}>
            <BookOpen size={width > 768 ? 28 : 24} color={Colors[colorScheme].tint} />
        </View>
      )}
      {/* Afficher seulement le titre à côté */}
      <Text style={styles.itemTitle}>{item.title}</Text>
    </Pressable>
  );

  const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
      <View style={styles.sectionHeaderContainer}>
        <Text style={styles.sectionHeaderText}>{title}</Text>
      </View>
  );

  const renderListEmptyComponent = () => {
    return (
      <View style={styles.emptyStateContainer}>
        <BookOpen size={isWideScreen ? 60 : 50} color={colors.icon} style={styles.emptyStateIcon} />
        <Text style={styles.emptyStateTitle}>Prêt à apprendre ?</Text>
        <Text style={styles.emptyStateSubtitle}>
          Aucun cours n'a été trouvé pour le moment. Explorez notre catalogue pour découvrir de nouvelles compétences !
        </Text>
        <Pressable 
          style={({ pressed }) => [
            styles.emptyStateButton,
            {
              opacity: pressed ? 0.7 : 1,
              transform: [{ scale: pressed ? 0.95 : 1 }],
            },
          ]}
          onPress={() => console.log("'Explorer les cours' button pressed")}
        >
          <Text style={styles.emptyStateButtonText}>Explorer les cours</Text>
        </Pressable>
      </View>
    );
  };

  if (loading && !refreshing) {
    // Afficher les squelettes pendant le chargement initial
    return (
      <Animated.View style={[styles.container, { opacity: opacity }]}>
        <Text style={styles.title}>Catalogue des Cours</Text>
        <View style={{width: '100%'}}> {/* Conteneur pour que les items prennent la bonne largeur*/}
            <CoursSqueletteItem />
            <CoursSqueletteItem />
            <CoursSqueletteItem />
            <CoursSqueletteItem />
        </View>
      </Animated.View>
    );
  }

  return (
    // Envelopper le contenu principal dans Animated.View
    <Animated.View style={[styles.container, { opacity }]}>
      <Text style={styles.title}>Catalogue des Cours</Text> 
      {user ? (
        <SectionList
          sections={courseSections}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false} // Ou true si vous préférez les headers fixes
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.tint}
              colors={[colors.tint]}
            />
          }
          ListEmptyComponent={renderListEmptyComponent}
        />
      ) : (
        <View style={styles.centered}><Text style={styles.emptyText}>Veuillez vous connecter pour voir vos cours.</Text></View>
      )}
    </Animated.View>
  );
}

// Styles (inspirés de grands-objectifs)
const getStyles = (scheme: 'light' | 'dark', screenWidth: number) => {
  const colors = Colors[scheme];
  const isWideScreen = screenWidth > 768; // Example breakpoint

  return StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: isWideScreen ? 60 : 50, // Adjusted paddingTop
      paddingHorizontal: isWideScreen ? 25 : 15,
      backgroundColor: colors.background,
      // For web, center the content if it's not full width
      alignItems: Platform.OS === 'web' ? 'center' : undefined, 
    },
    // Wrapper for the list itself if alignItems: center is on container
    listWrapper: {
        width: '100%',
        maxWidth: Platform.OS === 'web' ? 900 : undefined, 
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    title: {
      fontSize: isWideScreen ? 32 : 28,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginBottom: isWideScreen ? 25 : 20,
      textAlign: 'center',
    },
    listContent: {
      paddingBottom: isWideScreen ? 30 : 20,
    },
    itemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      padding: isWideScreen ? 18 : 10,
      borderRadius: isWideScreen ? 12 : 10,
      marginBottom: isWideScreen ? 18 : 15,
      borderWidth: 1,
      borderColor: colors.borderColor,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    courseLogo: {
      width: isWideScreen ? 60 : 50,
      height: isWideScreen ? 60 : 50,
      borderRadius: isWideScreen ? 10 : 8,
      marginRight: isWideScreen ? 18 : 15,
      backgroundColor: colors.borderColor,
    },
    logoPlaceholder: {
        width: isWideScreen ? 60 : 50,
        height: isWideScreen ? 60 : 50,
        borderRadius: isWideScreen ? 10 : 8,
        marginRight: isWideScreen ? 18 : 15,
        backgroundColor: colors.borderColor,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemTitle: {
      fontSize: isWideScreen ? 17 : 16,
      fontWeight: '600',
      color: colors.text,
      flexShrink: 1,
    },
    emptyText: {
      textAlign: 'center',
      marginTop: 30,
      fontSize: isWideScreen ? 17 : 16,
      color: colors.text,
    },
    sectionHeaderContainer: {
        backgroundColor: colors.background,
        paddingVertical: isWideScreen ? 12 : 8,
        paddingHorizontal: isWideScreen ? 5 : 0, // Less padding if items have their own
        borderBottomWidth: 1,
        borderColor: colors.borderColor,
        marginTop: isWideScreen ? 15 : 10,
    },
    sectionHeaderText: {
        fontSize: isWideScreen ? 20 : 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    emptyStateContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      marginTop: 40,
      backgroundColor: colors.background,
    },
    emptyStateIcon: {
      marginBottom: 25,
      opacity: 0.6,
    },
    emptyStateTitle: {
      fontSize: isWideScreen ? 22 : 20,
      fontWeight: 'bold',
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: 10,
    },
    emptyStateSubtitle: {
      fontSize: isWideScreen ? 16 : 14,
      color: colors.text,
      textAlign: 'center',
      marginBottom: 25,
      lineHeight: isWideScreen ? 24 : 20,
    },
    emptyStateButton: {
      backgroundColor: colors.tint,
      paddingVertical: isWideScreen ? 14 : 12,
      paddingHorizontal: isWideScreen ? 30 : 25,
      borderRadius: isWideScreen ? 10 : 8,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    emptyStateButtonText: {
      color: colors.buttonText,
      fontSize: isWideScreen ? 17 : 16,
      fontWeight: '600',
    },
  });
}; 