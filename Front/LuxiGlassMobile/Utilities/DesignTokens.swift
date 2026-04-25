import SwiftUI

enum Brand {
    static let cyan = Color(red: 0, green: 0.76, blue: 1.0)
    static let blue = Color(red: 0.16, green: 0.36, blue: 1.0)
    static let violet = Color(red: 0.42, green: 0.30, blue: 1.0)
    static let orange = Color(red: 1.0, green: 0.54, blue: 0.12)

    static let gradient: [Color] = [cyan, blue, violet]
    static let gradientWarm: [Color] = [cyan, blue, orange]

    static let linearGradient = LinearGradient(
        colors: gradient,
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let linearGradientHorizontal = LinearGradient(
        colors: gradient,
        startPoint: .leading,
        endPoint: .trailing
    )
}

enum MossombiColors {
    static let accent = Brand.cyan
    static let success = Color(red: 0.2, green: 0.84, blue: 0.48)
    static let warning = Color(red: 1.0, green: 0.76, blue: 0.0)
    static let danger = Color(red: 1.0, green: 0.32, blue: 0.32)

    static let glassBorder = Color.white.opacity(0.18)
    static let glassHighlight = Color.white.opacity(0.08)
    static let glassShadow = Color.black.opacity(0.12)

    static let cardGradientStart = Color.white.opacity(0.12)
    static let cardGradientEnd = Color.white.opacity(0.04)

    static let brandGlow = Brand.cyan.opacity(0.15)
}

enum MossombiSpacing {
    static let xxs: CGFloat = 4
    static let xs: CGFloat = 8
    static let sm: CGFloat = 12
    static let md: CGFloat = 16
    static let lg: CGFloat = 20
    static let xl: CGFloat = 24
    static let xxl: CGFloat = 32
}

enum MossombiRadius {
    static let sm: CGFloat = 16
    static let md: CGFloat = 20
    static let lg: CGFloat = 24
    static let xl: CGFloat = 28
}

enum MossombiBlur {
    static let light: CGFloat = 20
    static let medium: CGFloat = 40
    static let heavy: CGFloat = 60
    static let ultra: CGFloat = 80
}
