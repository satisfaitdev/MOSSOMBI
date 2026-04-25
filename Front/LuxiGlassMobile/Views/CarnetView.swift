import SwiftUI

struct CarnetView: View {
    @State private var appeared: Bool = false
    @State private var selectedTab: CarnetTab = .addresses
    @State private var searchText: String = ""

    var body: some View {
        VStack(spacing: 0) {
            tabSelector
            ScrollView {
                VStack(spacing: MossombiSpacing.lg) {
                    switch selectedTab {
                    case .addresses: addressesSection
                    case .trips: tripsSection
                    case .contacts: contactsSection
                    case .wallet: walletSection
                    }
                }
                .padding(.horizontal, MossombiSpacing.md)
                .padding(.top, MossombiSpacing.md)
                .padding(.bottom, MossombiSpacing.xxl)
                .opacity(appeared ? 1 : 0)
                .offset(y: appeared ? 0 : 12)
            }
            .scrollIndicators(.hidden)
        }
        .background { AppBackground() }
        .navigationTitle("Carnet")
        .navigationBarTitleDisplayMode(.inline)
        .searchable(text: $searchText, prompt: "Rechercher...")
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.8).delay(0.05)) {
                appeared = true
            }
        }
    }

    private var tabSelector: some View {
        ScrollView(.horizontal) {
            HStack(spacing: MossombiSpacing.xs) {
                ForEach(CarnetTab.allCases, id: \.self) { tab in
                    Button {
                        withAnimation(.snappy) { selectedTab = tab }
                    } label: {
                        HStack(spacing: 6) {
                            Image(systemName: tab.icon)
                                .font(.caption.weight(.semibold))
                            Text(tab.title)
                                .font(.subheadline.weight(.medium))
                        }
                        .foregroundStyle(selectedTab == tab ? .white : .secondary)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 9)
                        .background {
                            if selectedTab == tab {
                                Capsule()
                                    .fill(Brand.linearGradientHorizontal)
                            } else {
                                Capsule()
                                    .fill(.ultraThinMaterial)
                                    .overlay {
                                        Capsule()
                                            .strokeBorder(MossombiColors.glassBorder, lineWidth: 0.5)
                                    }
                            }
                        }
                    }
                    .sensoryFeedback(.selection, trigger: selectedTab)
                }
            }
            .padding(.horizontal, MossombiSpacing.md)
            .padding(.vertical, MossombiSpacing.sm)
        }
        .contentMargins(.horizontal, 0)
        .scrollIndicators(.hidden)
    }

    // MARK: - Addresses

    private var addressesSection: some View {
        VStack(spacing: MossombiSpacing.sm) {
            HStack {
                Text("Adresses enregistrées")
                    .font(.headline)
                Spacer()
                Button {} label: {
                    Image(systemName: "plus.circle.fill")
                        .font(.title3)
                        .foregroundStyle(Brand.linearGradient)
                }
            }

            let filtered = MockData.savedAddresses.filter {
                searchText.isEmpty || $0.label.localizedStandardContains(searchText) || $0.address.localizedStandardContains(searchText)
            }

            if filtered.isEmpty {
                emptyState(icon: "mappin.slash", text: "Aucune adresse trouvée")
            } else {
                ForEach(filtered) { address in
                    AddressRow(address: address)
                }
            }
        }
    }

    // MARK: - Trips

    private var tripsSection: some View {
        VStack(spacing: MossombiSpacing.sm) {
            HStack {
                Text("Trajets sauvegardés")
                    .font(.headline)
                Spacer()
                Button {} label: {
                    Image(systemName: "plus.circle.fill")
                        .font(.title3)
                        .foregroundStyle(Brand.linearGradient)
                }
            }

            let filtered = MockData.savedTrips.filter {
                searchText.isEmpty || $0.from.localizedStandardContains(searchText) || $0.to.localizedStandardContains(searchText)
            }

            if filtered.isEmpty {
                emptyState(icon: "map", text: "Aucun trajet trouvé")
            } else {
                ForEach(filtered) { trip in
                    TripRow(trip: trip)
                }
            }
        }
    }

    // MARK: - Contacts

    private var contactsSection: some View {
        VStack(spacing: MossombiSpacing.sm) {
            HStack {
                Text("Contacts")
                    .font(.headline)
                Spacer()
                Button {} label: {
                    Image(systemName: "plus.circle.fill")
                        .font(.title3)
                        .foregroundStyle(Brand.linearGradient)
                }
            }

            let favorites = MockData.savedContacts.filter { $0.isFavorite }
            let others = MockData.savedContacts.filter { !$0.isFavorite }

            let filteredFav = favorites.filter {
                searchText.isEmpty || $0.name.localizedStandardContains(searchText) || $0.phone.localizedStandardContains(searchText)
            }
            let filteredOther = others.filter {
                searchText.isEmpty || $0.name.localizedStandardContains(searchText) || $0.phone.localizedStandardContains(searchText)
            }

            if filteredFav.isEmpty && filteredOther.isEmpty {
                emptyState(icon: "person.slash", text: "Aucun contact trouvé")
            } else {
                if !filteredFav.isEmpty {
                    VStack(alignment: .leading, spacing: MossombiSpacing.xs) {
                        Text("Favoris")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(.secondary)
                        ForEach(filteredFav) { contact in
                            ContactRow(contact: contact)
                        }
                    }
                }

                if !filteredOther.isEmpty {
                    VStack(alignment: .leading, spacing: MossombiSpacing.xs) {
                        Text("Autres")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(.secondary)
                        ForEach(filteredOther) { contact in
                            ContactRow(contact: contact)
                        }
                    }
                }
            }
        }
    }

    // MARK: - Wallet

    private var walletSection: some View {
        VStack(spacing: MossombiSpacing.sm) {
            HStack {
                Text("Comptes & numéros")
                    .font(.headline)
                Spacer()
                Button {} label: {
                    Image(systemName: "plus.circle.fill")
                        .font(.title3)
                        .foregroundStyle(Brand.linearGradient)
                }
            }

            let filtered = MockData.walletActions.filter {
                searchText.isEmpty || $0.label.localizedStandardContains(searchText) || $0.provider.localizedStandardContains(searchText)
            }

            if filtered.isEmpty {
                emptyState(icon: "wallet.bifold", text: "Aucun compte trouvé")
            } else {
                ForEach(filtered) { action in
                    WalletActionRow(action: action)
                }
            }
        }
    }

    private func emptyState(icon: String, text: String) -> some View {
        VStack(spacing: MossombiSpacing.md) {
            Image(systemName: icon)
                .font(.system(size: 36))
                .foregroundStyle(.tertiary)
            Text(text)
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 50)
    }
}

enum CarnetTab: CaseIterable {
    case addresses
    case trips
    case contacts
    case wallet

    var title: String {
        switch self {
        case .addresses: "Adresses"
        case .trips: "Trajets"
        case .contacts: "Contacts"
        case .wallet: "Wallet"
        }
    }

    var icon: String {
        switch self {
        case .addresses: "mappin.circle.fill"
        case .trips: "arrow.triangle.swap"
        case .contacts: "person.2.fill"
        case .wallet: "wallet.bifold.fill"
        }
    }
}

// MARK: - Row Components

struct AddressRow: View {
    let address: SavedAddress

    var body: some View {
        GlassContainer(padding: MossombiSpacing.sm) {
            HStack(spacing: MossombiSpacing.sm) {
                ZStack {
                    Circle()
                        .fill(Brand.cyan.opacity(0.12))
                        .frame(width: 44, height: 44)
                    Image(systemName: address.icon)
                        .font(.body.weight(.semibold))
                        .foregroundStyle(Brand.linearGradient)
                }

                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 4) {
                        Text(address.label)
                            .font(.subheadline.weight(.semibold))
                        if address.isFavorite {
                            Image(systemName: "star.fill")
                                .font(.caption2)
                                .foregroundStyle(MossombiColors.warning)
                        }
                    }
                    Text(address.address)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.tertiary)
            }
        }
    }
}

struct TripRow: View {
    let trip: SavedTrip

    var body: some View {
        GlassContainer(padding: MossombiSpacing.sm) {
            HStack(spacing: MossombiSpacing.sm) {
                ZStack {
                    Circle()
                        .fill(Brand.violet.opacity(0.12))
                        .frame(width: 44, height: 44)
                    Image(systemName: trip.icon)
                        .font(.body.weight(.semibold))
                        .foregroundStyle(Brand.linearGradient)
                }

                VStack(alignment: .leading, spacing: 3) {
                    HStack(spacing: 4) {
                        Text(trip.from)
                            .font(.subheadline.weight(.semibold))
                        Image(systemName: "arrow.right")
                            .font(.caption2.weight(.bold))
                            .foregroundStyle(Brand.cyan)
                        Text(trip.to)
                            .font(.subheadline.weight(.semibold))
                    }
                    HStack(spacing: 6) {
                        Text(trip.type)
                            .font(.caption2.weight(.medium))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Brand.blue.opacity(0.7), in: Capsule())
                        Text(trip.lastUsed)
                            .font(.caption2)
                            .foregroundStyle(.tertiary)
                    }
                }

                Spacer()

                Image(systemName: "arrow.triangle.2.circlepath")
                    .font(.caption)
                    .foregroundStyle(Brand.linearGradient)
            }
        }
    }
}

struct ContactRow: View {
    let contact: SavedContact

    var body: some View {
        GlassContainer(padding: MossombiSpacing.sm) {
            HStack(spacing: MossombiSpacing.sm) {
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: Brand.gradient,
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 42, height: 42)
                    Text(contact.initials)
                        .font(.subheadline.weight(.bold))
                        .foregroundStyle(.white)
                }

                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 4) {
                        Text(contact.name)
                            .font(.subheadline.weight(.semibold))
                        if contact.isFavorite {
                            Image(systemName: "heart.fill")
                                .font(.caption2)
                                .foregroundStyle(Brand.orange)
                        }
                    }
                    Text(contact.phone)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                HStack(spacing: MossombiSpacing.xs) {
                    Button {} label: {
                        Image(systemName: "phone.fill")
                            .font(.caption)
                            .foregroundStyle(MossombiColors.success)
                            .padding(8)
                            .background(MossombiColors.success.opacity(0.1), in: Circle())
                    }
                    Button {} label: {
                        Image(systemName: "arrow.up.right")
                            .font(.caption)
                            .foregroundStyle(Brand.cyan)
                            .padding(8)
                            .background(Brand.cyan.opacity(0.1), in: Circle())
                    }
                }
            }
        }
    }
}

struct WalletActionRow: View {
    let action: WalletAction

    var body: some View {
        GlassContainer(padding: MossombiSpacing.sm) {
            HStack(spacing: MossombiSpacing.sm) {
                ZStack {
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .fill(
                            LinearGradient(
                                colors: [Brand.cyan.opacity(0.15), Brand.violet.opacity(0.10)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 44, height: 44)
                    Image(systemName: action.icon)
                        .font(.body.weight(.semibold))
                        .foregroundStyle(Brand.linearGradient)
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text(action.label)
                        .font(.subheadline.weight(.semibold))
                    HStack(spacing: 6) {
                        Text(action.provider)
                            .font(.caption2.weight(.medium))
                            .foregroundStyle(Brand.cyan)
                        Text("·")
                            .foregroundStyle(.tertiary)
                        Text(action.accountNumber)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }

                Spacer()

                Button {} label: {
                    Image(systemName: "doc.on.doc")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .padding(8)
                        .background(.ultraThinMaterial, in: Circle())
                }
            }
        }
    }
}
