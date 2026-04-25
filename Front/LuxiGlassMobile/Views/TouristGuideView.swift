import SwiftUI

struct TouristGuideView: View {
    @State private var searchText: String = ""
    @State private var selectedCountry: String = "Tous"
    @State private var selectedCategory: String = "Tous"
    @State private var appeared: Bool = false
    @State private var filterTrigger: Int = 0

    private let countries: [String] = {
        var c = Set(MockData.touristPlaces.map(\.country))
        return ["Tous"] + c.sorted()
    }()

    private let categories: [String] = {
        var c = Set(MockData.touristPlaces.map(\.category))
        return ["Tous"] + c.sorted()
    }()

    private var filteredPlaces: [TouristPlace] {
        var results = MockData.touristPlaces
        if !searchText.isEmpty {
            results = results.filter {
                $0.name.localizedStandardContains(searchText) ||
                $0.city.localizedStandardContains(searchText) ||
                $0.country.localizedStandardContains(searchText)
            }
        }
        if selectedCountry != "Tous" {
            results = results.filter { $0.country == selectedCountry }
        }
        if selectedCategory != "Tous" {
            results = results.filter { $0.category == selectedCategory }
        }
        return results
    }

    var body: some View {
        ScrollView {
            VStack(spacing: MossombiSpacing.lg) {
                PremiumInput("Rechercher un lieu, ville, pays...", text: $searchText, icon: "magnifyingglass")
                countryFilter
                categoryFilter
                placesList
            }
            .padding(.horizontal, MossombiSpacing.md)
            .padding(.bottom, MossombiSpacing.xxl)
            .opacity(appeared ? 1 : 0)
            .offset(y: appeared ? 0 : 10)
        }
        .scrollIndicators(.hidden)
        .background { AppBackground() }
        .navigationTitle("Guide touristique")
        .navigationBarTitleDisplayMode(.large)
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.8).delay(0.05)) {
                appeared = true
            }
        }
    }

    private var countryFilter: some View {
        VStack(alignment: .leading, spacing: MossombiSpacing.xs) {
            Text("Pays")
                .font(.subheadline.weight(.medium))
                .foregroundStyle(.secondary)
            ScrollView(.horizontal) {
                HStack(spacing: MossombiSpacing.xs) {
                    ForEach(countries, id: \.self) { country in
                        Button {
                            withAnimation(.snappy) { selectedCountry = country }
                            filterTrigger += 1
                        } label: {
                            Text(country)
                                .font(.subheadline.weight(.medium))
                                .padding(.horizontal, MossombiSpacing.md)
                                .padding(.vertical, MossombiSpacing.xs)
                                .foregroundStyle(selectedCountry == country ? .white : .primary)
                                .background {
                                    if selectedCountry == country {
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

    private var categoryFilter: some View {
        VStack(alignment: .leading, spacing: MossombiSpacing.xs) {
            Text("Catégorie")
                .font(.subheadline.weight(.medium))
                .foregroundStyle(.secondary)
            ScrollView(.horizontal) {
                HStack(spacing: MossombiSpacing.xs) {
                    ForEach(categories, id: \.self) { cat in
                        Button {
                            withAnimation(.snappy) { selectedCategory = cat }
                        } label: {
                            Text(cat)
                                .font(.caption.weight(.medium))
                                .padding(.horizontal, MossombiSpacing.sm)
                                .padding(.vertical, MossombiSpacing.xs)
                                .foregroundStyle(selectedCategory == cat ? .white : .primary)
                                .background {
                                    if selectedCategory == cat {
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

    private var placesList: some View {
        VStack(alignment: .leading, spacing: MossombiSpacing.sm) {
            Text("\(filteredPlaces.count) lieu\(filteredPlaces.count > 1 ? "x" : "") touristique\(filteredPlaces.count > 1 ? "s" : "")")
                .font(.headline)

            if filteredPlaces.isEmpty {
                Card3D(radius: MossombiRadius.md, padding: MossombiSpacing.xl) {
                    VStack(spacing: MossombiSpacing.sm) {
                        Image(systemName: "map")
                            .font(.largeTitle)
                            .foregroundStyle(.tertiary)
                        Text("Aucun lieu trouvé")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                }
            } else {
                ForEach(filteredPlaces) { place in
                    TouristPlaceCard(place: place)
                }
            }
        }
    }
}

struct TouristPlaceCard: View {
    let place: TouristPlace

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
                        .frame(height: 100)
                        .overlay {
                            Image(systemName: place.icon)
                                .font(.system(size: 36, weight: .light))
                                .foregroundStyle(Brand.linearGradient)
                        }

                    Text(place.category)
                        .font(.system(size: 9, weight: .bold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(Brand.violet, in: .capsule)
                        .padding(MossombiSpacing.xs)
                }

                VStack(alignment: .leading, spacing: MossombiSpacing.xs) {
                    Text(place.name)
                        .font(.headline)

                    HStack(spacing: MossombiSpacing.xs) {
                        Image(systemName: "mappin.circle.fill")
                            .font(.system(size: 11))
                            .foregroundStyle(Brand.linearGradient)
                        Text("\(place.city), \(place.country)")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }

                    Text(place.description)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(2)

                    HStack {
                        HStack(spacing: 2) {
                            Image(systemName: "star.fill")
                                .font(.system(size: 10))
                                .foregroundStyle(MossombiColors.warning)
                            Text(String(format: "%.1f", place.rating))
                                .font(.caption.weight(.medium))
                        }

                        Spacer()

                        Button {} label: {
                            HStack(spacing: 4) {
                                Image(systemName: "location.fill")
                                    .font(.system(size: 10))
                                Text("Itinéraire")
                                    .font(.caption.weight(.bold))
                            }
                            .foregroundStyle(.white)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Brand.linearGradientHorizontal, in: .capsule)
                        }
                    }
                }
            }
        }
    }
}
