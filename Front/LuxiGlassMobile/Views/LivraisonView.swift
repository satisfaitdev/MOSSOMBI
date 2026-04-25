import SwiftUI

struct LivraisonView: View {
    @State private var appeared: Bool = false

    var body: some View {
        ScrollView {
            VStack(spacing: MossombiSpacing.lg) {
                quickDeliveryBanner
                deliveryList
            }
            .padding(.horizontal, MossombiSpacing.md)
            .padding(.bottom, MossombiSpacing.xxl)
            .opacity(appeared ? 1 : 0)
            .offset(y: appeared ? 0 : 10)
        }
        .scrollIndicators(.hidden)
        .background { AppBackground() }
        .navigationTitle("Livraison")
        .navigationBarTitleDisplayMode(.large)
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.8).delay(0.05)) {
                appeared = true
            }
        }
    }

    private var quickDeliveryBanner: some View {
        BrandGradientCard {
            HStack(spacing: MossombiSpacing.md) {
                VStack(alignment: .leading, spacing: MossombiSpacing.xs) {
                    Text("Livraison Express")
                        .font(.headline)
                        .foregroundStyle(.white)
                    Text("Recevez vos colis en 2h dans tout Dakar")
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.8))
                    Text("Commander")
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
                    Image(systemName: "shippingbox.fill")
                        .font(.title2.weight(.semibold))
                        .foregroundStyle(.white)
                }
            }
            .padding(MossombiSpacing.md)
        }
    }

    private var deliveryList: some View {
        VStack(alignment: .leading, spacing: MossombiSpacing.sm) {
            Text("Services de livraison")
                .font(.headline)

            ForEach(MockData.deliveryItems) { item in
                DeliveryCard(item: item)
            }
        }
    }
}

struct DeliveryCard: View {
    let item: DeliveryItem

    var body: some View {
        Card3D(radius: MossombiRadius.md, padding: MossombiSpacing.md) {
            HStack(spacing: MossombiSpacing.md) {
                IconBubble3D(item.icon, size: 20, bubbleSize: 44)

                VStack(alignment: .leading, spacing: MossombiSpacing.xxs) {
                    HStack {
                        Text(item.title)
                            .font(.subheadline.weight(.semibold))
                        if let badge = item.badge {
                            Text(badge)
                                .font(.system(size: 8, weight: .bold))
                                .foregroundStyle(.white)
                                .padding(.horizontal, 5)
                                .padding(.vertical, 2)
                                .background(deliveryBadgeColor(badge), in: .capsule)
                        }
                    }
                    Text(item.subtitle)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    HStack(spacing: MossombiSpacing.xs) {
                        HStack(spacing: 2) {
                            Image(systemName: "clock.fill")
                                .font(.system(size: 9))
                            Text(item.estimatedTime)
                                .font(.system(size: 10))
                        }
                        .foregroundStyle(.secondary)
                    }
                }

                Spacer()

                VStack(alignment: .trailing, spacing: MossombiSpacing.xxs) {
                    Text("\(Int(item.price).formatted(.number.grouping(.automatic))) F")
                        .font(.subheadline.weight(.bold))
                        .foregroundStyle(Brand.linearGradient)
                    Button {} label: {
                        Text("Choisir")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 5)
                            .background(Brand.linearGradientHorizontal, in: .capsule)
                    }
                }
            }
        }
    }

    private func deliveryBadgeColor(_ badge: String) -> Color {
        switch badge {
        case "Rapide": Brand.cyan
        case "Populaire": Brand.blue
        case "Premium": Brand.violet
        case "Nouveau": MossombiColors.success
        default: Brand.blue
        }
    }
}
