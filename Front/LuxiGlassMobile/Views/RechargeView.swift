import SwiftUI

struct RechargeView: View {
    @State private var selectedOperator: RechargeOperator? = nil
    @State private var phoneNumber: String = ""
    @State private var amount: String = ""
    @State private var showConfirmation: Bool = false
    @State private var showSuccess: Bool = false
    @State private var appeared: Bool = false

    private let quickAmounts = [500, 1000, 2000, 5000, 10000, 25000]

    var body: some View {
        ScrollView {
            VStack(spacing: MossombiSpacing.xl) {
                if showSuccess {
                    successSection
                } else if showConfirmation {
                    confirmSection
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
        .navigationTitle("Recharger")
        .navigationBarTitleDisplayMode(.large)
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.8).delay(0.05)) {
                appeared = true
            }
        }
    }

    private var formSection: some View {
        VStack(spacing: MossombiSpacing.lg) {
            VStack(alignment: .leading, spacing: MossombiSpacing.sm) {
                Text("Opérateur")
                    .font(.headline)

                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: MossombiSpacing.sm) {
                    ForEach(MockData.rechargeOperators) { op in
                        Button {
                            withAnimation(.snappy) { selectedOperator = op }
                        } label: {
                            Card3D(radius: MossombiRadius.md, padding: MossombiSpacing.sm) {
                                HStack(spacing: MossombiSpacing.xs) {
                                    Image(systemName: op.icon)
                                        .font(.body.weight(.semibold))
                                        .foregroundStyle(Brand.linearGradient)
                                        .frame(width: 28)
                                    Text(op.name)
                                        .font(.subheadline.weight(.medium))
                                        .foregroundStyle(.primary)
                                    Spacer()
                                    if selectedOperator?.id == op.id {
                                        Image(systemName: "checkmark.circle.fill")
                                            .font(.body)
                                            .foregroundStyle(Brand.linearGradient)
                                    }
                                }
                            }
                        }
                        .buttonStyle(PremiumPressStyle())
                    }
                }
            }

            PremiumInput("Numéro de téléphone", text: $phoneNumber, icon: "phone.fill")

            VStack(spacing: MossombiSpacing.sm) {
                Text("Montant")
                    .font(.headline)
                    .frame(maxWidth: .infinity, alignment: .leading)

                LazyVGrid(columns: [GridItem(.adaptive(minimum: 90), spacing: MossombiSpacing.xs)], spacing: MossombiSpacing.xs) {
                    ForEach(quickAmounts, id: \.self) { amt in
                        Button {
                            amount = "\(amt)"
                        } label: {
                            Text("\(amt.formatted(.number.grouping(.automatic))) F")
                                .font(.caption.weight(.semibold))
                                .padding(.vertical, MossombiSpacing.sm)
                                .frame(maxWidth: .infinity)
                                .foregroundStyle(amount == "\(amt)" ? .white : .primary)
                                .background {
                                    if amount == "\(amt)" {
                                        RoundedRectangle(cornerRadius: MossombiRadius.sm, style: .continuous).fill(Brand.linearGradientHorizontal)
                                    } else {
                                        RoundedRectangle(cornerRadius: MossombiRadius.sm, style: .continuous).fill(.ultraThinMaterial)
                                            .overlay { RoundedRectangle(cornerRadius: MossombiRadius.sm, style: .continuous).strokeBorder(MossombiColors.glassBorder, lineWidth: 0.5) }
                                    }
                                }
                        }
                    }
                }

                PremiumInput("Ou saisir un montant", text: $amount, icon: "number")
            }

            PremiumButton("Recharger", icon: "phone.arrow.up.right", variant: .primary, isDisabled: selectedOperator == nil || phoneNumber.isEmpty || amount.isEmpty) {
                withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                    showConfirmation = true
                }
            }
        }
    }

    private var confirmSection: some View {
        VStack(spacing: MossombiSpacing.xl) {
            IconBubble3D("phone.arrow.up.right", size: 28, bubbleSize: 72)
                .padding(.top, MossombiSpacing.lg)

            Text("\(amount) F")
                .font(.system(size: 42, weight: .bold, design: .rounded))
                .foregroundStyle(Brand.linearGradient)

            Card3D(radius: MossombiRadius.lg, padding: MossombiSpacing.md) {
                VStack(spacing: MossombiSpacing.sm) {
                    HStack {
                        Text("Opérateur")
                            .font(.subheadline).foregroundStyle(.secondary)
                        Spacer()
                        Text(selectedOperator?.name ?? "")
                            .font(.subheadline.weight(.medium))
                    }
                    Divider()
                    HStack {
                        Text("Numéro")
                            .font(.subheadline).foregroundStyle(.secondary)
                        Spacer()
                        Text(phoneNumber)
                            .font(.subheadline.weight(.medium))
                    }
                    Divider()
                    HStack {
                        Text("Montant")
                            .font(.subheadline).foregroundStyle(.secondary)
                        Spacer()
                        Text("\(amount) F")
                            .font(.subheadline.weight(.bold))
                            .foregroundStyle(Brand.linearGradient)
                    }
                }
            }

            VStack(spacing: MossombiSpacing.sm) {
                PremiumButton("Confirmer", icon: "checkmark", variant: .primary) {
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
                Text("Recharge réussie!")
                    .font(.title2.weight(.bold))
                Text("\(amount) F • \(selectedOperator?.name ?? "") • \(phoneNumber)")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
        }
    }
}
