import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  useWindowDimensions, TouchableOpacity, Alert, Platform, Modal
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { getChapters, getQuizForChapter, markChapterCompleted, getCompletedChapters } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import ReactMarkdown from 'react-native-markdown-display';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useAuth } from '@/providers/AuthProvider';

// Type Chapter (inchangé)
type Chapter = {
  id: string;
  course_id: string;
  title: string;
  content: string | null;
  order_index: number;
  created_at: string;
};

// Type pour les données du Quiz
type QuizData = {
  id: string;
  chapter_id: string;
  question: string;
  options: string[]; // Supposons que options est un tableau de strings
  correct_answer: string;
};

// Styles Markdown
const getMarkdownStyles = (colors: typeof Colors.light | typeof Colors.dark, screenWidth: number) => {
  const isWideScreen = screenWidth > 768;
  return StyleSheet.create({
    body: { 
      color: colors.text, 
      fontSize: isWideScreen ? 17 : 16, 
      lineHeight: isWideScreen ? 26 : 24,
      backgroundColor: colors.card,
    },
    heading1: { fontSize: isWideScreen ? 28 : 24, fontWeight: 'bold', color: colors.textPrimary, marginTop: 15, marginBottom: 10, borderBottomWidth: 1, borderColor: colors.borderColor, paddingBottom: 5 },
    heading2: { fontSize: isWideScreen ? 22 : 20, fontWeight: 'bold', color: colors.textPrimary, marginTop: 10, marginBottom: 8 },
    paragraph: { marginBottom: 10, flexWrap: 'wrap' },
    bullet_list_icon: { color: colors.tint, marginRight: 8 }, 
    ordered_list_icon: { color: colors.tint, marginRight: 8, fontWeight: 'bold'},
    list_item: { marginBottom: 5, flexDirection: 'row', alignItems: 'flex-start' },
    image: { maxWidth: screenWidth - (isWideScreen ? 80 : 40), alignSelf: 'center', marginVertical: 10, borderRadius: Platform.select({web: 8, default: 4}) },
    link: { color: colors.tint, textDecorationLine: 'underline' }, 
    strong: { fontWeight: 'bold' },
    em: { fontStyle: 'italic' },
    blockquote: {
      backgroundColor: colors.background, // Ou une autre nuance. Si colors.card est le fond du contenu, colors.background (fond de page) peut bien rendre.
                                        // Si colors.background est trop similaire à colors.card, vous pourriez avoir besoin d'une couleur dédiée.
                                        // Par exemple: colorScheme === 'dark' ? '#252525' : '#f0f0f0'
      padding: isWideScreen ? 15 : 10,
      marginVertical: 10,
      marginLeft: 0, // Le style par défaut peut ajouter un marginLeft que vous voudrez peut-être écraser
      borderLeftWidth: 4,
      borderLeftColor: colors.tint,
      borderRadius: 4, // Optionnel, pour des bords arrondis
      // Le texte à l'intérieur du blockquote héritera de `body` pour sa couleur,
      // mais vous pouvez le spécifier ici si vous voulez une couleur différente pour le texte du blockquote.
      // color: colors.textSecondary, // Par exemple, si vous voulez un texte légèrement différent.
    },
  });
};

// Styles
const getStyles = (scheme: 'light' | 'dark', screenWidth: number) => {
  const colors = Colors[scheme];
  const isWideScreen = screenWidth > 768;

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    contentContainer: { 
        padding: isWideScreen ? 30 : 20, 
        paddingBottom: isWideScreen ? 100 : 80, // More space for nav buttons
        maxWidth: Platform.OS === 'web' ? 1000 : undefined, // Max width for content on web
        alignSelf: Platform.OS === 'web' ? 'center' : undefined, // Center content on web
        width: Platform.OS === 'web' ? '100%' : undefined,
    },
    loader: { marginTop: 50 },
    title: {
      fontSize: isWideScreen ? 28 : 24,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginBottom: isWideScreen ? 25 : 20,
    },
    contentWrapper: {
      backgroundColor: colors.card,
      padding: isWideScreen ? 25 : 15,
      borderRadius: isWideScreen ? 12 : 8,
      borderWidth: 1,
      borderColor: colors.borderColor,
    },
    navigationContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: isWideScreen ? 40 : 30,
      paddingHorizontal: isWideScreen ? 0 : 10, // No extra padding if contentContainer has enough
    },
    navButton: {
      backgroundColor: colors.tint,
      paddingVertical: isWideScreen ? 12 : 10,
      paddingHorizontal: isWideScreen ? 25 : 20,
      borderRadius: isWideScreen ? 10 : 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    navButtonDisabled: {
      backgroundColor: colors.tabIconDefault,
    },
    navButtonText: {
      color: colors.buttonText,
      fontSize: isWideScreen ? 17 : 16,
      fontWeight: 'bold',
      marginHorizontal: 5,
    },
    emptyText: {
      textAlign: 'center',
      marginTop: 50,
      fontSize: isWideScreen ? 18 : 16,
      color: colors.text,
    },
    quizContainer: {
      marginTop: isWideScreen ? 30 : 20,
      padding: isWideScreen ? 30 : 20,
      backgroundColor: colors.card,
      borderRadius: isWideScreen ? 12 : 8,
      borderWidth: 1,
      borderColor: colors.borderColor,
    },
    quizTitle: {
      fontSize: isWideScreen ? 24 : 20,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginBottom: isWideScreen ? 20 : 15,
      textAlign: 'center',
    },
    quizQuestion: {
      fontSize: isWideScreen ? 20 : 18,
      color: colors.text,
      marginBottom: isWideScreen ? 25 : 20,
      textAlign: 'center',
      lineHeight: isWideScreen ? 28 : 24,
    },
    quizOptionButton: {
      backgroundColor: colors.background,
      paddingVertical: isWideScreen ? 14 : 12,
      paddingHorizontal: isWideScreen ? 20 : 15,
      borderRadius: isWideScreen ? 10 : 8,
      borderWidth: 1,
      borderColor: colors.borderColor,
      marginBottom: isWideScreen ? 12 : 10,
      alignItems: 'center',
    },
    quizOptionSelected: {
      borderColor: colors.tint,
      backgroundColor: scheme === 'light' ? '#EAE0D5' : '#222',
    },
    quizOptionCorrect: {
      backgroundColor: scheme === 'light' ? '#d4edda' : '#234d2c',
      borderColor: '#28a745',
    },
    quizOptionIncorrect: {
      backgroundColor: scheme === 'light' ? '#f8d7da' : '#4d2323',
      borderColor: '#dc3545',
    },
    quizOptionText: {
      fontSize: isWideScreen ? 17 : 16,
      color: colors.text,
    },
    submitButton: {
      backgroundColor: colors.tint, 
      paddingVertical: isWideScreen ? 16 : 15,
      borderRadius: isWideScreen ? 10 : 8,
      alignItems: 'center',
      marginTop: isWideScreen ? 25 : 20,
    },
    submitButtonDisabled: {
      backgroundColor: colors.tabIconDefault,
    },
    retryButton: { 
       backgroundColor: scheme === 'light' ? '#ffc107' : '#665200',
    },
    submitButtonText: {
      color: colors.buttonText,
      fontSize: isWideScreen ? 17 : 16,
      fontWeight: 'bold',
    },
    // Nouveaux styles pour le Modal
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fond semi-transparent
    },
    modalContent: {
      width: isWideScreen ? '60%' : '85%',
      maxWidth: 500,
      backgroundColor: colors.card,
      borderRadius: isWideScreen ? 15 : 10,
      padding: isWideScreen ? 30 : 20,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    modalTitle: {
      fontSize: isWideScreen ? 22 : 20,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginBottom: 15,
      textAlign: 'center',
    },
    modalMessage: {
      fontSize: isWideScreen ? 17 : 16,
      color: colors.text,
      textAlign: 'center',
      marginBottom: 25,
      lineHeight: isWideScreen ? 26 : 24,
    },
    modalButton: {
      backgroundColor: colors.tint,
      paddingVertical: isWideScreen ? 14 : 12,
      paddingHorizontal: isWideScreen ? 30 : 25,
      borderRadius: isWideScreen ? 10 : 8,
      minWidth: 100,
      alignItems: 'center',
    },
    modalButtonText: {
      color: colors.buttonText,
      fontSize: isWideScreen ? 17 : 16,
      fontWeight: 'bold',
    }
  });
};

// URL du Webhook
const COURSE_COMPLETION_WEBHOOK_URL = 'https://n8n-nw6a.onrender.com/webhook-test/d7755f6a-efc2-47e2-9ac3-c87f2111ebfd';

export default function ChapterContentScreen() {
  const { courseId, chapterId, title } = useLocalSearchParams<{ courseId: string; chapterId: string; title: string }>();
  const [allChapters, setAllChapters] = useState<Chapter[]>([]); 
  const [allChapterIds, setAllChapterIds] = useState<Set<string>>(new Set()); // Stocker les IDs de tous les chapitres
  const [loading, setLoading] = useState(true);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0); 
  const [quizData, setQuizData] = useState<QuizData[] | null>(null);
  const [showQuiz, setShowQuiz] = useState(false); 
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const { width } = useWindowDimensions();
  const styles = getStyles(colorScheme, width);
  const router = useRouter();
  const scrollViewRef = React.useRef<ScrollView>(null);

  // Calculer le chapitre courant, son index, et ses sections
  const { currentChapter, currentIndex, totalChapters, sections } = useMemo(() => {
    if (!allChapters.length || !chapterId) {
      return { currentChapter: null, currentIndex: -1, totalChapters: 0, sections: [] };
    }
    const idx = allChapters.findIndex(chap => chap.id === chapterId);
    const chapter = idx !== -1 ? allChapters[idx] : null;
    // Diviser le contenu en sections. Gérer les cas null/vide et sauts de ligne autour de ---
    const chapterSections = chapter?.content
      ? chapter.content.split(/\n---\n/).map(s => s.trim()).filter(s => s.length > 0)
      : [];
    return {
      currentChapter: chapter,
      currentIndex: idx,
      totalChapters: allChapters.length,
      sections: chapterSections,
    };
  }, [allChapters, chapterId]);

  // Styles Markdown
  const markdownStyles = getMarkdownStyles(Colors[colorScheme], width);

  // Fetch tous les chapitres ET les quiz
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!courseId || !chapterId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setCurrentSectionIndex(0); // Réinitialiser la section
      setShowQuiz(false); // Cacher le quiz
      setCurrentQuizIndex(0); // Réinitialiser l'index du quiz

      // Récupérer les chapitres ET le quiz en parallèle
      const [chaptersResult, quizResult] = await Promise.all([
        getChapters(courseId),
        getQuizForChapter(chapterId)
      ]);

      // Traiter les chapitres
      if (chaptersResult.data) {
        const chapters = chaptersResult.data as Chapter[];
        setAllChapters(chapters);
        setAllChapterIds(new Set(chapters.map(ch => ch.id))); // Mettre à jour le Set d'IDs
      } else {
        console.error("Erreur lors de la récupération de tous les chapitres:", chaptersResult.error);
        setAllChapters([]);
        setAllChapterIds(new Set());
      }

      // Traiter le quiz
      if (quizResult.error) {
        console.error("Erreur lors de la récupération du quiz:", quizResult.error);
        setQuizData(null);
      } else {
        const validQuizzes = (quizResult.data || []).filter((q: any) => q && Array.isArray(q.options)).map((q: any) => q as QuizData);
        setQuizData(validQuizzes.length > 0 ? validQuizzes : null);
      }

      setLoading(false); 
    };

    fetchInitialData();
  }, [courseId, chapterId]); // Déclencher quand l'un ou l'autre change

  // Fonction pour déclencher le webhook
  const triggerCourseCompletionWebhook = async () => {
    if (!user || !courseId || !title) {
        console.error('Missing user, courseId or title for webhook');
        return;
    }

    const payload = {
        courseTitle: title,
        userName: user.nom || 'Nom inconnu',
        userId: user.id,
        courseId: courseId,
    };

    console.log('Triggering course completion webhook with payload:', payload);

    try {
        const response = await fetch(COURSE_COMPLETION_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            console.log('Webhook triggered successfully.');
            // Optionnel : Afficher un Toast de succès
        } else {
            console.error('Webhook call failed:', response.status, await response.text());
            // Optionnel : Afficher un Toast d'erreur
        }
    } catch (webhookError) {
        console.error('Error triggering course completion webhook:', webhookError);
        // Optionnel : Afficher un Toast d'erreur
    }
  };

  // Marquer le chapitre courant comme complété et vérifier la complétion du cours
  const markCurrentChapterComplete = async () => {
    if (!user || !currentChapter || !courseId) {
      console.log("User ou chapter non disponible pour marquer complété");
      return; 
    }
    console.log(`Marquage du chapitre ${currentChapter.id} pour le cours ${courseId}`);
    const { error: markError } = await markChapterCompleted(user.id, currentChapter.id, courseId);
    
    if (markError) {
        console.error("Erreur marquage chapitre:", markError);
        // Peut-être afficher une alerte ?
    } else {
        console.log("Chapitre marqué complété avec succès. Vérification de la complétion du cours...");
        // Vérifier si le cours est maintenant terminé
        const { data: completedData, error: completedError } = await getCompletedChapters(user.id, courseId);

        if (completedError) {
            console.error("Erreur récupération chapitres complétés après marquage:", completedError);
            return;
        }

        const completedChapterIds = completedData || new Set();
        console.log('Total chapters:', allChapterIds.size, 'Completed chapters:', completedChapterIds.size);
        
        // Vérifier si le nombre de chapitres complétés correspond au nombre total
        // et s'assurer qu'il y a bien des chapitres dans le cours
        if (allChapterIds.size > 0 && completedChapterIds.size === allChapterIds.size) {
            console.log("Le cours est terminé ! (détecté dans markCurrentChapterComplete)");
            await triggerCourseCompletionWebhook();
            // La mise à true de showCompletionModal se fera dans handleQuizProgression/handleNavigation
        } else {
            console.log("Le cours n'est pas encore terminé.");
        }
    }
  };

  // Navigation entre sections/quiz/chapitres
  const handleNavigation = (direction: 'previous' | 'next') => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    console.log('[NavDebug] handleNavigation called. Direction:', direction);
    console.log('[NavDebug] Current state: sectionIndex:', currentSectionIndex, 'showQuiz:', showQuiz, 'currentIndex:', currentIndex, 'totalChapters:', totalChapters, 'sections.length:', sections.length, 'hasQuiz:', !!quizData);

    if (direction === 'next') {
        console.log('[NavDebug] Direction is NEXT.');
        if (currentSectionIndex < sections.length - 1) {
            console.log('[NavDebug] Moving to next section.');
            setCurrentSectionIndex(currentSectionIndex + 1);
        } else if (quizData && quizData.length > 0 && !showQuiz) { // Changé pour !showQuiz ici, pour s'assurer qu'on ne le remontre pas si on est déjà dessus
            console.log('[NavDebug] Last section, quiz exists and not shown. Showing quiz.');
            setShowQuiz(true);
        } else {
            console.log('[NavDebug] Last section OR quiz already shown/no quiz. Checking if last chapter.');
            if (currentIndex < totalChapters - 1) {
                console.log('[NavDebug] Not last chapter. Moving to next chapter.');
                const nextChapter = allChapters[currentIndex + 1];
                router.setParams({ chapterId: nextChapter.id }); 
            } else {
                // DERNIER CHAPITRE (Navigation path)
                markCurrentChapterComplete().then(() => {
                    const courseName = title || "ce cours";
                    console.log(`[NavDebug] FIN DE COURS (Navigation). Course: ${courseName}. Affichage du modal.`);
                    setShowCompletionModal(true); // AFFICHER LE MODAL
                }).catch(error => {
                    console.error("[NavDebug] Erreur après markCurrentChapterComplete (Navigation):", error);
                });
            }
        }
    } else { // direction === 'previous'
        console.log('[NavDebug] Direction is PREVIOUS.');
        if (showQuiz) {
            // Si on est sur le quiz, revenir à la dernière section
            setShowQuiz(false);
        } else if (currentSectionIndex > 0) {
            setCurrentSectionIndex(currentSectionIndex - 1);
        } else {
            // Première section -> naviguer au chapitre précédent
            if (currentIndex > 0) {
                const prevChapter = allChapters[currentIndex - 1];
                router.setParams({ chapterId: prevChapter.id }); 
            } else {
                // Tout premier chapitre, ne rien faire ou revenir en arrière
                router.back(); // Revenir à la liste des chapitres
            }
        }
    }
  };
  
  // Gère la progression dans le quiz ou la navigation vers le chapitre suivant
  const handleQuizProgression = () => {
    if (quizData && currentQuizIndex < quizData.length - 1) {
      setCurrentQuizIndex(currentQuizIndex + 1);
    } else {
      // DERNIER QUIZ ou plus de questions
      setShowQuiz(false);
      markCurrentChapterComplete().then(() => {
        if (currentIndex < totalChapters - 1) {
            // Pas le dernier chapitre, naviguer
            const nextChapter = allChapters[currentIndex + 1];
            router.setParams({ chapterId: nextChapter.id });
        } else {
            // DERNIER CHAPITRE (Quiz path)
            const courseName = title || "ce cours";
            console.log(`[QuizDebug] FIN DE COURS (Quiz). Course: ${courseName}. Affichage du modal.`);
            setShowCompletionModal(true); // AFFICHER LE MODAL
        }
      }).catch(error => {
        console.error("[QuizDebug] Erreur après markCurrentChapterComplete (Quiz):", error);
      });
    }
  };

  // Déterminer les labels et états des boutons
  const isLastSection = currentSectionIndex >= sections.length - 1;
  const hasQuiz = quizData && quizData.length > 0;
  const isLastChapter = currentIndex >= totalChapters - 1;

  const prevDisabled = currentIndex <= 0 && currentSectionIndex <= 0;
  // Désactivé si dernier chapitre, dernière section, quiz affiché OU pas de quiz à afficher
  const nextDisabled = isLastChapter && isLastSection && (showQuiz || !hasQuiz);

  let prevLabel = "Précédent";
  if (currentSectionIndex > 0) prevLabel = "Section Préc.";
  else if (currentIndex > 0) prevLabel = "Chap. Préc.";

  let nextLabel = "Suivant";
  if (!isLastSection) nextLabel = "Section Suiv.";
  else if (hasQuiz && !showQuiz) nextLabel = "Démarrer Quiz";
  else if (!isLastChapter) nextLabel = "Chap. Suiv.";

  // Affichage principal
  return (
    <ScrollView 
      ref={scrollViewRef} 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
    >
      <Stack.Screen options={{ title: currentChapter?.title || 'Chapitre' }} />

      {loading ? (
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} style={styles.loader} />
      ) : showQuiz && quizData && quizData[currentQuizIndex] ? ( // Afficher le quiz
        <QuizView 
          key={quizData[currentQuizIndex].id} // Clé pour forcer le re-render si la question change
          quiz={quizData[currentQuizIndex]} 
          onQuestionComplete={handleQuizProgression} // Passer la fonction de progression
        />
      ) : currentChapter ? ( // Afficher le contenu du chapitre
        <>
          {/* Contenu de la section */}
          {sections.length > 0 && currentSectionIndex < sections.length ? (
              <View style={styles.contentWrapper}>
                  <ReactMarkdown style={markdownStyles}>
                  {sections[currentSectionIndex]}
                  </ReactMarkdown>
              </View>
          ) : (
              <Text style={styles.emptyText}>Ce chapitre n'a pas encore de contenu ou de sections.</Text>
          )}
          {/* Boutons de navigation */}
          <View style={styles.navigationContainer}>
             {/* ... Bouton Précédent ... */}
            <TouchableOpacity
              style={[styles.navButton, prevDisabled && styles.navButtonDisabled]}
              disabled={prevDisabled}
              onPress={() => handleNavigation('previous')}
              activeOpacity={0.7}
            >
              <ChevronLeft size={18} color={Colors[colorScheme].buttonText} />
              <Text style={styles.navButtonText}>{prevLabel}</Text>
            </TouchableOpacity>
            {/* ... Bouton Suivant / Quiz ... */}
            <TouchableOpacity
              style={[styles.navButton, nextDisabled && styles.navButtonDisabled]}
              disabled={nextDisabled}
              onPress={() => handleNavigation('next')}
              activeOpacity={0.7}
            >
              <Text style={styles.navButtonText}>{nextLabel}</Text>
              <ChevronRight size={18} color={Colors[colorScheme].buttonText} />
            </TouchableOpacity>
          </View>
        </>
      ) : ( // Si chapitre introuvable ou pas de sections
        <Text style={styles.emptyText}>Chapitre introuvable.</Text>
      )}

      {/* --- MODAL DE FIN DE COURS --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showCompletionModal}
        onRequestClose={() => {
          setShowCompletionModal(false);
          // Optionnel: rediriger même si l'utilisateur ferme le modal autrement qu'avec le bouton OK
          // router.replace('/(tabs)/chat'); 
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Félicitations !</Text>
            <Text style={styles.modalMessage}>
              {`Vous avez terminé le cours "${title || 'ce cours'}". Votre attestation est disponible au niveau de votre profil.`}
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowCompletionModal(false);
                router.replace('/(tabs)/chat');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

// --- Composant QuizView --- 
interface QuizViewProps {
  quiz: QuizData;
  onQuestionComplete: () => void; // Renommer onComplete
}

function QuizView({ quiz, onQuestionComplete }: QuizViewProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';
  const { width } = useWindowDimensions();
  const styles = getStyles(colorScheme, width);

  const handleSubmit = () => {
    if (!selectedOption) return;
    const correct = selectedOption === quiz.correct_answer;
    setIsCorrect(correct);
    setSubmitted(true);
  };
  
  // Fonction pour réinitialiser l'état de la question
  const handleRetry = () => {
      setSelectedOption(null);
      setIsCorrect(null);
      setSubmitted(false);
  };

  const getOptionStyle = (option: string) => {
      if (!submitted) {
          return [styles.quizOptionButton, selectedOption === option && styles.quizOptionSelected];
      } else {
          if (option === quiz.correct_answer) {
              return [styles.quizOptionButton, styles.quizOptionCorrect];
          } else if (option === selectedOption) {
              return [styles.quizOptionButton, styles.quizOptionIncorrect];
          } else {
              return styles.quizOptionButton;
          }
      }
  };

  return (
    <View style={styles.quizContainer}>
      <Text style={styles.quizTitle}>Quiz</Text> 
      <Text style={styles.quizQuestion}>{quiz.question}</Text>
      
      {quiz.options.map((option, index) => (
        <TouchableOpacity
          key={index}
          style={getOptionStyle(option)}
          onPress={() => !submitted && setSelectedOption(option)}
          disabled={submitted}
          activeOpacity={0.7}
        >
          <Text style={styles.quizOptionText}>{option}</Text>
        </TouchableOpacity>
      ))}

      {!submitted ? (
        <TouchableOpacity
          style={[styles.submitButton, !selectedOption && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!selectedOption}
          activeOpacity={0.7}
        >
          <Text style={styles.submitButtonText}>Valider</Text>
        </TouchableOpacity>
      ) : isCorrect ? (
        <TouchableOpacity
          style={styles.submitButton} 
          onPress={onQuestionComplete}
          activeOpacity={0.7}
        >
          <Text style={styles.submitButtonText}>Question Suivante / Terminer</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.submitButton, styles.retryButton]} // Style spécifique si besoin
          onPress={handleRetry}
          activeOpacity={0.7}
        >
          <Text style={styles.submitButtonText}>Réessayer</Text>
        </TouchableOpacity>
      )}
    </View>
  );
} 