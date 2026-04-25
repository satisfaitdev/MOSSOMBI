import SwiftUI

struct OrdersView: View {
    @State private var selectedFilter: String = "Tous"
    @State private var appeared: Bool = false
    @State private var filterTrigger: Int = 0

    private let filters = ["Tous", "En cours", "Livré", "Annulé"]

    private var filteredOrders: [Order] {
        switch selectedFilter {
        case "En cours": MockData.orders.filter { $0.status == .processing || $0.status == .shipped }
        case "Livré": MockData.orders.filter { $0.status == .delivered }
        case "Annulé": MockData.orders.filter { $0.status == .cancelled }
        default: MockData.orders
        }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: MossombiSpacing.lg) {
                orderStats
                filterChips
                ordersList
            }
            .padding(.horizontal, MossombiSpacing.md)
            .padding(.bottom, MossombiSpacing.xxl)
            .opacity(appeared ? 1 : 0)
            .offset(y: appeared ? 0 : 12)
        }
        .scrollIndicators(.hidden)
        .background { AppBackground() }
        .navigationTitle("Commandes")
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.8).delay(0.05)) {
                appeared = true
            }
        }
    }

    private var orderStats: some View {
        HStack(spacing: MossombiSpacing.sm) {
            OrderStatBubble(count: MockData.orders.filter { $0.status == .processing || $0.status == .shipped }.count, label: "En cours", color: Brand.cyan)
            OrderStatBubble(count: MockData.orders.filter { $0.status == .delivered }.count, label: "Livrés", color: MossombiColors.success)
            OrderStatBubble(count: MockData.orders.count, label: "Total", color: Brand.violet)
        }
    }

    private var filterChips: some View {
        ScrollView(.horizontal) {
            HStack(spacing: MossombiSpacing.xs) {
                ForEach(filters, id: \.self) { filter in
                    Button {
                        withAnimation(.snappy) { selectedFilter = filter }
                        filterTrigger += 1
                    } label: {
                        Text(filter)
                            .font(.subheadline.weight(.medium))
                            .padding(.horizontal, MossombiSpacing.md)
                            .padding(.vertical, MossombiSpacing.xs)
                            .foregroundStyle(selectedFilter == filter ? .white : .primary)
                            .background {
                                if selectedFilter == filter {
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

    private var ordersList: some View {
        VStack(spacing: MossombiSpacing.sm) {
            if filteredOrders.isEmpty {
                emptyState
            } else {
                ForEach(filteredOrders) { order in
                    OrderRow(order: order)
                }
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: MossombiSpacing.md) {
            Image(systemName: "tray")
                .font(.system(size: 40))
                .foregroundStyle(.tertiary)
            Text("Aucune commande")
                .font(.headline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, MossombiSpacing.xxl)
    }
}

struct OrderStatBubble: View {
    let count: Int
    let label: String
    let color: Color

    var body: some View {
        Card3D(radius: MossombiRadius.md, padding: MossombiSpacing.sm) {
            VStack(spacing: MossombiSpacing.xxs) {
                Text("\(count)")
                    .font(.title2.weight(.bold))
                    .foregroundStyle(color)
                Text(label)
                    .font(.system(size: 10, weight: .medium))
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, MossombiSpacing.xxs)
        }
    }
}

struct OrderRow: View {
    let order: Order

    private var statusColor: Color {
        switch order.status {
        case .processing: Brand.cyan
        case .shipped: MossombiColors.warning
        case .delivered: MossombiColors.success
        case .cancelled: MossombiColors.danger
        }
    }

    var body: some View {
        GlassContainer(padding: MossombiSpacing.sm) {
            HStack(spacing: MossombiSpacing.sm) {
                IconBubble3D(order.icon, size: 18, bubbleSize: 42)

                VStack(alignment: .leading, spacing: MossombiSpacing.xxs) {
                    Text(order.title)
                        .font(.subheadline.weight(.semibold))
                        .lineLimit(1)
                    Text(order.subtitle)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text(order.date)
                        .font(.system(size: 10))
                        .foregroundStyle(.tertiary)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: MossombiSpacing.xxs) {
                    Text("\(Int(order.amount).formatted(.number.grouping(.automatic))) F")
                        .font(.subheadline.weight(.semibold))
                    Text(order.status.rawValue)
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(statusColor)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(statusColor.opacity(0.15), in: .capsule)
                }
            }
        }
    }
}
