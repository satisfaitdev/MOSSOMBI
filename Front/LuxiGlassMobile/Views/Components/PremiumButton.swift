import SwiftUI

enum PremiumButtonVariant {
    case primary
    case secondary
    case ghost
}

struct PremiumButton: View {
    let title: String
    let icon: String?
    let variant: PremiumButtonVariant
    let isLoading: Bool
    let isDisabled: Bool
    let action: () -> Void

    @State private var pressCount: Int = 0

    init(
        _ title: String,
        icon: String? = nil,
        variant: PremiumButtonVariant = .primary,
        isLoading: Bool = false,
        isDisabled: Bool = false,
        action: @escaping () -> Void
    ) {
        self.title = title
        self.icon = icon
        self.variant = variant
        self.isLoading = isLoading
        self.isDisabled = isDisabled
        self.action = action
    }

    var body: some View {
        Button {
            pressCount += 1
            action()
        } label: {
            HStack(spacing: MossombiSpacing.xs) {
                if isLoading {
                    ProgressView()
                        .tint(labelColor)
                } else {
                    if let icon {
                        Image(systemName: icon)
                            .font(.body.weight(.semibold))
                    }
                    Text(title)
                        .font(.body.weight(.semibold))
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .padding(.horizontal, MossombiSpacing.lg)
            .foregroundStyle(labelColor)
            .background(backgroundView)
        }
        .buttonStyle(PremiumPressStyle())
        .disabled(isDisabled || isLoading)
        .opacity(isDisabled ? 0.5 : 1.0)
        .sensoryFeedback(.impact(weight: .light), trigger: pressCount)
    }

    private var labelColor: Color {
        switch variant {
        case .primary: .white
        case .secondary: .primary
        case .ghost: Brand.cyan
        }
    }

    @ViewBuilder
    private var backgroundView: some View {
        switch variant {
        case .primary:
            RoundedRectangle(cornerRadius: MossombiRadius.sm, style: .continuous)
                .fill(
                    LinearGradient(
                        colors: Brand.gradient,
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .shadow(color: Brand.blue.opacity(0.3), radius: 8, x: 0, y: 4)
        case .secondary:
            RoundedRectangle(cornerRadius: MossombiRadius.sm, style: .continuous)
                .fill(.ultraThinMaterial)
                .overlay {
                    RoundedRectangle(cornerRadius: MossombiRadius.sm, style: .continuous)
                        .strokeBorder(MossombiColors.glassBorder, lineWidth: 0.5)
                }
        case .ghost:
            Color.clear
        }
    }
}

struct PremiumPressStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.97 : 1.0)
            .opacity(configuration.isPressed ? 0.85 : 1.0)
            .animation(.snappy(duration: 0.15), value: configuration.isPressed)
    }
}
