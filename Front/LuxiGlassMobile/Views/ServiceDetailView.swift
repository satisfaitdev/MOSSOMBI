import SwiftUI

struct ServiceDetailView: View {
    let serviceId: String
    @State private var appeared: Bool = false

    private var service: ServiceItem? {
        MockData.allServices.first(where: { $0.id == serviceId })
    }

    var body: some View {
        ScrollView {
            if let service {
                VStack(spacing: MossombiSpacing.xl) {
                    heroSection(service)
                    detailsSection(service)
                    ctaSection
                }
                .padding(.horizontal, MossombiSpacing.md)
                .padding(.bottom, MossombiSpacing.xxl)
                .opacity(appeared ? 1 : 0)
                .offset(y: appeared ? 0 : 12)
            }
        }
        .scrollIndicators(.hidden)
        .background { AppBackground() }
        .navigationTitle(service?.name ?? "Service")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.8)) {
                appeared = true
            }
        }
    }

    private func heroSection(_ service: ServiceItem) -> some View {
        BrandGradientCard {
            VStack(spacing: MossombiSpacing.lg) {
                ZStack {
                    Circle()
                        .fill(.white.opacity(0.15))
                        .frame(width: 80, height: 80)
                    Image(systemName: service.icon)
                        .font(.system(size: 36, weight: .semibold))
                        .foregroundStyle(.white)
                }

                VStack(spacing: MossombiSpacing.xs) {
                    Text(service.name)
                        .font(.title2.weight(.bold))
                        .foregroundStyle(.white)
                    Text(service.category)
                        .font(.subheadline)
                        .foregroundStyle(.white.opacity(0.7))
                }

                if service.isPopular {
                    HStack(spacing: MossombiSpacing.xxs) {
                        ForEach(0..<5, id: \.self) { i in
                            Image(systemName: i < Int(service.rating) ? "star.fill" : "star")
                                .font(.caption)
                                .foregroundStyle(.white.opacity(i < Int(service.rating) ? 1.0 : 0.4))
                        }
                        Text(String(format: "%.1f", service.rating))
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(.white)
                    }
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, MossombiSpacing.xl)
            .padding(.horizontal, MossombiSpacing.md)
        }
    }

    private func detailsSection(_ service: ServiceItem) -> some View {
        VStack(spacing: MossombiSpacing.sm) {
            GlassContainer {
                VStack(alignment: .leading, spacing: MossombiSpacing.sm) {
                    Text("À propos")
                        .font(.headline)
                    Text("Accédez au service \(service.name) directement depuis Mossombi. Paiement sécurisé, suivi en temps réel et assistance 24/7.")
                        .font(.body)
                        .foregroundStyle(.secondary)
                }
            }

            GlassContainer {
                VStack(spacing: MossombiSpacing.sm) {
                    detailRow(icon: "clock.fill", label: "Disponibilité", value: "24h/24")
                    Divider()
                    detailRow(icon: "shield.checkered", label: "Sécurité", value: "Certifié")
                    Divider()
                    detailRow(icon: "star.fill", label: "Satisfaction", value: "98%")
                    Divider()
                    detailRow(icon: "person.2.fill", label: "Utilisateurs", value: "12K+")
                }
            }
        }
    }

    private func detailRow(icon: String, label: String, value: String) -> some View {
        HStack {
            Icon3D(icon, size: 16)
            Text(label)
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Spacer()
            Text(value)
                .font(.subheadline.weight(.semibold))
        }
    }

    private var ctaSection: some View {
        VStack(spacing: MossombiSpacing.sm) {
            PremiumButton("Commencer", icon: "arrow.right", variant: .primary) {}
            PremiumButton("Ajouter aux favoris", icon: "heart", variant: .secondary) {}
        }
    }
}
