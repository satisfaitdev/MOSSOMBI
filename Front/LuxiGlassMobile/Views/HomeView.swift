import SwiftUI

struct HomeView: View {
    @Environment(ThemeManager.self) private var themeManager
    @State private var appeared: Bool = false
    @State private var hapticTrigger: Int = 0

    private let user = MockData.user
    private let balance = MockData.walletBalance
    private let points = MockData.loyaltyPoints

    var body: some View {
        ScrollView {
            VStack(spacing: MossombiSpacing.xl) {
                headerSection
                bannerAdSection
                quickActionsSection
                balanceCard
                popularServicesSection
                offersSection
                recentActivitySection
            }
            .padding(.horizontal, MossombiSpacing.md)
            .padding(.bottom, MossombiSpacing.xxl)
            .opacity(appeared ? 1 : 0)
            .offset(y: appeared ? 0 : 12)
        }
        .scrollIndicators(.hidden)
        .background { AppBackground() }
        .onAppear {
            withAnimation(.spring(response: 0.6, dampingFraction: 0.8).delay(0.1)) {
                appeared = true
            }
        }
    }

    private var headerSection: some View {
        HStack(spacing: MossombiSpacing.sm) {
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: Brand.gradient,
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 48, height: 48)
                    .shadow(color: Brand.cyan.opacity(0.3), radius: 8, x: 0, y: 2)
                Text(user.avatarInitials)
                    .font(.body.weight(.bold))
                    .foregroundStyle(.white)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text("Bonjour,")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Text(user.firstName)
                    .font(.title3.weight(.bold))
            }

            Spacer()

            NavigationLink(value: AppRoute.notifications) {
                ZStack {
                    Circle()
                        .fill(.ultraThinMaterial)
                        .frame(width: 40, height: 40)
                        .overlay {
                            Circle()
                                .strokeBorder(MossombiColors.glassBorder, lineWidth: 0.5)
                        }
                    Image(systemName: "bell.fill")
                        .font(.body)
                        .foregroundStyle(.primary)

                    Circle()
                        .fill(Brand.orange)
                        .frame(width: 8, height: 8)
                        .offset(x: 8, y: -8)
                }
            }
            .buttonStyle(PremiumPressStyle())
        }
        .padding(.top, MossombiSpacing.xs)
    }

    private var bannerAdSection: some View {
        let ad = MockData.bannerAds[0]
        return BrandGradientCard {
            HStack(spacing: MossombiSpacing.md) {
                VStack(alignment: .leading, spacing: MossombiSpacing.xs) {
                    Text(ad.title)
                        .font(.headline)
                        .foregroundStyle(.white)
                    Text(ad.subtitle)
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.8))
                    Text(ad.cta)
                        .font(.caption.weight(.bold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(.white.opacity(0.2), in: .capsule)
                }

                Spacer()

                ZStack {
                    Circle()
                        .fill(.white.opacity(0.15))
                        .frame(width: 56, height: 56)
                    Image(systemName: ad.icon)
                        .font(.title2.weight(.semibold))
                        .foregroundStyle(.white)
                }
            }
            .padding(MossombiSpacing.md)
        }
    }

    private var quickActionsSection: some View {
        HStack(spacing: 0) {
            Spacer()
            NavigationLink(value: AppRoute.transfer) {
                QuickActionLabel(icon: "arrow.left.arrow.right", label: "Transfert")
            }
            .buttonStyle(PremiumPressStyle())
            Spacer()
            NavigationLink(value: AppRoute.pay) {
                QuickActionLabel(icon: "creditcard.fill", label: "Payer")
            }
            .buttonStyle(PremiumPressStyle())
            Spacer()
            NavigationLink(value: AppRoute.recharge) {
                QuickActionLabel(icon: "phone.arrow.up.right", label: "Recharger")
            }
            .buttonStyle(PremiumPressStyle())
            Spacer()
            NavigationLink(value: AppRoute.scan) {
                QuickActionLabel(icon: "qrcode.viewfinder", label: "Scanner")
            }
            .buttonStyle(PremiumPressStyle())
            Spacer()
        }
    }

    private var balanceCard: some View {
        LiquidGlassCard {
            HStack {
                Text("Solde disponible")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Spacer()
                Button {
                    themeManager.balanceHidden.toggle()
                    hapticTrigger += 1
                } label: {
                    Image(systemName: themeManager.balanceHidden ? "eye.slash.fill" : "eye.fill")
                        .font(.body)
                        .foregroundStyle(.secondary)
                        .contentTransition(.symbolEffect(.replace))
                }
            }
        } content: {
            Text(themeManager.balanceHidden ? "••••••" : "\(balance.formatted(.number.grouping(.automatic))) F")
                .font(.system(size: 34, weight: .bold, design: .rounded))
                .foregroundStyle(Brand.linearGradient)
                .contentTransition(.numericText())
        } footer: {
            HStack(spacing: MossombiSpacing.xxs) {
                Image(systemName: "arrow.up.right")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(MossombiColors.success)
                Text("+12.5% ce mois")
                    .font(.caption)
                    .foregroundStyle(MossombiColors.success)
            }
        }
    }

    private var popularServicesSection: some View {
        VStack(alignment: .leading, spacing: MossombiSpacing.sm) {
            HStack {
                Text("Services populaires")
                    .font(.headline)
                Spacer()
                NavigationLink(value: AppRoute.services) {
                    Text("Voir plus")
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(Brand.linearGradient)
                }
            }

            let columns = [
                GridItem(.flexible(), spacing: MossombiSpacing.sm),
                GridItem(.flexible(), spacing: MossombiSpacing.sm),
                GridItem(.flexible(), spacing: MossombiSpacing.sm),
                GridItem(.flexible(), spacing: MossombiSpacing.sm)
            ]

            LazyVGrid(columns: columns, spacing: MossombiSpacing.md) {
                ForEach(Array(MockData.popularServices.prefix(8))) { service in
                    NavigationLink(value: AppRoute.serviceDetail(service.id)) {
                        VStack(spacing: MossombiSpacing.xs) {
                            IconBubble3D(service.icon, size: 20, bubbleSize: 48)
                            Text(service.name)
                                .font(.system(size: 11, weight: .medium))
                                .foregroundStyle(.primary)
                                .lineLimit(1)
                        }
                    }
                    .buttonStyle(PremiumPressStyle())
                }
            }
        }
    }

    private var offersSection: some View {
        VStack(alignment: .leading, spacing: MossombiSpacing.sm) {
            HStack {
                Text("Offres pour vous")
                    .font(.headline)
                Spacer()
                Button("Voir tout") {}
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(Brand.linearGradient)
            }

            ScrollView(.horizontal) {
                HStack(spacing: MossombiSpacing.sm) {
                    ForEach(MockData.offers) { offer in
                        OfferCard(offer: offer)
                    }
                }
            }
            .contentMargins(.horizontal, 0)
            .scrollIndicators(.hidden)
        }
    }

    private var recentActivitySection: some View {
        VStack(alignment: .leading, spacing: MossombiSpacing.sm) {
            HStack {
                Text("Activité récente")
                    .font(.headline)
                Spacer()
                Button("Tout voir") {}
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(Brand.linearGradient)
            }

            GlassContainer(padding: MossombiSpacing.sm) {
                VStack(spacing: 0) {
                    ForEach(Array(MockData.transactions.prefix(4))) { tx in
                        TransactionRow(transaction: tx)
                        if tx.id != MockData.transactions.prefix(4).last?.id {
                            Divider()
                                .padding(.vertical, MossombiSpacing.xxs)
                        }
                    }
                }
            }
        }
    }
}
