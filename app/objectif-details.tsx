import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Platform, TouchableOpacity, useWindowDimensions, Modal, Pressable, Animated } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { getMiniObjectifs, updateMiniObjectifStatus } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { MoreVertical, CheckCircle2, Clock, AlertCircle } from 'lucide-react-native';
import { 
  Menu, 
  MenuOptions, 
  MenuOption, 
  MenuTrigger 
} from 'react-native-popup-menu';

// Type pour les Mini Objectifs (basé sur l'image de la structure)
type MiniObjectif = {
  id: string; // uuid
  objectif_id: string; // uuid (lien vers grands_objectifs.id)
  mini_objectif: string | null;
  statut: string | null;
  deadline: string | null; // date
  created_at: string; // timestamptz
  updated_at: string | null; // timestamptz
  details_miniobjectifs: string | null;
};

export default function ObjectifDetailsScreen() {
  const { grandObjectifId, titre } = useLocalSearchParams<{ grandObjectifId: string; titre: string }>();
  const router = useRouter();
  const [miniObjectifs, setMiniObjectifs] = useState<MiniObjectif[]>([]);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme() ?? 'light';
  const { width } = useWindowDimensions();
  const styles = getStyles(colorScheme, width);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  // Helper to show modal
  const showModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  useEffect(() => {
    const fetchMiniObjectifs = async () => {
      if (!grandObjectifId) return;
      setLoading(true);
      const { data, error } = await getMiniObjectifs(grandObjectifId);
      if (data) {
        setMiniObjectifs(data as MiniObjectif[]);
      } else if (error) {
        console.error("Erreur lors de la récupération des mini objectifs:", error);
        showModal("Erreur", "Impossible de récupérer les mini objectifs.");
      }
      setLoading(false);
    };

    fetchMiniObjectifs();
  }, [grandObjectifId]);

  // Gère la mise à jour du statut d'un mini objectif
  const handleUpdateMiniStatus = async (miniId: string, newStatus: 'Terminé' | 'En cours') => {
    const { data, error } = await updateMiniObjectifStatus(miniId, newStatus);
    if (error) {
      showModal('Erreur', `Impossible de mettre à jour le statut du mini objectif.`);
    } else if (data) {
      setMiniObjectifs(prevMiniObjectifs =>
        prevMiniObjectifs.map(mini =>
          mini.id === miniId ? { ...mini, statut: newStatus } : mini
        )
      );
    }
  };

  // Gère la navigation vers le chat pour un mini objectif
  const handleRevoirMini = (miniId: string) => {
    // Prépare l'ID comme message de pré-remplissage
    const messagePrefill = `ID Mini Objectif: ${miniId}`;
    router.push({ pathname: '/chat', params: { prefill: messagePrefill } });
  };

  // Fonction pour déterminer la couleur du statut
  const getStatusStyle = (status: string | null) => {
    switch (status) {
      case 'Terminé':
        return styles.statusTermine;
      case 'Abandonné': // Garder la couleur même si l'option de le définir ici disparaît
        return styles.statusAbandonne;
      case 'En cours':
      default:
        return styles.statusEnCours; // Style par défaut (couleur icon)
    }
  };

  const renderItem = ({ item, index }: { item: MiniObjectif; index: number }) => {
    const isCompletedOrAbandoned = item.statut === 'Terminé' || item.statut === 'Abandonné';
    const iconSize = width > 768 ? 24 : 22;
    
    const getStatusIcon = (status: string | null) => {
      switch (status) {
        case 'Terminé':
          return <CheckCircle2 size={20} color="#28a745" style={styles.statusIcon} />;
        case 'Abandonné':
          return <AlertCircle size={20} color="#dc3545" style={styles.statusIcon} />;
        case 'En cours':
        default:
          return <Clock size={20} color={Colors[colorScheme].text} style={styles.statusIcon} />;
      }
    };

    return (
      <Animated.View 
        style={[
          styles.itemContainer,
          {
            opacity: 1,
            transform: [{ translateY: 0 }],
          }
        ]}
      >
        <View style={styles.itemContent}>
          <Text style={styles.itemTitle}>{item.mini_objectif || 'Mini objectif sans titre'}</Text>
          {item.details_miniobjectifs && (
            <Text style={styles.itemDetail}>
              {item.details_miniobjectifs}
            </Text>
          )}
          <View style={styles.statusContainer}>
            {getStatusIcon(item.statut)}
            {item.statut && (
              <Text style={[styles.itemDetail, getStatusStyle(item.statut)]}>
                {item.statut}
              </Text>
            )}
          </View>
          {item.deadline && (
            <View style={styles.deadlineContainer}>
              <Text style={[styles.itemDetail, styles.deadlineText]}>
                Échéance: {new Date(item.deadline).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
        <Menu>
          <MenuTrigger customStyles={{ triggerWrapper: styles.menuButton }}>
            <MoreVertical size={iconSize} color={Colors[colorScheme].icon} />
          </MenuTrigger>
          <MenuOptions customStyles={{ optionsContainer: styles.menuOptionsContainer }}>
            <MenuOption onSelect={() => handleRevoirMini(item.id)} text='Revoir avec Mon Koach' customStyles={{ optionText: styles.menuOptionText }} />
            {!isCompletedOrAbandoned ? (
              <MenuOption onSelect={() => handleUpdateMiniStatus(item.id, 'Terminé')} text='Marquer comme terminé' customStyles={{ optionText: styles.menuOptionText }} />
            ) : (
              <MenuOption onSelect={() => handleUpdateMiniStatus(item.id, 'En cours')} text='Reprendre ce mini objectif' customStyles={{ optionText: styles.menuOptionText }} />
            )}
          </MenuOptions>
        </Menu>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
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

      {/* Configurer l'en-tête de la Stack pour afficher le titre du grand objectif */}
      <Stack.Screen options={{ title: titre || 'Détails Objectif', headerBackTitle: 'Retour' }} />

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={Colors[colorScheme].tint} /></View>
      ) : (
        <FlatList
          data={miniObjectifs}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={<Text style={styles.headerTitle}>{titre}</Text>}
          ListEmptyComponent={<Text style={styles.emptyText}>Aucun mini objectif trouvé pour cet objectif.</Text>}
        />
      )}
    </View>
  );
}

// Styles
const getStyles = (scheme: 'light' | 'dark', screenWidth: number) => {
  const colors = Colors[scheme];
  const isWideScreen = screenWidth > 768;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    listContent: {
      padding: isWideScreen ? 25 : 15,
      maxWidth: Platform.OS === 'web' ? 900 : undefined,
      width: Platform.OS === 'web' ? '100%' : undefined,
      alignSelf: Platform.OS === 'web' ? 'center' : undefined,
    },
    headerTitle: {
      fontSize: isWideScreen ? 24 : 22,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginBottom: isWideScreen ? 30 : 24,
      paddingHorizontal: 15,
      textAlign: 'center',
      letterSpacing: 0.5,
    },
    itemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      paddingVertical: isWideScreen ? 20 : 15,
      paddingLeft: isWideScreen ? 22 : 18,
      paddingRight: isWideScreen ? 12 : 8,
      borderRadius: isWideScreen ? 16 : 12,
      marginBottom: isWideScreen ? 24 : 18,
      borderWidth: 1,
      borderColor: colors.borderColor,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    itemContent: {
      flex: 1,
      marginRight: isWideScreen ? 12 : 8,
    },
    itemTitle: {
      fontSize: isWideScreen ? 18 : 16,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: isWideScreen ? 12 : 8,
    },
    itemDetail: {
      fontSize: isWideScreen ? 15 : 14,
      color: colors.text,
      marginBottom: isWideScreen ? 8 : 6,
      lineHeight: 20,
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: isWideScreen ? 8 : 6,
    },
    statusIcon: {
      marginRight: 8,
    },
    deadlineContainer: {
      backgroundColor: colors.background,
      padding: 8,
      borderRadius: 6,
      marginTop: 4,
    },
    deadlineText: {
      color: colors.text,
      fontSize: isWideScreen ? 14 : 13,
      opacity: 0.7,
    },
    menuButton: {
      padding: isWideScreen ? 14 : 12,
      backgroundColor: colors.background,
      borderRadius: 8,
    },
    menuOptionsContainer: {
      marginTop: isWideScreen ? 40 : 35,
      borderRadius: 12,
      backgroundColor: colors.card,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 6,
      borderColor: colors.borderColor,
      borderWidth: 1,
      padding: 8,
    },
    menuOptionText: {
      fontSize: isWideScreen ? 16 : 15,
      paddingVertical: isWideScreen ? 14 : 12,
      paddingHorizontal: isWideScreen ? 20 : 16,
      color: colors.text,
      fontWeight: '500',
    },
    emptyText: {
      textAlign: 'center',
      marginTop: 30,
      fontSize: isWideScreen ? 18 : 16,
      color: colors.text,
    },
    destructiveOption: { 
      color: '#dc3545',
    },
    statusTermine: {
      color: '#28a745',
      fontWeight: 'bold',
    },
    statusAbandonne: {
      color: '#dc3545',
      fontWeight: 'bold',
    },
    statusEnCours: {
       color: colors.text,
       fontWeight: 'normal',
    },
    // Modal Styles (copiés et adaptés si besoin de certificates.tsx)
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