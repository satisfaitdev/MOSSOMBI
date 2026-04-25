import SwiftUI

struct ServicesPublicView: View {
    @State private var appeared: Bool = false

    var body: some View {
        ScrollView {
            VStack(spacing: MossombiSpacing.lg) {
                totalBillCard
                servicesList
            }
            .padding(.horizontal, MossombiSpacing.md)
            .padding(.bottom, MossombiSpacing.xxl)
            .opacity(appeared ? 1 : 0)
            .offset(y: appeared ? 0 : 10)
        }
        .scrollIndicators(.hidden)
        .background { AppBackground() }
        .navigationTitle("Services publics")
        .navigationBarTitleDisplayMode(.large)
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.8).delay(0.05)) {
                appeared = true
            }
        }
    }

    private var totalBillCard: some View {
        BrandGradientCard {
            VStack(spacing: MossombiSpacing.md) {
                HStack {
                    VStack(alignment: .leading, spacing: MossombiSpacing.xxs) {
                        Text("Total factures ce mois")
                            .font(.subheadline)
                            .foregroundStyle(.white.opacity(0.7))
                        let total = MockData.publicServices.reduce(0) { $0 + $1.amount }
                        Text("\(Int(total).formatted(.number.grouping(.automatic))) F")
                            .font(.system(size: 28, weight: .bold, design: .rounded))
                            .foregroundStyle(.white)
                    }
                    Spacer()
                    ZStack {
                        Circle()
                            .fill(.white.opacity(0.15))
                            .frame(width: 50, height: 50)
                        Image(systemName: "building.fill")
                            .font(.title3.weight(.semibold))
                            .foregroundStyle(.white)
                    }
                }

                Button {} label: {
                    Text("Tout payer")
                        .font(.subheadline.weight(.bold))
                        .foregroundStyle(Brand.cyan)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(.white.opacity(0.2), in: .capsule)
                }
            }
            .padding(MossombiSpacing.lg)
        }
    }

    private var servicesList: some View {
        VStack(alignment: .leading, spacing: MossombiSpacing.sm) {
            Text("Vos services")
                .font(.headline)

            ForEach(MockData.publicServices) { service in
                PublicServiceCard(service: service)
            }
        }
    }
}

struct PublicServiceCard: View {
    let service: PublicService

    var body: some View {
        Card3D(radius: MossombiRadius.md, padding: MossombiSpacing.md) {
            HStack(spacing: MossombiSpacing.md) {
                IconBubble3D(service.icon, size: 20, bubbleSize: 44)

                VStack(alignment: .leading, spacing: MossombiSpacing.xxs) {
                    HStack {
                        Text(service.name)
                            .font(.subheadline.weight(.semibold))
                        if let badge = service.badge {
                            Text(badge)
                                .font(.system(size: 8, weight: .bold))
                                .foregroundStyle(.white)
                                .padding(.horizontal, 5)
                                .padding(.vertical, 2)
                                .background(publicBadgeColor(badge), in: .capsule)
                        }
                    }
                    Text(service.provider)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text("Dernier: \(service.lastPayment)")
                        .font(.system(size: 10))
                        .foregroundStyle(.tertiary)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: MossombiSpacing.xxs) {
                    Text("\(Int(service.amount).formatted(.number.grouping(.automatic))) F")
                        .font(.subheadline.weight(.bold))
                        .foregroundStyle(Brand.linearGradient)
                    Button {} label: {
                        Text("Payer")
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

    private func publicBadgeColor(_ badge: String) -> Color {
        switch badge {
        case "Actif": MossombiColors.success
        case "Nouveau": Brand.cyan
        case "En cours": MossombiColors.warning
        default: Brand.blue
        }
    }
}
