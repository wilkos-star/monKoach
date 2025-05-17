import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator, Linking, useWindowDimensions, Platform, Modal, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { checkUserVerification } from '../../lib/supabase'; // Adjust path as needed
import { useAuth } from '@/providers/AuthProvider'; // Corrected path
import { Colors } from '../../constants/Colors'; // Assuming you have this
import { useColorScheme } from '@/hooks/useColorScheme'; // Ensure this is imported

const VERIFICATION_WA_LINK = 'https://wa.me/22958082628?text=confirmer';
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
    const colorScheme = useColorScheme() ?? 'light'; // Define colorScheme here
    const styles = getThemedStyles(colorScheme, width); // Pass defined colorScheme and width

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalMessage, setModalMessage] = useState('');
    const [modalOkAction, setModalOkAction] = useState(() => () => {});

    // Helper to show modal
    const showModal = (title: string, message: string, onOkPress?: () => void) => {
        setModalTitle(title);
        setModalMessage(message);
        setModalOkAction(() => onOkPress ? () => { onOkPress(); setModalVisible(false); } : () => setModalVisible(false));
        setModalVisible(true);
    };

    useEffect(() => {
        if (!userId) {
            showModal('Error', 'User ID missing. Returning.', () => {
                if (router.canGoBack()) router.back(); else router.replace('/auth/PhoneNumberScreen');
            });
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
                            showModal('Login Error', 'Could not complete login process. Please restart the app.');
                        }
                        
                        // Check if additional info is needed before redirecting from VerificationScreen
                        if (userData.nom && userData.email) {
                            if (!modalVisible) { // Ensure modal isn't trying to show something else
                               router.replace('/(tabs)/chat'); 
                            }
                        } else {
                            if (!modalVisible) {
                                router.replace({
                                    pathname: '/auth/AdditionalInfoScreen',
                                    params: {
                                        userId: userId, // userId from VerificationScreen params
                                        authToken: userData.auth_token,
                                        phoneNumber: phoneNumber, // phoneNumber from VerificationScreen params
                                        currentNom: userData.nom || '',
                                        // Add currentEmail if AdditionalInfoScreen uses it, otherwise it's optional
                                        // currentEmail: userData.email || '' 
                                    }
                                });
                            }
                        }
                    }
                } catch (e: any) {
                    console.warn('Exception during polling:', e.message);
                }
            }
        }, POLLING_INTERVAL);

        return () => clearInterval(intervalId);
    }, [userId, router, auth, isAwaitingWhatsApp, modalVisible]);

    const handleConfirmViaWhatsApp = async () => {
        // The phoneNumber prop is for the user being verified, not the target of the WhatsApp message.
        // The link is fixed to VERIFICATION_WA_LINK.
        const url = VERIFICATION_WA_LINK;
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
                setStatusMessage('Check WhatsApp to confirm. Then return to this screen.');
                setIsAwaitingWhatsApp(true); 
            } else {
                showModal('Error', 'Cannot open WhatsApp. Is it installed?');
            }
        } catch (err) {
            showModal('Error', 'Failed to open WhatsApp.');
        }
    };

    if (isLoadingInitial) {
        return (
            <View style={styles.outerContainer}>
                <ActivityIndicator size="large" color={styles.tintColor.color} />
                <Text style={[styles.statusText, isWideScreen && styles.statusTextWide]}>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={styles.outerContainer}>
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    setModalVisible(false);
                }}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitleText}>{modalTitle}</Text>
                        <Text style={styles.modalMessageText}>{modalMessage}</Text>
                        <Pressable
                            style={[styles.modalButton, styles.buttonConfirm]}
                            onPress={modalOkAction} 
                        >
                            <Text style={styles.modalButtonText}>OK</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>

            <View style={[styles.container, isWideScreen && styles.containerWide]}>
                <Text style={[styles.title, isWideScreen && styles.titleWide]}>Confirmer Votre Numero</Text>
                <Text style={[styles.statusText, isWideScreen && styles.statusTextWide]}>{statusMessage}</Text>
            
                {!isAwaitingWhatsApp && (
                    <View style={[styles.buttonContainer, isWideScreen && styles.buttonContainerWide]}>
                        <Button 
                            title="Open WhatsApp to Confirm"
                            onPress={handleConfirmViaWhatsApp} 
                            color={styles.tintColor.color}
                        />
                    </View>
                )}

                {isAwaitingWhatsApp && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={styles.tintColor.color} />
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

// Renamed to avoid conflict if this file defines its own `getStyles` for other purposes
const getThemedStyles = (scheme: 'light' | 'dark', screenWidth: number) => { 
    const colors = Colors[scheme]; // Use the passed scheme to get colors
    const isWideScreen = screenWidth > 768;

    return StyleSheet.create({
        outerContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
            backgroundColor: colors.background,
        },
        container: {
            width: '100%',
            maxWidth: 500,
            alignItems: 'center',
            padding: Platform.select({ web: 0, default: 0}),
        },
        containerWide: {
            padding: Platform.select({web: 40, default: 20}),
            backgroundColor: colors.card,
            borderRadius: Platform.select({web: 12, default: 0}),
            boxShadow: Platform.select({web: '0 4px 8px rgba(0,0,0,0.1)', default: undefined }) as any,
        },
        title: {
            fontSize: isWideScreen ? 28 : 20, // Adjusted for consistency
            fontWeight: 'bold',
            marginBottom: 20,
            textAlign: 'center',
            color: colors.text,
        },
        titleWide: {
            fontSize: 28, // This was already here, kept for explicit wide screen
        },
        statusText: {
            fontSize: isWideScreen ? 17 : 14,
            textAlign: 'center',
            marginBottom: 25,
            color: colors.text,
            paddingHorizontal: 10,
        },
        statusTextWide: {
            fontSize: 17, // Kept for explicit wide screen
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
            fontSize: isWideScreen ? 16 : 14,
            color: colors.text,
        },
        loadingTextWide: {
            fontSize: 16, // Kept for explicit wide screen
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
            fontSize: isWideScreen ? 14 : 12,
            textAlign: 'center',
            color: '#777', // Could be themed: colors.textSecondary or similar
            fontStyle: 'italic',
        },
        tipTextWide: {
            fontSize: 14, // Kept for explicit wide screen
        },
        tintColor: { // Used for ActivityIndicator and Button color
            color: colors.tint 
        },
        // Modal Styles
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
            color: colors.textPrimary, // Use themed primary text color
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
            color: colors.buttonText, // Use themed button text color
            fontWeight: 'bold',
            textAlign: 'center',
            fontSize: isWideScreen ? 16 : 15,
        },
    });
};

export default VerificationScreen; 