import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, Image, TouchableOpacity, useWindowDimensions, Platform, Modal, Pressable } from 'react-native';
import { getGrandsObjectifs, updateGrandObjectifStatus } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'expo-router';
import { MoreVertical } from 'lucide-react-native';
import { 
  Menu, 
  MenuOptions, 
  MenuOption, 
  MenuTrigger 
} from 'react-native-popup-menu';

// Mettre à jour le type pour correspondre à la table Supabase
type GrandObjectif = {
  id: string; // uuid
  uid: string; // uuid
  titre: string;
  statut: string | null;
  deadline: string | null; // date
  created_at: string; // timestamptz
  updated_at: string | null; // timestamptz
  Ressources: string[] | null; // _text (tableau de texte)
};

export default function GrandsObjectifsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [objectifs, setObjectifs] = useState<GrandObjectif[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  const fetchObjectifs = async () => {
    if (!user) {
      setLoading(false); 
      return; 
    }
    setLoading(true);
    const { data, error } = await getGrandsObjectifs(user.id); 
    if (data) {
      setObjectifs(data as GrandObjectif[]);
    } else if (error) {
      console.error("Erreur lors de la récupération des objectifs:", error);
      showModal("Erreur", "Impossible de récupérer les objectifs."); // Show modal for fetch error
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
        fetchObjectifs();
    }
  }, [user]); 

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchObjectifs();
    setRefreshing(false);
  }, [user]); 

  const handleRevoir = (id: string) => {
    const messagePrefill = `objectif :${id}`;
    router.push({ pathname: '/chat', params: { prefill: messagePrefill } });
  };

  const handleUpdateStatus = async (id: string, newStatus: 'Terminé' | 'Abandonné' | 'En cours') => {
    const { data, error } = await updateGrandObjectifStatus(id, newStatus);
    if (error) {
      showModal('Erreur', `Impossible de mettre à jour le statut de l'objectif.`);
    } else if (data) {
      setObjectifs(prevObjectifs =>
        prevObjectifs.map(obj =>
          obj.id === id ? { ...obj, statut: newStatus } : obj
        )
      );
    }
  };

  // Fonction pour déterminer la couleur du statut
  const getStatusStyle = (status: string | null) => {
    switch (status) {
      case 'Terminé':
        return styles.statusTermine;
      case 'Abandonné':
        return styles.statusAbandonne;
      case 'En cours':
      default:
        return styles.statusEnCours; // Style par défaut (couleur icon)
    }
  };

  // Fonction pour naviguer vers les détails
  const handlePressObjectif = (objectifId: string, objectifTitre: string) => {
    router.push({ 
      pathname: '/objectif-details', 
      params: { grandObjectifId: objectifId, titre: objectifTitre }
    });
  };

  const renderItem = ({ item }: { item: GrandObjectif }) => {
    const isCompletedOrAbandoned = item.statut === 'Terminé' || item.statut === 'Abandonné';
    const iconSize = width > 768 ? 24 : 22;
    
    return (
      <View style={styles.itemContainer}>
        <TouchableOpacity 
          onPress={() => handlePressObjectif(item.id, item.titre)} 
          style={styles.itemContent}
          activeOpacity={0.7}
        >
          <Text style={styles.itemTitle}>{item.titre}</Text>
          {item.statut && <Text style={[styles.itemDetail, getStatusStyle(item.statut)]}>Statut: {item.statut}</Text>}
          {item.deadline && (
            <Text style={styles.itemDetail}>
              Deadline: {new Date(item.deadline).toLocaleDateString()}
            </Text>
          )}
        </TouchableOpacity>
        <Menu>
          <MenuTrigger customStyles={{ triggerWrapper: styles.menuButton }}>
            <MoreVertical size={iconSize} color={Colors[colorScheme].icon} />
          </MenuTrigger>
          <MenuOptions customStyles={{ optionsContainer: styles.menuOptionsContainer }}>
            <MenuOption onSelect={() => handleRevoir(item.id)} text='Revoir avec Mon Koach' customStyles={{ optionText: styles.menuOptionText }} />
            
            {!isCompletedOrAbandoned ? (
              <>
                <MenuOption onSelect={() => handleUpdateStatus(item.id, 'Terminé')} text='Marquer comme terminé' customStyles={{ optionText: styles.menuOptionText }} />
                <MenuOption onSelect={() => handleUpdateStatus(item.id, 'Abandonné')} customStyles={{ optionText: [styles.menuOptionText, styles.destructiveOption] }}>
                  <Text style={[styles.menuOptionText, styles.destructiveOption]}>Abandonner cet objectif</Text>
                </MenuOption>
              </>
            ) : (
              <MenuOption onSelect={() => handleUpdateStatus(item.id, 'En cours')} text='Reprendre cet objectif' customStyles={{ optionText: styles.menuOptionText }} />
            )}
            
          </MenuOptions>
        </Menu>
      </View>
    );
  };

  // Afficher un message si l'utilisateur n'est pas connecté
  if (!user && !loading) {
    return <View style={styles.centered}><Text style={styles.emptyText}>Veuillez vous connecter pour voir vos objectifs.</Text></View>;
  }

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}><ActivityIndicator size="large" color={Colors[colorScheme].tint} /></View>
    );
  }

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

      {/* Conteneur pour le titre et l'image */}
      <View style={styles.titleContainer}>
        <Image source={require('@/assets/images/logo.png')} style={styles.logo} />
        <Text style={styles.title}>Mes Objectifs</Text>
      </View>
      <FlatList
        data={objectifs}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors[colorScheme].tint}
            colors={[Colors[colorScheme].tint]}
          />
        }
        ListEmptyComponent={<Text style={styles.emptyText}>Aucun objectif trouvé.</Text>}
      />
    </View>
  );
}

// Styles dynamiques basés sur le thème
const getStyles = (scheme: 'light' | 'dark' | null | undefined, screenWidth: number) => {
  const effectiveScheme = scheme ?? 'light';
  const colors = Colors[effectiveScheme];
  const isWideScreen = screenWidth > 768;

  return StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: isWideScreen ? 60 : 50,
      paddingHorizontal: isWideScreen ? 25 : 15,
      backgroundColor: colors.background,
      alignItems: Platform.OS === 'web' ? 'center' : undefined,
    },
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
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: isWideScreen ? 25 : 20,
      width: '100%',
      maxWidth: Platform.OS === 'web' ? 900 : undefined, 
    },
    logo: { 
      width: isWideScreen ? 48 : 40,
      height: isWideScreen ? 48 : 40,
      marginRight: isWideScreen ? 12 : 10,
    },
    title: {
      fontSize: isWideScreen ? 28 : 24,
      fontWeight: 'bold',
      textAlign: 'center',
      color: colors.textPrimary,
    },
    listContent: {
      paddingBottom: isWideScreen ? 30 : 20,
    },
    itemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      paddingVertical: isWideScreen ? 18 : 10,
      paddingLeft: isWideScreen ? 20 : 15,
      paddingRight: isWideScreen ? 10 : 5,
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
    itemContent: {
      flex: 1,
      marginRight: isWideScreen ? 10 : 5,
    },
    itemTitle: {
      fontSize: isWideScreen ? 19 : 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: isWideScreen ? 10 : 8,
    },
    itemDetail: {
      fontSize: isWideScreen ? 15 : 14,
      color: colors.text,
      marginBottom: isWideScreen ? 5 : 4,
    },
    itemDescription: {
      fontSize: 14,
      color: colors.icon,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 30,
        fontSize: isWideScreen ? 17 : 16,
        color: colors.text,
    },
    menuButton: {
      padding: isWideScreen ? 12 : 10,
    },
    menuOptionsContainer: {
      marginTop: isWideScreen ? 35 : 30,
      borderRadius: 8,
      backgroundColor: colors.card,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 5,
      elevation: 5,
      borderColor: colors.borderColor,
      borderWidth: 1,
    },
    menuOptionText: {
      fontSize: isWideScreen ? 17 : 16,
      paddingVertical: isWideScreen ? 12 : 10,
      paddingHorizontal: isWideScreen ? 18 : 15,
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
    // Modal Styles (copied from profile.tsx)
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