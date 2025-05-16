import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, ActivityIndicator, Text, useWindowDimensions, Platform, Modal, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { upsertUserByPhoneNumber } from '../../lib/supabase';
import { Colors } from '../../constants/Colors'; 
import { useAuth, WhatsAppUser } from '@/providers/AuthProvider';

const PhoneNumberScreen = () => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const auth = useAuth();
    const { width } = useWindowDimensions();

    const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
    const [errorModalVisible, setErrorModalVisible] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalMessage, setModalMessage] = useState('');
    const [verificationParams, setVerificationParams] = useState<{ userId: string; phoneNumber: string | null | undefined } | null>(null);

    const isWideScreen = width > 768;

    const showErrorModal = (title: string, message: string) => {
        setModalTitle(title);
        setModalMessage(message);
        setErrorModalVisible(true);
    };

    const handleContinue = async () => {
        if (!phoneNumber.trim()) {
            showErrorModal('Erreur', 'Veuillez entrer votre numéro de téléphone WhatsApp.');
            return;
        }
        if (!/^\+[1-9]\d{9,14}$/.test(phoneNumber)) {
             showErrorModal('Numéro Invalide', 'Veuillez entrer un numéro de téléphone valide commençant par + et suivi d\'au moins 10 chiffres (ex: +336123456789).');
             return;
        }

        setLoading(true);
        try {
            const { data: userData, error } = await upsertUserByPhoneNumber(phoneNumber);

            if (error || !userData) {
                showErrorModal('Erreur', error?.message || 'Une erreur est survenue lors de la récupération des données utilisateur.');
                setLoading(false);
                return;
            }

            if (userData.is_verified) {
                if (userData.email && userData.nom) {
                    localStorage.setItem('userId', userData.id);
                    localStorage.setItem('userToken', userData.auth_token);
                    auth.signInUser(userData as WhatsAppUser);
                    router.replace('/(tabs)/chat');
                } else {
                    router.push({
                        pathname: '/auth/AdditionalInfoScreen',
                        params: { 
                            userId: userData.id, 
                            authToken: userData.auth_token,
                            phoneNumber: userData.phone_number,
                            currentNom: userData.nom || '' 
                        }
                    });
                }
            } else {
                setVerificationParams({ userId: userData.id, phoneNumber: userData.phone_number });
                setModalTitle('Confirmez votre numéro');
                setModalMessage(`Est-ce que ${phoneNumber} est bien votre numéro WhatsApp ?`);
                setConfirmationModalVisible(true);
            }

        } catch (e: any) {
            showErrorModal('Erreur Inattendue', e.message || 'Une erreur inconnue est survenue.');
        } finally {
        }
    };

    return (
        <View style={styles.outerContainer}>
            <Modal
                animationType="fade"
                transparent={true}
                visible={confirmationModalVisible}
                onRequestClose={() => {
                    setConfirmationModalVisible(false);
                    setLoading(false); 
                }}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>{modalTitle}</Text>
                        <Text style={styles.modalText}>{modalMessage}</Text>
                        <View style={styles.modalButtonContainer}>
                            <Pressable
                                style={[styles.modalButton, styles.buttonCancel]}
                                onPress={() => {
                                    setConfirmationModalVisible(false);
                                    setLoading(false);
                                }}
                            >
                                <Text style={styles.modalButtonText}>Annuler</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.modalButton, styles.buttonConfirm]}
                                onPress={() => {
                                    setConfirmationModalVisible(false);
                                    if (verificationParams) {
                                        router.push({
                                            pathname: '/auth/VerificationScreen',
                                            params: verificationParams
                                        });
                                    }
                                }}
                            >
                                <Text style={styles.modalButtonText}>Confirmer</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                animationType="fade"
                transparent={true}
                visible={errorModalVisible}
                onRequestClose={() => setErrorModalVisible(false)}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>{modalTitle}</Text>
                        <Text style={styles.modalText}>{modalMessage}</Text>
                        <Pressable
                            style={[styles.modalButton, styles.buttonConfirm, { width: '100%' }]}
                            onPress={() => setErrorModalVisible(false)}
                        >
                            <Text style={styles.modalButtonText}>OK</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>

            <View style={[styles.container, isWideScreen && styles.containerWide]}>
                <Text style={[styles.title, isWideScreen && styles.titleWide]}>Connexion / Inscription</Text>
                <Text style={[styles.subtitle, isWideScreen && styles.subtitleWide]}>Entrez votre numéro WhatsApp pour commencer.</Text>
                <TextInput
                    style={[styles.input, isWideScreen && styles.inputWide]}
                    placeholder="Numéro WhatsApp (ex: +33612345678)"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                    autoCapitalize="none"
                    placeholderTextColor="#888"
                />
                {loading ? (
                    <ActivityIndicator size="large" color={Colors.light.tint} />
                ) : (
                    <Button title="Continuer" onPress={handleContinue} color={Colors.light.tint} />
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
        maxWidth: 400,
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
        fontSize: 32,
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 25,
        textAlign: 'center',
        color: '#555',
    },
    subtitleWide: {
        fontSize: 18,
    },
    input: {
        height: 50,
        borderColor: '#ccc',
        borderWidth: 1,
        marginBottom: 20,
        paddingHorizontal: 15,
        borderRadius: 8,
        fontSize: 16,
        backgroundColor: '#fff',
        color: '#333',
    },
    inputWide: {
    },
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
    modalTitle: {
        marginBottom: 15,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    modalText: {
        marginBottom: 20,
        textAlign: 'center',
        fontSize: 16,
        color: '#555',
        lineHeight: 22,
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 10,
    },
    modalButton: { 
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 10,
        elevation: 2,
        flex: 1,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    buttonCancel: {
        backgroundColor: '#A0A0A0', 
    },
    buttonConfirm: {
        backgroundColor: Colors.light.tint, 
    },
    modalButtonText: { 
        color: 'white', 
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 15,
    },
});

export default PhoneNumberScreen; 