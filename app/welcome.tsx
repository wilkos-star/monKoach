import { Image, StyleSheet, Platform, View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';

export default function WelcomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWideScreen = width > 768;

  return (
    <View style={styles.outerContainer}>
      <View style={[styles.container, isWideScreen && styles.containerWide]}>
        <Text style={[styles.appTitle, isWideScreen && styles.appTitleWide]}>MON KOACH</Text>

        <Image
          source={require('@/assets/images/logo.png')}
          style={[styles.logo, isWideScreen && styles.logoWide]}
          resizeMode="contain"
        />

        <Text style={[styles.title, isWideScreen && styles.titleWide]}>Deviens la meilleure version de toi-même !</Text>
        <Text style={[styles.subtitle, isWideScreen && styles.subtitleWide]}>
          Un assistant IA pour t'accompagner pas à pas, avec un plan sur-mesure et un vrai suivi dans l'acquisition de tes compétences
        </Text>

        <TouchableOpacity style={styles.button} onPress={() => router.push('/auth/EmailAuthScreen' as any)}>
          <Text style={styles.buttonText}>Commencer avec mon koach</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF6EF',
    padding: 20, 
  },
  container: { 
    width: '100%',
    maxWidth: 500, // Max width for content on larger screens
    alignItems: 'center', // Center content within the card
  },
  containerWide: {
    padding: Platform.select({ web: 40, default: 20 }), // More padding on web
    backgroundColor: Platform.select({ web: '#FFFFFF', default: '#FAF6EF' }), // Card background on web
    borderRadius: Platform.select({ web: 12, default: 0 }),
    boxShadow: Platform.select({ web: '0 6px 12px rgba(0,0,0,0.1)', default: undefined }) as any,
  },
  appTitle: {
    fontSize: 28, // Base size
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#6E5F4E',
  },
  appTitleWide: {
    fontSize: 40,
    marginBottom: 15,
  },
  logo: {
    width: 200, // Base size
    height: 200, // Base size
    alignSelf: 'center',
    marginBottom: 20, // Base margin
  },
  logoWide: {
    width: 250, // Adjusted size for wide
    height: 250, // Adjusted size for wide
    marginBottom: 30,
  },
  title: { 
    fontSize: 20, // Base size 
    fontWeight: 'bold', 
    marginBottom: 12, // Base margin
    textAlign: 'center' 
  },
  titleWide: {
    fontSize: 28,
    marginBottom: 20,
  },
  subtitle: { 
    fontSize: 14, // Base size
    marginBottom: 28, // Base margin
    color: '#555', 
    textAlign: 'center', 
    paddingHorizontal: 10, // Add some horizontal padding for better text flow on narrow screens
  },
  subtitleWide: {
    fontSize: 17,
    marginBottom: 40,
    paddingHorizontal: 0, // Reset padding if containerWide has enough
  },
  button: {
    backgroundColor: '#6E5F4E',
    paddingVertical: 12, // Base padding
    paddingHorizontal: 20, // Base padding
    borderRadius: 10, // Base radius
    alignItems: 'center',
    marginBottom: 12,
    width: '100%', // Make button take width of its container (which has maxWidth)
  },
  buttonWide: {
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 12,
    maxWidth: 350, // Max width for the button on wide screens
    alignSelf: 'center',
  },
  buttonText: { 
    color: 'white', 
    fontWeight: 'bold', 
    fontSize: 16 // Base size
  },
  buttonTextWide: {
    fontSize: 18,
  }
});