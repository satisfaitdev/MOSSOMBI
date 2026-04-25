import SwiftUI

@Observable
final class CartManager {
    static let shared = CartManager()
    var items: [CartItem] = []

    var totalPrice: Double {
        items.reduce(0) { $0 + $1.product.price * Double($1.quantity) }
    }

    var itemCount: Int {
        items.reduce(0) { $0 + $1.quantity }
    }

    func addItem(_ product: Product) {
        if let index = items.firstIndex(where: { $0.product.id == product.id }) {
            let old = items[index]
            items[index] = CartItem(id: old.id, product: old.product, quantity: old.quantity + 1)
        } else {
            items.append(CartItem(id: product.id, product: product, quantity: 1))
        }
    }

    func removeItem(_ productId: String) {
        items.removeAll { $0.product.id == productId }
    }

    func clear() {
        items.removeAll()
    }
}

struct ShoppingView: View {
    @State private var searchText: String = ""
    @State private var selectedFilter: String = "Tous"
    @State private var appeared: Bool = false
    @State private var filterTrigger: Int = 0
    @State private var cart = CartManager.shared

    private let filters = ["Tous", "Promo", "Nouveau", "Recommandé", "Tendance"]

    private var filteredProducts: [Product] {
        var result = MockData.products
        if !searchText.isEmpty {
            result = result.filter { $0.name.localizedStandardContains(searchText) }
        }
        if selectedFilter != "Tous" {
            result = result.filter { $0.badge == selectedFilter }
        }
        return result
    }

    var body: some View {
        ScrollView {
            VStack(spacing: MossombiSpacing.lg) {
                PremiumInput("Rechercher un produit...", text: $searchText, icon: "magnifyingglass")
                filterChips
                featuredProduct
                productsStaggeredGrid
            }
            .padding(.horizontal, MossombiSpacing.md)
            .padding(.bottom, MossombiSpacing.xxl)
            .opacity(appeared ? 1 : 0)
            .offset(y: appeared ? 0 : 10)
        }
        .scrollIndicators(.hidden)
        .background { AppBackground() }
        .navigationTitle("Shopping")
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                NavigationLink(value: AppRoute.cart) {
                    ZStack(alignment: .topTrailing) {
                        Image(systemName: "bag.fill")
                            .font(.body)
                            .foregroundStyle(Brand.linearGradient)
                        if cart.itemCount > 0 {
                            Text("\(cart.itemCount)")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundStyle(.white)
                                .frame(width: 18, height: 18)
                                .background(MossombiColors.danger, in: .circle)
                                .offset(x: 8, y: -6)
                        }
                    }
                }
            }
        }
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

    private var featuredProduct: some View {
        let product = MockData.products[0]
        return NavigationLink(value: AppRoute.productDetail(product.id)) {
            BrandGradientCard {
                HStack(spacing: MossombiSpacing.md) {
                    VStack(alignment: .leading, spacing: MossombiSpacing.xs) {
                        if let badge = product.badge {
                            Text(badge.uppercased())
                                .font(.system(size: 10, weight: .bold))
                                .foregroundStyle(.white)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 3)
                                .background(.white.opacity(0.2), in: .capsule)
                        }
                        Text(product.name)
                            .font(.headline)
                            .foregroundStyle(.white)
                        HStack(spacing: MossombiSpacing.xxs) {
                            Text("\(Int(product.price).formatted(.number.grouping(.automatic))) F")
                                .font(.title3.weight(.bold))
                                .foregroundStyle(.white)
                            if let original = product.originalPrice {
                                Text("\(Int(original).formatted(.number.grouping(.automatic))) F")
                                    .font(.caption)
                                    .foregroundStyle(.white.opacity(0.6))
                                    .strikethrough()
                            }
                        }
                    }
                    Spacer()
                    ZStack {
                        Circle()
                            .fill(.white.opacity(0.15))
                            .frame(width: 64, height: 64)
                        Image(systemName: product.icon)
                            .font(.system(size: 28, weight: .semibold))
                            .foregroundStyle(.white)
                    }
                }
                .padding(MossombiSpacing.md)
            }
        }
        .buttonStyle(PremiumPressStyle())
    }

    private var productsStaggeredGrid: some View {
        HStack(alignment: .top, spacing: MossombiSpacing.sm) {
            VStack(spacing: MossombiSpacing.sm) {
                ForEach(Array(filteredProducts.enumerated()), id: \.element.id) { index, product in
                    if index % 2 == 0 {
                        NavigationLink(value: AppRoute.productDetail(product.id)) {
                            StaggeredProductCard(product: product, isLarge: index % 4 == 0)
                        }
                        .buttonStyle(PremiumPressStyle())
                    }
                }
            }

            VStack(spacing: MossombiSpacing.sm) {
                ForEach(Array(filteredProducts.enumerated()), id: \.element.id) { index, product in
                    if index % 2 == 1 {
                        NavigationLink(value: AppRoute.productDetail(product.id)) {
                            StaggeredProductCard(product: product, isLarge: index % 4 == 1)
                        }
                        .buttonStyle(PremiumPressStyle())
                    }
                }
            }
        }
    }
}

struct StaggeredProductCard: View {
    let product: Product
    let isLarge: Bool

    var body: some View {
        Card3D(radius: MossombiRadius.md, padding: MossombiSpacing.sm) {
            VStack(alignment: .leading, spacing: MossombiSpacing.xs) {
                ZStack(alignment: .topTrailing) {
                    RoundedRectangle(cornerRadius: MossombiRadius.sm, style: .continuous)
                        .fill(
                            LinearGradient(
                                colors: [Brand.cyan.opacity(0.08), Brand.violet.opacity(0.06)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(height: isLarge ? 150 : 100)
                        .overlay {
                            Image(systemName: product.icon)
                                .font(.system(size: isLarge ? 44 : 32, weight: .light))
                                .foregroundStyle(Brand.linearGradient)
                        }

                    if let badge = product.badge {
                        Text(badge)
                            .font(.system(size: 8, weight: .bold))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 3)
                            .background(badgeColor(badge), in: .capsule)
                            .padding(6)
                    }
                }

                Text(product.name)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(.primary)
                    .lineLimit(2)
                    .fixedSize(horizontal: false, vertical: true)

                Text(product.category)
                    .font(.system(size: 10))
                    .foregroundStyle(.secondary)

                HStack(spacing: MossombiSpacing.xxs) {
                    Text("\(Int(product.price).formatted(.number.grouping(.automatic))) F")
                        .font(.subheadline.weight(.bold))
                        .foregroundStyle(Brand.linearGradient)
                    if let original = product.originalPrice {
                        Text("\(Int(original).formatted(.number.grouping(.automatic)))")
                            .font(.system(size: 10))
                            .foregroundStyle(.tertiary)
                            .strikethrough()
                    }
                }

                HStack(spacing: 2) {
                    Image(systemName: "star.fill")
                        .font(.system(size: 9))
                        .foregroundStyle(MossombiColors.warning)
                    Text(String(format: "%.1f", product.rating))
                        .font(.system(size: 10, weight: .medium))
                        .foregroundStyle(.secondary)
                    Text("(\(product.reviewCount))")
                        .font(.system(size: 9))
                        .foregroundStyle(.tertiary)
                }
            }
        }
    }

    private func badgeColor(_ badge: String) -> Color {
        switch badge {
        case "Promo": MossombiColors.danger
        case "Nouveau": Brand.cyan
        case "Recommandé": Brand.violet
        case "Tendance": Brand.orange
        case "Bio": MossombiColors.success
        default: Brand.blue
        }
    }
}
