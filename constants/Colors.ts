/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

const koachPrimary = '#6E5F4E'; // Marron du bouton welcome
const koachBackground = '#FAF6EF'; // Beige/crème du fond welcome
const koachText = '#333'; // Texte standard (un peu plus foncé que welcome subtitle)
const koachMuted = '#A5998C'; // Version plus claire du marron pour icônes inactives
const white = '#fff';
const black = '#1C1C1E'; // Pour le mode sombre
const darkBackground = '#151718'; // Fond sombre existant
const darkText = '#ECEDEE'; // Texte clair existant

export const Colors = {
  light: {
    text: koachText,
    textPrimary: koachPrimary,
    background: koachBackground,
    tint: koachPrimary, // Couleur principale / accentuation
    icon: koachPrimary,
    card: white, // Fond des cartes (objectifs, messages koach)
    buttonText: white,
    tabIconDefault: koachMuted,
    tabIconSelected: koachPrimary,
    // Ajouter d'autres si nécessaire (ex: bordures...)
    borderColor: '#EAE0D5', // Bordure légère pour les cartes en mode clair
  },
  dark: {
    text: darkText,
    textPrimary: white, // Titres en blanc en mode sombre
    background: darkBackground,
    tint: white,
    icon: koachMuted, // Utiliser le gris clair pour icônes sombres
    card: black, // Fond des cartes en mode sombre
    buttonText: darkText,
    tabIconDefault: koachMuted,
    tabIconSelected: white,
    borderColor: '#333', // Bordure sombre
  },
};
