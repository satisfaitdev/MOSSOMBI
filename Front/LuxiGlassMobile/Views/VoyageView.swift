import SwiftUI

struct VoyageView: View {
    @State private var appeared: Bool = false

    private let serviceNames = ["Vols", "Hôtels & Apparts", "Visa", "Guide touristique"]
    private let serviceIcons = ["airplane.departure", "building.2.fill", "doc.text.fill", "map.fill"]
    private let serviceSubtitles = ["Rechercher des vols", "Trouver un hébergement", "Assistance visa", "Découvrir des lieux"]
    private let serviceRoutes: [AppRoute] = [.flightSearch, .hotelSearch, .visaAssistance, .touristGuide]

    var body: some View {
        ScrollView {
            VStack(spacing: MossombiSpacing.xl) {
                heroBanner
                servicesGrid
                popularFlights
                popularHotels
            }
            .padding(.horizontal, MossombiSpacing.md)
            .padding(.bottom, MossombiSpacing.xxl)
            .opacity(appeared ? 1 : 0)
            .offset(y: appeared ? 0 : 10)
        }
        .scrollIndicators(.hidden)
        .background { AppBackground() }
        .navigationTitle("Voyage")
        .navigationBarTitleDisplayMode(.large)
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.8).delay(0.05)) {
                appeared = true
            }
        }
    }

    private var heroBanner: some View {
        BrandGradientCard {
            VStack(alignment: .leading, spacing: MossombiSpacing.sm) {
                HStack {
                    VStack(alignment: .leading, spacing: MossombiSpacing.xs) {
                        Text("Explorez le monde")
                            .font(.title3.weight(.bold))
                            .foregroundStyle(.white)
                        Text("Vols, hôtels, visa et guides touristiques")
                            .font(.caption)
                            .foregroundStyle(.white.opacity(0.8))
                    }
                    Spacer()
                    ZStack {
                        Circle().fill(.white.opacity(0.15)).frame(width: 56, height: 56)
                        Image(systemName: "globe.europe.africa.fill")
                            .font(.title2.weight(.semibold))
                            .foregroundStyle(.white)
                    }
                }
            }
            .padding(MossombiSpacing.md)
        }
    }

    private var servicesGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible(), spacing: MossombiSpacing.sm), GridItem(.flexible(), spacing: MossombiSpacing.sm)], spacing: MossombiSpacing.sm) {
            ForEach(Array(serviceNames.enumerated()), id: \.offset) { index, name in
                NavigationLink(value: serviceRoutes[index]) {
                    Card3D(radius: MossombiRadius.lg, padding: MossombiSpacing.md) {
                        VStack(spacing: MossombiSpacing.sm) {
                            IconBubble3D(serviceIcons[index], size: 22, bubbleSize: 52)
                            Text(name)
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(.primary)
                            Text(serviceSubtitles[index])
                                .font(.system(size: 10))
                                .foregroundStyle(.secondary)
                                .multilineTextAlignment(.center)
                                .lineLimit(2)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, MossombiSpacing.xs)
                    }
                }
                .buttonStyle(PremiumPressStyle())
            }
        }
    }

    private var popularFlights: some View {
        VStack(alignment: .leading, spacing: MossombiSpacing.sm) {
            HStack {
                Text("Vols populaires")
                    .font(.headline)
                Spacer()
                NavigationLink(value: AppRoute.flightSearch) {
                    Text("Voir tout")
                        .font(.caption.weight(.medium))
                        .foregroundStyle(Brand.linearGradient)
                }
            }

            ScrollView(.horizontal) {
                HStack(spacing: MossombiSpacing.sm) {
                    ForEach(MockData.flights.prefix(3)) { flight in
                        Card3D(radius: MossombiRadius.md, padding: MossombiSpacing.sm) {
                            VStack(alignment: .leading, spacing: MossombiSpacing.xs) {
                                HStack {
                                    Text(flight.from)
                                        .font(.subheadline.weight(.bold))
                                    Image(systemName: "airplane")
                                        .font(.caption)
                                        .foregroundStyle(Brand.linearGradient)
                                    Text(flight.to)
                                        .font(.subheadline.weight(.bold))
                                }
                                Text(flight.airline)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                                Text("\(Int(flight.price).formatted(.number.grouping(.automatic))) F")
                                    .font(.subheadline.weight(.bold))
                                    .foregroundStyle(Brand.linearGradient)
                            }
                            .frame(width: 160)
                        }
                    }
                }
            }
            .contentMargins(.horizontal, 0)
            .scrollIndicators(.hidden)
        }
    }

    private var popularHotels: some View {
        VStack(alignment: .leading, spacing: MossombiSpacing.sm) {
            HStack {
                Text("Hôtels recommandés")
                    .font(.headline)
                Spacer()
                NavigationLink(value: AppRoute.hotelSearch) {
                    Text("Voir tout")
                        .font(.caption.weight(.medium))
                        .foregroundStyle(Brand.linearGradient)
                }
            }

            ForEach(MockData.hotels.prefix(2)) { hotel in
                HotelCard(hotel: hotel)
            }
        }
    }
}

struct FlightCard: View {
    let flight: Flight

    var body: some View {
        Card3D(radius: MossombiRadius.md, padding: MossombiSpacing.md) {
            VStack(spacing: MossombiSpacing.sm) {
                HStack {
                    Text(flight.airline)
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                    Spacer()
                    if let badge = flight.badge {
                        Text(badge)
                            .font(.system(size: 9, weight: .bold))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(flightBadgeColor(badge), in: .capsule)
                    }
                }

                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(flight.from)
                            .font(.title3.weight(.bold))
                        Text(flight.date)
                            .font(.system(size: 10))
                            .foregroundStyle(.secondary)
                    }

                    Spacer()

                    VStack(spacing: MossombiSpacing.xxs) {
                        Image(systemName: "airplane")
                            .font(.body)
                            .foregroundStyle(Brand.linearGradient)
                        HStack(spacing: 2) {
                            Circle().fill(Brand.cyan).frame(width: 4, height: 4)
                            Rectangle().fill(Brand.linearGradientHorizontal).frame(height: 1)
                            Circle().fill(Brand.violet).frame(width: 4, height: 4)
                        }
                        .frame(width: 60)
                        Text(flight.duration)
                            .font(.system(size: 9, weight: .medium))
                            .foregroundStyle(.secondary)
                    }

                    Spacer()

                    VStack(alignment: .trailing, spacing: 2) {
                        Text(flight.to)
                            .font(.title3.weight(.bold))
                    }
                }

                Divider()

                HStack {
                    Text("\(Int(flight.price).formatted(.number.grouping(.automatic))) F")
                        .font(.headline.weight(.bold))
                        .foregroundStyle(Brand.linearGradient)
                    Spacer()
                    Button {} label: {
                        Text("Réserver")
                            .font(.caption.weight(.bold))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 7)
                            .background(Brand.linearGradientHorizontal, in: .capsule)
                    }
                }
            }
        }
    }

    private func flightBadgeColor(_ badge: String) -> Color {
        switch badge {
        case "Direct": MossombiColors.success
        case "Promo": MossombiColors.danger
        case "Recommandé": Brand.violet
        default: Brand.blue
        }
    }
}

struct HotelCard: View {
    let hotel: Hotel

    var body: some View {
        Card3D(radius: MossombiRadius.md, padding: MossombiSpacing.md) {
            HStack(spacing: MossombiSpacing.md) {
                ZStack {
                    RoundedRectangle(cornerRadius: MossombiRadius.sm, style: .continuous)
                        .fill(
                            LinearGradient(
                                colors: [Brand.cyan.opacity(0.1), Brand.violet.opacity(0.08)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 72, height: 72)
                    Image(systemName: hotel.icon)
                        .font(.system(size: 28, weight: .light))
                        .foregroundStyle(Brand.linearGradient)
                }

                VStack(alignment: .leading, spacing: MossombiSpacing.xxs) {
                    HStack {
                        Text(hotel.name)
                            .font(.subheadline.weight(.semibold))
                        if let badge = hotel.badge {
                            Text(badge)
                                .font(.system(size: 8, weight: .bold))
                                .foregroundStyle(.white)
                                .padding(.horizontal, 5)
                                .padding(.vertical, 2)
                                .background(Brand.violet, in: .capsule)
                        }
                    }
                    Text(hotel.location)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    HStack(spacing: 2) {
                        Image(systemName: "star.fill")
                            .font(.system(size: 9))
                            .foregroundStyle(MossombiColors.warning)
                        Text(String(format: "%.1f", hotel.rating))
                            .font(.system(size: 10, weight: .medium))
                            .foregroundStyle(.secondary)
                    }
                }

                Spacer()

                VStack(alignment: .trailing, spacing: MossombiSpacing.xxs) {
                    Text("\(Int(hotel.pricePerNight).formatted(.number.grouping(.automatic))) F")
                        .font(.subheadline.weight(.bold))
                        .foregroundStyle(Brand.linearGradient)
                    Text("/nuit")
                        .font(.system(size: 9))
                        .foregroundStyle(.tertiary)
                }
            }
        }
    }
}
