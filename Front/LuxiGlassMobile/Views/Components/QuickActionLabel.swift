import SwiftUI

struct QuickActionLabel: View {
    let icon: String
    let label: String

    var body: some View {
        VStack(spacing: MossombiSpacing.xs) {
            IconBubble3D(icon, size: 20, bubbleSize: 52)
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }
}
