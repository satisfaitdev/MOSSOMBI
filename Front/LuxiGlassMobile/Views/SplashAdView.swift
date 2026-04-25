import SwiftUI
import Combine

struct SplashAdView: View {
    let onDismiss: () -> Void
    @State private var appeared: Bool = false
    @State private var pulsePhase: Bool = false
    @State private var countdown: Int = 3

    private let ad = MockData.splashAd
    private let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    var body: some View {
        ZStack {
            Color(red: 0.024, green: 0.027, blue: 0.04)
                .ignoresSafeArea()

            MeshGradient(
                width: 3, height: 3,
                points: [
                    [0.0, 0.0], [0.5, 0.0], [1.0, 0.0],
                    [0.0, 0.5], [0.5, 0.4], [1.0, 0.5],
                    [0.0, 1.0], [0.5, 1.0], [1.0, 1.0]
                ],
                colors: [
                    Color(red: 0.0, green: 0.1, blue: 0.2),
                    Color(red: 0.0, green: 0.15, blue: 0.3),
                    Color(red: 0.05, green: 0.05, blue: 0.2),

                    Color(red: 0.0, green: 0.2, blue: 0.35),
                    Color(red: 0.1, green: 0.08, blue: 0.35),
                    Color(red: 0.0, green: 0.12, blue: 0.25),

                    Color(red: 0.024, green: 0.027, blue: 0.04),
                    Color(red: 0.05, green: 0.03, blue: 0.15),
                    Color(red: 0.024, green: 0.027, blue: 0.04)
                ]
            )
            .ignoresSafeArea()
            .opacity(appeared ? 0.9 : 0)

            VStack(spacing: 0) {
                HStack {
                    Spacer()
                    Button {
                        onDismiss()
                    } label: {
                        Text(countdown > 0 ? "Passer (\(countdown))" : "Passer")
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(.white.opacity(0.7))
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .background(.ultraThinMaterial, in: .capsule)
                    }
                    .disabled(countdown > 0)
                    .opacity(countdown > 0 ? 0.5 : 1)
                }
                .padding(.horizontal, MossombiSpacing.lg)
                .padding(.top, MossombiSpacing.md)

                Spacer()

                VStack(spacing: MossombiSpacing.xxl) {
                    ZStack {
                        Circle()
                            .fill(
                                RadialGradient(
                                    colors: [Brand.cyan.opacity(0.3), Brand.violet.opacity(0.1), .clear],
                                    center: .center,
                                    startRadius: 20,
                                    endRadius: 80
                                )
                            )
                            .frame(width: 160, height: 160)
                            .scaleEffect(pulsePhase ? 1.1 : 0.95)

                        Circle()
                            .fill(
                                LinearGradient(
                                    colors: Brand.gradient,
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .frame(width: 96, height: 96)
                            .overlay {
                                Circle()
                                    .fill(
                                        LinearGradient(
                                            colors: [Color.white.opacity(0.3), Color.clear],
                                            startPoint: .topLeading,
                                            endPoint: .center
                                        )
                                    )
                            }
                            .overlay {
                                Image(systemName: ad.icon)
                                    .font(.system(size: 40, weight: .semibold))
                                    .foregroundStyle(.white)
                            }
                            .shadow(color: Brand.blue.opacity(0.5), radius: 24, x: 0, y: 8)
                    }
                    .opacity(appeared ? 1 : 0)
                    .scaleEffect(appeared ? 1 : 0.8)

                    VStack(spacing: MossombiSpacing.sm) {
                        Text(ad.title)
                            .font(.system(size: 32, weight: .bold))
                            .foregroundStyle(.white)

                        Text(ad.subtitle)
                            .font(.body)
                            .foregroundStyle(.white.opacity(0.7))
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, MossombiSpacing.xxl)
                    }
                    .opacity(appeared ? 1 : 0)
                    .offset(y: appeared ? 0 : 20)
                }

                Spacer()

                Button {
                    onDismiss()
                } label: {
                    HStack(spacing: MossombiSpacing.xs) {
                        Text(ad.cta)
                            .font(.body.weight(.bold))
                        Image(systemName: "arrow.right")
                            .font(.body.weight(.bold))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .foregroundStyle(.white)
                    .background(
                        LinearGradient(
                            colors: Brand.gradient,
                            startPoint: .leading,
                            endPoint: .trailing
                        ),
                        in: RoundedRectangle(cornerRadius: MossombiRadius.sm, style: .continuous)
                    )
                    .shadow(color: Brand.blue.opacity(0.4), radius: 16, x: 0, y: 6)
                }
                .buttonStyle(PremiumPressStyle())
                .padding(.horizontal, MossombiSpacing.xl)
                .padding(.bottom, MossombiSpacing.xxl)
                .opacity(appeared ? 1 : 0)
                .offset(y: appeared ? 0 : 30)
            }
        }
        .onAppear {
            withAnimation(.spring(response: 0.8, dampingFraction: 0.75)) {
                appeared = true
            }
            withAnimation(.easeInOut(duration: 2.5).repeatForever(autoreverses: true)) {
                pulsePhase = true
            }
        }
        .onReceive(timer) { _ in
            if countdown > 0 {
                countdown -= 1
            }
            if countdown == 0 {
                timer.upstream.connect().cancel()
            }
        }
    }
}
