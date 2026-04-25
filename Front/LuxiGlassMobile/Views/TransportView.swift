import SwiftUI

struct TransportView: View {
    @State private var selectedTab: String = "Trajets"
    @State private var appeared: Bool = false
    @State private var tabTrigger: Int = 0

    private let tabs = ["Trajets", "Location"]

    var body: some View {
        ScrollView {
            VStack(spacing: MossombiSpacing.lg) {
                segmentedControl
                if selectedTab == "Trajets" {
                    tripsOverview
                } else {
                    rentalOverview
                }
            }
            .padding(.horizontal, MossombiSpacing.md)
            .padding(.bottom, MossombiSpacing.xxl)
            .opacity(appeared ? 1 : 0)
            .offset(y: appeared ? 0 : 10)
        }
        .scrollIndicators(.hidden)
        .background { AppBackground() }
        .navigationTitle("Transport")
        .navigationBarTitleDisplayMode(.large)
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.8).delay(0.05)) {
                appeared = true
            }
        }
    }

    private var segmentedControl: some View {
        HStack(spacing: 0) {
            ForEach(tabs, id: \.self) { tab in
                Button {
                    withAnimation(.snappy) { selectedTab = tab }
                    tabTrigger += 1
                } label: {
                    Text(tab)
                        .font(.subheadline.weight(.semibold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, MossombiSpacing.sm)
                        .foregroundStyle(selectedTab == tab ? .white : .primary)
                        .background {
                            if selectedTab == tab {
                                RoundedRectangle(cornerRadius: MossombiRadius.sm, style: .continuous)
                                    .fill(Brand.linearGradientHorizontal)
                            }
                        }
                }
                .sensoryFeedback(.selection, trigger: tabTrigger)
            }
        }
        .background {
            RoundedRectangle(cornerRadius: MossombiRadius.sm, style: .continuous)
                .fill(.ultraThinMaterial)
                .overlay {
                    RoundedRectangle(cornerRadius: MossombiRadius.sm, style: .continuous)
                        .strokeBorder(MossombiColors.glassBorder, lineWidth: 0.5)
                }
        }
    }

    private var tripsOverview: some View {
        VStack(spacing: MossombiSpacing.lg) {
            NavigationLink(value: AppRoute.tripSearch) {
                BrandGradientCard {
                    HStack(spacing: MossombiSpacing.md) {
                        VStack(alignment: .leading, spacing: MossombiSpacing.xs) {
                            Text("Rechercher un trajet")
                                .font(.headline)
                                .foregroundStyle(.white)
                            Text("Taxi, Bus, Train, Canot rapide")
                                .font(.caption)
                                .foregroundStyle(.white.opacity(0.8))
                        }
                        Spacer()
                        ZStack {
                            Circle().fill(.white.opacity(0.15)).frame(width: 52, height: 52)
                            Image(systemName: "magnifyingglass")
                                .font(.title3.weight(.semibold))
                                .foregroundStyle(.white)
                        }
                    }
                    .padding(MossombiSpacing.md)
                }
            }
            .buttonStyle(PremiumPressStyle())

            VStack(alignment: .leading, spacing: MossombiSpacing.sm) {
                Text("Trajets récents")
                    .font(.headline)

                ForEach(MockData.trips.prefix(3)) { trip in
                    TripCard(trip: trip)
                }
            }
        }
    }

    private var rentalOverview: some View {
        VStack(spacing: MossombiSpacing.lg) {
            NavigationLink(value: AppRoute.rentalSearch) {
                BrandGradientCard {
                    HStack(spacing: MossombiSpacing.md) {
                        VStack(alignment: .leading, spacing: MossombiSpacing.xs) {
                            Text("Louer un véhicule")
                                .font(.headline)
                                .foregroundStyle(.white)
                            Text("Berline, SUV, Luxe, Pickup")
                                .font(.caption)
                                .foregroundStyle(.white.opacity(0.8))
                        }
                        Spacer()
                        ZStack {
                            Circle().fill(.white.opacity(0.15)).frame(width: 52, height: 52)
                            Image(systemName: "car.fill")
                                .font(.title3.weight(.semibold))
                                .foregroundStyle(.white)
                        }
                    }
                    .padding(MossombiSpacing.md)
                }
            }
            .buttonStyle(PremiumPressStyle())

            VStack(alignment: .leading, spacing: MossombiSpacing.sm) {
                Text("Véhicules populaires")
                    .font(.headline)

                ForEach(MockData.rentalCars.prefix(3)) { car in
                    RentalCarCard(car: car)
                }
            }
        }
    }
}

struct TripCard: View {
    let trip: Trip

    var body: some View {
        Card3D(radius: MossombiRadius.md, padding: MossombiSpacing.md) {
            VStack(spacing: MossombiSpacing.sm) {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(trip.from)
                            .font(.headline)
                        Text(trip.departureTime)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }

                    Spacer()

                    VStack(spacing: MossombiSpacing.xxs) {
                        Image(systemName: trip.icon)
                            .font(.body)
                            .foregroundStyle(Brand.linearGradient)
                        HStack(spacing: 2) {
                            Circle().fill(Brand.cyan).frame(width: 4, height: 4)
                            Rectangle().fill(Brand.linearGradientHorizontal).frame(height: 1)
                            Circle().fill(Brand.violet).frame(width: 4, height: 4)
                        }
                        .frame(width: 60)
                        Text(trip.type)
                            .font(.system(size: 9, weight: .medium))
                            .foregroundStyle(.secondary)
                    }

                    Spacer()

                    VStack(alignment: .trailing, spacing: 2) {
                        Text(trip.to)
                            .font(.headline)
                        Text(trip.arrivalTime)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }

                Divider()

                HStack {
                    Text("\(Int(trip.price).formatted(.number.grouping(.automatic))) F")
                        .font(.headline.weight(.bold))
                        .foregroundStyle(Brand.linearGradient)

                    if let badge = trip.badge {
                        Text(badge)
                            .font(.system(size: 9, weight: .bold))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(tripBadgeColor(badge), in: .capsule)
                    }

                    Spacer()

                    HStack(spacing: MossombiSpacing.xxs) {
                        Image(systemName: "person.fill")
                            .font(.system(size: 10))
                            .foregroundStyle(.secondary)
                        Text("\(trip.seatsLeft) places")
                            .font(.caption)
                            .foregroundStyle(trip.seatsLeft <= 5 ? MossombiColors.danger : .secondary)
                    }

                    Button {} label: {
                        Text("Réserver")
                            .font(.caption.weight(.bold))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Brand.linearGradientHorizontal, in: .capsule)
                    }
                }
            }
        }
    }

    private func tripBadgeColor(_ badge: String) -> Color {
        switch badge {
        case "VIP": Brand.violet
        case "Nouveau": Brand.cyan
        case "Populaire": Brand.blue
        case "Recommandé": MossombiColors.success
        default: Brand.blue
        }
    }
}

struct RentalCarCard: View {
    let car: RentalCar

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
                    Image(systemName: car.icon)
                        .font(.system(size: 28, weight: .light))
                        .foregroundStyle(Brand.linearGradient)
                }

                VStack(alignment: .leading, spacing: MossombiSpacing.xxs) {
                    HStack {
                        Text(car.name)
                            .font(.subheadline.weight(.semibold))
                        if let badge = car.badge {
                            Text(badge)
                                .font(.system(size: 8, weight: .bold))
                                .foregroundStyle(.white)
                                .padding(.horizontal, 5)
                                .padding(.vertical, 2)
                                .background(Brand.violet, in: .capsule)
                        }
                    }

                    Text(car.type)
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    HStack(spacing: MossombiSpacing.sm) {
                        HStack(spacing: 2) {
                            Image(systemName: "person.fill")
                                .font(.system(size: 9))
                            Text("\(car.seats)")
                                .font(.system(size: 10))
                        }
                        .foregroundStyle(.secondary)

                        HStack(spacing: 2) {
                            Image(systemName: "gearshape.fill")
                                .font(.system(size: 9))
                            Text(car.transmission)
                                .font(.system(size: 10))
                        }
                        .foregroundStyle(.secondary)
                    }
                }

                Spacer()

                VStack(alignment: .trailing, spacing: MossombiSpacing.xxs) {
                    Text("\(Int(car.pricePerDay).formatted(.number.grouping(.automatic))) F")
                        .font(.subheadline.weight(.bold))
                        .foregroundStyle(Brand.linearGradient)
                    Text("/jour")
                        .font(.system(size: 9))
                        .foregroundStyle(.tertiary)
                }
            }
        }
    }
}
