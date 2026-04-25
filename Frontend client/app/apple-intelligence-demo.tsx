import React, { useState } from 'react';
import { View, StyleSheet, TextInput, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdaptiveCard } from '@/components/ui/AdaptiveCard';
import { AdaptiveText } from '@/components/ui/AdaptiveText';
import { AdaptiveButton } from '@/components/ui/AdaptiveButton';
import { useTheme } from '@/contexts/ThemeContext';

// Import conditionnel pour éviter les erreurs dans Expo Go
let foundationModels: any = null;
if (Platform.OS === 'ios') {
  try {
    const appleAI = require('@react-native-ai/apple');
    foundationModels = appleAI.foundationModels;
  } catch (error) {
    console.log('Apple Intelligence non disponible dans Expo Go');
  }
}

export default function AppleIntelligenceDemo() {
  const { colors } = useTheme();
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const generateText = async () => {
    if (!prompt.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une question ou une demande');
      return;
    }

    setIsLoading(true);
    setResponse('');

    try {
      if (!foundationModels) {
        throw new Error('Apple Intelligence nécessite un development build iOS');
      }

      const result = await foundationModels.generateText([
        { role: 'user', content: prompt }
      ]);
      
      setResponse(result);
    } catch (error) {
      console.error('Apple Intelligence Error:', error);
      Alert.alert(
        'Information', 
        'Apple Intelligence nécessite iOS 18+ avec un development build. Sur Expo Go, utilisez un build de développement pour tester.'
      );
      setResponse('Apple Intelligence disponible uniquement avec un development build iOS 18+.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateStream = async () => {
    if (!prompt.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une question ou une demande');
      return;
    }

    setIsLoading(true);
    setResponse('');

    try {
      if (!foundationModels) {
        throw new Error('Apple Intelligence nécessite un development build iOS');
      }

      const stream = foundationModels.generateStream([
        { role: 'user', content: prompt }
      ]);

      let fullResponse = '';
      for await (const chunk of stream) {
        if (chunk.type === 'text-delta') {
          fullResponse += chunk.textDelta;
          setResponse(fullResponse);
        }
      }
    } catch (error) {
      console.error('Apple Intelligence Stream Error:', error);
      Alert.alert(
        'Information', 
        'Le streaming nécessite iOS 18+ avec un development build.'
      );
      setResponse('Streaming disponible uniquement avec development build iOS 18+.');
    } finally {
      setIsLoading(false);
    }
  };

  const predefinedPrompts = [
    {
      title: '📝 Résumé de transaction',
      prompt: 'Résume les avantages de Mossombi pour les transactions mobiles en Afrique'
    },
    {
      title: '💡 Idée de fonctionnalité',
      prompt: 'Suggère une nouvelle fonctionnalité innovante pour une application de paiement mobile'
    },
    {
      title: '🎯 Marketing',
      prompt: 'Écris un court message marketing pour promouvoir l\'application Mossombi'
    },
    {
      title: '📊 Analyse',
      prompt: 'Analyse les tendances du marché des paiements mobiles en Afrique Centrale'
    }
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <AdaptiveText variant="display" style={styles.title}>
            🧠 Apple Intelligence
          </AdaptiveText>
          <AdaptiveText variant="body" color={colors.textSecondary} style={styles.subtitle}>
            IA on-device privée et sécurisée (iOS 18+)
          </AdaptiveText>
        </View>

        {/* Info Card */}
        <AdaptiveCard margin={16}>
          <AdaptiveText variant="title" style={styles.cardTitle}>
            🍎 Fonctionnalités iOS 18
          </AdaptiveText>
          <AdaptiveText variant="body" color={colors.textSecondary}>
            Apple Intelligence nécessite un development build iOS 18+
          </AdaptiveText>
          <AdaptiveText variant="body" color={colors.textSecondary}>
            • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •
          </AdaptiveText>
          <AdaptiveText variant="caption" color={colors.textTertiary} style={styles.note}>
            {foundationModels ? 
              "Apple Intelligence disponible" : 
              "Utilisez 'eas build --platform ios --profile development' pour tester"
            }
          </AdaptiveText>
        </AdaptiveCard>

        {/* Predefined Prompts */}
        <View style={styles.section}>
          <AdaptiveText variant="headline" style={styles.sectionTitle}>
            💬 Prompts Suggérés
          </AdaptiveText>
          
          {predefinedPrompts.map((item, index) => (
            <AdaptiveCard 
              key={index} 
              margin={16} 
              variant="outlined"
              onPress={() => setPrompt(item.prompt)}
            >
              <AdaptiveText variant="title">{item.title}</AdaptiveText>
              <AdaptiveText variant="caption" color={colors.textSecondary}>
                {item.prompt}
              </AdaptiveText>
            </AdaptiveCard>
          ))}
        </View>

        {/* Input Section */}
        <View style={styles.section}>
          <AdaptiveText variant="headline" style={styles.sectionTitle}>
            ✍️ Votre Question
          </AdaptiveText>
          
          <AdaptiveCard margin={16}>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: colors.outline 
              }]}
              placeholder="Entrez votre question ou demande..."
              placeholderTextColor={colors.textSecondary}
              value={prompt}
              onChangeText={setPrompt}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </AdaptiveCard>

          <View style={styles.buttonRow}>
            <AdaptiveButton 
              variant="primary" 
              onPress={generateText}
              loading={isLoading}
              style={styles.button}
            >
              Générer
            </AdaptiveButton>
            <AdaptiveButton 
              variant="secondary" 
              onPress={generateStream}
              loading={isLoading}
              style={styles.button}
            >
              Streaming
            </AdaptiveButton>
          </View>
        </View>

        {/* Response Section */}
        {response ? (
          <View style={styles.section}>
            <AdaptiveText variant="headline" style={styles.sectionTitle}>
              🤖 Réponse IA
            </AdaptiveText>
            
            <AdaptiveCard margin={16}>
              <AdaptiveText variant="body" style={styles.response}>
                {response}
              </AdaptiveText>
            </AdaptiveCard>
          </View>
        ) : null}

        {/* Android Alternative */}
        <AdaptiveCard margin={16} variant="tonal">
          <AdaptiveText variant="title" style={styles.cardTitle}>
            🤖 Alternative Android
          </AdaptiveText>
          <AdaptiveText variant="body" color={colors.textSecondary}>
            Pour Android, nous pouvons intégrer :
            • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •
          </AdaptiveText>
          <AdaptiveButton variant="surface" size="sm" style={styles.androidButton}>
            Configurer IA Android
          </AdaptiveButton>
        </AdaptiveCard>

        {/* Footer */}
        <View style={styles.footer}>
          <AdaptiveText variant="caption" color={colors.textTertiary} style={styles.footerText}>
            Mossombi © 2025 - Intelligence Artificielle Intégrée
          </AdaptiveText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 16,
    marginHorizontal: 16,
  },
  cardTitle: {
    marginBottom: 12,
  },
  note: {
    marginTop: 12,
    fontStyle: 'italic',
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 100,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginTop: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
  response: {
    lineHeight: 24,
  },
  androidButton: {
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    textAlign: 'center',
  },
});
