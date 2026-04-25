import SwiftUI

struct TransferView: View {
    @State private var amount: String = ""
    @State private var searchText: String = ""
    @State private var selectedContact: Contact? = nil
    @State private var showConfirmation: Bool = false
    @State private var showSuccess: Bool = false
    @State private var appeared: Bool = false

    private var filteredContacts: [Contact] {
        if searchText.isEmpty { return MockData.contacts }
        return MockData.contacts.filter { $0.name.localizedStandardContains(searchText) || $0.phone.localizedStandardContains(searchText) }
    }

    private var favorites: [Contact] {
        MockData.contacts.filter(\.isFavorite)
    }

    var body: some View {
        ScrollView {
            VStack(spacing: MossombiSpacing.xl) {
                if showSuccess {
                    successView
                } else if showConfirmation, let contact = selectedContact {
                    confirmationView(contact: contact)
                } else if selectedContact != nil {
                    amountEntry
                } else {
                    contactSelection
                }
            }
            .padding(.horizontal, MossombiSpacing.md)
            .padding(.bottom, MossombiSpacing.xxl)
            .opacity(appeared ? 1 : 0)
            .offset(y: appeared ? 0 : 10)
        }
        .scrollIndicators(.hidden)
        .background { AppBackground() }
        .navigationTitle("Transfert")
        .navigationBarTitleDisplayMode(.large)
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.8).delay(0.05)) {
                appeared = true
            }
        }
    }

    private var contactSelection: some View {
        VStack(spacing: MossombiSpacing.lg) {
            PremiumInput("Rechercher un contact...", text: $searchText, icon: "magnifyingglass")

            if !favorites.isEmpty && searchText.isEmpty {
                VStack(alignment: .leading, spacing: MossombiSpacing.sm) {
                    Text("Favoris")
                        .font(.headline)

                    ScrollView(.horizontal) {
                        HStack(spacing: MossombiSpacing.md) {
                            ForEach(favorites) { contact in
                                Button {
                                    withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                                        selectedContact = contact
                                    }
                                } label: {
                                    VStack(spacing: MossombiSpacing.xs) {
                                        ZStack {
                                            Circle()
                                                .fill(
                                                    LinearGradient(colors: Brand.gradient, startPoint: .topLeading, endPoint: .bottomTrailing)
                                                )
                                                .frame(width: 56, height: 56)
                                            Text(contact.initials)
                                                .font(.body.weight(.bold))
                                                .foregroundStyle(.white)
                                        }
                                        Text(contact.name.components(separatedBy: " ").first ?? "")
                                            .font(.caption)
                                            .foregroundStyle(.primary)
                                            .lineLimit(1)
                                    }
                                    .frame(width: 70)
                                }
                                .buttonStyle(PremiumPressStyle())
                            }
                        }
                    }
                    .contentMargins(.horizontal, 0)
                    .scrollIndicators(.hidden)
                }
            }

            VStack(alignment: .leading, spacing: MossombiSpacing.sm) {
                Text("Tous les contacts")
                    .font(.headline)

                ForEach(filteredContacts) { contact in
                    Button {
                        withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                            selectedContact = contact
                        }
                    } label: {
                        contactRow(contact)
                    }
                    .buttonStyle(PremiumPressStyle())
                }
            }
        }
    }

    private func contactRow(_ contact: Contact) -> some View {
        Card3D(radius: MossombiRadius.md, padding: MossombiSpacing.sm) {
            HStack(spacing: MossombiSpacing.sm) {
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(colors: [Brand.cyan.opacity(0.2), Brand.violet.opacity(0.15)], startPoint: .topLeading, endPoint: .bottomTrailing)
                        )
                        .frame(width: 44, height: 44)
                    Text(contact.initials)
                        .font(.subheadline.weight(.bold))
                        .foregroundStyle(Brand.linearGradient)
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text(contact.name)
                        .font(.body.weight(.medium))
                        .foregroundStyle(.primary)
                    Text(contact.phone)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                if contact.isFavorite {
                    Image(systemName: "star.fill")
                        .font(.caption)
                        .foregroundStyle(MossombiColors.warning)
                }

                Image(systemName: "chevron.right")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.tertiary)
            }
        }
    }

    private var amountEntry: some View {
        VStack(spacing: MossombiSpacing.xl) {
            if let contact = selectedContact {
                Card3D(radius: MossombiRadius.lg, padding: MossombiSpacing.md) {
                    HStack(spacing: MossombiSpacing.sm) {
                        ZStack {
                            Circle()
                                .fill(LinearGradient(colors: Brand.gradient, startPoint: .topLeading, endPoint: .bottomTrailing))
                                .frame(width: 48, height: 48)
                            Text(contact.initials)
                                .font(.body.weight(.bold))
                                .foregroundStyle(.white)
                        }
                        VStack(alignment: .leading, spacing: 2) {
                            Text(contact.name)
                                .font(.headline)
                            Text(contact.phone)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        Button {
                            withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                                selectedContact = nil
                                amount = ""
                            }
                        } label: {
                            Image(systemName: "xmark.circle.fill")
                                .font(.title3)
                                .foregroundStyle(.tertiary)
                        }
                    }
                }
            }

            VStack(spacing: MossombiSpacing.sm) {
                Text("Montant à envoyer")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                HStack(alignment: .firstTextBaseline, spacing: MossombiSpacing.xs) {
                    TextField("0", text: $amount)
                        .font(.system(size: 48, weight: .bold, design: .rounded))
                        .foregroundStyle(Brand.linearGradient)
                        .keyboardType(.numberPad)
                        .multilineTextAlignment(.center)
                    Text("F")
                        .font(.title2.weight(.semibold))
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity)

                Text("Solde disponible: \(MockData.walletBalance.formatted(.number.grouping(.automatic))) F")
                    .font(.caption)
                    .foregroundStyle(.tertiary)
            }

            let quickAmounts = [5000, 10000, 25000, 50000, 100000]
            LazyVGrid(columns: [GridItem(.adaptive(minimum: 90), spacing: MossombiSpacing.xs)], spacing: MossombiSpacing.xs) {
                ForEach(quickAmounts, id: \.self) { amt in
                    Button {
                        amount = "\(amt)"
                    } label: {
                        Text("\(amt.formatted(.number.grouping(.automatic)))")
                            .font(.caption.weight(.semibold))
                            .padding(.vertical, MossombiSpacing.xs)
                            .frame(maxWidth: .infinity)
                            .foregroundStyle(amount == "\(amt)" ? .white : .primary)
                            .background {
                                if amount == "\(amt)" {
                                    Capsule(style: .continuous).fill(Brand.linearGradientHorizontal)
                                } else {
                                    Capsule(style: .continuous).fill(.ultraThinMaterial)
                                        .overlay { Capsule(style: .continuous).strokeBorder(MossombiColors.glassBorder, lineWidth: 0.5) }
                                }
                            }
                    }
                }
            }

            PremiumButton("Continuer", icon: "arrow.right", variant: .primary, isDisabled: amount.isEmpty || (Int(amount) ?? 0) <= 0) {
                withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                    showConfirmation = true
                }
            }
        }
    }

    private func confirmationView(contact: Contact) -> some View {
        VStack(spacing: MossombiSpacing.xl) {
            VStack(spacing: MossombiSpacing.md) {
                ZStack {
                    Circle()
                        .fill(LinearGradient(colors: Brand.gradient, startPoint: .topLeading, endPoint: .bottomTrailing))
                        .frame(width: 72, height: 72)
                    Text(contact.initials)
                        .font(.title2.weight(.bold))
                        .foregroundStyle(.white)
                }

                Text("Envoyer à \(contact.name)")
                    .font(.headline)

                Text("\(amount) F")
                    .font(.system(size: 42, weight: .bold, design: .rounded))
                    .foregroundStyle(Brand.linearGradient)
            }
            .padding(.top, MossombiSpacing.xl)

            Card3D(radius: MossombiRadius.lg, padding: MossombiSpacing.md) {
                VStack(spacing: MossombiSpacing.sm) {
                    HStack {
                        Text("Destinataire")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        Spacer()
                        Text(contact.name)
                            .font(.subheadline.weight(.medium))
                    }
                    Divider()
                    HStack {
                        Text("Téléphone")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        Spacer()
                        Text(contact.phone)
                            .font(.subheadline.weight(.medium))
                    }
                    Divider()
                    HStack {
                        Text("Frais")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        Spacer()
                        Text("Gratuit")
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(MossombiColors.success)
                    }
                    Divider()
                    HStack {
                        Text("Total")
                            .font(.subheadline.weight(.semibold))
                        Spacer()
                        Text("\(amount) F")
                            .font(.headline.weight(.bold))
                            .foregroundStyle(Brand.linearGradient)
                    }
                }
            }

            VStack(spacing: MossombiSpacing.sm) {
                PremiumButton("Confirmer le transfert", icon: "paperplane.fill", variant: .primary) {
                    withAnimation(.spring(response: 0.5, dampingFraction: 0.8)) {
                        showSuccess = true
                    }
                }
                PremiumButton("Annuler", variant: .ghost) {
                    withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                        showConfirmation = false
                    }
                }
            }
        }
    }

    private var successView: some View {
        VStack(spacing: MossombiSpacing.xl) {
            Spacer().frame(height: 40)

            ZStack {
                Circle()
                    .fill(MossombiColors.success.opacity(0.12))
                    .frame(width: 120, height: 120)
                Circle()
                    .fill(MossombiColors.success.opacity(0.2))
                    .frame(width: 88, height: 88)
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 56))
                    .foregroundStyle(MossombiColors.success)
            }

            VStack(spacing: MossombiSpacing.xs) {
                Text("Transfert réussi!")
                    .font(.title2.weight(.bold))
                Text("\(amount) F envoyés à \(selectedContact?.name ?? "")")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }

            Text("Réf: TRF-\(Int.random(in: 100000...999999))")
                .font(.caption)
                .foregroundStyle(.tertiary)
                .padding(.horizontal, MossombiSpacing.md)
                .padding(.vertical, MossombiSpacing.xs)
                .background(.ultraThinMaterial, in: .capsule)
        }
    }
}
