import SwiftUI

struct Card3D<Content: View>: View {
    let radius: CGFloat
    let padding: CGFloat
    @ViewBuilder let content: () -> Content

    init(
        radius: CGFloat = MossombiRadius.lg,
        padding: CGFloat = MossombiSpacing.md,
        @ViewBuilder content: @escaping () -> Content
    ) {
        self.radius = radius
        self.padding = padding
        self.content = content
    }

    var body: some View {
        content()
            .padding(padding)
            .background {
                ZStack {
                    RoundedRectangle(cornerRadius: radius, style: .continuous)
                        .fill(.ultraThinMaterial)

                    RoundedRectangle(cornerRadius: radius, style: .continuous)
                        .fill(
                            LinearGradient(
                                colors: [
                                    Color.white.opacity(0.14),
                                    Color.white.opacity(0.03)
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )

                    RoundedRectangle(cornerRadius: radius, style: .continuous)
                        .strokeBorder(
                            LinearGradient(
                                colors: [
                                    Color.white.opacity(0.30),
                                    Brand.cyan.opacity(0.08),
                                    Color.white.opacity(0.05)
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 0.5
                        )
                }
            }
            .shadow(color: Brand.cyan.opacity(0.06), radius: 20, x: 0, y: 0)
            .shadow(color: Color.black.opacity(0.15), radius: 12, x: 0, y: 6)
            .shadow(color: Color.white.opacity(0.04), radius: 1, x: -1, y: -1)
    }
}

struct BrandGradientCard<Content: View>: View {
    let radius: CGFloat
    @ViewBuilder let content: () -> Content

    init(radius: CGFloat = MossombiRadius.lg, @ViewBuilder content: @escaping () -> Content) {
        self.radius = radius
        self.content = content
    }

    var body: some View {
        content()
            .background {
                ZStack {
                    RoundedRectangle(cornerRadius: radius, style: .continuous)
                        .fill(
                            LinearGradient(
                                colors: Brand.gradient,
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )

                    RoundedRectangle(cornerRadius: radius, style: .continuous)
                        .fill(
                            LinearGradient(
                                colors: [Color.white.opacity(0.2), Color.clear],
                                startPoint: .topLeading,
                                endPoint: .center
                            )
                        )

                    RoundedRectangle(cornerRadius: radius, style: .continuous)
                        .strokeBorder(
                            LinearGradient(
                                colors: [Color.white.opacity(0.4), Color.white.opacity(0.1)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 0.5
                        )
                }
            }
            .shadow(color: Brand.blue.opacity(0.3), radius: 16, x: 0, y: 8)
    }
}
