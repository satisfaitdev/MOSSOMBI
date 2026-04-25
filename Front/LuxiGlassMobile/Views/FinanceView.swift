import SwiftUI

struct FinanceView: View {
    @State private var appeared: Bool = false

    var body: some View {
        ScrollView {
            VStack(spacing: MossombiSpacing.lg) {
                summaryCard
                productsSection
            }
            .padding(.horizontal, MossombiSpacing.md)
            .padding(.bottom, MossombiSpacing.xxl)
            .opacity(appeared ? 1 : 0)
            .offset(y: appeared ? 0 : 10)
        }
        .scrollIndicators(.hidden)
        .background { AppBackground() }
        .navigationTitle("Finance")
        .navigationBarTitleDisplayMode(.large)
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.8).delay(0.05)) {
                appeared = true
            }
        }
    }

    private var summaryCard: some View {
        BrandGradientCard {
            VStack(spacing: MossombiSpacing.md) {
                HStack {
                    VStack(alignment: .leading, spacing: MossombiSpacing.xxs) {
                        Text("Portefeuille total")
                            .font(.subheadline)
                            .foregroundStyle(.white.opacity(0.7))
                        Text("247 850 F")
                            .font(.system(size: 32, weight: .bold, design: .rounded))
                            .foregroundStyle(.white)
                    }
                    Spacer()
                    ZStack {
                        Circle()
                            .fill(.white.opacity(0.15))
                            .frame(width: 50, height: 50)
                        Image(systemName: "chart.line.uptrend.xyaxis")
                            .font(.title3.weight(.semibold))
                            .foregroundStyle(.white)
                    }
                }

                HStack(spacing: MossombiSpacing.xl) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Épargne")
                            .font(.caption)
                            .foregroundStyle(.white.opacity(0.7))
                        Text("125 000 F")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(.white)
                    }
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Investissement")
                            .font(.caption)
                            .foregroundStyle(.white.opacity(0.7))
                        Text("45 000 F")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(.white)
                    }
                    Spacer()
                }
            }
            .padding(MossombiSpacing.lg)
        }
    }

    private var productsSection: some View {
        VStack(alignment: .leading, spacing: MossombiSpacing.sm) {
            Text("Produits financiers")
                .font(.headline)

            ForEach(MockData.financeProducts) { product in
                FinanceProductCard(product: product)
            }
        }
    }
}

struct FinanceProductCard: View {
    let product: FinanceProduct

    var body: some View {
        Card3D(radius: MossombiRadius.md, padding: MossombiSpacing.md) {
            HStack(spacing: MossombiSpacing.md) {
                IconBubble3D(product.icon, size: 20, bubbleSize: 44)

                VStack(alignment: .leading, spacing: MossombiSpacing.xxs) {
                    HStack {
                        Text(product.name)
                            .font(.subheadline.weight(.semibold))
                        if let badge = product.badge {
                            Text(badge)
                                .font(.system(size: 8, weight: .bold))
                                .foregroundStyle(.white)
                                .padding(.horizontal, 5)
                                .padding(.vertical, 2)
                                .background(financeBadgeColor(badge), in: .capsule)
                        }
                    }
                    Text(product.subtitle)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                Text(product.value)
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(Brand.linearGradient)
            }
        }
    }

    private func financeBadgeColor(_ badge: String) -> Color {
        switch badge {
        case "Recommandé": Brand.violet
        case "Nouveau": Brand.cyan
        case "Populaire": Brand.blue
        case "Pro": Brand.orange
        default: Brand.blue
        }
    }
}
