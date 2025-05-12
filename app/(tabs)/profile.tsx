import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, useWindowDimensions, Platform } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { LogOut, Award, ChevronRight } from 'lucide-react-native'; // Importer Award et ChevronRight
import { useRouter } from 'expo-router'; // Importer useRouter

export default function ProfileScreen() {
  const { user, signOutUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';
  const { width } = useWindowDimensions(); // Get screen width
  const styles = getStyles(colorScheme, width); // Pass width to styles
  const router = useRouter(); // Initialiser le router

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOutUser();
      // La redirection est gérée par le AuthProvider/_layout.tsx
    } catch (error: any) {
      Alert.alert("Erreur de déconnexion", error?.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour naviguer vers les certificats
  const goToCertificates = () => {
    router.push('/certificates');
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}> {/* Added wrapper */} 
        <Text style={styles.title}>Mon Profil</Text>
        
        {user ? (
          <View style={styles.userInfoContainer}>
              {user.nom && (
                  <View style={styles.infoItem}> 
                      <Text style={styles.label}>Nom :</Text>
                      <Text style={styles.infoValue}>{user.nom}</Text>
                  </View>
              )}
              {user.phone_number && (
                  <View style={styles.infoItem}> 
                      <Text style={styles.label}>Téléphone :</Text>
                      <Text style={styles.infoValue}>{user.phone_number}</Text> 
                  </View>
              )}
          </View>
        ) : (
          <Text style={styles.infoText}>Chargement des informations utilisateur...</Text>
        )}

        {/* Ajouter la section Certificats */} 
        {user && (
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={goToCertificates}
            activeOpacity={0.7}
          >
              <Award size={20} color={Colors[colorScheme].text} style={styles.menuIcon} />
              <Text style={styles.menuText}>Mes Certificats</Text>
              <ChevronRight size={20} color={Colors[colorScheme].icon} />
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={styles.button}
          onPress={handleSignOut}
          disabled={loading}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator color={Colors[colorScheme].buttonText} />
          ) : (
            <View style={styles.buttonContent}>
              <LogOut size={18} color={Colors[colorScheme].buttonText} style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Déconnexion</Text>
            </View>
          )}
        </TouchableOpacity>
      </View> 
    </View>
  );
}

const getStyles = (scheme: 'light' | 'dark', screenWidth: number) => { // Added screenWidth
  const colors = Colors[scheme];
  const isWideScreen = screenWidth > 768; // Example breakpoint

  return StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: isWideScreen ? 80 : 60, // Adjusted paddingTop
      paddingHorizontal: 20,
      backgroundColor: colors.background,
      alignItems: 'center', // Center the contentWrapper
    },
    contentWrapper: { // Wrapper for the main content
        width: '100%',
        maxWidth: Platform.OS === 'web' ? 600 : undefined, // Max width on web
        alignItems: 'center', // Center items inside the wrapper
    },
    title: {
      fontSize: isWideScreen ? 32 : 28,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginBottom: isWideScreen ? 50 : 40,
    },
    userInfoContainer: {
        marginBottom: isWideScreen ? 50 : 40, 
        alignItems: 'stretch', // Let infoItems determine their width based on contentWrapper
        width: '100%',
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: isWideScreen ? 18 : 15,
        width: '100%', // Take width from userInfoContainer
        justifyContent: 'space-between',
        paddingHorizontal: isWideScreen ? 15 : 10,
        paddingVertical: isWideScreen ? 5 : 0, // Add some vertical padding on wide screens if needed
    },
    label: {
        fontSize: isWideScreen ? 17 : 16,
        color: colors.text,
        fontWeight: '600',
        marginRight: 10,
    },
    infoValue: {
      fontSize: isWideScreen ? 17 : 16,
      color: colors.text,
      flexShrink: 1,
      textAlign: 'right',
    },
    infoText: {
        fontSize: isWideScreen ? 17 : 16,
        color: colors.text,
        fontStyle: 'italic',
        marginBottom: 40,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        paddingVertical: isWideScreen ? 18 : 15,
        paddingHorizontal: isWideScreen ? 25 : 20,
        borderRadius: isWideScreen ? 12 : 10,
        marginBottom: isWideScreen ? 25 : 20,
        width: '100%', // Take width from contentWrapper
        borderWidth: 1,
        borderColor: colors.borderColor,
    },
    menuIcon: {
        marginRight: isWideScreen ? 18 : 15,
    },
    menuText: {
        flex: 1,
        fontSize: isWideScreen ? 17 : 16,
        color: colors.text,
    },
    button: {
      backgroundColor: colors.tint,
      paddingVertical: isWideScreen ? 16 : 15,
      paddingHorizontal: 40,
      borderRadius: isWideScreen ? 12 : 10,
      width: '100%', // Take width from contentWrapper
      maxWidth: 400, // Max width for the button itself
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      // shadow styles are fine
      marginTop: isWideScreen ? 30 : 20,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    buttonIcon: {
        marginRight: 10,
    },
    buttonText: {
      color: colors.buttonText,
      fontSize: isWideScreen ? 17 : 16,
      fontWeight: 'bold',
    },
  });
}; 