import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, StyleSheet, Text, ActivityIndicator, useWindowDimensions, Platform, Modal, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { updateUserProfile } from '../../lib/supabase';
import { useAuth, WhatsAppUser } from '@/providers/AuthProvider';
import { Colors } from '../../constants/Colors';

const AdditionalInfoScreen = () => {
    const router = useRouter();
    const params = useLocalSearchParams<{ userId: string, currentNom?: string, authToken?: string, phoneNumber?: string }>();
    const auth = useAuth();
    const { width } = useWindowDimensions();

    const [fullName, setFullName] = useState(params.currentNom || '');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalMessage, setModalMessage] = useState('');
    const [modalOkAction, setModalOkAction] = useState(() => () => {}); // Callback for OK button

    const isWideScreen = width > 768;

    // Helper to show modal
    const showModal = (title: string, message: string, onOkPress?: () => void) => {
        setModalTitle(title);
        setModalMessage(message);
        setModalOkAction(() => onOkPress ? () => { onOkPress(); setModalVisible(false); } : () => setModalVisible(false));
        setModalVisible(true);
    };

    useEffect(() => {
        if (!params.userId || !params.authToken || !params.phoneNumber) {
            showModal('Erreur', "Données utilisateur incomplètes. Impossible de continuer.", () => router.replace('/auth/PhoneNumberScreen'));
            // router.replace might be called before modal is seen, consider modal interaction first
        }
    }, [params, router]);

    const handleSubmit = async () => {
        if (!params.userId || !params.authToken || !params.phoneNumber) {
            showModal('Erreur', "Les informations de session sont manquantes.");
            return;
        }
        if (!fullName.trim()) {
            showModal('Champ Requis', 'Veuillez entrer votre nom complet.');
            return;
        }
        if (!email.trim()) {
            showModal('Champ Requis', 'Veuillez entrer votre adresse e-mail.');
            return;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            showModal('Email Invalide', 'Veuillez entrer une adresse e-mail valide.');
            return;
        }

        setLoading(true);
        try {
            const { data: updatedUserData, error } = await updateUserProfile(params.userId, { nom: fullName, email });

            if (error || !updatedUserData) {
                showModal('Erreur de Mise à Jour', error?.message || 'Impossible de sauvegarder les informations.');
            } else {
                localStorage.setItem('userId', updatedUserData.id);
                localStorage.setItem('userToken', updatedUserData.auth_token);
                
                auth.signInUser(updatedUserData as WhatsAppUser);
                showModal('Succès', 'Vos informations ont été enregistrées.', () => router.replace({ pathname: '/(tabs)/chat', params: { fromProfileCompletion: 'true' } }));
            }
        } catch (e: any) {
            showModal('Erreur Inattendue', e.message || 'Une erreur inconnue est survenue.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.outerContainer}>
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    setModalVisible(!modalVisible);
                    // Potentially call modalOkAction if it's just a dismiss action for some modals
                }}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitleText}>{modalTitle}</Text>
                        <Text style={styles.modalMessageText}>{modalMessage}</Text>
                        <Pressable
                            style={[styles.modalButton, styles.buttonConfirm]}
                            onPress={modalOkAction} // Use the dynamic action
                        >
                            <Text style={styles.modalButtonText}>OK</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>

            <View style={[styles.container, isWideScreen && styles.containerWide]}>
                <Text style={[styles.title, isWideScreen && styles.titleWide]}>Complétez Votre Profil</Text>
                <Text style={[styles.subtitle, isWideScreen && styles.subtitleWide]}>Veuillez fournir les informations suivantes pour continuer.</Text>
                
                <TextInput
                    style={styles.input}
                    placeholder="Nom Complet"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                    textContentType="name"
                    placeholderTextColor="#888"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Adresse Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    textContentType="emailAddress"
                    placeholderTextColor="#888"
                />
                {loading ? (
                    <ActivityIndicator size="large" color={Colors.light.tint} style={{ marginTop: 20 }} />
                ) : (
                    <Button title="Enregistrer et Continuer" onPress={handleSubmit} color={Colors.light.tint} />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    outerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        padding: 20,
    },
    container: {
        width: '100%',
        maxWidth: 420,
        padding: Platform.select({ web: 0, default: 0}),
    },
    containerWide: {
        padding: 40,
        backgroundColor: '#ffffff',
        borderRadius: Platform.select({web: 12, default: 0}),
        boxShadow: Platform.select({web: '0 4px 8px rgba(0,0,0,0.1)', default: undefined }) as any,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
        color: '#333',
    },
    titleWide: {
        fontSize: 30,
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 25,
        textAlign: 'center',
        color: '#555',
    },
    subtitleWide: {
        fontSize: 17,
    },
    input: {
        height: 50,
        borderColor: '#ccc',
        borderWidth: 1,
        marginBottom: 15,
        paddingHorizontal: 15,
        borderRadius: 8,
        fontSize: 16,
        backgroundColor: '#fff',
        color: '#333',
    },
    // Styles for Modal
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)', 
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white', 
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
    },
    modalTitleText: {
        marginBottom: 15,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    modalMessageText: {
        marginBottom: 20,
        textAlign: 'center',
        fontSize: 16,
        color: '#555',
        lineHeight: 22,
    },
    modalButton: { 
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 20,
        elevation: 2,
        width: '100%', // Make button take full width of modal content area
        alignItems: 'center',
    },
    buttonConfirm: { // Using buttonConfirm style for the single OK button
        backgroundColor: Colors.light.tint, 
    },
    modalButtonText: { 
        color: 'white', 
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 15,
    },
});

export default AdditionalInfoScreen; 