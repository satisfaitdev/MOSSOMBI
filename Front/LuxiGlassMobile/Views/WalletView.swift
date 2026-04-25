import SwiftUI

struct WalletView: View {
    @Environment(ThemeManager.self) private var themeManager
    @State private var selectedFilter: String = "Tous"
    @State private var appeared: Bool = false
    @State private var filterTrigger: Int = 0

    private let filters = ["Tous", "Envoyés", "Reçus", "En attente"]

    private var filteredTransactions: [Transaction] {
        switch selectedFilter {
        case "Envoyés": MockData.transactions.filter { !$0.isCredit }
        case "Reçus": MockData.transactions.filter { $0.isCredit }
        case "En attente": MockData.transactions.filter { $0.status == .pending }
        default: MockData.transactions
        }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: MossombiSpacing.xl) {
                balanceHeader
                quickActions
                filterChips
                transactionsList
            }
            .padding(.horizontal, MossombiSpacing.md)
            .padding(.bottom, MossombiSpacing.xxl)
            .opacity(appeared ? 1 : 0)
            .offset(y: appeared ? 0 : 12)
        }
        .scrollIndicators(.hidden)
        .background { AppBackground() }
        .navigationTitle("Portefeuille")
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.8).delay(0.05)) {
                appeared = true
            }
        }
    }

    private var balanceHeader: some View {
        Card3D(radius: MossombiRadius.xl, padding: MossombiSpacing.xl) {
            VStack(spacing: MossombiSpacing.md) {
                HStack {
                    Text("Solde total")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    Spacer()
                    Button {
                        withAnimation(.snappy) {
                            themeManager.balanceHidden.toggle()
                        }
                    } label: {
                        Image(systemName: themeManager.balanceHidden ? "eye.slash.fill" : "eye.fill")
                            .font(.body)
                            .foregroundStyle(.secondary)
                            .contentTransition(.symbolEffect(.replace))
                    }
                }

                Text(themeManager.balanceHidden ? "••••••" : "\(MockData.walletBalance.formatted(.number.grouping(.automatic))) F")
                    .font(.system(size: 38, weight: .bold, design: .rounded))
                    .foregroundStyle(Brand.linearGradient)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .contentTransition(.numericText())

                HStack(spacing: MossombiSpacing.xl) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Entrées")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Text("+482 500 F")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(MossombiColors.success)
                    }
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Sorties")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Text("-70 400 F")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(MossombiColors.danger)
                    }
                    Spacer()
                }
            }
        }
    }

    private var quickActions: some View {
        HStack(spacing: MossombiSpacing.sm) {
            WalletActionButton(icon: "arrow.up.right", label: "Envoyer") {}
            WalletActionButton(icon: "arrow.down.left", label: "Recevoir") {}
            WalletActionButton(icon: "plus", label: "Recharger") {}
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
                            .padding(.horizontal, MossombiSpacing.sm)
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

    private var transactionsList: some View {
        VStack(alignment: .leading, spacing: MossombiSpacing.sm) {
            Text("Transactions")
                .font(.headline)

            GlassContainer(padding: MossombiSpacing.sm) {
                if filteredTransactions.isEmpty {
                    VStack(spacing: MossombiSpacing.sm) {
                        Image(systemName: "tray")
                            .font(.largeTitle)
                            .foregroundStyle(.tertiary)
                        Text("Aucune transaction")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, MossombiSpacing.xxl)
                } else {
                    VStack(spacing: 0) {
                        ForEach(filteredTransactions) { tx in
                            TransactionRow(transaction: tx)
                            if tx.id != filteredTransactions.last?.id {
                                Divider()
                                    .padding(.vertical, MossombiSpacing.xxs)
                            }
                        }
                    }
                }
            }
        }
    }
}

struct WalletActionButton: View {
    let icon: String
    let label: String
    let action: () -> Void

    @State private var tapCount: Int = 0

    var body: some View {
        Button {
            tapCount += 1
            action()
        } label: {
            Card3D(radius: MossombiRadius.md, padding: MossombiSpacing.sm) {
                VStack(spacing: MossombiSpacing.xs) {
                    Icon3D(icon, size: 20)
                    Text(label)
                        .font(.caption.weight(.medium))
                        .foregroundStyle(.primary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, MossombiSpacing.xxs)
            }
        }
        .buttonStyle(PremiumPressStyle())
        .sensoryFeedback(.impact(weight: .light), trigger: tapCount)
    }
}
