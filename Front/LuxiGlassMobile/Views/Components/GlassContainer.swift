import SwiftUI

struct GlassContainer<Content: View>: View {
    let radius: CGFloat
    let padding: CGFloat
    let hasGlow: Bool
    @ViewBuilder let content: () -> Content

    init(
        radius: CGFloat = MossombiRadius.md,
        padding: CGFloat = MossombiSpacing.md,
        hasGlow: Bool = false,
        @ViewBuilder content: @escaping () -> Content
    ) {
        self.radius = radius
        self.padding = padding
        self.hasGlow = hasGlow
        self.content = content
    }

    var body: some View {
        content()
            .padding(padding)
            .background {
                RoundedRectangle(cornerRadius: radius, style: .continuous)
                    .fill(.ultraThinMaterial)
                    .overlay {
                        RoundedRectangle(cornerRadius: radius, style: .continuous)
                            .fill(
                                LinearGradient(
                                    colors: [
                                        MossombiColors.cardGradientStart,
                                        MossombiColors.cardGradientEnd
                                    ],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                    }
                    .overlay {
                        RoundedRectangle(cornerRadius: radius, style: .continuous)
                            .strokeBorder(
                                LinearGradient(
                                    colors: [
                                        Color.white.opacity(0.25),
                                        Color.white.opacity(0.05)
                                    ],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ),
                                lineWidth: 0.5
                            )
                    }
            }
            .shadow(color: MossombiColors.glassShadow, radius: 12, x: 0, y: 4)
            .shadow(color: hasGlow ? Brand.cyan.opacity(0.08) : .clear, radius: 16, x: 0, y: 0)
    }
}
