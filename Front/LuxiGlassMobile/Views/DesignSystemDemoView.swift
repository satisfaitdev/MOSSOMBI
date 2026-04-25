import SwiftUI

struct DesignSystemDemoView: View {
    @State private var demoText: String = ""
    @State private var errorText: String = ""

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: MossombiSpacing.xxl) {
                brandSection
                typographySection
                iconsSection
                buttonsSection
                inputsSection
                cardsSection
                shimmerSection
            }
            .padding(.horizontal, MossombiSpacing.md)
            .padding(.bottom, MossombiSpacing.xxl)
        }
        .scrollIndicators(.hidden)
        .background { AppBackground() }
        .navigationTitle("Design System")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var brandSection: some View {
        VStack(alignment: .leading, spacing: MossombiSpacing.sm) {
            sectionHeader("Couleurs de marque")

            HStack(spacing: MossombiSpacing.sm) {
                colorSwatch("Cyan", Brand.cyan)
                colorSwatch("Blue", Brand.blue)
                colorSwatch("Violet", Brand.violet)
                colorSwatch("Orange", Brand.orange)
            }

            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(Brand.linearGradient)
                .frame(height: 56)
                .overlay {
                    Text("Brand Gradient")
                        .font(.headline)
                        .foregroundStyle(.white)
                }
                .shadow(color: Brand.blue.opacity(0.3), radius: 12, x: 0, y: 4)

            HStack(spacing: MossombiSpacing.sm) {
                colorSwatch("Success", MossombiColors.success)
                colorSwatch("Warning", MossombiColors.warning)
                colorSwatch("Danger", MossombiColors.danger)
            }
        }
    }

    private var typographySection: some View {
        VStack(alignment: .leading, spacing: MossombiSpacing.sm) {
            sectionHeader("Typographie")
            GlassContainer {
                VStack(alignment: .leading, spacing: MossombiSpacing.sm) {
                    AdaptiveText("Large Title", variant: .largeTitle)
                    AdaptiveText("Title", variant: .title)
                    AdaptiveText("Headline", variant: .headline)
                    AdaptiveText("Body text example", variant: .body)
                    AdaptiveText("Caption text", variant: .caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
    }

    private var iconsSection: some View {
        VStack(alignment: .leading, spacing: MossombiSpacing.sm) {
            sectionHeader("Icon3D & IconBubble3D")
            Card3D {
                HStack(spacing: MossombiSpacing.lg) {
                    VStack(spacing: MossombiSpacing.xs) {
                        Icon3D("star.fill", size: 28)
                        Text("Icon3D")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }

                    VStack(spacing: MossombiSpacing.xs) {
                        IconBubble3D("bolt.fill", size: 22, bubbleSize: 48)
                        Text("Bubble")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }

                    VStack(spacing: MossombiSpacing.xs) {
                        Icon3D("heart.fill", size: 28, isActive: false)
                        Text("Inactive")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                .frame(maxWidth: .infinity)
            }
        }
    }

    private var buttonsSection: some View {
        VStack(alignment: .leading, spacing: MossombiSpacing.sm) {
            sectionHeader("Boutons")
            PremiumButton("Primary Gradient", icon: "star.fill", variant: .primary) {}
            PremiumButton("Secondary Glass", icon: "heart.fill", variant: .secondary) {}
            PremiumButton("Ghost", variant: .ghost) {}
            PremiumButton("Loading", variant: .primary, isLoading: true) {}
            PremiumButton("Désactivé", variant: .primary, isDisabled: true) {}
        }
    }

    private var inputsSection: some View {
        VStack(alignment: .leading, spacing: MossombiSpacing.sm) {
            sectionHeader("Champs de saisie")
            PremiumInput("Rechercher...", text: $demoText, icon: "magnifyingglass")
            PremiumInput("Email invalide", text: $errorText, icon: "envelope.fill", hasError: true, errorMessage: "Format d'email invalide")
        }
    }

    private var cardsSection: some View {
        VStack(alignment: .leading, spacing: MossombiSpacing.sm) {
            sectionHeader("Card3D")
            LiquidGlassCard {
                Text("En-tête")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            } content: {
                Text("247 850 F")
                    .font(.system(size: 28, weight: .bold, design: .rounded))
                    .foregroundStyle(Brand.linearGradient)
            } footer: {
                HStack(spacing: MossombiSpacing.xxs) {
                    Image(systemName: "arrow.up.right")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(MossombiColors.success)
                    Text("+12.5%")
                        .font(.caption)
                        .foregroundStyle(MossombiColors.success)
                }
            }

            sectionHeader("BrandGradientCard")
            BrandGradientCard {
                HStack {
                    VStack(alignment: .leading, spacing: MossombiSpacing.xs) {
                        Text("Promo spéciale")
                            .font(.headline)
                            .foregroundStyle(.white)
                        Text("Offre limitée")
                            .font(.caption)
                            .foregroundStyle(.white.opacity(0.8))
                    }
                    Spacer()
                    Image(systemName: "gift.fill")
                        .font(.title)
                        .foregroundStyle(.white)
                }
                .padding(MossombiSpacing.md)
            }
        }
    }

    private var shimmerSection: some View {
        VStack(alignment: .leading, spacing: MossombiSpacing.sm) {
            sectionHeader("Skeleton Loading")
            LiquidGlassCard(isLoading: true) {
                EmptyView()
            } content: {
                EmptyView()
            }
        }
    }

    private func sectionHeader(_ title: String) -> some View {
        Text(title)
            .font(.title3.weight(.bold))
            .padding(.top, MossombiSpacing.xs)
    }

    private func colorSwatch(_ name: String, _ color: Color) -> some View {
        VStack(spacing: MossombiSpacing.xxs) {
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(color)
                .frame(height: 44)
                .shadow(color: color.opacity(0.3), radius: 6, x: 0, y: 3)
            Text(name)
                .font(.system(size: 10))
                .foregroundStyle(.secondary)
        }
    }
}
