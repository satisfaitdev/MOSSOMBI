import SwiftUI

struct CheckoutView: View {
    @State private var selectedPayment: String = "Wallet"
    @State private var deliveryAddress: String = "Dakar, Plateau - Rue 10"
    @State private var showSuccess: Bool = false
    @State private var appeared: Bool = false
    @State private var cart = CartManager.shared

    private let paymentNames = ["Wallet", "Orange Money", "Carte bancaire"]
    private let paymentIcons = ["wallet.bifold.fill", "phone.fill", "creditcard.fill"]

    private var deliveryFee: Double { cart.totalPrice > 100000 ? 0 : 3500 }
    private var grandTotal: Double { cart.totalPrice + deliveryFee }

    var body: some View {
        if showSuccess {
            orderSuccessView
        } else {
            ScrollView {
                VStack(spacing: MossombiSpacing.xl) {
                    deliverySection
                    paymentSection
                    orderSummary
                }
                .padding(.horizontal, MossombiSpacing.md)
                .padding(.bottom, 100)
                .opacity(appeared ? 1 : 0)
                .offset(y: appeared ? 0 : 10)
            }
            .scrollIndicators(.hidden)
            .background { AppBackground() }
            .navigationTitle("Commande")
            .navigationBarTitleDisplayMode(.large)
            .safeAreaInset(edge: .bottom) {
                confirmButton
            }
            .onAppear {
                withAnimation(.spring(response: 0.5, dampingFraction: 0.8).delay(0.05)) {
                    appeared = true
                }
            }
        }
    }

    private var deliverySection: some View {
        VStack(alignment: .leading, spacing: MossombiSpacing.sm) {
            Text("Livraison")
                .font(.headline)

            Card3D(radius: MossombiRadius.md, padding: MossombiSpacing.md) {
                HStack(spacing: MossombiSpacing.sm) {
                    IconBubble3D("mappin.circle.fill", size: 18, bubbleSize: 44)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Adresse de livraison")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Text(deliveryAddress)
                            .font(.body.weight(.medium))
                    }
                    Spacer()
                    Button {} label: {
                        Text("Modifier")
                            .font(.caption.weight(.medium))
                            .foregroundStyle(Brand.linearGradient)
                    }
                }
            }

            Card3D(radius: MossombiRadius.md, padding: MossombiSpacing.md) {
                HStack(spacing: MossombiSpacing.sm) {
                    IconBubble3D("clock.fill", size: 18, bubbleSize: 44)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Délai estimé")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Text("2-5 jours ouvrés")
                            .font(.body.weight(.medium))
                    }
                    Spacer()
                }
            }
        }
    }

    private var paymentSection: some View {
        VStack(alignment: .leading, spacing: MossombiSpacing.sm) {
            Text("Paiement")
                .font(.headline)

            ForEach(Array(paymentNames.enumerated()), id: \.offset) { index, name in
                Button {
                    withAnimation(.snappy) { selectedPayment = name }
                } label: {
                    Card3D(radius: MossombiRadius.md, padding: MossombiSpacing.sm) {
                        HStack(spacing: MossombiSpacing.sm) {
                            Image(systemName: paymentIcons[index])
                                .font(.body.weight(.semibold))
                                .foregroundStyle(Brand.linearGradient)
                                .frame(width: 28)
                            Text(name)
                                .font(.body.weight(.medium))
                                .foregroundStyle(.primary)
                            Spacer()
                            Image(systemName: selectedPayment == name ? "checkmark.circle.fill" : "circle")
                                .font(.title3)
                                .foregroundStyle(selectedPayment == name ? AnyShapeStyle(Brand.linearGradient) : AnyShapeStyle(.tertiary))
                        }
                    }
                }
                .buttonStyle(PremiumPressStyle())
            }
        }
    }

    private var orderSummary: some View {
        Card3D(radius: MossombiRadius.lg, padding: MossombiSpacing.md) {
            VStack(spacing: MossombiSpacing.sm) {
                Text("Résumé")
                    .font(.headline)
                    .frame(maxWidth: .infinity, alignment: .leading)

                ForEach(cart.items) { item in
                    HStack {
                        Text("\(item.product.name) x\(item.quantity)")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                        Spacer()
                        Text("\(Int(item.product.price * Double(item.quantity)).formatted(.number.grouping(.automatic))) F")
                            .font(.subheadline.weight(.medium))
                    }
                }

                Divider()
                HStack {
                    Text("Livraison")
                        .font(.subheadline).foregroundStyle(.secondary)
                    Spacer()
                    Text(deliveryFee == 0 ? "Gratuite" : "\(Int(deliveryFee).formatted(.number.grouping(.automatic))) F")
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(deliveryFee == 0 ? MossombiColors.success : .primary)
                }
                Divider()
                HStack {
                    Text("Total")
                        .font(.headline)
                    Spacer()
                    Text("\(Int(grandTotal).formatted(.number.grouping(.automatic))) F")
                        .font(.title3.weight(.bold))
                        .foregroundStyle(Brand.linearGradient)
                }
            }
        }
    }

    private var confirmButton: some View {
        PremiumButton("Confirmer la commande • \(Int(grandTotal).formatted(.number.grouping(.automatic))) F", icon: "checkmark.shield.fill", variant: .primary) {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.8)) {
                showSuccess = true
                cart.clear()
            }
        }
        .padding(.horizontal, MossombiSpacing.md)
        .padding(.vertical, MossombiSpacing.xs)
    }

    private var orderSuccessView: some View {
        VStack(spacing: MossombiSpacing.xl) {
            Spacer()

            ZStack {
                Circle()
                    .fill(MossombiColors.success.opacity(0.12))
                    .frame(width: 140, height: 140)
                Circle()
                    .fill(MossombiColors.success.opacity(0.2))
                    .frame(width: 100, height: 100)
                Image(systemName: "bag.fill.badge.checkmark")
                    .font(.system(size: 48))
                    .foregroundStyle(MossombiColors.success)
            }

            VStack(spacing: MossombiSpacing.sm) {
                Text("Commande confirmée!")
                    .font(.title2.weight(.bold))
                Text("Votre commande a été passée avec succès.\nVous recevrez une notification de suivi.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }

            Text("CMD-\(Int.random(in: 100000...999999))")
                .font(.caption.weight(.medium))
                .foregroundStyle(.tertiary)
                .padding(.horizontal, MossombiSpacing.md)
                .padding(.vertical, MossombiSpacing.xs)
                .background(.ultraThinMaterial, in: .capsule)

            Spacer()
        }
        .padding(.horizontal, MossombiSpacing.md)
        .background { AppBackground() }
        .navigationTitle("Confirmation")
        .navigationBarTitleDisplayMode(.inline)
    }
}
