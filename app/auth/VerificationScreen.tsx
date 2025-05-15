import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator, Linking, Alert, useWindowDimensions, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { checkUserVerification } from '../../lib/supabase'; // Adjust path as needed
import { useAuth } from '@/providers/AuthProvider'; // Corrected path
import { Colors } from '../../constants/Colors'; // Assuming you have this

// Define the recipient phone number and the base URL prefix separately
const WHATSAPP_RECIPIENT_NUMBER = '22958082628';
const WHATSAPP_MESSAGE_KEYWORD = 'confirmer'; // To match the tipText
const POLLING_INTERVAL = 5000; // 5 seconds

const VerificationScreen = () => {
    const params = useLocalSearchParams<{ userId?: string; phoneNumber?: string }>();
    const { userId, phoneNumber } = params;
    const router = useRouter();
    const auth = useAuth(); // Use the hook, variable is now 'auth'

    const [isLoadingInitial, setIsLoadingInitial] = useState(true);
    const [isAwaitingWhatsApp, setIsAwaitingWhatsApp] = useState(false);
    const [statusMessage, setStatusMessage] = useState('Please confirm your number via WhatsApp.');

    const { width } = useWindowDimensions();
    const isWideScreen = width > 768;

    useEffect(() => {
        if (!userId) {
            Alert.alert('Error', 'User ID missing. Returning.');
            if (router.canGoBack()) router.back(); else router.replace('/auth/PhoneNumberScreen');
            return;
        }
        setIsLoadingInitial(false);

        const intervalId = setInterval(async () => {
            if (isAwaitingWhatsApp) { 
                console.log('Polling for verification status for userId:', userId);
                try {
                    const { data: userData, error } = await checkUserVerification(userId);
                    if (error) {
                        console.warn('Polling error:', error.message);
                        return;
                    }

                    if (userData && userData.is_verified && userData.auth_token) {
                        clearInterval(intervalId);
                        setIsAwaitingWhatsApp(false);
                        setStatusMessage('Number verified successfully!');
                        
                        localStorage.setItem('userToken', userData.auth_token);
                        localStorage.setItem('userId', userId);

                        if (auth && auth.signInUser) { 
                            auth.signInUser(userData);
                        } else {
                            console.warn('Auth object or signInUser method not available.');
                            Alert.alert('Login Error', 'Could not complete login process. Please restart the app.');
                        }
                        router.replace('/(tabs)' as any);
                    }
                } catch (e: any) {
                    console.warn('Exception during polling:', e.message);
                }
            }
        }, POLLING_INTERVAL);

        return () => clearInterval(intervalId);
    }, [userId, router, auth, isAwaitingWhatsApp]); // 'auth' is in dependency array

    const handleConfirmViaWhatsApp = async () => {
        if (!phoneNumber) {
            Alert.alert('Error', 'Phone number not available.');
            return;
        }
        // Construct the message text
        const messageText = `${WHATSAPP_MESSAGE_KEYWORD} ${phoneNumber}`;
        // URL-encode the message text
        const encodedMessageText = encodeURIComponent(messageText);
        // Construct the final URL
        const url = `https://wa.me/${WHATSAPP_RECIPIENT_NUMBER}?text=${encodedMessageText}`;
        
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
                setStatusMessage('Check WhatsApp to confirm. Then return to this screen.');
                setIsAwaitingWhatsApp(true); 
            } else {
                Alert.alert('Error', 'Cannot open WhatsApp. Is it installed?');
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to open WhatsApp.');
        }
    };

    if (isLoadingInitial) {
        return (
            <View style={styles.outerContainer}>
                <ActivityIndicator size="large" color={Colors.light.tint} />
                <Text style={[styles.statusText, isWideScreen && styles.statusTextWide]}>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={styles.outerContainer}>
            <View style={[styles.container, isWideScreen && styles.containerWide]}>
                <Text style={[styles.title, isWideScreen && styles.titleWide]}>Confirmer Votre Numero</Text>
                <Text style={[styles.statusText, isWideScreen && styles.statusTextWide]}>{statusMessage}</Text>
            
                {!isAwaitingWhatsApp && (
                    <View style={[styles.buttonContainer, isWideScreen && styles.buttonContainerWide]}>
                        <Button 
                            title="Open WhatsApp to Confirm"
                            onPress={handleConfirmViaWhatsApp} 
                            color={Colors.light.tint}
                        />
                    </View>
                )}

                {isAwaitingWhatsApp && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={Colors.light.tint} />
                        <Text style={[styles.loadingText, isWideScreen && styles.loadingTextWide]}>Waiting for your confirmation in WhatsApp...</Text>
                    </View>
                )}

                <View style={[styles.tipContainer, isWideScreen && styles.tipContainerWide]}>
                    <Text style={[styles.tipText, isWideScreen && styles.tipTextWide]}>
                        After sending "confirmer" on WhatsApp, please return to this page. Verification is automatic.
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    outerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    container: {
        width: '100%',
        maxWidth: 500,
        alignItems: 'center',
        padding: Platform.select({ web: 0, default: 0}),
    },
    containerWide: {
        padding: Platform.select({web: 40, default: 20}),
        backgroundColor: '#ffffff',
        borderRadius: Platform.select({web: 12, default: 0}),
        boxShadow: Platform.select({web: '0 4px 8px rgba(0,0,0,0.1)', default: undefined }) as any,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
    },
    titleWide: {
        fontSize: 28,
    },
    statusText: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 25,
        color: '#555',
        paddingHorizontal: 10,
    },
    statusTextWide: {
        fontSize: 17,
    },
    buttonContainer: {
        width: '90%',
        marginVertical: 20,
    },
    buttonContainerWide: {
        width: '80%',
        maxWidth: 350,
    },
    loadingContainer: {
        alignItems: 'center',
        marginVertical: 30,
    },
    loadingText: {
        marginTop: 15,
        fontSize: 14,
        color: '#555',
    },
    loadingTextWide: {
        fontSize: 16,
    },
    tipContainer: {
        marginTop: 25,
        paddingHorizontal: 15,
        width: '100%',
    },
    tipContainerWide: {
        marginTop: 40,
    },
    tipText: {
        fontSize: 12,
        textAlign: 'center',
        color: '#777',
        fontStyle: 'italic',
    },
    tipTextWide: {
        fontSize: 14,
    }
});

export default VerificationScreen; 