import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react-native'; // Keep Send, remove Loader2 if unused or handle loading differently
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Linking, ViewStyle, TextStyle, useWindowDimensions, Modal, Pressable } from 'react-native'; // Import React Native components & Linking & Alert & Modal & Pressable
import { SafeAreaView } from 'react-native-safe-area-context'; // Importer SafeAreaView
import ReactMarkdown from 'react-native-markdown-display'; // Use react-native-markdown-display
import { supabase } from '@/lib/supabase'; // Adjust this path if your supabase client is elsewhere
import { useLocalSearchParams, useRouter } from 'expo-router'; // Importer useLocalSearchParams et useRouter
import { useColorScheme } from '@/hooks/useColorScheme'; // Importer pour le thème
import { Colors } from '@/constants/Colors'; // Importer Colors
import { useAuth } from '@/providers/AuthProvider'; // Corrected import path

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'koach';
  timestamp: Date;
}

// Styles Markdown - on les adapte dynamiquement
const getMarkdownStyles = (colors: typeof Colors.light | typeof Colors.dark, screenWidth: number) => {
  const isWideScreen = screenWidth > 768;
  return StyleSheet.create({
    body: { color: colors.text, fontSize: isWideScreen ? 16 : 14, lineHeight: isWideScreen ? 24 : 20 }, 
    paragraph: { marginBottom: 8 },
    list_item: { marginBottom: 4 }, 
    bullet_list_icon: { color: colors.tint, marginRight: 5 }, 
    ordered_list_icon: { color: colors.tint, marginRight: 5, fontWeight: 'bold'}, 
    strong: { fontWeight: '600', color: colors.tint }, 
    em: { fontStyle: 'italic', color: colors.tint }, 
    link: { color: colors.tint, textDecorationLine: 'underline' }, 
  });
};

// Styles principaux - on les rend dynamiques
const getStyles = (scheme: 'light' | 'dark', screenWidth: number) => {
  const colors = Colors[scheme];
  const isWideScreen = screenWidth > 768;

  return StyleSheet.create({
    safeArea: { // Style pour SafeAreaView
      flex: 1,
      backgroundColor: colors.background, 
    },
    container: { // Container interne pour KeyboardAvoidingView
      flex: 1,
      maxWidth: Platform.OS === 'web' ? 900 : undefined, // Max width for chat on web
      width: Platform.OS === 'web' ? '100%' : undefined,
      alignSelf: Platform.OS === 'web' ? 'center' : undefined,
      // backgroundColor est maintenant sur safeArea
    },
    scrollView: {
      flex: 1,
      paddingHorizontal: isWideScreen ? 20 : 10,
    },
    scrollViewContent: { // Style pour contentContainerStyle
      paddingTop: isWideScreen ? 15 : 10,
      paddingBottom: isWideScreen ? 15 : 10,
    },
    messageContainer: {
      maxWidth: '85%', // Slightly more width for messages
      paddingHorizontal: isWideScreen ? 18 : 15,
      paddingVertical: isWideScreen ? 12 : 10,
      borderRadius: isWideScreen ? 18 : 15,
      marginBottom: isWideScreen ? 8 : 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2, 
    },
    userMessage: {
      alignSelf: 'flex-end',
      backgroundColor: colors.tint, // Couleur principale
      borderBottomRightRadius: 0,
    },
    koachMessage: {
      alignSelf: 'flex-start',
      backgroundColor: colors.card, // Fond des cartes
      borderTopLeftRadius: 0,
      borderColor: colors.borderColor, // Bordure thème
      borderWidth: 1,
      marginTop: isWideScreen ? 12 : 10,
    },
    koachHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: isWideScreen ? 10 : 8,
    },
    koachAvatarContainer: {
      width: isWideScreen ? 32 : 28,
      height: isWideScreen ? 32 : 28,
      borderRadius: isWideScreen ? 16 : 14,
      // Couleur claire basée sur le tint/primary ? À définir si besoin
      backgroundColor: scheme === 'light' ? '#EAE0D5' : '#333', 
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: isWideScreen ? 10 : 8,
    },
    koachAvatarInner: {
      width: isWideScreen ? 22 : 20,
      height: isWideScreen ? 22 : 20,
      borderRadius: isWideScreen ? 11 : 10,
      backgroundColor: colors.tint, // Couleur principale
    },
    koachName: {
      fontWeight: '500',
      color: colors.tint, // Couleur principale
      fontSize: isWideScreen ? 17 : 16,
    },
    messageContentUser: {
      fontSize: isWideScreen ? 15 : 14,
      color: scheme === 'dark' ? Colors.light.text : Colors.light.buttonText,
      lineHeight: isWideScreen ? 22 : 20,
    },
    messageContentKoach: {
      // Markdown styles will handle this primarily, but keep for potential direct Text usage
      fontSize: isWideScreen ? 15 : 14,
      color: colors.text, // Texte standard
      lineHeight: isWideScreen ? 22 : 20,
    },
    timestamp: {
      fontSize: isWideScreen ? 11 : 10,
      marginTop: isWideScreen ? 6 : 5,
      textAlign: 'right',
    },
    timestampUser: {
      // Couleur légèrement transparente basée sur buttonText
      color: scheme === 'light' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(236, 237, 238, 0.7)', 
    },
    timestampKoach: {
      color: scheme === 'light' ? 'rgba(51, 51, 51, 0.5)' : 'rgba(236, 237, 238, 0.5)', // Basé sur text
    },
    loadingContainer: {
      alignSelf: 'flex-start',
      maxWidth: '80%',
      paddingHorizontal: isWideScreen ? 18 : 15,
      paddingVertical: isWideScreen ? 12 : 10,
      borderRadius: isWideScreen ? 18 : 15,
      backgroundColor: colors.card, // Fond carte
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
      borderTopLeftRadius: 0,
      borderColor: colors.borderColor,
      borderWidth: 1,
    },
    loadingContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: isWideScreen ? 15 : 14,
      color: colors.text, // Texte standard
      marginLeft: 8,
    },
    inputContainer: {
      backgroundColor: colors.card, // Fond carte pour l'input
      padding: isWideScreen ? 12 : 10,
      borderTopWidth: 1,
      borderTopColor: colors.borderColor,
      flexDirection: 'row',
      alignItems: 'center',
    },
    input: {
      flex: 1,
      height: isWideScreen ? 44 : 40,
      borderColor: colors.borderColor,
      borderWidth: 1,
      borderRadius: isWideScreen ? 22 : 20,
      paddingHorizontal: isWideScreen ? 18 : 15,
      marginRight: isWideScreen ? 12 : 10,
      backgroundColor: colors.background, // Fond général pour l'input
      color: colors.text, // Couleur du texte saisi
      fontSize: isWideScreen ? 15 : 14,
    },
    sendButton: {
      padding: isWideScreen ? 12 : 10,
      borderRadius: isWideScreen ? 22 : 20,
      backgroundColor: colors.tint, // Couleur principale
    },
    sendButtonDisabled: {
      backgroundColor: colors.tabIconDefault, // Couleur désactivée (ex: muted)
    },
    // Modal Styles
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)', 
    },
    modalView: {
        margin: 20,
        backgroundColor: colors.card,
        borderRadius: 10,
        padding: 25,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: Platform.OS === 'web' ? '50%' : '85%', 
        maxWidth: 400,
        borderColor: colors.borderColor,
        borderWidth: 1,
    },
    modalTitleText: {
        marginBottom: 15,
        textAlign: 'center',
        fontSize: isWideScreen ? 19 : 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    modalMessageText: {
        marginBottom: 20,
        textAlign: 'center',
        fontSize: isWideScreen ? 17 : 16,
        color: colors.text,
        lineHeight: 22,
    },
    modalButton: { 
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 20,
        elevation: 2,
        width: '100%', 
        alignItems: 'center',
    },
    buttonConfirm: { 
        backgroundColor: colors.tint, 
    },
    modalButtonText: { 
        color: colors.buttonText, 
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: isWideScreen ? 16 : 15,
    },
  });
};

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Bonjour ! Je suis ton Koach personnel. Comment puis-je t'aider aujourd'hui ?",
      sender: 'koach',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const { prefill } = useLocalSearchParams<{ prefill?: string }>(); // Récupérer le paramètre
  const router = useRouter(); // Pour potentiellement effacer le paramètre
  const colorScheme = useColorScheme() ?? 'light';
  const { width } = useWindowDimensions(); // Get screen width
  const styles = getStyles(colorScheme, width); // Pass width to styles
  const markdownStyles = getMarkdownStyles(Colors[colorScheme], width); // Pass width to markdown styles

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  // Get user from AuthContext
  const { user: authContextUser } = useAuth(); // <<< MODIFICATION: Get user from context

  // Helper to show modal
  const showModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Effet pour gérer le pré-remplissage
  useEffect(() => {
    if (prefill) {
      setInputValue(prefill);
      // Optionnel: Effacer le paramètre pour qu'il ne soit pas réutilisé si l'utilisateur navigue en arrière puis revient
      try {
          router.setParams({ prefill: '' }); 
      } catch (e) {
          console.warn("Could not clear prefill param: ", e)
      }
    }
  }, [prefill, router]);

  const sendMessage = async () => {
    if (inputValue.trim() === '') return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue; // Store input value before clearing
    setInputValue('');
    setIsLoading(true);

    try {
      // MODIFICATION: Use user from AuthContext directly
      if (!authContextUser || !authContextUser.id || !authContextUser.email) { 
        console.error('ChatInterface: User data missing or incomplete from AuthContext.', authContextUser);
        showModal("Erreur d'Authentification", "Vos informations utilisateur sont incomplètes ou manquantes. Veuillez vous reconnecter.");
        setMessages(prev => prev.filter(msg => msg.id !== userMessage.id)); // Remove optimistic user message
        setIsLoading(false);
        return; 
      }

      const userId = authContextUser.id;
      const userEmail = authContextUser.email;
      // Fin de la MODIFICATION

      const response = await fetch('https://n8n-nw6a.onrender.com/webhook/moncoach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput, 
          userId: userId, 
          email: userEmail, 
          timestamp: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        // Try to get more details from the response if possible
        let errorDetails = 'Erreur de communication avec le serveur';
        try {
            const errorData = await response.json();
            errorDetails = errorData.message || errorData.error || errorDetails;
        } catch (e) {
            // Ignore if response is not JSON
        }
        throw new Error(errorDetails);
      }

      const data = await response.json();

      const koachResponse: Message = {
        id: Date.now().toString(),
        content: data.response || "Je suis là pour t'aider à atteindre tes objectifs. Dis-moi ce qui t'intéresse !",
        sender: 'koach',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, koachResponse]);

    } catch (error: any) { // Catch any error type
      console.error('Error sending message:', error);
      showModal("Problème de Connexion", error.message || "Je rencontre des difficultés à me connecter. Réessaie plus tard !"); 
      // No need to remove user message here, as it's a server/network error, not an auth error before sending
    } finally {
        setIsLoading(false); 
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(!modalVisible)}
      >
          <View style={styles.centeredView}>
              <View style={styles.modalView}>
                  <Text style={styles.modalTitleText}>{modalTitle}</Text>
                  <Text style={styles.modalMessageText}>{modalMessage}</Text>
                  <Pressable
                      style={[styles.modalButton, styles.buttonConfirm]}
                      onPress={() => setModalVisible(!modalVisible)}
                  >
                      <Text style={styles.modalButtonText}>OK</Text>
                  </Pressable>
              </View>
          </View>
      </Modal>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        keyboardVerticalOffset={10}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.sender === 'user' ? styles.userMessage : styles.koachMessage
              ]}
            >
              {message.sender === 'koach' && (
                <View style={styles.koachHeader}>
                  <View style={styles.koachAvatarContainer}>
                    <View style={styles.koachAvatarInner} />
                  </View>
                  <Text style={styles.koachName}>Mon Koach</Text>
                </View>
              )}
               {message.sender === 'koach' ? (
                   <ReactMarkdown style={markdownStyles}>
                      {message.content}
                   </ReactMarkdown>
               ) : (
                   <Text style={styles.messageContentUser}>{message.content}</Text>
               )}

              <Text style={[
                styles.timestamp,
                message.sender === 'user' ? styles.timestampUser : styles.timestampKoach
              ]}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          ))}

          {isLoading && (
            <View style={[styles.loadingContainer, styles.koachMessage]}>
               <View style={styles.koachHeader}>
                  <View style={styles.koachAvatarContainer}>
                    <View style={styles.koachAvatarInner} />
                  </View>
                  <Text style={styles.koachName}>Mon Koach</Text>
                </View>
              <View style={styles.loadingContent}>
                <ActivityIndicator size="small" color="#6b46c1" />
                <Text style={styles.loadingText}>En train d'écrire...</Text>
              </View>
            </View>
          )}
        </ScrollView>
        <View style={styles.inputContainer}>
          <TextInput
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="Écris ton message ici..."
            style={styles.input}
            editable={!isLoading}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
            placeholderTextColor={Colors[colorScheme].tabIconDefault}
          />
          <TouchableOpacity
            onPress={sendMessage}
            disabled={inputValue.trim() === '' || isLoading}
            style={[styles.sendButton, (inputValue.trim() === '' || isLoading) && styles.sendButtonDisabled]}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={Colors[colorScheme].buttonText} />
            ) : (
              <Send width={20} height={20} color={Colors[colorScheme].buttonText} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatInterface; 