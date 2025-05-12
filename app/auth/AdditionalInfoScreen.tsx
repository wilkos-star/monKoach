import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, StyleSheet, Alert, Text, ActivityIndicator, useWindowDimensions, Platform } from 'react-native';
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

    const isWideScreen = width > 768;

    useEffect(() => {
        if (!params.userId || !params.authToken || !params.phoneNumber) {
            Alert.alert('Erreur', "Données utilisateur incomplètes. Impossible de continuer.");
            router.replace('/auth/PhoneNumberScreen');
        }
    }, [params, router]);

    const handleSubmit = async () => {
        if (!params.userId || !params.authToken || !params.phoneNumber) {
            Alert.alert('Erreur', "Les informations de session sont manquantes.");
            return;
        }
        if (!fullName.trim()) {
            Alert.alert('Champ Requis', 'Veuillez entrer votre nom complet.');
            return;
        }
        if (!email.trim()) {
            Alert.alert('Champ Requis', 'Veuillez entrer votre adresse e-mail.');
            return;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            Alert.alert('Email Invalide', 'Veuillez entrer une adresse e-mail valide.');
            return;
        }

        setLoading(true);
        try {
            const { data: updatedUserData, error } = await updateUserProfile(params.userId, { nom: fullName, email });

            if (error || !updatedUserData) {
                Alert.alert('Erreur de Mise à Jour', error?.message || 'Impossible de sauvegarder les informations.');
            } else {
                localStorage.setItem('userId', updatedUserData.id);
                localStorage.setItem('userToken', updatedUserData.auth_token);
                
                auth.signInUser(updatedUserData as WhatsAppUser);
                Alert.alert('Succès', 'Vos informations ont été enregistrées.', [
                    { text: 'OK', onPress: () => router.replace('/(tabs)/chat') }
                ]);
            }
        } catch (e: any) {
            Alert.alert('Erreur Inattendue', e.message || 'Une erreur inconnue est survenue.');
        } finally {
            setLoading(false);
        }
    };

    if (!params.userId || !params.authToken || !params.phoneNumber) {
        return <View style={styles.outerContainer}><ActivityIndicator size="large" color={Colors.light.tint} /></View>;
    }

    return (
        <View style={styles.outerContainer}>
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
});

export default AdditionalInfoScreen; 