import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert, ActivityIndicator, Text, useWindowDimensions, Platform } from 'react-native';
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
                Alert.alert(
                    'Confirmez votre numéro',
                    `Est-ce que ${phoneNumber} est bien votre numéro WhatsApp ?`,
                    [
                        { text: 'Annuler', style: 'cancel', onPress: () => setLoading(false) },
                        {
                            text: 'Confirmer',
                            onPress: () => {
                                setLoading(false);
                                router.push({
                                    pathname: '/auth/VerificationScreen',
                                    params: { userId: userData.id, phoneNumber: userData.phone_number }
                                });
                            },
                        },
                    ],
                    { cancelable: false }
                );
            }

        } catch (e: any) {
            Alert.alert('Erreur Inattendue', e.message || 'Une erreur inconnue est survenue.');
            setLoading(false);
        }
    };

    return (
        <View style={styles.outerContainer}>
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
});

export default PhoneNumberScreen; 