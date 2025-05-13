import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const CustomInstallPrompt: React.FC = () => {
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return; // This feature is web-only
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPromptEvent(event as BeforeInstallPromptEvent);
      setShowInstallButton(true);
      console.log('beforeinstallprompt event fired and captured.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPromptEvent) {
      console.log('Install prompt event not available.');
      return;
    }
    try {
      await installPromptEvent.prompt();
      console.log('Install prompt shown to user.');
      const { outcome } = await installPromptEvent.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      if (outcome === 'accepted') {
        console.log('User accepted the A2HS prompt');
      } else {
        console.log('User dismissed the A2HS prompt');
      }
    } catch (error) {
      console.error('Error during install prompt:', error);
    } finally {
      setInstallPromptEvent(null);
      setShowInstallButton(false);
    }
  };

  if (!showInstallButton || Platform.OS !== 'web') {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.promptBox}>
        <Text style={styles.title}>Installer MonKoach</Text>
        <Text style={styles.description}>
          Ajoutez MonKoach à votre écran d'accueil pour un accès rapide et une meilleure expérience !
        </Text>
        <Pressable onPress={handleInstallClick} style={styles.installButton}>
          <Text style={styles.buttonText}>Installer</Text>
        </Pressable>
        <Pressable onPress={() => setShowInstallButton(false)} style={styles.dismissButton}>
          <Text style={styles.dismissButtonText}>Plus tard</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute' as 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    alignItems: 'center' as 'center',
    zIndex: 1000, // Ensure it's on top
  },
  promptBox: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center' as 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold' as 'bold',
    marginBottom: 8,
    color: '#333',
  },
  description: {
    fontSize: 14,
    textAlign: 'center' as 'center',
    marginBottom: 16,
    color: '#555',
  },
  installButton: {
    backgroundColor: '#007AFF', // Un bleu standard
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 8,
    width: '80%',
    alignItems: 'center' as 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold' as 'bold',
  },
  dismissButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  dismissButtonText: {
    color: '#007AFF',
    fontSize: 14,
  }
});

export default CustomInstallPrompt; 