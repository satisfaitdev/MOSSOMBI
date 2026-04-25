import SwiftUI

struct ProfileView: View {
    @State private var appeared: Bool = false
    private let user = MockData.user

    var body: some View {
        ScrollView {
            VStack(spacing: MossombiSpacing.xl) {
                avatarSection
                statsSection
                walletAccessCard
                carnetAccessCard
                profileCards

                NavigationLink(value: AppRoute.editProfile) {
                    HStack(spacing: MossombiSpacing.xs) {
                        Image(systemName: "pencil")
                            .font(.body.weight(.semibold))
                        Text("Modifier le profil")
                            .font(.body.weight(.semibold))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .padding(.horizontal, MossombiSpacing.lg)
                    .foregroundStyle(.white)
                    .background {
                        RoundedRectangle(cornerRadius: MossombiRadius.sm, style: .continuous)
                            .fill(Brand.linearGradientHorizontal)
                            .shadow(color: Brand.blue.opacity(0.3), radius: 8, x: 0, y: 4)
                    }
                }
                .buttonStyle(PremiumPressStyle())
            }
            .padding(.horizontal, MossombiSpacing.md)
            .padding(.bottom, MossombiSpacing.xxl)
            .opacity(appeared ? 1 : 0)
            .offset(y: appeared ? 0 : 12)
        }
        .scrollIndicators(.hidden)
        .background { AppBackground() }
        .navigationTitle("Profil")
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.8).delay(0.05)) {
                appeared = true
            }
        }
    }

    private var avatarSection: some View {
        VStack(spacing: MossombiSpacing.md) {
            ZStack {
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [Brand.cyan.opacity(0.2), Brand.violet.opacity(0.1), .clear],
                            center: .center,
                            startRadius: 30,
                            endRadius: 60
                        )
                    )
                    .frame(width: 110, height: 110)

                Circle()
                    .fill(
                        LinearGradient(
                            colors: Brand.gradient,
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 88, height: 88)
                    .overlay {
                        Circle()
                            .fill(
                                LinearGradient(
                                    colors: [Color.white.opacity(0.3), Color.clear],
                                    startPoint: .topLeading,
                                    endPoint: .center
                                )
                            )
                    }
                    .overlay {
                        Text(user.avatarInitials)
                            .font(.title.weight(.bold))
                            .foregroundStyle(.white)
                    }
                    .shadow(color: Brand.blue.opacity(0.4), radius: 16, x: 0, y: 6)
            }

            VStack(spacing: MossombiSpacing.xxs) {
                Text(user.fullName)
                    .font(.title2.weight(.bold))
                Text(user.email)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }

            HStack(spacing: MossombiSpacing.xs) {
                Image(systemName: "star.fill")
                    .font(.caption)
                    .foregroundStyle(MossombiColors.warning)
                Text("Membre \(user.level)")
                    .font(.subheadline.weight(.medium))
                Text("·")
                    .foregroundStyle(.tertiary)
                Text("Depuis \(user.memberSince)")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.top, MossombiSpacing.md)
    }

    private var statsSection: some View {
        HStack(spacing: MossombiSpacing.sm) {
            StatCard3D(value: "3 420", label: "Points", icon: "star.fill")
            StatCard3D(value: "47", label: "Transactions", icon: "arrow.left.arrow.right")
            StatCard3D(value: "12", label: "Services", icon: "square.grid.2x2.fill")
        }
    }

    private var walletAccessCard: some View {
        NavigationLink(value: AppRoute.wallet) {
            Card3D(radius: MossombiRadius.lg, padding: MossombiSpacing.md) {
                HStack(spacing: MossombiSpacing.md) {
                    IconBubble3D("wallet.bifold.fill", size: 22, bubbleSize: 50)

                    VStack(alignment: .leading, spacing: MossombiSpacing.xxs) {
                        Text("Mon Portefeuille")
                            .font(.headline)
                            .foregroundStyle(.primary)
                        Text("Gérer votre solde et transactions")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }

                    Spacer()

                    Image(systemName: "chevron.right")
                        .font(.body.weight(.semibold))
                        .foregroundStyle(Brand.linearGradient)
                }
            }
        }
        .buttonStyle(PremiumPressStyle())
    }

    private var carnetAccessCard: some View {
        NavigationLink(value: AppRoute.carnet) {
            Card3D(radius: MossombiRadius.lg, padding: MossombiSpacing.md) {
                HStack(spacing: MossombiSpacing.md) {
                    IconBubble3D("book.closed.fill", size: 22, bubbleSize: 50)

                    VStack(alignment: .leading, spacing: MossombiSpacing.xxs) {
                        Text("Mon Carnet")
                            .font(.headline)
                            .foregroundStyle(.primary)
                        Text("Adresses, trajets, contacts, comptes")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }

                    Spacer()

                    Image(systemName: "chevron.right")
                        .font(.body.weight(.semibold))
                        .foregroundStyle(Brand.linearGradient)
                }
            }
        }
        .buttonStyle(PremiumPressStyle())
    }

    private var profileCards: some View {
        VStack(spacing: MossombiSpacing.sm) {
            ProfileCard(
                title: "Identité",
                icon: "person.text.rectangle",
                items: [
                    ("Nom complet", user.fullName),
                    ("Email", user.email),
                    ("Niveau", user.level),
                ]
            )

            ProfileCard(
                title: "Sécurité",
                icon: "lock.shield.fill",
                items: [
                    ("2FA", "Activé"),
                    ("Dernière connexion", "Aujourd'hui"),
                    ("Appareil", "iPhone 15 Pro"),
                ]
            )

            ProfileCard(
                title: "Préférences",
                icon: "gearshape.fill",
                items: [
                    ("Langue", "Français"),
                    ("Devise", "FCFA"),
                    ("Notifications", "Activées"),
                ]
            )
        }
    }
}

struct StatCard3D: View {
    let value: String
    let label: String
    let icon: String

    var body: some View {
        Card3D(radius: MossombiRadius.md, padding: MossombiSpacing.sm) {
            VStack(spacing: MossombiSpacing.xs) {
                Icon3D(icon, size: 18)
                Text(value)
                    .font(.headline)
                Text(label)
                    .font(.system(size: 10))
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, MossombiSpacing.xxs)
        }
    }
}

struct ProfileCard: View {
    let title: String
    let icon: String
    let items: [(String, String)]

    var body: some View {
        GlassContainer {
            VStack(alignment: .leading, spacing: MossombiSpacing.sm) {
                HStack(spacing: MossombiSpacing.xs) {
                    Icon3D(icon, size: 16)
                    Text(title)
                        .font(.headline)
                }

                ForEach(items, id: \.0) { item in
                    HStack {
                        Text(item.0)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        Spacer()
                        Text(item.1)
                            .font(.subheadline.weight(.medium))
                    }
                    if item.0 != items.last?.0 {
                        Divider()
                    }
                }
            }
        }
    }
}
