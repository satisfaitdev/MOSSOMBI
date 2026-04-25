import SwiftUI

struct VisaAssistanceView: View {
    @State private var selectedTab: String = "Demander"
    @State private var appeared: Bool = false
    @State private var tabTrigger: Int = 0

    private let tabs = ["Demander", "Mes dossiers"]

    var body: some View {
        ScrollView {
            VStack(spacing: MossombiSpacing.lg) {
                segmentedControl
                if selectedTab == "Demander" {
                    countriesSection
                } else {
                    dossiersSection
                }
            }
            .padding(.horizontal, MossombiSpacing.md)
            .padding(.bottom, MossombiSpacing.xxl)
            .opacity(appeared ? 1 : 0)
            .offset(y: appeared ? 0 : 10)
        }
        .scrollIndicators(.hidden)
        .background { AppBackground() }
        .navigationTitle("Assistance Visa")
        .navigationBarTitleDisplayMode(.large)
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.8).delay(0.05)) {
                appeared = true
            }
        }
    }

    private var segmentedControl: some View {
        HStack(spacing: 0) {
            ForEach(tabs, id: \.self) { tab in
                Button {
                    withAnimation(.snappy) { selectedTab = tab }
                    tabTrigger += 1
                } label: {
                    Text(tab)
                        .font(.subheadline.weight(.semibold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, MossombiSpacing.sm)
                        .foregroundStyle(selectedTab == tab ? .white : .primary)
                        .background {
                            if selectedTab == tab {
                                RoundedRectangle(cornerRadius: MossombiRadius.sm, style: .continuous)
                                    .fill(Brand.linearGradientHorizontal)
                            }
                        }
                }
                .sensoryFeedback(.selection, trigger: tabTrigger)
            }
        }
        .background {
            RoundedRectangle(cornerRadius: MossombiRadius.sm, style: .continuous)
                .fill(.ultraThinMaterial)
                .overlay {
                    RoundedRectangle(cornerRadius: MossombiRadius.sm, style: .continuous)
                        .strokeBorder(MossombiColors.glassBorder, lineWidth: 0.5)
                }
        }
    }

    private var countriesSection: some View {
        VStack(spacing: MossombiSpacing.sm) {
            ForEach(MockData.visaCountries) { country in
                VisaCountryCard(country: country)
            }
        }
    }

    private var dossiersSection: some View {
        VStack(spacing: MossombiSpacing.sm) {
            if MockData.visaDossiers.isEmpty {
                Card3D(radius: MossombiRadius.md, padding: MossombiSpacing.xl) {
                    VStack(spacing: MossombiSpacing.sm) {
                        Image(systemName: "doc.text")
                            .font(.largeTitle)
                            .foregroundStyle(.tertiary)
                        Text("Aucun dossier en cours")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                }
            } else {
                ForEach(MockData.visaDossiers) { dossier in
                    VisaDossierCard(dossier: dossier)
                }
            }
        }
    }
}

struct VisaCountryCard: View {
    let country: VisaCountry
    @State private var expanded: Bool = false

    var body: some View {
        Card3D(radius: MossombiRadius.lg, padding: MossombiSpacing.md) {
            VStack(spacing: MossombiSpacing.md) {
                Button {
                    withAnimation(.spring(response: 0.35, dampingFraction: 0.8)) {
                        expanded.toggle()
                    }
                } label: {
                    HStack(spacing: MossombiSpacing.sm) {
                        Text(country.flag)
                            .font(.largeTitle)

                        VStack(alignment: .leading, spacing: 2) {
                            Text(country.country)
                                .font(.headline)
                                .foregroundStyle(.primary)
                            Text("Délai: \(country.processingTime)")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }

                        Spacer()

                        VStack(alignment: .trailing, spacing: 2) {
                            Text("À partir de")
                                .font(.system(size: 9))
                                .foregroundStyle(.tertiary)
                            Text("\(Int(country.price).formatted(.number.grouping(.automatic))) F")
                                .font(.subheadline.weight(.bold))
                                .foregroundStyle(Brand.linearGradient)
                        }

                        Image(systemName: expanded ? "chevron.up" : "chevron.down")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(.tertiary)
                    }
                }

                if expanded {
                    VStack(spacing: MossombiSpacing.sm) {
                        Divider()

                        HStack {
                            Text("Taux de succès")
                                .font(.caption).foregroundStyle(.secondary)
                            Spacer()
                            Text(country.successRate)
                                .font(.caption.weight(.bold))
                                .foregroundStyle(MossombiColors.success)
                        }

                        VStack(alignment: .leading, spacing: MossombiSpacing.xs) {
                            Text("Types de visa disponibles")
                                .font(.caption.weight(.medium))
                                .foregroundStyle(.secondary)

                            ForEach(country.types, id: \.self) { type in
                                HStack(spacing: MossombiSpacing.xs) {
                                    Circle()
                                        .fill(Brand.linearGradient)
                                        .frame(width: 6, height: 6)
                                    Text(type)
                                        .font(.subheadline)
                                    Spacer()
                                    Button {} label: {
                                        Text("Demander")
                                            .font(.system(size: 10, weight: .bold))
                                            .foregroundStyle(.white)
                                            .padding(.horizontal, 10)
                                            .padding(.vertical, 4)
                                            .background(Brand.linearGradientHorizontal, in: .capsule)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

struct VisaDossierCard: View {
    let dossier: VisaDossier

    var body: some View {
        Card3D(radius: MossombiRadius.md, padding: MossombiSpacing.md) {
            VStack(spacing: MossombiSpacing.sm) {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("\(dossier.country) - \(dossier.type)")
                            .font(.subheadline.weight(.semibold))
                        Text("Soumis le \(dossier.submittedDate)")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    dossierStatusBadge(dossier.status)
                }

                Divider()

                HStack {
                    Text("Dernière mise à jour")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Spacer()
                    Text(dossier.lastUpdate)
                        .font(.caption.weight(.medium))
                }

                progressBar(for: dossier.status)
            }
        }
    }

    private func dossierStatusBadge(_ status: VisaDossierStatus) -> some View {
        Text(status.rawValue)
            .font(.system(size: 10, weight: .bold))
            .foregroundStyle(.white)
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(statusColor(status), in: .capsule)
    }

    private func statusColor(_ status: VisaDossierStatus) -> Color {
        switch status {
        case .submitted: Brand.blue
        case .inReview: MossombiColors.warning
        case .approved: MossombiColors.success
        case .rejected: MossombiColors.danger
        case .documentsNeeded: Brand.orange
        }
    }

    private func progressBar(for status: VisaDossierStatus) -> some View {
        let progress: CGFloat = switch status {
        case .submitted: 0.25
        case .inReview: 0.5
        case .documentsNeeded: 0.4
        case .approved: 1.0
        case .rejected: 0.75
        }

        return GeometryReader { geo in
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 4, style: .continuous)
                    .fill(Brand.cyan.opacity(0.1))
                    .frame(height: 6)
                RoundedRectangle(cornerRadius: 4, style: .continuous)
                    .fill(Brand.linearGradientHorizontal)
                    .frame(width: geo.size.width * progress, height: 6)
            }
        }
        .frame(height: 6)
    }
}

struct VisaDossierTrackingView: View {
    @State private var appeared: Bool = false

    var body: some View {
        ScrollView {
            VStack(spacing: MossombiSpacing.lg) {
                ForEach(MockData.visaDossiers) { dossier in
                    VisaDossierCard(dossier: dossier)
                }
            }
            .padding(.horizontal, MossombiSpacing.md)
            .padding(.bottom, MossombiSpacing.xxl)
            .opacity(appeared ? 1 : 0)
            .offset(y: appeared ? 0 : 10)
        }
        .scrollIndicators(.hidden)
        .background { AppBackground() }
        .navigationTitle("Suivi des dossiers")
        .navigationBarTitleDisplayMode(.large)
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.8).delay(0.05)) {
                appeared = true
            }
        }
    }
}
