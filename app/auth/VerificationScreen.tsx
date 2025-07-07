import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Button, ActivityIndicator, useWindowDimensions, Platform, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { checkUserVerification, setUserVerified } from '../../lib/supabase';
import { useAuth, WhatsAppUser } from '@/providers/AuthProvider';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const VerificationScreen = () => {
    const params = useLocalSearchParams<{ userId?: string; email?: string }>();
    const { userId } = params;
    const router = useRouter();
    const auth = useAuth();
    const { width } = useWindowDimensions();
    const colorScheme = useColorScheme() ?? 'light';
    const styles = getThemedStyles(colorScheme, width);

    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!userId) {
            Alert.alert("Erreur", "ID utilisateur manquant. Vous allez être redirigé.", [{ text: "OK", onPress: () => router.replace('/auth/EmailAuthScreen' as any) }]);
        }
    }, [userId, router]);

    const handleValidate = async () => {
        if (code.length !== 6) {
            Alert.alert('Erreur', 'Veuillez entrer un code à 6 chiffres.');
            return;
        }

        setLoading(true);
        try {
            // 1. Récupérer les infos utilisateur, y compris l'auth_token
            const { data: userData, error: fetchError } = await checkUserVerification(userId!);
            if (fetchError || !userData || !userData.auth_token) {
                Alert.alert('Erreur', fetchError?.message || "Impossible de récupérer les informations de l'utilisateur.");
                setLoading(false);
                return;
            }

            // 2. Comparer le code
            const expectedCode = userData.auth_token.slice(-6);
            if (code !== expectedCode) {
                Alert.alert('Code Invalide', 'Le code que vous avez entré est incorrect.');
                setLoading(false);
                return;
            }

            // 3. Mettre à jour is_verified à true
            const { data: verifiedUserData, error: verificationError } = await setUserVerified(userId!);
            if (verificationError || !verifiedUserData) {
                Alert.alert('Erreur', verificationError?.message || "Une erreur est survenue lors de la validation.");
                setLoading(false);
                return;
            }

            // 4. Connecter l'utilisateur et rediriger
            const expirationTime = new Date().getTime() + 30 * 24 * 60 * 60 * 1000; // 30 jours en millisecondes
            localStorage.setItem('tokenExpiration', expirationTime.toString());
            localStorage.setItem('userToken', verifiedUserData.auth_token);
            localStorage.setItem('userId', verifiedUserData.id);
            auth.signInUser(verifiedUserData as WhatsAppUser);

            if (verifiedUserData.nom && verifiedUserData.email) {
                router.replace('/(tabs)/chat');
            } else {
                router.replace({
                    pathname: '/auth/AdditionalInfoScreen',
                    params: {
                        userId: verifiedUserData.id,
                        authToken: verifiedUserData.auth_token,
                        currentNom: verifiedUserData.nom || '',
                    }
                });
            }
        } catch (e: any) {
            Alert.alert('Erreur Inattendue', e.message || 'Une erreur inconnue est survenue.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.outerContainer}>
            <View style={[styles.container, width > 768 && styles.containerWide]}>
                <Text style={[styles.title, width > 768 && styles.titleWide]}>Vérifiez votre compte</Text>
                
                <Text style={[styles.statusText, width > 768 && styles.statusTextWide]}>
                    Veuillez entrer le code à 6 chiffres que vous avez reçu pour finaliser votre inscription.
                </Text>

                <TextInput
                    style={styles.input}
                    value={code}
                    onChangeText={setCode}
                    placeholder="_ _ _ _ _ _"
                    keyboardType="number-pad"
                    maxLength={6}
                    textAlign="center"
                    placeholderTextColor="#aaa"
                />

                {loading ? (
                    <ActivityIndicator size="large" color={styles.tintColor.color} style={{ marginTop: 20 }} />
                ) : (
                    <View style={styles.buttonContainer}>
                        <Button
                            title="Valider"
                            onPress={handleValidate}
                            color={styles.tintColor.color}
                        />
                    </View>
                )}

                <Text style={[styles.tipText, width > 768 && styles.tipTextWide]}>
                    Si vous n'avez pas reçu de code, veuillez vérifier vos spams ou retourner à l'écran précédent pour réessayer.
                </Text>

                <View style={[styles.buttonContainer, { marginTop: 10 }]}>
                    <Button 
                        title="Retour"
                        onPress={() => router.replace('/auth/EmailAuthScreen' as any)}
                        color="#888" // Softer color for secondary action
                    />
                </View>
            </View>
        </View>
    );
};

const getThemedStyles = (scheme: 'light' | 'dark', screenWidth: number) => { 
    const colors = Colors[scheme];
    const isWideScreen = screenWidth > 768;

    return StyleSheet.create({
        outerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: colors.background },
        container: { width: '100%', maxWidth: 500, alignItems: 'center', padding: Platform.select({ web: 0, default: 0 }) },
        containerWide: { padding: Platform.select({ web: 40, default: 20 }), backgroundColor: colors.card, borderRadius: Platform.select({ web: 12, default: 0 }), boxShadow: Platform.select({ web: '0 4px 8px rgba(0,0,0,0.1)', default: undefined }) as any },
        title: { fontSize: isWideScreen ? 28 : 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: colors.text },
        titleWide: { fontSize: 28 },
        statusText: {
            fontSize: isWideScreen ? 18 : 16,
            textAlign: 'center',
            marginBottom: 25,
            color: colors.text,
            paddingHorizontal: 10,
            lineHeight: 24,
        },
        statusTextWide: { fontSize: 18 },
        input: {
            height: 60,
            width: '80%',
            maxWidth: 300,
            borderColor: '#ccc',
            borderWidth: 1,
            borderRadius: 8,
            fontSize: 24,
            backgroundColor: '#fff',
            color: '#333',
            letterSpacing: 10,
            marginBottom: 20,
        },
        buttonContainer: {
            width: '80%',
            maxWidth: 300,
            marginVertical: 10,
        },
        tipText: {
            fontSize: isWideScreen ? 14 : 12,
            textAlign: 'center',
            color: '#777',
            fontStyle: 'italic',
            marginTop: 'auto',
            paddingTop: 20,
        },
        tipTextWide: { fontSize: 14 },
        tintColor: { color: colors.tint },
    });
};

export default VerificationScreen;