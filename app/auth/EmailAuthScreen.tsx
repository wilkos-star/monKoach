import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, ActivityIndicator, Text, useWindowDimensions, Platform, Modal, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { upsertUserByEmail } from '../../lib/supabase';
import { Colors } from '../../constants/Colors';
import { useAuth, WhatsAppUser } from '@/providers/AuthProvider';

const EmailAuthScreen = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const auth = useAuth();
    const { width } = useWindowDimensions();

    const [modalVisible, setModalVisible] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalMessage, setModalMessage] = useState('');
    const [nextScreenParams, setNextScreenParams] = useState<any>(null);
    const [isConfirmation, setIsConfirmation] = useState(false);

    const isWideScreen = width > 768;

    const showModal = (title: string, message: string, params: any = null, confirmation = false) => {
        setModalTitle(title);
        setModalMessage(message);
        setNextScreenParams(params);
        setIsConfirmation(confirmation);
        setModalVisible(true);
    };

    const handleModalAction = () => {
        setModalVisible(false);
        if (nextScreenParams) {
            router.push(nextScreenParams);
        }
    };
    
    const handleContinue = async () => {
        const trimmedEmail = email.trim();
        if (!trimmedEmail) {
            showModal('Erreur', 'Veuillez entrer votre adresse email.');
            return;
        }
        if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
            showModal('Email Invalide', 'Veuillez entrer une adresse e-mail valide.');
            return;
        }

        setLoading(true);
        try {
            const { data: userData, error } = await upsertUserByEmail(trimmedEmail);

            if (error || !userData) {
                setLoading(false);
                showModal('Erreur', error?.message || 'Une erreur est survenue lors de la récupération des données utilisateur.');
                return;
            }

            // Si l'utilisateur est déjà vérifié, on le connecte directement
            if (userData.is_verified) {
                const expirationTime = new Date().getTime() + 30 * 24 * 60 * 60 * 1000; // 30 jours en millisecondes
                localStorage.setItem('tokenExpiration', expirationTime.toString());
                localStorage.setItem('userId', userData.id);
                localStorage.setItem('userToken', userData.auth_token);
                auth.signInUser(userData as WhatsAppUser);

                if (userData.email && userData.nom) {
                    router.replace('/(tabs)/chat');
                } else {
                    router.push({
                        pathname: '/auth/AdditionalInfoScreen',
                        params: { 
                            userId: userData.id, 
                            authToken: userData.auth_token,
                            currentNom: userData.nom || '' 
                        }
                    });
                }
                return; // On arrête l'exécution ici
            }

            // Si l'utilisateur n'est pas vérifié, on envoie le code et on va à l'écran de vérification
            fetch('https://n8n-nw6a.onrender.com/webhook/09686b59-9edd-46a6-a2d5-5620326b2eeb', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: trimmedEmail }),
            }).catch(webhookError => console.error('Erreur Webhook:', webhookError));

            router.push({
                pathname: '/auth/VerificationScreen',
                params: { userId: userData.id, email: userData.email }
            });

        } catch (e: any) {
            setLoading(false);
            showModal('Erreur Inattendue', e.message || 'Une erreur inconnue est survenue.');
        } 
    };

    return (
        <View style={styles.outerContainer}>
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    setModalVisible(false);
                    if (!isConfirmation) setLoading(false);
                }}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>{modalTitle}</Text>
                        <Text style={styles.modalText}>{modalMessage}</Text>
                        {isConfirmation ? (
                            <View style={styles.modalButtonContainer}>
                                <Pressable
                                    style={[styles.modalButton, styles.buttonCancel]}
                                    onPress={() => {
                                        setModalVisible(false);
                                        setLoading(false);
                                    }}
                                >
                                    <Text style={styles.modalButtonText}>Annuler</Text>
                                </Pressable>
                                <Pressable
                                    style={[styles.modalButton, styles.buttonConfirm]}
                                    onPress={handleModalAction}
                                >
                                    <Text style={styles.modalButtonText}>Confirmer</Text>
                                </Pressable>
                            </View>
                        ) : (
                            <Pressable
                                style={[styles.modalButton, styles.buttonConfirm, { width: '100%' }]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.modalButtonText}>OK</Text>
                            </Pressable>
                        )}
                    </View>
                </View>
            </Modal>

            <View style={[styles.container, isWideScreen && styles.containerWide]}>
                <Text style={[styles.title, isWideScreen && styles.titleWide]}>Connexion / Inscription</Text>
                <Text style={[styles.subtitle, isWideScreen && styles.subtitleWide]}>Entrez votre adresse email pour commencer.</Text>
                <TextInput
                    style={[styles.input, isWideScreen && styles.inputWide]}
                    placeholder="Votre adresse email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoComplete="email"
                    textContentType="emailAddress"
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

export default EmailAuthScreen; 