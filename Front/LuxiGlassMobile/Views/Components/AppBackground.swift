import SwiftUI

struct AppBackground: View {
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        ZStack {
            if colorScheme == .dark {
                Color(red: 0.02, green: 0.024, blue: 0.05).ignoresSafeArea()
                MeshGradient(
                    width: 3, height: 3,
                    points: [
                        [0.0, 0.0], [0.5, 0.0], [1.0, 0.0],
                        [0.0, 0.5], [0.55, 0.45], [1.0, 0.5],
                        [0.0, 1.0], [0.5, 1.0], [1.0, 1.0]
                    ],
                    colors: [
                        Color(red: 0.02, green: 0.024, blue: 0.05),
                        Color(red: 0.0, green: 0.05, blue: 0.14),
                        Color(red: 0.02, green: 0.024, blue: 0.05),

                        Color(red: 0.0, green: 0.08, blue: 0.16),
                        Color(red: 0.06, green: 0.03, blue: 0.18),
                        Color(red: 0.12, green: 0.04, blue: 0.03),

                        Color(red: 0.02, green: 0.024, blue: 0.05),
                        Color(red: 0.04, green: 0.02, blue: 0.10),
                        Color(red: 0.02, green: 0.024, blue: 0.05)
                    ]
                )
                .ignoresSafeArea()
                .opacity(0.9)
            } else {
                Color(red: 0.96, green: 0.97, blue: 1.0).ignoresSafeArea()
                MeshGradient(
                    width: 3, height: 3,
                    points: [
                        [0.0, 0.0], [0.5, 0.0], [1.0, 0.0],
                        [0.0, 0.5], [0.5, 0.5], [1.0, 0.5],
                        [0.0, 1.0], [0.5, 1.0], [1.0, 1.0]
                    ],
                    colors: [
                        Color(red: 0.93, green: 0.97, blue: 1.0),
                        Color(red: 0.96, green: 0.98, blue: 1.0),
                        Color(red: 0.95, green: 0.96, blue: 1.0),

                        Color(red: 0.95, green: 0.98, blue: 1.0),
                        Color(red: 0.94, green: 0.95, blue: 1.0),
                        Color(red: 1.0, green: 0.97, blue: 0.96),

                        Color(red: 0.96, green: 0.97, blue: 1.0),
                        Color(red: 0.95, green: 0.96, blue: 0.99),
                        Color(red: 0.94, green: 0.97, blue: 1.0)
                    ]
                )
                .ignoresSafeArea()
                .opacity(0.85)
            }
        }
    }
}
