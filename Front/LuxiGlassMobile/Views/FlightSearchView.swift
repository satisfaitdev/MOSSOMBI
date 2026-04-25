import SwiftUI

struct FlightSearchView: View {
    @State private var departure: String = "Dakar"
    @State private var destination: String = ""
    @State private var selectedClass: String = "Économique"
    @State private var passengers: Int = 1
    @State private var showResults: Bool = false
    @State private var appeared: Bool = false
    @State private var sortBy: String = "Prix"

    private let classes = ["Économique", "Business", "Première"]
    private let sorts = ["Prix", "Durée", "Recommandé"]

    private var filteredFlights: [Flight] {
        var results = MockData.flights
        if !destination.isEmpty {
            results = results.filter { $0.to.localizedStandardContains(destination) }
        }
        switch sortBy {
        case "Prix": results.sort { $0.price < $1.price }
        case "Durée": results.sort { $0.duration < $1.duration }
        default: break
        }
        return results
    }

    var body: some View {
        ScrollView {
            VStack(spacing: MossombiSpacing.lg) {
                searchCard
                if showResults {
                    filterBar
                    resultsList
                }
            }
            .padding(.horizontal, MossombiSpacing.md)
            .padding(.bottom, MossombiSpacing.xxl)
            .opacity(appeared ? 1 : 0)
            .offset(y: appeared ? 0 : 10)
        }
        .scrollIndicators(.hidden)
        .background { AppBackground() }
        .navigationTitle("Recherche de vols")
        .navigationBarTitleDisplayMode(.large)
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.8).delay(0.05)) {
                appeared = true
            }
        }
    }

    private var searchCard: some View {
        Card3D(radius: MossombiRadius.xl, padding: MossombiSpacing.md) {
            VStack(spacing: MossombiSpacing.md) {
                HStack(spacing: MossombiSpacing.sm) {
                    ZStack {
                        Circle().fill(Brand.cyan.opacity(0.15)).frame(width: 32, height: 32)
                        Image(systemName: "airplane.departure")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(Brand.cyan)
                    }
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Départ")
                            .font(.caption).foregroundStyle(.secondary)
                        TextField("Ville de départ", text: $departure)
                            .font(.body)
                    }
                }

                HStack {
                    Rectangle().fill(Brand.linearGradient).frame(width: 2, height: 20).padding(.leading, 15)
                    Spacer()
                    Button {
                        let temp = departure
                        departure = destination
                        destination = temp
                    } label: {
                        ZStack {
                            Circle().fill(.ultraThinMaterial).frame(width: 32, height: 32)
                            Image(systemName: "arrow.up.arrow.down")
                                .font(.caption.weight(.bold))
                                .foregroundStyle(Brand.linearGradient)
                        }
                    }
                }

                HStack(spacing: MossombiSpacing.sm) {
                    ZStack {
                        Circle().fill(Brand.violet.opacity(0.15)).frame(width: 32, height: 32)
                        Image(systemName: "airplane.arrival")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(Brand.violet)
                    }
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Destination")
                            .font(.caption).foregroundStyle(.secondary)
                        TextField("Ville d'arrivée", text: $destination)
                            .font(.body)
                    }
                }

                Divider()

                HStack(spacing: MossombiSpacing.md) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Classe")
                            .font(.caption).foregroundStyle(.secondary)
                        Menu {
                            ForEach(classes, id: \.self) { c in
                                Button(c) { selectedClass = c }
                            }
                        } label: {
                            HStack(spacing: 4) {
                                Text(selectedClass)
                                    .font(.subheadline.weight(.medium))
                                    .foregroundStyle(.primary)
                                Image(systemName: "chevron.down")
                                    .font(.system(size: 10))
                                    .foregroundStyle(.tertiary)
                            }
                        }
                    }

                    Spacer()

                    VStack(alignment: .trailing, spacing: 2) {
                        Text("Passagers")
                            .font(.caption).foregroundStyle(.secondary)
                        HStack(spacing: MossombiSpacing.sm) {
                            Button { if passengers > 1 { passengers -= 1 } } label: {
                                Image(systemName: "minus.circle")
                                    .foregroundStyle(passengers > 1 ? AnyShapeStyle(Brand.linearGradient) : AnyShapeStyle(.tertiary))
                            }
                            Text("\(passengers)")
                                .font(.subheadline.weight(.bold))
                            Button { if passengers < 9 { passengers += 1 } } label: {
                                Image(systemName: "plus.circle")
                                    .foregroundStyle(Brand.linearGradient)
                            }
                        }
                    }
                }

                PremiumButton("Rechercher des vols", icon: "magnifyingglass", variant: .primary) {
                    withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                        showResults = true
                    }
                }
            }
        }
    }

    private var filterBar: some View {
        ScrollView(.horizontal) {
            HStack(spacing: MossombiSpacing.xs) {
                ForEach(sorts, id: \.self) { sort in
                    Button {
                        withAnimation(.snappy) { sortBy = sort }
                    } label: {
                        Text(sort)
                            .font(.caption.weight(.medium))
                            .padding(.horizontal, MossombiSpacing.sm)
                            .padding(.vertical, MossombiSpacing.xs)
                            .foregroundStyle(sortBy == sort ? .white : .primary)
                            .background {
                                if sortBy == sort {
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

    private var resultsList: some View {
        VStack(alignment: .leading, spacing: MossombiSpacing.sm) {
            Text("\(filteredFlights.count) vol\(filteredFlights.count > 1 ? "s" : "") trouvé\(filteredFlights.count > 1 ? "s" : "")")
                .font(.headline)

            ForEach(filteredFlights) { flight in
                FlightCard(flight: flight)
            }
        }
    }
}
