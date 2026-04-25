import SwiftUI

struct TripSearchView: View {
    @State private var selectedType: String = "Taxi"
    @State private var departure: String = ""
    @State private var destination: String = ""
    @State private var showResults: Bool = false
    @State private var appeared: Bool = false
    @State private var typeTrigger: Int = 0

    private let typeNames = ["Taxi", "Bus", "Train", "Canot"]
    private let typeIcons = ["car.fill", "bus.fill", "tram.fill", "ferry.fill"]
    private let typeDescs = ["Dans la ville", "Ville en ville", "Ville en ville", "Fluvial"]

    private var filteredTrips: [Trip] {
        var results = MockData.trips
        if !departure.isEmpty {
            results = results.filter { $0.from.localizedStandardContains(departure) }
        }
        if !destination.isEmpty {
            results = results.filter { $0.to.localizedStandardContains(destination) }
        }
        switch selectedType {
        case "Taxi": return results.filter { $0.type.localizedStandardContains("Express") || $0.type.localizedStandardContains("Taxi") }.isEmpty ? results.prefix(3).map { $0 } : results.filter { $0.type.localizedStandardContains("Express") || $0.type.localizedStandardContains("Taxi") }
        case "Bus": return results.filter { $0.type.localizedStandardContains("Bus") }
        case "Train": return results.filter { $0.type.localizedStandardContains("Train") }
        default: return Array(results.prefix(3))
        }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: MossombiSpacing.lg) {
                transportTypePicker
                searchForm
                if showResults {
                    resultsSection
                }
            }
            .padding(.horizontal, MossombiSpacing.md)
            .padding(.bottom, MossombiSpacing.xxl)
            .opacity(appeared ? 1 : 0)
            .offset(y: appeared ? 0 : 10)
        }
        .scrollIndicators(.hidden)
        .background { AppBackground() }
        .navigationTitle("Rechercher un trajet")
        .navigationBarTitleDisplayMode(.large)
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.8).delay(0.05)) {
                appeared = true
            }
        }
    }

    private var transportTypePicker: some View {
        VStack(alignment: .leading, spacing: MossombiSpacing.sm) {
            Text("Type de transport")
                .font(.headline)

            ScrollView(.horizontal) {
                HStack(spacing: MossombiSpacing.sm) {
                    ForEach(Array(typeNames.enumerated()), id: \.offset) { index, name in
                        Button {
                            withAnimation(.snappy) { selectedType = name }
                            typeTrigger += 1
                        } label: {
                            VStack(spacing: MossombiSpacing.xs) {
                                ZStack {
                                    RoundedRectangle(cornerRadius: MossombiRadius.md, style: .continuous)
                                        .fill(selectedType == name ? AnyShapeStyle(Brand.linearGradient) : AnyShapeStyle(.ultraThinMaterial))
                                        .frame(width: 72, height: 72)
                                        .overlay {
                                            if selectedType != name {
                                                RoundedRectangle(cornerRadius: MossombiRadius.md, style: .continuous)
                                                    .strokeBorder(MossombiColors.glassBorder, lineWidth: 0.5)
                                            }
                                        }
                                    Image(systemName: typeIcons[index])
                                        .font(.title2.weight(.semibold))
                                        .foregroundStyle(selectedType == name ? AnyShapeStyle(.white) : AnyShapeStyle(Brand.linearGradient))
                                }
                                Text(name)
                                    .font(.caption.weight(.medium))
                                    .foregroundStyle(selectedType == name ? .primary : .secondary)
                                Text(typeDescs[index])
                                    .font(.system(size: 9))
                                    .foregroundStyle(.tertiary)
                            }
                        }
                        .buttonStyle(PremiumPressStyle())
                        .sensoryFeedback(.selection, trigger: typeTrigger)
                    }
                }
            }
            .contentMargins(.horizontal, 0)
            .scrollIndicators(.hidden)
        }
    }

    private var searchForm: some View {
        VStack(spacing: MossombiSpacing.md) {
            Card3D(radius: MossombiRadius.lg, padding: MossombiSpacing.md) {
                VStack(spacing: MossombiSpacing.md) {
                    HStack(spacing: MossombiSpacing.sm) {
                        ZStack {
                            Circle().fill(Brand.cyan.opacity(0.15)).frame(width: 32, height: 32)
                            Circle().fill(Brand.cyan).frame(width: 8, height: 8)
                        }
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Départ")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            TextField(selectedType == "Taxi" ? "Votre position" : "Ville de départ", text: $departure)
                                .font(.body)
                        }
                    }

                    HStack {
                        Rectangle()
                            .fill(Brand.linearGradient)
                            .frame(width: 2, height: 24)
                            .padding(.leading, 15)
                        Spacer()
                        Button {
                            let temp = departure
                            departure = destination
                            destination = temp
                        } label: {
                            ZStack {
                                Circle().fill(.ultraThinMaterial).frame(width: 36, height: 36)
                                    .overlay { Circle().strokeBorder(MossombiColors.glassBorder, lineWidth: 0.5) }
                                Image(systemName: "arrow.up.arrow.down")
                                    .font(.caption.weight(.bold))
                                    .foregroundStyle(Brand.linearGradient)
                            }
                        }
                    }

                    HStack(spacing: MossombiSpacing.sm) {
                        ZStack {
                            Circle().fill(Brand.violet.opacity(0.15)).frame(width: 32, height: 32)
                            Image(systemName: "mappin")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundStyle(Brand.violet)
                        }
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Destination")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            TextField(selectedType == "Taxi" ? "Où allez-vous?" : "Ville d'arrivée", text: $destination)
                                .font(.body)
                        }
                    }
                }
            }

            PremiumButton("Rechercher", icon: "magnifyingglass", variant: .primary) {
                withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                    showResults = true
                }
            }
        }
    }

    private var resultsSection: some View {
        VStack(alignment: .leading, spacing: MossombiSpacing.sm) {
            HStack {
                Text("\(filteredTrips.count) résultat\(filteredTrips.count > 1 ? "s" : "")")
                    .font(.headline)
                Spacer()
                Text(selectedType)
                    .font(.caption.weight(.medium))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(Brand.linearGradientHorizontal, in: .capsule)
            }

            if filteredTrips.isEmpty {
                Card3D(radius: MossombiRadius.md, padding: MossombiSpacing.xl) {
                    VStack(spacing: MossombiSpacing.sm) {
                        Image(systemName: "magnifyingglass")
                            .font(.largeTitle)
                            .foregroundStyle(.tertiary)
                        Text("Aucun trajet trouvé")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        Text("Essayez d'autres critères")
                            .font(.caption)
                            .foregroundStyle(.tertiary)
                    }
                    .frame(maxWidth: .infinity)
                }
            } else {
                ForEach(filteredTrips) { trip in
                    TripCard(trip: trip)
                }
            }
        }
    }
}
