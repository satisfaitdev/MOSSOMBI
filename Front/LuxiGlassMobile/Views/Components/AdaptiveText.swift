import SwiftUI

enum TextVariant {
    case largeTitle
    case title
    case headline
    case body
    case caption
}

struct AdaptiveText: View {
    let text: String
    let variant: TextVariant
    let weight: Font.Weight?

    init(_ text: String, variant: TextVariant = .body, weight: Font.Weight? = nil) {
        self.text = text
        self.variant = variant
        self.weight = weight
    }

    var body: some View {
        Text(text)
            .font(font)
            .fontWeight(weight ?? defaultWeight)
    }

    private var font: Font {
        switch variant {
        case .largeTitle: .largeTitle
        case .title: .title2
        case .headline: .headline
        case .body: .body
        case .caption: .caption
        }
    }

    private var defaultWeight: Font.Weight {
        switch variant {
        case .largeTitle: .bold
        case .title: .semibold
        case .headline: .semibold
        case .body: .regular
        case .caption: .regular
        }
    }
}
