import SwiftUI

struct Icon3D: View {
    let systemName: String
    let size: CGFloat
    let isActive: Bool

    init(_ systemName: String, size: CGFloat = 24, isActive: Bool = true) {
        self.systemName = systemName
        self.size = size
        self.isActive = isActive
    }

    var body: some View {
        Image(systemName: systemName)
            .font(.system(size: size, weight: .semibold))
            .foregroundStyle(
                isActive ? AnyShapeStyle(Brand.linearGradient) : AnyShapeStyle(.secondary)
            )
            .shadow(color: isActive ? Brand.cyan.opacity(0.4) : .clear, radius: 6, x: 0, y: 2)
    }
}

struct IconBubble3D: View {
    let systemName: String
    let size: CGFloat
    let bubbleSize: CGFloat

    init(_ systemName: String, size: CGFloat = 22, bubbleSize: CGFloat = 48) {
        self.systemName = systemName
        self.size = size
        self.bubbleSize = bubbleSize
    }

    var body: some View {
        ZStack {
            Circle()
                .fill(
                    LinearGradient(
                        colors: [Brand.cyan.opacity(0.18), Brand.violet.opacity(0.12)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .frame(width: bubbleSize, height: bubbleSize)
                .overlay {
                    Circle()
                        .strokeBorder(
                            LinearGradient(
                                colors: [Color.white.opacity(0.25), Color.white.opacity(0.05)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 0.5
                        )
                }
                .shadow(color: Brand.cyan.opacity(0.2), radius: 8, x: 0, y: 3)

            Image(systemName: systemName)
                .font(.system(size: size, weight: .semibold))
                .foregroundStyle(Brand.linearGradient)
        }
    }
}
