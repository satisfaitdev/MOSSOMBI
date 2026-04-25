import 'package:flutter/material.dart';

class OnboardingData {
  final String title;
  final String subtitle;
  final String emoji;
  final List<Color> gradient;

  const OnboardingData({
    required this.title,
    required this.subtitle,
    required this.emoji,
    required this.gradient,
  });
}

final List<OnboardingData> onboardingSlides = [
  const OnboardingData(
    title: "Tout en un",
    subtitle: "Une super-application pour tous vos services quotidiens. Marketplace, transports et livraisons au même endroit.",
    emoji: "🚀",
    gradient: [Color(0xFF6C4EF6), Color(0xFF9B77FF)],
  ),
  const OnboardingData(
    title: "Rapide & Sécurisé",
    subtitle: "Des paiements intégrés, flexibles et hautement sécurisés grâce à Mosombi Pay et vos wallets locaux.",
    emoji: "🔐",
    gradient: [Color(0xFFFF6584), Color(0xFFFF8FA3)],
  ),
  const OnboardingData(
    title: "Ta ville, connectée",
    subtitle: "Profitez des services d'une vraie Smart City. Billetterie, événements et assistance intelligente 24/7.",
    emoji: "🏙️",
    gradient: [Color(0xFF00E5C5), Color(0xFF00D4FF)],
  ),
];
