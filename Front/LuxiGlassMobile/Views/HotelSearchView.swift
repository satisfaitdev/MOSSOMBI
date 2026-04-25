import SwiftUI

struct HotelSearchView: View {
    @State private var searchText: String = ""
    @State private var selectedCity: String = "Toutes"
    @State private var priceRange: String = "Tous"
    @State private var appeared: Bool = false
    @State private var filterTrigger: Int = 0

    private let cities = ["Toutes", "Dakar", "Saly", "Saint-Louis"]
    private let priceRanges = ["Tous", "< 50 000", "50-100 000", "> 100 000"]

    private var filteredHotels: [Hotel] {
        var results = MockData.hotels
        if !searchText.isEmpty {
            results = results.filter { $0.name.localizedStandardContains(searchText) || $0.location.localizedStandardContains(searchText) }
        }
        if selectedCity != "Toutes" {
            results = results.filter { $0.location.localizedStandardContains(selectedCity) }
        }
        switch priceRange {
        case "< 50 000": results = results.filter { $0.pricePerNight < 50000 }
        case "50-100 000": results = results.filter { $0.pricePerNight >= 50000 && $0.pricePerNight <= 100000 }
        case "> 100 000": results = results.filter { $0.pricePerNight > 100000 }
        default: break
        }
        return results
    }

    var body: some View {
        ScrollView {
            VStack(spacing: MossombiSpacing.lg) {
                PremiumInput("Rechercher un hôtel, quartier, ville...", text: $searchText, icon: "magnifyingglass")
                cityFilter
                priceFilter
                resultsList
            }
            .padding(.horizontal, MossombiSpacing.md)
            .padding(.bottom, MossombiSpacing.xxl)
            .opacity(appeared ? 1 : 0)
            .offset(y: appeared ? 0 : 10)
        }
        .scrollIndicators(.hidden)
        .background { AppBackground() }
        .navigationTitle("Hôtels & Apparts")
        .navigationBarTitleDisplayMode(.large)
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.8).delay(0.05)) {
                appeared = true
            }
        }
    }

    private var cityFilter: some View {
        VStack(alignment: .leading, spacing: MossombiSpacing.xs) {
            Text("Ville")
                .font(.subheadline.weight(.medium))
                .foregroundStyle(.secondary)
            ScrollView(.horizontal) {
                HStack(spacing: MossombiSpacing.xs) {
                    ForEach(cities, id: \.self) { city in
                        Button {
                            withAnimation(.snappy) { selectedCity = city }
                            filterTrigger += 1
                        } label: {
                            Text(city)
                                .font(.subheadline.weight(.medium))
                                .padding(.horizontal, MossombiSpacing.md)
                                .padding(.vertical, MossombiSpacing.xs)
                                .foregroundStyle(selectedCity == city ? .white : .primary)
                                .background {
                                    if selectedCity == city {
                                        Capsule(style: .continuous).fill(Brand.linearGradientHorizontal)
                                    } else {
                                        Capsule(style: .continuous).fill(.ultraThinMaterial)
                                            .overlay { Capsule(style: .continuous).strokeBorder(MossombiColors.glassBorder, lineWidth: 0.5) }
                                    }
                                }
                        }
                        .sensoryFeedback(.selection, trigger: filterTrigger)
                    }
                }
            }
            .contentMargins(.horizontal, 0)
            .scrollIndicators(.hidden)
        }
    }

    private var priceFilter: some View {
        VStack(alignment: .leading, spacing: MossombiSpacing.xs) {
            Text("Budget par nuit")
                .font(.subheadline.weight(.medium))
                .foregroundStyle(.secondary)
            ScrollView(.horizontal) {
                HStack(spacing: MossombiSpacing.xs) {
                    ForEach(priceRanges, id: \.self) { range in
                        Button {
                            withAnimation(.snappy) { priceRange = range }
                        } label: {
                            Text(range)
                                .font(.caption.weight(.medium))
                                .padding(.horizontal, MossombiSpacing.sm)
                                .padding(.vertical, MossombiSpacing.xs)
                                .foregroundStyle(priceRange == range ? .white : .primary)
                                .background {
                                    if priceRange == range {
                                        Capsule(style: .continuous).fill(Brand.linearGradientHorizontal)
                                    } else {
                                        Capsule(style: .continuous).fill(.ultraThinMaterial)
                                            .overlay { Capsule(style: .continuous).strokeBorder(MossombiColors.glassBorder, lineWidth: 0.5) }
                                    }
                                }
                        }
                    }
                }
            }
            .contentMargins(.horizontal, 0)
            .scrollIndicators(.hidden)
        }
    }

    private var resultsList: some View {
        VStack(alignment: .leading, spacing: MossombiSpacing.sm) {
            Text("\(filteredHotels.count) hébergement\(filteredHotels.count > 1 ? "s" : "")")
                .font(.headline)

            if filteredHotels.isEmpty {
                Card3D(radius: MossombiRadius.md, padding: MossombiSpacing.xl) {
                    VStack(spacing: MossombiSpacing.sm) {
                        Image(systemName: "building.2")
                            .font(.largeTitle)
                            .foregroundStyle(.tertiary)
                        Text("Aucun hébergement trouvé")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                }
            } else {
                ForEach(filteredHotels) { hotel in
                    HotelDetailCard(hotel: hotel)
                }
            }
        }
    }
}

struct HotelDetailCard: View {
    let hotel: Hotel
    @State private var showBooking: Bool = false

    var body: some View {
        Card3D(radius: MossombiRadius.lg, padding: MossombiSpacing.md) {
            VStack(spacing: MossombiSpacing.md) {
                ZStack(alignment: .topTrailing) {
                    RoundedRectangle(cornerRadius: MossombiRadius.md, style: .continuous)
                        .fill(
                            LinearGradient(
                                colors: [Brand.cyan.opacity(0.1), Brand.violet.opacity(0.08)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(height: 120)
                        .overlay {
                            Image(systemName: "building.2.fill")
                                .font(.system(size: 44, weight: .light))
                                .foregroundStyle(Brand.linearGradient)
                        }

                    if let badge = hotel.badge {
                        Text(badge)
                            .font(.system(size: 9, weight: .bold))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 3)
                            .background(Brand.violet, in: .capsule)
                            .padding(MossombiSpacing.xs)
                    }
                }

                VStack(alignment: .leading, spacing: MossombiSpacing.xs) {
                    Text(hotel.name)
                        .font(.headline)
                    Text(hotel.location)
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    HStack(spacing: MossombiSpacing.sm) {
                        HStack(spacing: 2) {
                            Image(systemName: "star.fill")
                                .font(.system(size: 10))
                                .foregroundStyle(MossombiColors.warning)
                            Text(String(format: "%.1f", hotel.rating))
                                .font(.caption.weight(.medium))
                        }
                        Spacer()
                        VStack(alignment: .trailing, spacing: 0) {
                            Text("\(Int(hotel.pricePerNight).formatted(.number.grouping(.automatic))) F")
                                .font(.headline.weight(.bold))
                                .foregroundStyle(Brand.linearGradient)
                            Text("/nuit")
                                .font(.system(size: 10))
                                .foregroundStyle(.tertiary)
                        }
                    }
                }

                Button { showBooking = true } label: {
                    Text("Réserver")
                        .font(.subheadline.weight(.bold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, MossombiSpacing.sm)
                        .background(Brand.linearGradientHorizontal, in: .capsule)
                }
            }
        }
        .sheet(isPresented: $showBooking) {
            HotelBookingSheet(hotel: hotel)
        }
    }
}

struct HotelBookingSheet: View {
    let hotel: Hotel
    @Environment(\.dismiss) private var dismiss
    @State private var nights: Int = 1
    @State private var booked: Bool = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: MossombiSpacing.xl) {
                    if booked {
                        VStack(spacing: MossombiSpacing.lg) {
                            Spacer().frame(height: 20)
                            ZStack {
                                Circle().fill(MossombiColors.success.opacity(0.12)).frame(width: 100, height: 100)
                                Image(systemName: "checkmark.circle.fill")
                                    .font(.system(size: 48))
                                    .foregroundStyle(MossombiColors.success)
                            }
                            Text("Réservation confirmée!")
                                .font(.title3.weight(.bold))
                            Text("\(hotel.name) • \(nights) nuit\(nights > 1 ? "s" : "")")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                    } else {
                        VStack(spacing: MossombiSpacing.md) {
                            Text(hotel.name)
                                .font(.title3.weight(.bold))
                            Text(hotel.location)
                                .font(.subheadline)
                                .foregroundStyle(.secondary)

                            Card3D(radius: MossombiRadius.md, padding: MossombiSpacing.md) {
                                HStack {
                                    Text("Nuits").font(.subheadline.weight(.medium))
                                    Spacer()
                                    HStack(spacing: MossombiSpacing.md) {
                                        Button { if nights > 1 { nights -= 1 } } label: {
                                            Image(systemName: "minus.circle.fill").font(.title3)
                                                .foregroundStyle(nights > 1 ? AnyShapeStyle(Brand.linearGradient) : AnyShapeStyle(.tertiary))
                                        }
                                        Text("\(nights)").font(.headline).frame(width: 40)
                                        Button { if nights < 30 { nights += 1 } } label: {
                                            Image(systemName: "plus.circle.fill").font(.title3)
                                                .foregroundStyle(Brand.linearGradient)
                                        }
                                    }
                                }
                            }

                            Card3D(radius: MossombiRadius.md, padding: MossombiSpacing.md) {
                                VStack(spacing: MossombiSpacing.sm) {
                                    HStack {
                                        Text("Prix/nuit").font(.subheadline).foregroundStyle(.secondary)
                                        Spacer()
                                        Text("\(Int(hotel.pricePerNight).formatted(.number.grouping(.automatic))) F").font(.subheadline.weight(.medium))
                                    }
                                    Divider()
                                    HStack {
                                        Text("Total").font(.headline)
                                        Spacer()
                                        Text("\(Int(hotel.pricePerNight * Double(nights)).formatted(.number.grouping(.automatic))) F")
                                            .font(.title3.weight(.bold))
                                            .foregroundStyle(Brand.linearGradient)
                                    }
                                }
                            }

                            PremiumButton("Confirmer", icon: "checkmark", variant: .primary) {
                                withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                                    booked = true
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal, MossombiSpacing.md)
                .padding(.top, MossombiSpacing.md)
            }
            .background { AppBackground() }
            .navigationTitle("Réservation")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { dismiss() } label: {
                        Image(systemName: "xmark.circle.fill").font(.title3).foregroundStyle(.tertiary)
                    }
                }
            }
        }
    }
}
