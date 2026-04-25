import SwiftUI

struct NotificationsView: View {
    @State private var appeared: Bool = false
    @State private var selectedFilter: String = "Toutes"
    private let filters = ["Toutes", "Transactions", "Promos", "Sécurité", "Système"]
    private let notifications = MockData.notifications

    var body: some View {
        ScrollView {
            VStack(spacing: MossombiSpacing.lg) {
                filterChips
                unreadBanner
                notificationsList
            }
            .padding(.horizontal, MossombiSpacing.md)
            .padding(.bottom, MossombiSpacing.xxl)
            .opacity(appeared ? 1 : 0)
            .offset(y: appeared ? 0 : 12)
        }
        .scrollIndicators(.hidden)
        .background { AppBackground() }
        .navigationTitle("Notifications")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                } label: {
                    Text("Tout lire")
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(Brand.linearGradient)
                }
            }
        }
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.8).delay(0.05)) {
                appeared = true
            }
        }
    }

    private var filterChips: some View {
        ScrollView(.horizontal) {
            HStack(spacing: MossombiSpacing.xs) {
                ForEach(filters, id: \.self) { filter in
                    Button {
                        withAnimation(.snappy) { selectedFilter = filter }
                    } label: {
                        Text(filter)
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(selectedFilter == filter ? .white : .secondary)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 8)
                            .background {
                                if selectedFilter == filter {
                                    Capsule()
                                        .fill(Brand.linearGradientHorizontal)
                                } else {
                                    Capsule()
                                        .fill(.ultraThinMaterial)
                                        .overlay {
                                            Capsule()
                                                .strokeBorder(MossombiColors.glassBorder, lineWidth: 0.5)
                                        }
                                }
                            }
                    }
                    .sensoryFeedback(.selection, trigger: selectedFilter)
                }
            }
        }
        .contentMargins(.horizontal, 0)
        .scrollIndicators(.hidden)
    }

    private var unreadBanner: some View {
        let unreadCount = filteredNotifications.filter { !$0.isRead }.count
        return Group {
            if unreadCount > 0 {
                Card3D(radius: MossombiRadius.md, padding: MossombiSpacing.sm) {
                    HStack(spacing: MossombiSpacing.sm) {
                        ZStack {
                            Circle()
                                .fill(Brand.cyan.opacity(0.15))
                                .frame(width: 40, height: 40)
                            Image(systemName: "bell.badge.fill")
                                .font(.body.weight(.semibold))
                                .foregroundStyle(Brand.linearGradient)
                        }

                        VStack(alignment: .leading, spacing: 2) {
                            Text("\(unreadCount) non lue\(unreadCount > 1 ? "s" : "")")
                                .font(.subheadline.weight(.semibold))
                            Text("Vous avez des notifications en attente")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }

                        Spacer()
                    }
                }
            }
        }
    }

    private var filteredNotifications: [NotificationItem] {
        switch selectedFilter {
        case "Transactions": notifications.filter { $0.type == .transaction }
        case "Promos": notifications.filter { $0.type == .promotion }
        case "Sécurité": notifications.filter { $0.type == .security }
        case "Système": notifications.filter { $0.type == .system || $0.type == .social }
        default: notifications
        }
    }

    private var notificationsList: some View {
        VStack(spacing: MossombiSpacing.xs) {
            ForEach(filteredNotifications) { notif in
                NotificationRow(notification: notif)
            }

            if filteredNotifications.isEmpty {
                VStack(spacing: MossombiSpacing.md) {
                    Image(systemName: "bell.slash")
                        .font(.system(size: 40))
                        .foregroundStyle(.tertiary)
                    Text("Aucune notification")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 60)
            }
        }
    }
}

struct NotificationRow: View {
    let notification: NotificationItem

    var body: some View {
        HStack(alignment: .top, spacing: MossombiSpacing.sm) {
            ZStack {
                Circle()
                    .fill(iconBackground)
                    .frame(width: 44, height: 44)
                Image(systemName: notification.icon)
                    .font(.body.weight(.semibold))
                    .foregroundStyle(iconColor)
            }

            VStack(alignment: .leading, spacing: 3) {
                HStack {
                    Text(notification.title)
                        .font(.subheadline.weight(notification.isRead ? .medium : .bold))
                        .lineLimit(1)
                    Spacer()
                    Text(notification.timeAgo)
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                }
                Text(notification.message)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            }

            if !notification.isRead {
                Circle()
                    .fill(Brand.cyan)
                    .frame(width: 8, height: 8)
                    .padding(.top, 6)
            }
        }
        .padding(MossombiSpacing.sm)
        .background {
            if notification.isRead {
                RoundedRectangle(cornerRadius: MossombiRadius.sm, style: .continuous)
                    .fill(.clear)
            } else {
                RoundedRectangle(cornerRadius: MossombiRadius.sm, style: .continuous)
                    .fill(.ultraThinMaterial)
                    .overlay {
                        RoundedRectangle(cornerRadius: MossombiRadius.sm, style: .continuous)
                            .strokeBorder(Brand.cyan.opacity(0.1), lineWidth: 0.5)
                    }
            }
        }
    }

    private var iconBackground: Color {
        switch notification.type {
        case .transaction: Brand.cyan.opacity(0.12)
        case .promotion: Brand.orange.opacity(0.12)
        case .security: Brand.violet.opacity(0.12)
        case .system: Brand.blue.opacity(0.12)
        case .social: MossombiColors.success.opacity(0.12)
        }
    }

    private var iconColor: Color {
        switch notification.type {
        case .transaction: Brand.cyan
        case .promotion: Brand.orange
        case .security: Brand.violet
        case .system: Brand.blue
        case .social: MossombiColors.success
        }
    }
}
