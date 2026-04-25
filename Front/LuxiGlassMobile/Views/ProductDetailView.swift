import SwiftUI

struct ProductDetailView: View {
    let productId: String
    @State private var selectedQuantity: Int = 1
    @State private var addedToCart: Bool = false
    @State private var appeared: Bool = false
    @State private var cartTrigger: Int = 0
    @State private var cart = CartManager.shared

    private var product: Product? {
        MockData.products.first { $0.id == productId }
    }

    var body: some View {
        if let product {
            ScrollView {
                VStack(spacing: MossombiSpacing.xl) {
                    heroSection(product)
                    infoSection(product)
                    quantitySelector
                    specsSection(product)
                    reviewsPreview(product)
                    relatedProducts(product)
                }
                .padding(.horizontal, MossombiSpacing.md)
                .padding(.bottom, 100)
                .opacity(appeared ? 1 : 0)
                .offset(y: appeared ? 0 : 10)
            }
            .scrollIndicators(.hidden)
            .background { AppBackground() }
            .navigationTitle("")
            .navigationBarTitleDisplayMode(.inline)
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
            .safeAreaInset(edge: .bottom) {
                bottomBar(product)
            }
            .onAppear {
                withAnimation(.spring(response: 0.5, dampingFraction: 0.8).delay(0.05)) {
                    appeared = true
                }
            }
        }
    }

    private func heroSection(_ product: Product) -> some View {
        Card3D(radius: MossombiRadius.xl, padding: 0) {
            ZStack(alignment: .topTrailing) {
                RoundedRectangle(cornerRadius: MossombiRadius.xl, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: [Brand.cyan.opacity(0.08), Brand.violet.opacity(0.06)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(height: 280)
                    .overlay {
                        Image(systemName: product.icon)
                            .font(.system(size: 80, weight: .ultraLight))
                            .foregroundStyle(Brand.linearGradient)
                    }

                if let badge = product.badge {
                    Text(badge.uppercased())
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 5)
                        .background(MossombiColors.danger, in: .capsule)
                        .padding(MossombiSpacing.md)
                }
            }
        }
    }

    private func infoSection(_ product: Product) -> some View {
        VStack(alignment: .leading, spacing: MossombiSpacing.sm) {
            Text(product.category)
                .font(.caption.weight(.medium))
                .foregroundStyle(Brand.linearGradient)

            Text(product.name)
                .font(.title2.weight(.bold))

            HStack(spacing: MossombiSpacing.sm) {
                HStack(spacing: 2) {
                    ForEach(0..<5) { i in
                        Image(systemName: i < Int(product.rating) ? "star.fill" : "star")
                            .font(.caption)
                            .foregroundStyle(MossombiColors.warning)
                    }
                }
                Text(String(format: "%.1f", product.rating))
                    .font(.subheadline.weight(.medium))
                Text("(\(product.reviewCount) avis)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            HStack(alignment: .firstTextBaseline, spacing: MossombiSpacing.xs) {
                Text("\(Int(product.price).formatted(.number.grouping(.automatic))) F")
                    .font(.title.weight(.bold))
                    .foregroundStyle(Brand.linearGradient)
                if let original = product.originalPrice {
                    Text("\(Int(original).formatted(.number.grouping(.automatic))) F")
                        .font(.body)
                        .foregroundStyle(.tertiary)
                        .strikethrough()

                    let discount = Int(((original - product.price) / original) * 100)
                    Text("-\(discount)%")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(MossombiColors.danger, in: .capsule)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var quantitySelector: some View {
        Card3D(radius: MossombiRadius.md, padding: MossombiSpacing.md) {
            HStack {
                Text("Quantité")
                    .font(.subheadline.weight(.medium))

                Spacer()

                HStack(spacing: MossombiSpacing.md) {
                    Button {
                        if selectedQuantity > 1 { selectedQuantity -= 1 }
                    } label: {
                        Image(systemName: "minus.circle.fill")
                            .font(.title3)
                            .foregroundStyle(selectedQuantity > 1 ? AnyShapeStyle(Brand.linearGradient) : AnyShapeStyle(.tertiary))
                    }

                    Text("\(selectedQuantity)")
                        .font(.headline)
                        .frame(width: 36)

                    Button {
                        if selectedQuantity < 10 { selectedQuantity += 1 }
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .font(.title3)
                            .foregroundStyle(Brand.linearGradient)
                    }
                }
            }
        }
    }

    private func specsSection(_ product: Product) -> some View {
        GlassContainer {
            VStack(alignment: .leading, spacing: MossombiSpacing.sm) {
                Text("Détails")
                    .font(.headline)

                VStack(spacing: MossombiSpacing.xs) {
                    specRow("Catégorie", value: product.category)
                    Divider()
                    specRow("Disponibilité", value: "En stock")
                    Divider()
                    specRow("Livraison", value: "2-5 jours ouvrés")
                    Divider()
                    specRow("Garantie", value: "12 mois")
                    Divider()
                    specRow("Retour", value: "30 jours")
                }
            }
        }
    }

    private func specRow(_ label: String, value: String) -> some View {
        HStack {
            Text(label)
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Spacer()
            Text(value)
                .font(.subheadline.weight(.medium))
        }
    }

    private func reviewsPreview(_ product: Product) -> some View {
        GlassContainer {
            VStack(alignment: .leading, spacing: MossombiSpacing.sm) {
                HStack {
                    Text("Avis clients")
                        .font(.headline)
                    Spacer()
                    Text("Voir tout")
                        .font(.caption.weight(.medium))
                        .foregroundStyle(Brand.linearGradient)
                }

                ForEach(0..<2, id: \.self) { i in
                    VStack(alignment: .leading, spacing: MossombiSpacing.xxs) {
                        HStack {
                            HStack(spacing: 1) {
                                ForEach(0..<5, id: \.self) { s in
                                    Image(systemName: s < (i == 0 ? 5 : 4) ? "star.fill" : "star")
                                        .font(.system(size: 9))
                                        .foregroundStyle(MossombiColors.warning)
                                }
                            }
                            Spacer()
                            Text(i == 0 ? "Il y a 2 jours" : "Il y a 1 semaine")
                                .font(.system(size: 10))
                                .foregroundStyle(.tertiary)
                        }
                        Text(i == 0 ? "Excellent produit, livraison rapide!" : "Bon rapport qualité/prix. Emballage soigné.")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    if i == 0 { Divider() }
                }
            }
        }
    }

    private func relatedProducts(_ product: Product) -> some View {
        VStack(alignment: .leading, spacing: MossombiSpacing.sm) {
            Text("Produits similaires")
                .font(.headline)

            ScrollView(.horizontal) {
                HStack(spacing: MossombiSpacing.sm) {
                    ForEach(MockData.products.filter { $0.id != product.id }.prefix(4)) { p in
                        NavigationLink(value: AppRoute.productDetail(p.id)) {
                            Card3D(radius: MossombiRadius.md, padding: MossombiSpacing.sm) {
                                VStack(alignment: .leading, spacing: MossombiSpacing.xxs) {
                                    RoundedRectangle(cornerRadius: MossombiRadius.sm, style: .continuous)
                                        .fill(Brand.cyan.opacity(0.06))
                                        .frame(width: 120, height: 80)
                                        .overlay {
                                            Image(systemName: p.icon)
                                                .font(.title2.weight(.light))
                                                .foregroundStyle(Brand.linearGradient)
                                        }
                                    Text(p.name)
                                        .font(.system(size: 11, weight: .medium))
                                        .foregroundStyle(.primary)
                                        .lineLimit(1)
                                    Text("\(Int(p.price).formatted(.number.grouping(.automatic))) F")
                                        .font(.caption.weight(.bold))
                                        .foregroundStyle(Brand.linearGradient)
                                }
                                .frame(width: 120)
                            }
                        }
                        .buttonStyle(PremiumPressStyle())
                    }
                }
            }
            .contentMargins(.horizontal, 0)
            .scrollIndicators(.hidden)
        }
    }

    private func bottomBar(_ product: Product) -> some View {
        HStack(spacing: MossombiSpacing.sm) {
            VStack(alignment: .leading, spacing: 2) {
                Text("Total")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text("\(Int(product.price * Double(selectedQuantity)).formatted(.number.grouping(.automatic))) F")
                    .font(.headline.weight(.bold))
                    .foregroundStyle(Brand.linearGradient)
            }

            Spacer()

            Button {
                for _ in 0..<selectedQuantity {
                    cart.addItem(product)
                }
                withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                    addedToCart = true
                }
                cartTrigger += 1
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                    addedToCart = false
                }
            } label: {
                HStack(spacing: MossombiSpacing.xs) {
                    Image(systemName: addedToCart ? "checkmark" : "bag.badge.plus")
                        .font(.body.weight(.semibold))
                        .contentTransition(.symbolEffect(.replace))
                    Text(addedToCart ? "Ajouté!" : "Ajouter au panier")
                        .font(.subheadline.weight(.bold))
                }
                .foregroundStyle(.white)
                .padding(.horizontal, MossombiSpacing.lg)
                .padding(.vertical, 14)
                .background(Brand.linearGradientHorizontal, in: .capsule)
                .shadow(color: Brand.blue.opacity(0.3), radius: 8, x: 0, y: 4)
            }
            .sensoryFeedback(.success, trigger: cartTrigger)
        }
        .padding(.horizontal, MossombiSpacing.md)
        .padding(.vertical, MossombiSpacing.sm)
        .background(.ultraThinMaterial)
    }
}
