import SwiftUI

struct LiquidGlassCard<Header: View, Content: View, Footer: View>: View {
    let isLoading: Bool
    @ViewBuilder let header: () -> Header
    @ViewBuilder let content: () -> Content
    @ViewBuilder let footer: () -> Footer

    init(
        isLoading: Bool = false,
        @ViewBuilder header: @escaping () -> Header,
        @ViewBuilder content: @escaping () -> Content,
        @ViewBuilder footer: @escaping () -> Footer = { EmptyView() }
    ) {
        self.isLoading = isLoading
        self.header = header
        self.content = content
        self.footer = footer
    }

    var body: some View {
        Card3D {
            VStack(alignment: .leading, spacing: MossombiSpacing.sm) {
                if isLoading {
                    ShimmerBlock(height: 16, width: 120)
                    ShimmerBlock(height: 32)
                    ShimmerBlock(height: 12, width: 80)
                } else {
                    header()
                    content()
                    footer()
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

struct ShimmerBlock: View {
    let height: CGFloat
    var width: CGFloat? = nil
    @State private var phase: CGFloat = -200

    var body: some View {
        RoundedRectangle(cornerRadius: 8, style: .continuous)
            .fill(Brand.cyan.opacity(0.06))
            .frame(maxWidth: width ?? .infinity)
            .frame(height: height)
            .overlay {
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: [.clear, Brand.cyan.opacity(0.1), .clear],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .offset(x: phase)
            }
            .clipShape(.rect(cornerRadius: 8))
            .onAppear {
                withAnimation(.linear(duration: 1.5).repeatForever(autoreverses: false)) {
                    phase = 400
                }
            }
    }
}
