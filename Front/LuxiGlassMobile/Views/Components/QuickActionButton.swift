import SwiftUI

struct QuickActionButton: View {
    let icon: String
    let label: String
    let action: () -> Void

    @State private var tapCount: Int = 0

    var body: some View {
        Button {
            tapCount += 1
            action()
        } label: {
            VStack(spacing: MossombiSpacing.xs) {
                IconBubble3D(icon, size: 20, bubbleSize: 52)
                Text(label)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .buttonStyle(PremiumPressStyle())
        .sensoryFeedback(.impact(weight: .light), trigger: tapCount)
    }
}
