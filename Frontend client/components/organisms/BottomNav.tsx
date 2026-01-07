import React, { useEffect, useRef } from 'react';
import { View, Pressable, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { Home, Grid3x3, ShoppingBag, User } from 'lucide-react-native';
import { useRouter, usePathname } from 'expo-router';

interface TabItem {
  id: string;
  route: string;
  icon: React.ComponentType<{ color: string; size: number }>;
  labelKey: string; // Clé de traduction au lieu du texte fixe
}

const TABS: TabItem[] = [
  { id: 'home', route: '/', icon: Home, labelKey: 'home' },
  { id: 'services', route: '/services', icon: Grid3x3, labelKey: 'services' },
  { id: 'orders', route: '/orders', icon: ShoppingBag, labelKey: 'orders' },
  { id: 'profile', route: '/profile', icon: User, labelKey: 'profile' },
];

// Composant TabButton avec animation bulle
function TabButton({ 
  tab, 
  label,
  isActive, 
  onPress, 
  colors, 
  colorScheme 
}: { 
  tab: TabItem; 
  label: string;
  isActive: boolean; 
  onPress: () => void; 
  colors: any; 
  colorScheme: string;
}) {
  const scaleAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const opacityAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  
  useEffect(() => {
    if (isActive) {
      // Animation bulle d'eau - expansion
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animation disparition
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isActive]);

  const Icon = tab.icon;
  const color = isActive ? colors.gradient.start : colors.tabIconDefault;

  return (
    <Pressable
      onPress={onPress}
      style={styles.tab}
    >
      <View style={[styles.pill, isActive && { paddingTop: 2 }]}>
        {/* Background animé bulle */}
        <Animated.View
          style={[
            styles.bubbleBackground,
            {
              backgroundColor: colorScheme === 'dark' 
                ? 'rgba(255, 255, 255, 0.2)' 
                : 'rgba(0, 0, 0, 0.15)',
              opacity: opacityAnim,
              transform: [
                {
                  scale: scaleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }),
                },
              ],
            },
          ]}
        />
        
        {/* Contenu avec gradient si actif */}
        <View style={styles.contentWrapper}>
          {isActive ? (
            <>
              <MaskedView
                style={{ height: 22, width: 22 }}
                maskElement={<Icon color="#FFFFFF" size={22} />}
              >
                <LinearGradient
                  colors={[colors.gradient.start, colors.gradient.middle, colors.gradient.end]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ height: 22, width: 22 }}
                />
              </MaskedView>
              <MaskedView
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                maskElement={
                  <Text style={[styles.label, { color: '#FFFFFF', textAlign: 'center' }]}>
                    {label}
                  </Text>
                }
              >
                <LinearGradient
                  colors={[colors.gradient.start, colors.gradient.middle, colors.gradient.end]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ flex: 1, height: 20 }}
                />
              </MaskedView>
            </>
          ) : (
            <>
              <Icon color={color} size={22} />
              <Text style={[styles.label, { color }]}>
                {label}
              </Text>
            </>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default function BottomNav() {
  const { colors, colorScheme } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();

  const handlePress = (route: string) => {
    router.push(route);
  };

  return (
    <View style={[styles.container, { 
      marginLeft: 15,
      marginRight: 15,
      marginBottom: 20,
    }]}>
      {/* Background avec blur pour iOS */}
      <BlurView
        intensity={30}
        tint={colorScheme === 'dark' ? 'dark' : 'light'}
        style={[styles.blurView, {
          backgroundColor: colors.card + '80',
          borderWidth: 1,
          borderColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        }]}
      />

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => {
          const isActive = pathname === tab.route;

          return (
            <TabButton
              key={tab.id}
              tab={tab}
              label={t(tab.labelKey as any)}
              isActive={isActive}
              onPress={() => handlePress(tab.route)}
              colors={colors}
              colorScheme={colorScheme}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    borderRadius: 20,
    overflow: 'hidden',
  },
  blurView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
  },
  tabsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  pill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
    width: '100%',
    height: 56,
    borderRadius: 16,
    gap: 2,
    position: 'relative',
  },
  bubbleBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  contentWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    flexDirection: 'column',
    width: '100%',
  },
  maskContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    flexDirection: 'column',
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
  },
});
