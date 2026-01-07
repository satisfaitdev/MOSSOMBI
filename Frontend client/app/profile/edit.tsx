import React, { useState, useEffect } from 'react';
import { View, Pressable, Image } from 'react-native';
import { Camera, User, Mail, Phone, MapPin, Calendar } from 'lucide-react-native';
import HeaderWithBackButton from '@/components/HeaderWithBackButton';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '@/constants/colors';
import { Heading, Body, Caption } from '@/components/atoms';
import { Stack } from '@/components/ui';
import { PageContainer } from '@/components/layouts';
import { useSuccessModal } from '@/hooks';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { SuccessModal } from '@/components/organisms/modals';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const { user, updateProfile } = useAuth();
  const { t } = useLanguage();
  
  const [name, setName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(''); // Champ supplémentaire
  const [birthDate, setBirthDate] = useState(''); // Champ supplémentaire
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const successModal = useSuccessModal({ autoClose: true });

  // Synchroniser les champs avec les données utilisateur
  useEffect(() => {
    if (user) {
      // Fonction pour convertir YYYY-MM-DD vers DD/MM/YYYY pour l'affichage
      const formatDateForDisplay = (isoDate: string) => {
        if (!isoDate) return '';
        
        // Si déjà au format DD/MM/YYYY, retourner tel quel
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(isoDate)) {
          return isoDate;
        }
        
        // Convertir YYYY-MM-DD vers DD/MM/YYYY
        const parts = isoDate.split('-');
        if (parts.length === 3) {
          const [year, month, day] = parts;
          return `${day}/${month}/${year}`;
        }
        
        return isoDate;
      };

      setName(user.full_name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setBirthDate(formatDateForDisplay(user.date_of_birth || ''));
      setAddress(user.address || '');
    }
  }, [user]);

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      setError(t('fillRequiredFields'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fonction pour convertir DD/MM/YYYY vers YYYY-MM-DD (ISO 8601)
      const formatDateToISO = (dateStr: string) => {
        if (!dateStr.trim()) return '';
        
        // Si déjà au format ISO (YYYY-MM-DD), retourner tel quel
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
          return dateStr.trim();
        }
        
        // Convertir DD/MM/YYYY vers YYYY-MM-DD
        const parts = dateStr.trim().split('/');
        if (parts.length === 3) {
          const [day, month, year] = parts;
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        
        return '';
      };

      const updateData = {
        full_name: name.trim(),
        email: email.trim(),
        ...(phone.trim() && { phone: phone.trim() }),
        ...(birthDate.trim() && { date_of_birth: formatDateToISO(birthDate) }),
        ...(address.trim() && { address: address.trim() })
      };

      const response = await updateProfile(updateData);
      
      if (response.success) {
        successModal.show({
          title: t('success'),
          message: t('profileUpdated'),
          animation: 'checkmark',
        });
      } else {
        throw new Error(response.error || 'Erreur lors de la mise à jour');
      }
    } catch (err: any) {
      console.error('Erreur mise à jour profil:', err);
      setError(err.message || t('updateError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <HeaderWithBackButton title={t('editProfile')} />
      <PageContainer>
        <Stack spacing="lg">
          {/* Affichage des erreurs */}
          {error && (
            <View style={{ 
              backgroundColor: colors.error + '20', 
              borderRadius: BORDER_RADIUS.md, 
              padding: SPACING.md,
              borderWidth: 1,
              borderColor: colors.error + '40'
            }}>
              <Body style={{ color: colors.error, textAlign: 'center' }}>
                {error}
              </Body>
            </View>
          )}
            {/* Photo de profil */}
            <View style={{ alignItems: 'center', marginBottom: SPACING.md }}>
              <View style={{ position: 'relative' }}>
                <View style={{ 
                  width: 100, 
                  height: 100, 
                  backgroundColor: colors.surface, 
                  borderRadius: 50, 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  borderWidth: 3,
                  borderColor: colors.primary,
                  ...SHADOWS.md,
                }}>
                  <User size={50} color={colors.textSecondary} />
                </View>
                <Pressable 
                  style={{ 
                    position: 'absolute', 
                    bottom: 0, 
                    right: 0, 
                    backgroundColor: colors.primary, 
                    width: 36, 
                    height: 36, 
                    borderRadius: 18, 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    borderWidth: 3,
                    borderColor: colors.background,
                    ...SHADOWS.sm,
                  }}
                >
                  <Camera size={18} color="#FFFFFF" />
                </Pressable>
              </View>
              <Caption style={{ marginTop: SPACING.sm, color: colors.textSecondary }}>
                {t('changePhoto')}
              </Caption>
            </View>

            {/* Informations personnelles */}
            <View>
              <Heading level={3} style={{ marginBottom: SPACING.md }}>{t('personalInfo')}</Heading>
              
              <Stack spacing="md">
                <Input
                  label={t('fullName')}
                  value={name}
                  onChangeText={setName}
                  placeholder={t('fullName')}
                  icon={<User size={20} color={colors.textSecondary} />}
                />

                <Input
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="votre@email.com"
                  keyboardType="email-address"
                  icon={<Mail size={20} color={colors.textSecondary} />}
                />

                <Input
                  label={t('phone')}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+243 XXX XXX XXX"
                  keyboardType="phone-pad"
                  icon={<Phone size={20} color={colors.textSecondary} />}
                />

                <Input
                  label={t('address')}
                  value={address}
                  onChangeText={setAddress}
                  placeholder={t('address')}
                  icon={<MapPin size={20} color={colors.textSecondary} />}
                />

                <Input
                  label={t('birthDate')}
                  value={birthDate}
                  onChangeText={setBirthDate}
                  placeholder="JJ/MM/AAAA"
                  icon={<Calendar size={20} color={colors.textSecondary} />}
                />
              </Stack>
            </View>

            {/* Boutons d'action */}
            <Stack spacing="md" style={{ marginTop: SPACING.md }}>
              <Button
                title={t('saveChanges')}
                onPress={handleSave}
                variant="gradient"
                size="lg"
                fullWidth
                loading={isLoading}
                disabled={isLoading}
              />
              <Button
                title={t('cancel')}
                onPress={() => {}}
                variant="outline"
                size="lg"
                fullWidth
                disabled={isLoading}
              />
          </Stack>
        </Stack>
      </PageContainer>
    </>
  );
}
