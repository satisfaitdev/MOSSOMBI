import React, { useState } from 'react';
import { ScrollView, View, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Send, Bot, User as UserIcon } from 'lucide-react-native';
import HeaderWithBackButton from '@/components/HeaderWithBackButton';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '@/constants/colors';
import { Body, Caption } from '@/components/atoms';
import { Stack, Row } from '@/components/ui';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
}

// Fonction pour générer des réponses automatiques intelligentes
const getAutomaticResponse = (userMessage: string): string => {
  const message = userMessage.toLowerCase();
  
  // Réponses pour les problèmes de compte
  if (message.includes('compte') && (message.includes('supprimé') || message.includes('désactivé') || message.includes('bloqué'))) {
    return '🔒 Je vois que vous avez un problème avec votre compte. Si votre compte a été supprimé par erreur, contactez-nous au +242 06 694 42 00 ou par email à support@mossombi.com avec vos informations.';
  }
  
  // Réponses pour les problèmes de connexion
  if (message.includes('connexion') || message.includes('connecter') || message.includes('login')) {
    return '🔑 Pour les problèmes de connexion, vérifiez votre numéro de téléphone et mot de passe. Si le problème persiste, essayez de réinitialiser votre mot de passe.';
  }
  
  // Réponses pour les problèmes de paiement/portefeuille
  if (message.includes('paiement') || message.includes('portefeuille') || message.includes('wallet') || message.includes('argent')) {
    return '💰 Pour les questions liées aux paiements et au portefeuille, allez dans l\'onglet Wallet de l\'app. Si vous avez des problèmes, contactez notre support au +242 06 694 42 00.';
  }
  
  // Réponses pour WhatsApp/OTP
  if (message.includes('otp') || message.includes('code') || message.includes('whatsapp') || message.includes('sms')) {
    return '📱 Si vous ne recevez pas votre code OTP, vérifiez que votre numéro WhatsApp est correct et que vous avez une connexion internet. Le code arrive généralement en quelques secondes.';
  }
  
  // Réponses pour les salutations
  if (message.includes('bonjour') || message.includes('salut') || message.includes('hello') || message.includes('bonsoir')) {
    return '👋 Bonjour ! Je suis ravi de vous aider. Décrivez-moi votre problème et je ferai de mon mieux pour vous orienter vers la bonne solution.';
  }
  
  // Réponses pour les remerciements
  if (message.includes('merci') || message.includes('thanks')) {
    return '😊 Je vous en prie ! N\'hésitez pas si vous avez d\'autres questions. Notre équipe est là pour vous aider 24h/24.';
  }
  
  // Réponse par défaut
  return '🤖 Merci pour votre message ! Pour une assistance personnalisée, vous pouvez :\n\n📞 Nous appeler : +242 06 694 42 00\n📧 Nous écrire : support@mossombi.com\n\nUn agent vous répondra rapidement ! 😊';
};

export default function ChatScreen() {
  const { colors } = useTheme();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Bonjour ! 👋 Je suis votre assistant virtuel Mossombi. Comment puis-je vous aider aujourd\'hui ?',
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const handleSend = () => {
    if (message.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: message,
        sender: 'user',
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages([...messages, newMessage]);
      setMessage('');

      // Réponse automatique intelligente du bot après 1 seconde
      setTimeout(() => {
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: getAutomaticResponse(message),
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, botResponse]);
      }, 1000);
    }
  };

  return (
    <>
      <HeaderWithBackButton title="Chat en direct" />
      <KeyboardAvoidingView 
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xl }}
        >
          <Stack spacing="md">
            {messages.map((msg) => (
              <View
                key={msg.id}
                style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                }}
              >
                {msg.sender === 'user' ? (
                  <LinearGradient
                    colors={[colors.gradient.start, colors.gradient.middle, colors.gradient.end]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      borderRadius: BORDER_RADIUS.lg,
                      padding: SPACING.md,
                      ...SHADOWS.sm,
                    }}
                  >
                    <Row spacing="xs" align="center" style={{ marginBottom: SPACING.xs }}>
                      <UserIcon size={16} color="#FFFFFF" />
                      <Caption style={{ color: '#FFFFFF' }}>Vous</Caption>
                    </Row>
                    <Body style={{ color: '#FFFFFF' }}>{msg.text}</Body>
                    <Caption
                      style={{
                        color: 'rgba(255,255,255,0.7)',
                        marginTop: SPACING.xs,
                        textAlign: 'right',
                      }}
                    >
                      {msg.timestamp}
                    </Caption>
                  </LinearGradient>
                ) : (
                  <View
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: BORDER_RADIUS.lg,
                      padding: SPACING.md,
                      borderWidth: 1,
                      borderColor: colors.border,
                      ...SHADOWS.sm,
                    }}
                  >
                    <Row spacing="xs" align="center" style={{ marginBottom: SPACING.xs }}>
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: BORDER_RADIUS.full,
                          overflow: 'hidden',
                        }}
                      >
                        <LinearGradient
                          colors={[colors.gradient.start, colors.gradient.middle, colors.gradient.end]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{
                            width: '100%',
                            height: '100%',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Bot size={12} color="#FFFFFF" />
                        </LinearGradient>
                      </View>
                      <Caption style={{ color: colors.textSecondary }}>Assistant</Caption>
                    </Row>
                    <Body style={{ color: colors.text }}>{msg.text}</Body>
                    <Caption
                      style={{
                        color: colors.textTertiary,
                        marginTop: SPACING.xs,
                        textAlign: 'right',
                      }}
                    >
                      {msg.timestamp}
                    </Caption>
                  </View>
                )}
              </View>
            ))}
          </Stack>
        </ScrollView>

        {/* Input de message */}
        <View
          style={{
            padding: SPACING.md,
            backgroundColor: colors.card,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <Row spacing="sm" align="center">
            <TextInput
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: BORDER_RADIUS.full,
                paddingHorizontal: SPACING.md,
                paddingVertical: SPACING.sm,
                color: colors.text,
                fontSize: TYPOGRAPHY.sizes.sm,
                borderWidth: 1,
                borderColor: colors.border,
              }}
              placeholder="Écrivez votre message..."
              placeholderTextColor={colors.textTertiary}
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={500}
            />
            <Pressable
              onPress={handleSend}
              disabled={!message.trim()}
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                borderRadius: BORDER_RADIUS.full,
                overflow: 'hidden',
                opacity: pressed ? 0.8 : 1,
              })}
            >
              {message.trim() ? (
                <LinearGradient
                  colors={[colors.gradient.start, colors.gradient.middle, colors.gradient.end]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: '100%',
                    height: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Send size={20} color="#FFFFFF" />
                </LinearGradient>
              ) : (
                <View
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: colors.surface,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Send size={20} color={colors.textTertiary} />
                </View>
              )}
            </Pressable>
          </Row>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}
