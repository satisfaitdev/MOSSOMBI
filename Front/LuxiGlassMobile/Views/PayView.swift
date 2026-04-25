import SwiftUI

struct PayView: View {
    @State private var amount: String = ""
    @State private var selectedMethod: String = "Wallet"
    @State private var reference: String = ""
    @State private var showConfirmation: Bool = false
    @State private var showSuccess: Bool = false
    @State private var appeared: Bool = false

    private let methodNames = ["Wallet", "Orange Money", "Wave", "Carte bancaire"]
    private let methodIcons = ["wallet.bifold.fill", "phone.fill", "wave.3.forward", "creditcard.fill"]

    var body: some View {
        ScrollView {
            VStack(spacing: MossombiSpacing.xl) {
                if showSuccess {
                    successSection
                } else if showConfirmation {
                    confirmationSection
                } else {
                    formSection
                }
            }
            .padding(.horizontal, MossombiSpacing.md)
            .padding(.bottom, MossombiSpacing.xxl)
            .opacity(appeared ? 1 : 0)
            .offset(y: appeared ? 0 : 10)
        }
        .scrollIndicators(.hidden)
        .background { AppBackground() }
        .navigationTitle("Payer / Retrait")
        .navigationBarTitleDisplayMode(.large)
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.8).delay(0.05)) {
                appeared = true
            }
        }
    }

    private var formSection: some View {
        VStack(spacing: MossombiSpacing.lg) {
            Card3D(radius: MossombiRadius.xl, padding: MossombiSpacing.lg) {
                VStack(spacing: MossombiSpacing.md) {
                    Text("Solde disponible")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    Text("\(MockData.walletBalance.formatted(.number.grouping(.automatic))) F")
                        .font(.system(size: 32, weight: .bold, design: .rounded))
                        .foregroundStyle(Brand.linearGradient)
                }
                .frame(maxWidth: .infinity)
            }

            VStack(alignment: .leading, spacing: MossombiSpacing.sm) {
                Text("Méthode de retrait")
                    .font(.headline)

                ForEach(Array(methodNames.enumerated()), id: \.offset) { index, name in
                    Button {
                        withAnimation(.snappy) { selectedMethod = name }
                    } label: {
                        Card3D(radius: MossombiRadius.md, padding: MossombiSpacing.sm) {
                            HStack(spacing: MossombiSpacing.sm) {
                                IconBubble3D(methodIcons[index], size: 18, bubbleSize: 44)
                                Text(name)
                                    .font(.body.weight(.medium))
                                    .foregroundStyle(.primary)
                                Spacer()
                                Image(systemName: selectedMethod == name ? "checkmark.circle.fill" : "circle")
                                    .font(.title3)
                                    .foregroundStyle(selectedMethod == name ? AnyShapeStyle(Brand.linearGradient) : AnyShapeStyle(.tertiary))
                            }
                        }
                    }
                    .buttonStyle(PremiumPressStyle())
                }
            }

            VStack(spacing: MossombiSpacing.sm) {
                Text("Montant")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)

                HStack(alignment: .firstTextBaseline, spacing: MossombiSpacing.xs) {
                    TextField("0", text: $amount)
                        .font(.system(size: 44, weight: .bold, design: .rounded))
                        .foregroundStyle(Brand.linearGradient)
                        .keyboardType(.numberPad)
                        .multilineTextAlignment(.center)
                    Text("F")
                        .font(.title3.weight(.semibold))
                        .foregroundStyle(.secondary)
                }
            }

            if selectedMethod != "Wallet" {
                PremiumInput("Référence / Numéro", text: $reference, icon: "number")
            }

            PremiumButton("Continuer", icon: "arrow.right", variant: .primary, isDisabled: amount.isEmpty || (Int(amount) ?? 0) <= 0) {
                withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                    showConfirmation = true
                }
            }
        }
    }

    private var confirmationSection: some View {
        VStack(spacing: MossombiSpacing.xl) {
            IconBubble3D("creditcard.fill", size: 28, bubbleSize: 72)
                .padding(.top, MossombiSpacing.lg)

            Text("\(amount) F")
                .font(.system(size: 42, weight: .bold, design: .rounded))
                .foregroundStyle(Brand.linearGradient)

            Card3D(radius: MossombiRadius.lg, padding: MossombiSpacing.md) {
                VStack(spacing: MossombiSpacing.sm) {
                    HStack {
                        Text("Méthode")
                            .font(.subheadline).foregroundStyle(.secondary)
                        Spacer()
                        Text(selectedMethod)
                            .font(.subheadline.weight(.medium))
                    }
                    Divider()
                    HStack {
                        Text("Montant")
                            .font(.subheadline).foregroundStyle(.secondary)
                        Spacer()
                        Text("\(amount) F")
                            .font(.subheadline.weight(.medium))
                    }
                    Divider()
                    HStack {
                        Text("Frais")
                            .font(.subheadline).foregroundStyle(.secondary)
                        Spacer()
                        Text(selectedMethod == "Wallet" ? "Gratuit" : "150 F")
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(selectedMethod == "Wallet" ? MossombiColors.success : .primary)
                    }
                }
            }

            VStack(spacing: MossombiSpacing.sm) {
                PremiumButton("Confirmer le paiement", icon: "checkmark.shield.fill", variant: .primary) {
                    withAnimation(.spring(response: 0.5, dampingFraction: 0.8)) {
                        showSuccess = true
                    }
                }
                PremiumButton("Retour", variant: .ghost) {
                    withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                        showConfirmation = false
                    }
                }
            }
        }
    }

    private var successSection: some View {
        VStack(spacing: MossombiSpacing.xl) {
            Spacer().frame(height: 40)

            ZStack {
                Circle()
                    .fill(MossombiColors.success.opacity(0.12))
                    .frame(width: 120, height: 120)
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 56))
                    .foregroundStyle(MossombiColors.success)
            }

            VStack(spacing: MossombiSpacing.xs) {
                Text("Paiement réussi!")
                    .font(.title2.weight(.bold))
                Text("\(amount) F via \(selectedMethod)")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }

            Text("Réf: PAY-\(Int.random(in: 100000...999999))")
                .font(.caption)
                .foregroundStyle(.tertiary)
                .padding(.horizontal, MossombiSpacing.md)
                .padding(.vertical, MossombiSpacing.xs)
                .background(.ultraThinMaterial, in: .capsule)
        }
    }
}
