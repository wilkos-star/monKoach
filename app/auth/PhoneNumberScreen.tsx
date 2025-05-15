import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert, ActivityIndicator, Text, useWindowDimensions, Platform, Modal, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { upsertUserByPhoneNumber } from '../../lib/supabase';
import { Colors } from '../../constants/Colors'; 
import { useAuth, WhatsAppUser } from '@/providers/AuthProvider';

const PhoneNumberScreen = () => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const auth = useAuth();
    const { width } = useWindowDimensions(); // Get window width

    const [modalVisible, setModalVisible] = useState(false);
    const [verificationParams, setVerificationParams] = useState<{ userId: string; phoneNumber: string | null | undefined } | null>(null);

    // Determine if the screen is wide (e.g., web desktop)
    const isWideScreen = width > 768; // Example breakpoint

    const handleContinue = async () => {
        if (!phoneNumber.trim()) {
            Alert.alert('Erreur', 'Veuillez entrer votre numéro de téléphone WhatsApp.');
            return;
        }
        if (!/^\+?[1-9]\d{7,14}$/.test(phoneNumber)) {
             Alert.alert('Numéro Invalide', 'Veuillez entrer un numéro de téléphone valide (ex: +33612345678).');
             return;
        }

        setLoading(true);
        try {
            const { data: userData, error } = await upsertUserByPhoneNumber(phoneNumber);

            if (error || !userData) {
                Alert.alert('Erreur', error?.message || 'Une erreur est survenue lors de la récupération des données utilisateur.');
                setLoading(false);
                return;
            }

            if (userData.is_verified) {
                if (userData.email) {
                    localStorage.setItem('userId', userData.id);
                    localStorage.setItem('userToken', userData.auth_token);
                    auth.signInUser(userData as WhatsAppUser);
                    router.replace('/(tabs)/chat');
                    setLoading(false);
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
                    setLoading(false);
                }
            } else {
                // User is NOT verified, show custom modal
                setVerificationParams({ userId: userData.id, phoneNumber: userData.phone_number });
                setModalVisible(true);
                // setLoading(false) is not called here; modal actions or navigation will handle it.
            }

        } catch (e: any) {
            Alert.alert('Erreur Inattendue', e.message || 'Une erreur inconnue est survenue.');
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
                    setLoading(false); 
                }}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>Confirmez votre numéro</Text>
                        <Text style={styles.modalText}>
                            Est-ce que {phoneNumber} est bien votre numéro WhatsApp ?
                        </Text>
                        <View style={styles.modalButtonContainer}>
                            <Pressable
                                style={[styles.modalButton, styles.buttonCancel]}
                                onPress={() => {
                                    setModalVisible(!modalVisible);
                                    setLoading(false);
                                }}
                            >
                                <Text style={styles.modalButtonText}>Annuler</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.modalButton, styles.buttonConfirm]}
                                onPress={() => {
                                    setModalVisible(!modalVisible);
                                    if (verificationParams) {
                                        router.push({
                                            pathname: '/auth/VerificationScreen',
                                            params: verificationParams
                                        });
                                    }
                                    // setLoading(false); // Consider if needed, navigation might make it irrelevant
                                }}
                            >
                                <Text style={styles.modalButtonText}>Confirmer</Text>
                            </Pressable>
                        </View>
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
        alignItems: 'center', // Center the inner container on web
        backgroundColor: '#f0f0f0',
        padding: 20, // Base padding for smaller screens
    },
    container: {
        width: '100%', // Full width on mobile
        maxWidth: 400, // Max width for the content block on larger screens
        padding: Platform.select({ web: 0, default: 0}), // Original padding moved to outerContainer or adjusted
        // justifyContent: 'center', // Already in outerContainer
        // backgroundColor: '#f0f0f0', // Moved to outerContainer
    },
    containerWide: { // Additional styles for wider screens
        padding: 40, // Larger padding for web
        backgroundColor: '#ffffff', // Optional: different background for the content card on web
        borderRadius: Platform.select({web: 12, default: 0}),
        boxShadow: Platform.select({web: '0 4px 8px rgba(0,0,0,0.1)', default: undefined }) as any,
    },
    title: {
        fontSize: 22, // Adjusted base font size
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
        color: '#333',
    },
    titleWide: {
        fontSize: 32, // Larger font size for web
    },
    subtitle: {
        fontSize: 14, // Adjusted base font size
        marginBottom: 25,
        textAlign: 'center',
        color: '#555',
    },
    subtitleWide: {
        fontSize: 18, // Larger font size for web
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
        // On web, let it take the width of its container (which has maxWidth)
    },
    inputWide: {
        // height: 55, // Optionally slightly larger input height on web
        // fontSize: 18, // Optionally slightly larger font in input on web
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
        paddingHorizontal: 10, // Adjusted for smaller screens
        elevation: 2,
        flex: 1, // Make buttons take available space
        marginHorizontal: 5, // Add some space between buttons
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