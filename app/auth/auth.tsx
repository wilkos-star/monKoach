import React, { useState } from 'react';
import {
  View, Text, TextInput, Image, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Platform, useWindowDimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useAuth } from '@/providers/AuthProvider';
import { resetPassword, supabase } from '@/lib/supabase';

// Ton logo
const logo = require('@/assets/images/logo.png');

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const { loading } = useAuth();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWideScreen = width > 768;

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedFullName = fullName.trim();

    if (!trimmedEmail || !trimmedPassword || (!isLogin && (!confirmPassword.trim() || !trimmedFullName))) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Veuillez remplir tous les champs.' });
      return;
    }

    if (!isLogin && trimmedPassword.length < 6) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Le mot de passe doit contenir au moins 6 caractères.' });
      return;
    }
    if (!isLogin && trimmedPassword !== confirmPassword.trim()) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Les mots de passe ne correspondent pas.' });
      return;
    }

    setSubmitLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password: trimmedPassword });
        if (error) throw error;
        router.replace('/(tabs)/chat');
      } else {
        const { error } = await supabase.auth.signUp({ 
            email: trimmedEmail, 
            password: trimmedPassword, 
            options: { 
                data: { 
                    full_name: trimmedFullName
                } 
            }
        });
        if (error) throw error;
        Toast.show({
          type: 'success',
          text1: 'Inscription réussie',
          text2: 'Veuillez vérifier votre email de confirmation.',
        });
        setIsLogin(true);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setFullName('');
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.message || 'Une erreur est survenue',
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Mot de passe oublié',
        'Entrez votre adresse email pour recevoir les instructions de réinitialisation.',
        async (email) => {
          if (email && email.trim()) {
            setResetLoading(true);
            const { error } = await resetPassword(email.trim());
            setResetLoading(false);
            if (error) {
              Toast.show({ type: 'error', text1: 'Erreur', text2: error.message });
            } else {
              Toast.show({ 
                type: 'success', 
                text1: 'Email envoyé', 
                text2: 'Si votre compte existe, vous recevrez un email.' 
              });
            }
          }
        },
        'plain-text'
      );
    } else {
      Alert.alert(
        'Mot de passe oublié',
        'Fonctionnalité de réinitialisation à venir. Pour l\'instant, veuillez contacter le support si besoin.',
        [{ text: 'OK' }]
      );
    }
  };

  const isLoading = loading || submitLoading || resetLoading;

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FAF6EF',
      alignItems: 'center',
      padding: 20,
      justifyContent: 'center',
    },
    contentWrapper: {
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        padding: isWideScreen ? 40 : 20,
        backgroundColor: Platform.OS === 'web' ? '#FFFFFF' : 'transparent',
        borderRadius: Platform.OS === 'web' ? 12 : 0,
        boxShadow: Platform.OS === 'web' ? '0 4px 12px rgba(0,0,0,0.1)' : undefined,
    },
    logo: {
      width: isWideScreen ? 150 : 120,
      height: isWideScreen ? 150 : 120,
      marginBottom: isWideScreen ? 30 : 24,
    },
    switchContainer: {
      flexDirection: 'row',
      marginBottom: isWideScreen ? 30 : 24,
      width: '100%',
    },
    input: {
      width: '100%',
      height: isWideScreen ? 55 : 50,
      fontSize: isWideScreen ? 17 : 16,
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      paddingHorizontal: 15,
      marginBottom: isWideScreen ? 18 : 15,
      backgroundColor: '#fff',
    },
    button: {
      width: '100%',
      backgroundColor: '#6E5F4E',
      height: isWideScreen ? 55 : 50,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: isWideScreen ? 15 : 10,
    },
    buttonText: {
      color: '#fff',
      fontSize: isWideScreen ? 18 : 16,
      fontWeight: 'bold',
    },
    forgotPasswordButton: {
      alignSelf: 'flex-end',
      marginBottom: isWideScreen ? 18 : 15,
      marginTop: -5,
    },
    forgotPasswordText: {
      color: '#6E5F4E',
      fontSize: isWideScreen ? 15 : 14,
      textDecorationLine: 'underline',
    },
  });

  if (isLoading) {
    return (
      <View style={dynamicStyles.container}>
        <ActivityIndicator size="large" color="#6E5F4E" />
      </View>
    );
  }

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.contentWrapper}>
          <Image source={logo} style={dynamicStyles.logo} />

          <View style={dynamicStyles.switchContainer}>
            <TouchableOpacity
              style={[styles.switchButton, isLogin && styles.activeSwitchButton]}
              onPress={() => { setIsLogin(true); setFullName(''); }}>
              <Text style={[styles.switchText, isLogin && styles.activeSwitchText]}>Connexion</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.switchButton, !isLogin && styles.activeSwitchButton]}
              onPress={() => setIsLogin(false)}>
              <Text style={[styles.switchText, !isLogin && styles.activeSwitchText]}>Inscription</Text>
            </TouchableOpacity>
          </View>

          {!isLogin && (
            <TextInput
              style={dynamicStyles.input}
              placeholder="Nom complet"
              autoCapitalize="words"
              value={fullName}
              onChangeText={setFullName}
            />
          )}
          <TextInput
            style={dynamicStyles.input}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={dynamicStyles.input}
            placeholder="Mot de passe"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          {isLogin && (
            <TouchableOpacity onPress={handlePasswordReset} style={dynamicStyles.forgotPasswordButton}>
              <Text style={dynamicStyles.forgotPasswordText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>
          )}
          {!isLogin && (
            <TextInput
              style={dynamicStyles.input}
              placeholder="Confirmer le mot de passe"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          )}

          <TouchableOpacity
            style={dynamicStyles.button}
            onPress={handleSubmit}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={dynamicStyles.buttonText}>
                {isLogin ? 'Se connecter' : "S'inscrire"}
              </Text>
            )}
          </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  switchButton: {
    flex: 1,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  activeSwitchButton: {
    borderColor: '#6E5F4E',
  },
  switchText: {
    fontSize: 16,
    color: '#555',
  },
  activeSwitchText: {
    color: '#6E5F4E',
    fontWeight: 'bold',
  },
});
