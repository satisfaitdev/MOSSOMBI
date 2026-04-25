import SwiftUI

struct TransactionRow: View {
    let transaction: Transaction

    var body: some View {
        HStack(spacing: MossombiSpacing.sm) {
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: transaction.isCredit
                                ? [MossombiColors.success.opacity(0.15), MossombiColors.success.opacity(0.05)]
                                : [Brand.cyan.opacity(0.15), Brand.violet.opacity(0.08)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 44, height: 44)
                Image(systemName: transaction.icon)
                    .font(.body.weight(.semibold))
                    .foregroundStyle(
                        transaction.isCredit ? AnyShapeStyle(MossombiColors.success) : AnyShapeStyle(Brand.linearGradient)
                    )
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(transaction.title)
                    .font(.body.weight(.medium))
                HStack(spacing: MossombiSpacing.xxs) {
                    Text(transaction.subtitle)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    if transaction.status != .completed {
                        StatusChip(status: transaction.status)
                    }
                }
            }

            Spacer()

            Text(formattedAmount)
                .font(.body.weight(.semibold))
                .foregroundStyle(transaction.isCredit ? MossombiColors.success : .primary)
        }
        .padding(.vertical, MossombiSpacing.xxs)
    }

    private var formattedAmount: String {
        let prefix = transaction.isCredit ? "+" : ""
        let formatted = abs(transaction.amount).formatted(.number.grouping(.automatic))
        return "\(prefix)\(formatted) F"
    }
}

struct StatusChip: View {
    let status: TransactionStatus

    var body: some View {
        Text(status.rawValue)
            .font(.system(size: 10, weight: .medium))
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .foregroundStyle(chipColor)
            .background(chipColor.opacity(0.12), in: .capsule)
    }

    private var chipColor: Color {
        switch status {
        case .completed: MossombiColors.success
        case .pending: MossombiColors.warning
        case .failed: MossombiColors.danger
        }
    }
}
