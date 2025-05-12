import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Linking, Alert, useWindowDimensions, Platform
} from 'react-native';
import { Stack } from 'expo-router';
import { getUserCertificates } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/providers/AuthProvider';
import { Award, ExternalLink } from 'lucide-react-native'; // Icônes

// Type pour un certificat (basé sur la fonction Supabase)
type Certificate = {
  id: string;
  user_id: string;
  course_id: string;
  issued_at: string;
  certificate_url: string | null;
  created_at: string;
  course_title: string; // Ajouté par la jointure
};

export default function CertificatesScreen() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const { width } = useWindowDimensions(); // Get window width
  const styles = getStyles(colorScheme, width); // Pass width to styles

  useEffect(() => {
    const fetchCertificates = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error } = await getUserCertificates(user.id);
      if (error) {
        console.error("Erreur chargement certificats:", error);
        Alert.alert("Erreur", "Impossible de charger vos certificats.");
      } else {
        setCertificates(data || []);
      }
      setLoading(false);
    };

    fetchCertificates();
  }, [user]);

  const handleViewCertificate = async (url: string | null) => {
    if (!url) {
        Alert.alert("Lien manquant", "Aucune URL n'est associée à ce certificat.");
        return;
    }
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Erreur", `Impossible d'ouvrir ce lien: ${url}`);
    }
  };

  const renderItem = ({ item }: { item: Certificate }) => (
    <View style={styles.itemContainer}>
        <Award size={24} color={Colors[colorScheme].tint} style={styles.icon} />
        <View style={styles.itemTextContainer}>
            <Text style={styles.courseTitle}>{item.course_title}</Text>
            <Text style={styles.dateText}>
                Délivré le: {new Date(item.issued_at).toLocaleDateString()}
            </Text>
        </View>
        {item.certificate_url && (
            <TouchableOpacity 
                style={styles.linkButton}
                onPress={() => handleViewCertificate(item.certificate_url)}
                activeOpacity={0.7}
            >
                <ExternalLink size={20} color={Colors[colorScheme].tint} />
            </TouchableOpacity>
        )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Mes Certificats' }} />
      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={Colors[colorScheme].tint} /></View>
      ) : (
        <FlatList
          data={certificates}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>Vous n'avez encore aucun certificat.</Text>}
          // Optionally, add numColumns for web if a grid layout is desired on wide screens
          // numColumns={Platform.OS === 'web' && width > 768 ? 2 : 1}
          // key={Platform.OS === 'web' && width > 768 ? 'two-columns' : 'one-column'} // Required if numColumns changes
        />
      )}
    </View>
  );
}

const getStyles = (scheme: 'light' | 'dark', screenWidth: number) => {
  const colors = Colors[scheme];
  const isWideScreen = screenWidth > 768; // Example breakpoint

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    listContent: { 
        paddingVertical: isWideScreen ? 30 : 20, 
        paddingHorizontal: isWideScreen ? 40 : 15, 
    },
    itemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      padding: isWideScreen ? 20 : 15,
      borderRadius: isWideScreen ? 12 : 10,
      marginBottom: isWideScreen ? 20 : 15,
      borderWidth: 1,
      borderColor: colors.borderColor,
      // For web, if numColumns > 1, you might need to adjust flex properties
      // flex: Platform.OS === 'web' && isWideScreen ? 1 / 2 : 1, 
      // margin: Platform.OS === 'web' && isWideScreen ? 10 : 0,
      // maxWidth: Platform.OS === 'web' && isWideScreen ? '48%' : '100%', // Example for 2 columns
    },
    icon: {
      marginRight: isWideScreen ? 20 : 15,
    },
    itemTextContainer: {
      flex: 1,
      marginRight: 10,
    },
    courseTitle: {
      fontSize: isWideScreen ? 18 : 16,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: isWideScreen ? 6 : 4,
    },
    dateText: {
      fontSize: isWideScreen ? 15 : 14,
      color: colors.text,
    },
    linkButton: {
        padding: isWideScreen ? 8 : 5, 
    },
    emptyText: {
      textAlign: 'center',
      marginTop: 50,
      fontSize: isWideScreen ? 18 : 16,
      color: colors.text,
    },
  });
}; 