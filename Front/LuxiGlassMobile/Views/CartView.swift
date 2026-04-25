import SwiftUI

struct CartView: View {
    @State private var cart = CartManager.shared
    @State private var appeared: Bool = false

    var body: some View {
        ScrollView {
            VStack(spacing: MossombiSpacing.lg) {
                if cart.items.isEmpty {
                    emptyState
                } else {
                    ForEach(cart.items) { item in
                        cartItemRow(item)
                    }
                    promoCodeSection
                    summarySection
                }
            }
            .padding(.horizontal, MossombiSpacing.md)
            .padding(.bottom, cart.items.isEmpty ? MossombiSpacing.xxl : 100)
            .opacity(appeared ? 1 : 0)
            .offset(y: appeared ? 0 : 10)
        }
        .scrollIndicators(.hidden)
        .background { AppBackground() }
        .navigationTitle("Panier")
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            if !cart.items.isEmpty {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                            cart.clear()
                        }
                    } label: {
                        Text("Vider")
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(MossombiColors.danger)
                    }
                }
            }
        }
        .safeAreaInset(edge: .bottom) {
            if !cart.items.isEmpty {
                checkoutBar
            }
        }
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.8).delay(0.05)) {
                appeared = true
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: MossombiSpacing.lg) {
            Spacer().frame(height: 60)
            ZStack {
                Circle()
                    .fill(Brand.cyan.opacity(0.08))
                    .frame(width: 120, height: 120)
                Image(systemName: "bag")
                    .font(.system(size: 48, weight: .light))
                    .foregroundStyle(Brand.linearGradient)
            }
            Text("Votre panier est vide")
                .font(.title3.weight(.semibold))
            Text("Explorez nos produits et ajoutez-les à votre panier")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
    }

    private func cartItemRow(_ item: CartItem) -> some View {
        Card3D(radius: MossombiRadius.md, padding: MossombiSpacing.md) {
            HStack(spacing: MossombiSpacing.sm) {
                RoundedRectangle(cornerRadius: MossombiRadius.sm, style: .continuous)
                    .fill(Brand.cyan.opacity(0.06))
                    .frame(width: 72, height: 72)
                    .overlay {
                        Image(systemName: item.product.icon)
                            .font(.title2.weight(.light))
                            .foregroundStyle(Brand.linearGradient)
                    }

                VStack(alignment: .leading, spacing: MossombiSpacing.xxs) {
                    Text(item.product.name)
                        .font(.subheadline.weight(.semibold))
                        .lineLimit(1)
                    Text(item.product.category)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text("\(Int(item.product.price).formatted(.number.grouping(.automatic))) F")
                        .font(.subheadline.weight(.bold))
                        .foregroundStyle(Brand.linearGradient)
                }

                Spacer()

                VStack(spacing: MossombiSpacing.xs) {
                    Text("x\(item.quantity)")
                        .font(.subheadline.weight(.semibold))

                    Button {
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                            cart.removeItem(item.product.id)
                        }
                    } label: {
                        Image(systemName: "trash")
                            .font(.caption)
                            .foregroundStyle(MossombiColors.danger)
                    }
                }
            }
        }
    }

    @State private var promoCode: String = ""

    private var promoCodeSection: some View {
        HStack(spacing: MossombiSpacing.sm) {
            PremiumInput("Code promo", text: $promoCode, icon: "tag.fill")
            Button {
            } label: {
                Text("Appliquer")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, MossombiSpacing.md)
                    .padding(.vertical, 14)
                    .background(Brand.linearGradientHorizontal, in: .capsule)
            }
        }
    }

    private var summarySection: some View {
        Card3D(radius: MossombiRadius.lg, padding: MossombiSpacing.md) {
            VStack(spacing: MossombiSpacing.sm) {
                HStack {
                    Text("Sous-total")
                        .font(.subheadline).foregroundStyle(.secondary)
                    Spacer()
                    Text("\(Int(cart.totalPrice).formatted(.number.grouping(.automatic))) F")
                        .font(.subheadline.weight(.medium))
                }
                Divider()
                HStack {
                    Text("Livraison")
                        .font(.subheadline).foregroundStyle(.secondary)
                    Spacer()
                    Text(cart.totalPrice > 100000 ? "Gratuite" : "3 500 F")
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(cart.totalPrice > 100000 ? MossombiColors.success : .primary)
                }
                Divider()
                HStack {
                    Text("Total")
                        .font(.headline)
                    Spacer()
                    let total = cart.totalPrice + (cart.totalPrice > 100000 ? 0 : 3500)
                    Text("\(Int(total).formatted(.number.grouping(.automatic))) F")
                        .font(.headline.weight(.bold))
                        .foregroundStyle(Brand.linearGradient)
                }
            }
        }
    }

    private var checkoutBar: some View {
        NavigationLink(value: AppRoute.checkout) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("\(cart.itemCount) article\(cart.itemCount > 1 ? "s" : "")")
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.8))
                    Text("\(Int(cart.totalPrice).formatted(.number.grouping(.automatic))) F")
                        .font(.headline.weight(.bold))
                        .foregroundStyle(.white)
                }
                Spacer()
                Text("Commander")
                    .font(.body.weight(.bold))
                    .foregroundStyle(.white)
                Image(systemName: "arrow.right")
                    .font(.body.weight(.bold))
                    .foregroundStyle(.white)
            }
            .padding(.horizontal, MossombiSpacing.lg)
            .padding(.vertical, MossombiSpacing.md)
            .background(Brand.linearGradientHorizontal, in: .rect(cornerRadius: MossombiRadius.md))
            .shadow(color: Brand.blue.opacity(0.3), radius: 12, x: 0, y: 4)
            .padding(.horizontal, MossombiSpacing.md)
            .padding(.vertical, MossombiSpacing.xs)
        }
        .buttonStyle(PremiumPressStyle())
    }
}
