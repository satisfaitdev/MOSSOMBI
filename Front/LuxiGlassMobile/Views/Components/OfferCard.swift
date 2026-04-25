import SwiftUI

struct OfferCard: View {
    let offer: OfferItem

    var body: some View {
        BrandGradientCard {
            VStack(alignment: .leading, spacing: MossombiSpacing.sm) {
                HStack {
                    Image(systemName: offer.icon)
                        .font(.title2.weight(.semibold))
                        .foregroundStyle(.white)
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.white.opacity(0.7))
                }

                Spacer()

                Text(offer.title)
                    .font(.headline)
                    .foregroundStyle(.white)
                Text(offer.subtitle)
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.8))
                    .lineLimit(2)
            }
            .padding(MossombiSpacing.md)
            .frame(width: 200, height: 140)
        }
    }
}
