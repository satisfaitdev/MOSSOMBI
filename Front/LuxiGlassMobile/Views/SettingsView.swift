import SwiftUI

struct SettingsView: View {
    @Environment(ThemeManager.self) private var themeManager
    @State private var notificationsEnabled: Bool = true
    @State private var biometricsEnabled: Bool = true
    @State private var appeared: Bool = false

    var body: some View {
        ScrollView {
            VStack(spacing: MossombiSpacing.xl) {
                themeSection
                togglesSection
                themePreview
                aboutSection
            }
            .padding(.horizontal, MossombiSpacing.md)
            .padding(.bottom, MossombiSpacing.xxl)
            .opacity(appeared ? 1 : 0)
            .offset(y: appeared ? 0 : 10)
        }
        .scrollIndicators(.hidden)
        .background { AppBackground() }
        .navigationTitle("Réglages")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.8).delay(0.05)) {
                appeared = true
            }
        }
    }

    private var themeSection: some View {
        VStack(alignment: .leading, spacing: MossombiSpacing.sm) {
            Text("Apparence")
                .font(.headline)

            GlassContainer {
                VStack(spacing: MossombiSpacing.sm) {
                    ForEach(AppTheme.allCases, id: \.rawValue) { theme in
                        Button {
                            withAnimation(.snappy) {
                                themeManager.selectedTheme = theme
                            }
                        } label: {
                            HStack {
                                Icon3D(themeIcon(for: theme), size: 16)
                                    .frame(width: 24)
                                Text(theme.displayName)
                                    .font(.body)
                                    .foregroundStyle(.primary)
                                Spacer()
                                if themeManager.selectedTheme == theme {
                                    Image(systemName: "checkmark.circle.fill")
                                        .font(.body)
                                        .foregroundStyle(Brand.linearGradient)
                                }
                            }
                            .padding(.vertical, MossombiSpacing.xxs)
                        }

                        if theme != AppTheme.allCases.last {
                            Divider()
                        }
                    }
                }
            }
        }
    }

    private var togglesSection: some View {
        VStack(alignment: .leading, spacing: MossombiSpacing.sm) {
            Text("Préférences")
                .font(.headline)

            GlassContainer {
                VStack(spacing: MossombiSpacing.sm) {
                    Toggle(isOn: $notificationsEnabled) {
                        HStack(spacing: MossombiSpacing.sm) {
                            Icon3D("bell.fill", size: 16)
                                .frame(width: 24)
                            Text("Notifications")
                        }
                    }
                    .tint(Brand.cyan)

                    Divider()

                    Toggle(isOn: $biometricsEnabled) {
                        HStack(spacing: MossombiSpacing.sm) {
                            Icon3D("faceid", size: 16)
                                .frame(width: 24)
                            Text("Face ID")
                        }
                    }
                    .tint(Brand.cyan)

                    Divider()

                    @Bindable var tm = themeManager
                    Toggle(isOn: $tm.balanceHidden) {
                        HStack(spacing: MossombiSpacing.sm) {
                            Icon3D("eye.slash.fill", size: 16)
                                .frame(width: 24)
                            Text("Masquer le solde")
                        }
                    }
                    .tint(Brand.cyan)
                }
            }
        }
    }

    private var themePreview: some View {
        VStack(alignment: .leading, spacing: MossombiSpacing.sm) {
            Text("Aperçu")
                .font(.headline)

            Card3D {
                VStack(spacing: MossombiSpacing.sm) {
                    HStack {
                        Circle()
                            .fill(Brand.linearGradient)
                            .frame(width: 36, height: 36)
                        VStack(alignment: .leading, spacing: 2) {
                            RoundedRectangle(cornerRadius: 4)
                                .fill(.primary.opacity(0.3))
                                .frame(width: 80, height: 10)
                            RoundedRectangle(cornerRadius: 4)
                                .fill(.secondary.opacity(0.2))
                                .frame(width: 50, height: 8)
                        }
                        Spacer()
                    }

                    RoundedRectangle(cornerRadius: 8)
                        .fill(Brand.cyan.opacity(0.08))
                        .frame(height: 40)

                    HStack(spacing: MossombiSpacing.xs) {
                        ForEach(0..<3, id: \.self) { _ in
                            RoundedRectangle(cornerRadius: 8)
                                .fill(
                                    LinearGradient(
                                        colors: [Brand.cyan.opacity(0.12), Brand.violet.opacity(0.08)],
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    )
                                )
                                .frame(height: 32)
                        }
                    }
                }
            }
        }
    }

    private var aboutSection: some View {
        VStack(alignment: .leading, spacing: MossombiSpacing.sm) {
            Text("À propos")
                .font(.headline)

            GlassContainer {
                VStack(spacing: MossombiSpacing.sm) {
                    HStack {
                        Text("Version")
                            .foregroundStyle(.secondary)
                        Spacer()
                        Text("1.0.0")
                    }
                    .font(.subheadline)

                    Divider()

                    HStack {
                        Text("Build")
                            .foregroundStyle(.secondary)
                        Spacer()
                        Text("2026.1")
                    }
                    .font(.subheadline)
                }
            }
        }
    }

    private func themeIcon(for theme: AppTheme) -> String {
        switch theme {
        case .system: "circle.lefthalf.filled"
        case .light: "sun.max.fill"
        case .dark: "moon.fill"
        }
    }
}
