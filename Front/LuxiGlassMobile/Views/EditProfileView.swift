import SwiftUI

struct EditProfileView: View {
    @State private var firstName: String = MockData.user.firstName
    @State private var lastName: String = MockData.user.lastName
    @State private var email: String = MockData.user.email
    @State private var phone: String = "+221 77 123 45 67"
    @State private var address: String = "Dakar, Plateau"
    @State private var showSuccess: Bool = false
    @State private var appeared: Bool = false
    @State private var saveTrigger: Int = 0

    var body: some View {
        ScrollView {
            VStack(spacing: MossombiSpacing.xl) {
                avatarSection
                formSection
                PremiumButton("Enregistrer", icon: "checkmark", variant: .primary) {
                    withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                        showSuccess = true
                    }
                    saveTrigger += 1
                }
                .sensoryFeedback(.success, trigger: saveTrigger)
            }
            .padding(.horizontal, MossombiSpacing.md)
            .padding(.bottom, MossombiSpacing.xxl)
            .opacity(appeared ? 1 : 0)
            .offset(y: appeared ? 0 : 10)
        }
        .scrollIndicators(.hidden)
        .background { AppBackground() }
        .navigationTitle("Modifier le profil")
        .navigationBarTitleDisplayMode(.large)
        .overlay {
            if showSuccess {
                successOverlay
            }
        }
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.8).delay(0.05)) {
                appeared = true
            }
        }
    }

    private var avatarSection: some View {
        VStack(spacing: MossombiSpacing.md) {
            ZStack(alignment: .bottomTrailing) {
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(colors: Brand.gradient, startPoint: .topLeading, endPoint: .bottomTrailing)
                        )
                        .frame(width: 100, height: 100)
                        .overlay {
                            Circle()
                                .fill(
                                    LinearGradient(colors: [Color.white.opacity(0.3), Color.clear], startPoint: .topLeading, endPoint: .center)
                                )
                        }
                    Text(MockData.user.avatarInitials)
                        .font(.title.weight(.bold))
                        .foregroundStyle(.white)
                }
                .shadow(color: Brand.blue.opacity(0.3), radius: 12, x: 0, y: 4)

                Button {} label: {
                    ZStack {
                        Circle()
                            .fill(Brand.linearGradientHorizontal)
                            .frame(width: 32, height: 32)
                        Image(systemName: "camera.fill")
                            .font(.caption.weight(.bold))
                            .foregroundStyle(.white)
                    }
                }
            }
        }
        .padding(.top, MossombiSpacing.md)
    }

    private var formSection: some View {
        VStack(spacing: MossombiSpacing.md) {
            GlassContainer {
                VStack(spacing: MossombiSpacing.md) {
                    fieldRow(label: "Prénom", text: $firstName, icon: "person.fill")
                    Divider()
                    fieldRow(label: "Nom", text: $lastName, icon: "person.fill")
                    Divider()
                    fieldRow(label: "Email", text: $email, icon: "envelope.fill")
                    Divider()
                    fieldRow(label: "Téléphone", text: $phone, icon: "phone.fill")
                    Divider()
                    fieldRow(label: "Adresse", text: $address, icon: "mappin.circle.fill")
                }
            }
        }
    }

    private func fieldRow(label: String, text: Binding<String>, icon: String) -> some View {
        VStack(alignment: .leading, spacing: MossombiSpacing.xxs) {
            HStack(spacing: MossombiSpacing.xs) {
                Image(systemName: icon)
                    .font(.caption)
                    .foregroundStyle(Brand.linearGradient)
                    .frame(width: 16)
                Text(label)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            TextField(label, text: text)
                .font(.body)
                .padding(.leading, 24)
        }
    }

    private var successOverlay: some View {
        ZStack {
            Color.black.opacity(0.4).ignoresSafeArea()
                .onTapGesture {
                    withAnimation { showSuccess = false }
                }

            Card3D(radius: MossombiRadius.xl, padding: MossombiSpacing.xl) {
                VStack(spacing: MossombiSpacing.lg) {
                    ZStack {
                        Circle()
                            .fill(MossombiColors.success.opacity(0.15))
                            .frame(width: 80, height: 80)
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 44))
                            .foregroundStyle(MossombiColors.success)
                    }

                    Text("Profil mis à jour!")
                        .font(.headline)

                    PremiumButton("Fermer", variant: .secondary) {
                        withAnimation { showSuccess = false }
                    }
                }
                .frame(maxWidth: .infinity)
            }
            .padding(.horizontal, MossombiSpacing.xxl)
        }
        .transition(.opacity)
    }
}
