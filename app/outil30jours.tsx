import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  useWindowDimensions,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, Briefcase, PlusCircle } from 'lucide-react-native';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

// Import des SVGs
import AsanaLogo from '@/assets/svgs/tools/asana.svg';
import CanvaLogo from '@/assets/svgs/tools/canva.svg';
import ChatGptLogo from '@/assets/svgs/tools/chatgpt.svg';
import ClaudeAiLogo from '@/assets/svgs/tools/claude_ai.svg';
import ClickupLogo from '@/assets/svgs/tools/clickup.svg';
import DeepseekLogo from '@/assets/svgs/tools/deepseek.svg';
import GoogleGeminiLogo from '@/assets/svgs/tools/google_gemini.svg';
import GoogleSheetsLogo from '@/assets/svgs/tools/google_sheets.svg';
import MicrosoftCopilotLogo from '@/assets/svgs/tools/microsoft_copilot.svg';
import MicrosoftExcelLogo from '@/assets/svgs/tools/microsoft_excel.svg';
import MidjourneyLogo from '@/assets/svgs/tools/midjourney.svg';
import N8nLogo from '@/assets/svgs/tools/n8n.svg';
import NotionLogo from '@/assets/svgs/tools/notion.svg';
import PerplexityAiLogo from '@/assets/svgs/tools/perplexity_ai.svg';
import ZoomLogo from '@/assets/svgs/tools/zoom.svg';

interface ToolDefinition {
  name: string;
  logo?: React.ElementType;
}

const featuredTools: ToolDefinition[] = [
  { name: 'Asana', logo: AsanaLogo },
  { name: 'Canva', logo: CanvaLogo },
  { name: 'ChatGPT', logo: ChatGptLogo },
  { name: 'Claude AI', logo: ClaudeAiLogo },
  { name: 'ClickUp', logo: ClickupLogo },
  { name: 'DeepSeek', logo: DeepseekLogo },
  { name: 'Google Gemini', logo: GoogleGeminiLogo },
  { name: 'Google Sheets', logo: GoogleSheetsLogo },
  { name: 'Microsoft Copilot', logo: MicrosoftCopilotLogo },
  { name: 'Microsoft Excel', logo: MicrosoftExcelLogo },
  { name: 'Midjourney', logo: MidjourneyLogo },
  { name: 'n8n', logo: N8nLogo },
  { name: 'Notion', logo: NotionLogo },
  { name: 'Perplexity AI', logo: PerplexityAiLogo },
  { name: 'Zoom', logo: ZoomLogo },
].sort((a, b) => a.name.localeCompare(b.name));

export default function Outil30JoursScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const { width } = useWindowDimensions();
  const styles = getStyles(colorScheme, width);

  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToolSelect = (toolName: string) => {
    setIsSubmitting(true);
    const messagePrefill = `Je veux apprendre l'outil ${toolName}`;
    setTimeout(() => {
        router.push({ pathname: '/(tabs)/chat', params: { prefill: messagePrefill } });
        setIsSubmitting(false);
        setSearchTerm('');
    }, 300);
  };

  const filteredTools = useMemo(() => {
    if (searchTerm.trim() === '') {
      return featuredTools;
    }
    return featuredTools.filter(tool =>
      tool.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const showAddToolOption = searchTerm.trim() !== '' && filteredTools.length === 0;

  if (isSubmitting) {
    return (
      <ThemedView style={[styles.container, styles.centeredLoader]}>
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
        <ThemedText style={{marginTop: 10}}>Préparation du chat...</ThemedText>
      </ThemedView>
    )
  }

  const renderToolGridItem = (tool: ToolDefinition, index: number, type: 'featured' | 'filtered') => {
    const IconComponent = tool.logo || Briefcase;
    const hasActualLogo = !!tool.logo;
    return (
      <TouchableOpacity
        key={`${type}-${tool.name}-${index}`}
        style={styles.gridItem}
        onPress={() => handleToolSelect(tool.name)}
        disabled={isSubmitting}
      >
        <View style={[styles.gridItemLogoContainer, !hasActualLogo && styles.defaultLogoBackground]}>
          <IconComponent 
            width={hasActualLogo ? (tool.name === 'Canva' ? 56 : 48) : 36}
            height={hasActualLogo ? (tool.name === 'Canva' ? 56 : 48) : 36} 
            color={hasActualLogo ? undefined : Colors[colorScheme].tint} 
          />
        </View>
        <ThemedText style={styles.gridItemText} numberOfLines={2}>{tool.name}</ThemedText>
      </TouchableOpacity>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} disabled={isSubmitting}>
          <ArrowLeft size={24} color={Colors[colorScheme].text} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.pageTitle}>1 Outil 30 Jours</ThemedText>
        <View style={{width: 24}} /> 
      </View>

      <View style={styles.fixedTopContent}>
        <ThemedText style={styles.introText}>
          Quel outil souhaitez-vous explorer aujourd'hui ?
        </ThemedText>
        <View style={styles.searchContainer}>
          <Search size={20} color={Colors[colorScheme].icon} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un outil..."
            placeholderTextColor={Colors[colorScheme].tabIconDefault}
            value={searchTerm}
            onChangeText={setSearchTerm}
            clearButtonMode="while-editing"
            autoFocus={Platform.OS !== 'web'}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollViewContent} keyboardShouldPersistTaps="handled">
        {showAddToolOption && (
          <TouchableOpacity
            style={styles.addToolButton}
            onPress={() => handleToolSelect(searchTerm.trim())}
            disabled={isSubmitting}
          >
            <PlusCircle size={22} color={Colors[colorScheme].buttonText} style={{marginRight: 10}}/>
            <Text style={styles.addToolButtonText}>Apprendre "{searchTerm.trim()}" avec Koach</Text>
          </TouchableOpacity>
        )}

        {!showAddToolOption && filteredTools.length === 0 && searchTerm.trim() !== '' && (
             <ThemedText style={styles.noResultsText}>Aucun outil trouvé pour "{searchTerm.trim()}".</ThemedText>
        )}
        
        <View style={styles.gridContainer}>
          {filteredTools.map((tool, index) => renderToolGridItem(tool, index, searchTerm.trim() === '' ? 'featured' : 'filtered'))}
        </View>

      </ScrollView>
    </ThemedView>
  );
}

const getStyles = (scheme: 'light' | 'dark', screenWidth: number) => {
  const colors = Colors[scheme];
  const isWideScreen = screenWidth > 768;
  const numColumns = isWideScreen ? 4 : (screenWidth > 480 ? 3 : 2);
  const itemMarginBase = isWideScreen ? 15 : 12;
  const gridPadding = itemMarginBase;
  const totalHorizontalPadding = gridPadding * 2;
  const totalHorizontalSpacingBetweenItems = itemMarginBase * (numColumns - 1);
  const availableWidthForItems = screenWidth - totalHorizontalPadding - totalHorizontalSpacingBetweenItems;
  const itemWidth = availableWidthForItems / numColumns;

  return StyleSheet.create({
    container: {
      flex: 1,
    },
    centeredLoader: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 15,
      paddingTop: Platform.OS === 'ios' ? 50 : 40, 
      paddingBottom: 15,
      backgroundColor: colors.card, 
      borderBottomWidth: 1,
      borderBottomColor: colors.borderColor,
      elevation: 2,
      zIndex: 10,
    },
    fixedTopContent: {
        paddingHorizontal: gridPadding,
        paddingTop: 15,
        paddingBottom: 10,
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderColor,
    },
    backButton: {
      padding: 8,
      borderRadius: 20,
    },
    pageTitle: {
      fontSize: isWideScreen ? 22 : 20,
      fontWeight: 'bold',
    },
    scrollViewContent: {
      paddingBottom: 40,
      paddingHorizontal: gridPadding,
    },
    introText: {
      fontSize: isWideScreen ? 17 : 15,
      textAlign: 'center',
      marginBottom: 15,
      color: colors.text,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingHorizontal: 15,
      borderWidth: 1,
      borderColor: colors.borderColor,
      elevation: 1,
    },
    searchIcon: {
      marginRight: 10,
    },
    searchInput: {
      flex: 1,
      height: 50,
      fontSize: isWideScreen ? 17 : 16,
      color: colors.text,
    },
    addToolButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.tint,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginBottom: 20,
        elevation: 2,
    },
    addToolButtonText: {
        fontSize: isWideScreen ? 16 : 15,
        color: colors.buttonText,
        fontWeight: '600',
        textAlign: 'center',
    },
    noResultsText: {
        textAlign: 'center',
        marginVertical: 20,
        fontSize: isWideScreen ? 16 : 15,
        color: colors.text,
    },
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-around',
    },
    gridItem: {
      width: itemWidth,
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingVertical: isWideScreen ? 20 : 15,
      paddingHorizontal: isWideScreen ? 10 : 8, 
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: itemMarginBase,
      borderWidth: 1,
      borderColor: colors.borderColor,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
      minHeight: itemWidth * 1.3,
    },
    gridItemLogoContainer: {
        width: itemWidth * 0.7,
        height: itemWidth * 0.7,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10, 
        borderRadius: 8, 
    },
    defaultLogoBackground: {
        backgroundColor: colors.background,
        padding: 10,
        borderRadius: 12,
    },
    gridItemText: {
      fontSize: isWideScreen ? 15 : 13,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
      marginTop: 5,
    },
  });
}; 