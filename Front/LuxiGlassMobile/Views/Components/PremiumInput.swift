import SwiftUI

struct PremiumInput: View {
    let placeholder: String
    @Binding var text: String
    let icon: String?
    let hasError: Bool
    let errorMessage: String?

    init(
        _ placeholder: String,
        text: Binding<String>,
        icon: String? = nil,
        hasError: Bool = false,
        errorMessage: String? = nil
    ) {
        self.placeholder = placeholder
        self._text = text
        self.icon = icon
        self.hasError = hasError
        self.errorMessage = errorMessage
    }

    var body: some View {
        VStack(alignment: .leading, spacing: MossombiSpacing.xxs) {
            HStack(spacing: MossombiSpacing.sm) {
                if let icon {
                    Image(systemName: icon)
                        .font(.body)
                        .foregroundStyle(Brand.linearGradient)
                        .frame(width: 20)
                }
                TextField(placeholder, text: $text)
                    .font(.body)
            }
            .padding(.horizontal, MossombiSpacing.md)
            .padding(.vertical, 14)
            .background {
                RoundedRectangle(cornerRadius: MossombiRadius.sm, style: .continuous)
                    .fill(.ultraThinMaterial)
                    .overlay {
                        RoundedRectangle(cornerRadius: MossombiRadius.sm, style: .continuous)
                            .strokeBorder(
                                hasError ? MossombiColors.danger.opacity(0.6) : MossombiColors.glassBorder,
                                lineWidth: hasError ? 1 : 0.5
                            )
                    }
            }

            if let errorMessage, hasError {
                Text(errorMessage)
                    .font(.caption)
                    .foregroundStyle(MossombiColors.danger)
                    .padding(.leading, MossombiSpacing.xxs)
            }
        }
    }
}
