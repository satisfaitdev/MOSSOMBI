import SwiftUI

struct CoinsView: View {
    @State private var appeared: Bool = false

    var body: some View {
        ScrollView {
            VStack(spacing: MossombiSpacing.lg) {
                portfolioCard
                coinsList
            }
            .padding(.horizontal, MossombiSpacing.md)
            .padding(.bottom, MossombiSpacing.xxl)
            .opacity(appeared ? 1 : 0)
            .offset(y: appeared ? 0 : 10)
        }
        .scrollIndicators(.hidden)
        .background { AppBackground() }
        .navigationTitle("Coins")
        .navigationBarTitleDisplayMode(.large)
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.8).delay(0.05)) {
                appeared = true
            }
        }
    }

    private var portfolioCard: some View {
        BrandGradientCard {
            VStack(spacing: MossombiSpacing.md) {
                HStack {
                    VStack(alignment: .leading, spacing: MossombiSpacing.xxs) {
                        Text("Portfolio Crypto")
                            .font(.subheadline)
                            .foregroundStyle(.white.opacity(0.7))
                        Text("1 245 000 F")
                            .font(.system(size: 32, weight: .bold, design: .rounded))
                            .foregroundStyle(.white)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 2) {
                        HStack(spacing: 2) {
                            Image(systemName: "arrow.up.right")
                                .font(.system(size: 10, weight: .bold))
                            Text("+3.45%")
                                .font(.caption.weight(.bold))
                        }
                        .foregroundStyle(.white)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(.white.opacity(0.2), in: .capsule)
                        Text("24h")
                            .font(.system(size: 9))
                            .foregroundStyle(.white.opacity(0.6))
                    }
                }

                HStack(spacing: MossombiSpacing.md) {
                    Button {} label: {
                        HStack(spacing: MossombiSpacing.xxs) {
                            Image(systemName: "arrow.down")
                                .font(.caption.weight(.bold))
                            Text("Acheter")
                                .font(.caption.weight(.bold))
                        }
                        .foregroundStyle(Brand.cyan)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(.white.opacity(0.2), in: .capsule)
                    }

                    Button {} label: {
                        HStack(spacing: MossombiSpacing.xxs) {
                            Image(systemName: "arrow.up")
                                .font(.caption.weight(.bold))
                            Text("Vendre")
                                .font(.caption.weight(.bold))
                        }
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(.white.opacity(0.1), in: .capsule)
                    }
                }
            }
            .padding(MossombiSpacing.lg)
        }
    }

    private var coinsList: some View {
        VStack(alignment: .leading, spacing: MossombiSpacing.sm) {
            HStack {
                Text("Marché")
                    .font(.headline)
                Spacer()
                Text("24h")
                    .font(.caption.weight(.medium))
                    .foregroundStyle(.secondary)
            }

            ForEach(MockData.coins) { coin in
                CoinRow(coin: coin)
            }
        }
    }
}

struct CoinRow: View {
    let coin: CoinItem

    private var isPositive: Bool { coin.change24h >= 0 }

    var body: some View {
        Card3D(radius: MossombiRadius.md, padding: MossombiSpacing.sm) {
            HStack(spacing: MossombiSpacing.sm) {
                IconBubble3D(coin.icon, size: 18, bubbleSize: 40)

                VStack(alignment: .leading, spacing: 2) {
                    Text(coin.name)
                        .font(.subheadline.weight(.semibold))
                    HStack(spacing: MossombiSpacing.xxs) {
                        Text(coin.symbol)
                            .font(.system(size: 10, weight: .medium))
                            .foregroundStyle(.secondary)
                        Text("·")
                            .foregroundStyle(.tertiary)
                        Text("Cap: \(coin.marketCap)")
                            .font(.system(size: 10))
                            .foregroundStyle(.tertiary)
                    }
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 2) {
                    Text("\(Int(coin.price).formatted(.number.grouping(.automatic))) F")
                        .font(.subheadline.weight(.semibold))

                    HStack(spacing: 2) {
                        Image(systemName: isPositive ? "arrow.up.right" : "arrow.down.right")
                            .font(.system(size: 8, weight: .bold))
                        Text(String(format: "%+.2f%%", coin.change24h))
                            .font(.system(size: 10, weight: .semibold))
                    }
                    .foregroundStyle(isPositive ? MossombiColors.success : MossombiColors.danger)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background((isPositive ? MossombiColors.success : MossombiColors.danger).opacity(0.12), in: .capsule)
                }
            }
        }
    }
}
