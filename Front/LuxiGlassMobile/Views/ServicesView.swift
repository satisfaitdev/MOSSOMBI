import SwiftUI

struct ServicesView: View {
    @State private var searchText: String = ""
    @State private var selectedFilter: String = "Populaire"
    @State private var appeared: Bool = false
    @State private var filterTrigger: Int = 0

    private let filters = MockData.filterChips

    private var filteredCategories: [ServiceCategory] {
        if searchText.isEmpty {
            return MockData.categories
        }
        return MockData.categories.compactMap { cat in
            let matched = cat.services.filter { $0.name.localizedStandardContains(searchText) }
            if matched.isEmpty { return nil }
            return ServiceCategory(id: cat.id, name: cat.name, icon: cat.icon, services: matched)
        }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: MossombiSpacing.lg) {
                PremiumInput("Rechercher un service...", text: $searchText, icon: "magnifyingglass")

                filterChips

                ForEach(filteredCategories) { category in
                    CategorySection3D(category: category)
                }
            }
            .padding(.horizontal, MossombiSpacing.md)
            .padding(.bottom, MossombiSpacing.xxl)
            .opacity(appeared ? 1 : 0)
            .offset(y: appeared ? 0 : 10)
        }
        .scrollIndicators(.hidden)
        .background { AppBackground() }
        .navigationTitle("Services")
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.8).delay(0.05)) {
                appeared = true
            }
        }
    }

    private var filterChips: some View {
        ScrollView(.horizontal) {
            HStack(spacing: MossombiSpacing.xs) {
                ForEach(filters, id: \.self) { filter in
                    Button {
                        withAnimation(.snappy) {
                            selectedFilter = filter
                        }
                        filterTrigger += 1
                    } label: {
                        Text(filter)
                            .font(.subheadline.weight(.medium))
                            .padding(.horizontal, MossombiSpacing.md)
                            .padding(.vertical, MossombiSpacing.xs)
                            .foregroundStyle(selectedFilter == filter ? .white : .primary)
                            .background {
                                if selectedFilter == filter {
                                    Capsule(style: .continuous)
                                        .fill(Brand.linearGradientHorizontal)
                                } else {
                                    Capsule(style: .continuous)
                                        .fill(.ultraThinMaterial)
                                        .overlay {
                                            Capsule(style: .continuous)
                                                .strokeBorder(MossombiColors.glassBorder, lineWidth: 0.5)
                                        }
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

struct CategorySection3D: View {
    let category: ServiceCategory

    private var categoryRoute: AppRoute {
        switch category.id {
        case "shopping": .shopping
        case "transport": .transport
        case "voyage": .voyage
        case "finance": .finance
        case "livraison": .livraison
        case "services-publics": .servicesPublic
        case "coins": .coins
        default: .services
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: MossombiSpacing.sm) {
            HStack {
                Icon3D(category.icon, size: 16)
                Text(category.name)
                    .font(.headline.weight(.bold))
                Spacer()
                NavigationLink(value: categoryRoute) {
                    Text("Voir tout")
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(Brand.linearGradient)
                }
            }

            ScrollView(.horizontal) {
                HStack(spacing: MossombiSpacing.xs) {
                    ForEach(category.services) { service in
                        NavigationLink(value: AppRoute.serviceDetail(service.id)) {
                            ServiceTile3D(service: service)
                        }
                        .buttonStyle(PremiumPressStyle())
                    }
                }
            }
            .contentMargins(.horizontal, 0)
            .scrollIndicators(.hidden)
        }
    }
}

struct ServiceTile3D: View {
    let service: ServiceItem

    var body: some View {
        Card3D(radius: MossombiRadius.sm, padding: MossombiSpacing.sm) {
            VStack(spacing: MossombiSpacing.xs) {
                ZStack(alignment: .topTrailing) {
                    IconBubble3D(service.icon, size: 18, bubbleSize: 40)

                    if service.isNew {
                        Text("NEW")
                            .font(.system(size: 7, weight: .bold))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 4)
                            .padding(.vertical, 2)
                            .background(Brand.orange, in: .capsule)
                            .offset(x: 6, y: -4)
                    }
                }

                Text(service.name)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(.primary)
                    .lineLimit(1)

                if service.isPopular {
                    HStack(spacing: 2) {
                        Image(systemName: "star.fill")
                            .font(.system(size: 8))
                            .foregroundStyle(MossombiColors.warning)
                        Text(String(format: "%.1f", service.rating))
                            .font(.system(size: 9, weight: .medium))
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .frame(width: 72)
        }
    }
}
