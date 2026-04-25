import React from 'react';
import { View } from 'react-native';
import GradientBackground from '@/components/atoms/GradientBackground';
import HeaderWithBackButton from '@/components/HeaderWithBackButton';

interface AuthPageLayoutProps {
  title: string;
  children: React.ReactNode;
}

export default function AuthPageLayout({ title, children }: AuthPageLayoutProps) {
  return (
    <GradientBackground style={{ flex: 1 }} opacity="10">
      <HeaderWithBackButton title={title} />
      <View style={{ flex: 1 }}>{children}</View>
    </GradientBackground>
  );
}
