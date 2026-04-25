import SwiftUI

struct ScanView: View {
    @State private var appeared: Bool = false
    @State private var scannerActive: Bool = true
    @State private var pulseScale: CGFloat = 1.0

    var body: some View {
        VStack(spacing: MossombiSpacing.xl) {
            Spacer()

            VStack(spacing: MossombiSpacing.lg) {
                ZStack {
                    RoundedRectangle(cornerRadius: MossombiRadius.xl, style: .continuous)
                        .fill(Color.black.opacity(0.3))
                        .frame(width: 260, height: 260)
                        .overlay {
                            RoundedRectangle(cornerRadius: MossombiRadius.xl, style: .continuous)
                                .strokeBorder(Brand.linearGradientHorizontal, lineWidth: 2)
                        }

                    RoundedRectangle(cornerRadius: MossombiRadius.xl, style: .continuous)
                        .strokeBorder(Brand.cyan.opacity(0.3), lineWidth: 1)
                        .frame(width: 260, height: 260)
                        .scaleEffect(pulseScale)

                    VStack(spacing: MossombiSpacing.md) {
                        Image(systemName: "qrcode.viewfinder")
                            .font(.system(size: 72, weight: .ultraLight))
                            .foregroundStyle(Brand.linearGradient)

                        Text("Placez le QR code ici")
                            .font(.subheadline)
                            .foregroundStyle(.white.opacity(0.7))
                    }

                    cornerBrackets
                }
            }

            VStack(spacing: MossombiSpacing.sm) {
                Text("Scanner un code QR")
                    .font(.title3.weight(.bold))
                Text("Pointez votre caméra vers un code QR pour payer ou recevoir un paiement")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, MossombiSpacing.xl)
            }

            HStack(spacing: MossombiSpacing.xl) {
                scanOption(icon: "photo.on.rectangle", label: "Galerie")
                scanOption(icon: "flashlight.off.fill", label: "Flash")
                scanOption(icon: "doc.on.doc", label: "Mon QR")
            }
            .padding(.top, MossombiSpacing.md)

            Spacer()
        }
        .background { AppBackground() }
        .navigationTitle("Scanner")
        .navigationBarTitleDisplayMode(.inline)
        .opacity(appeared ? 1 : 0)
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.8)) {
                appeared = true
            }
            withAnimation(.easeInOut(duration: 2).repeatForever(autoreverses: true)) {
                pulseScale = 1.05
            }
        }
    }

    private var cornerBrackets: some View {
        ZStack {
            ForEach(0..<4, id: \.self) { index in
                CornerBracket()
                    .rotationEffect(.degrees(Double(index) * 90))
            }
        }
        .frame(width: 240, height: 240)
    }

    private func scanOption(icon: String, label: String) -> some View {
        Button {} label: {
            VStack(spacing: MossombiSpacing.xs) {
                ZStack {
                    Circle()
                        .fill(.ultraThinMaterial)
                        .frame(width: 56, height: 56)
                        .overlay { Circle().strokeBorder(MossombiColors.glassBorder, lineWidth: 0.5) }
                    Image(systemName: icon)
                        .font(.body.weight(.semibold))
                        .foregroundStyle(Brand.linearGradient)
                }
                Text(label)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .buttonStyle(PremiumPressStyle())
    }
}

struct CornerBracket: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        let length: CGFloat = 30
        let offset: CGFloat = 10
        path.move(to: CGPoint(x: offset, y: offset + length))
        path.addLine(to: CGPoint(x: offset, y: offset))
        path.addLine(to: CGPoint(x: offset + length, y: offset))
        return path
    }
}
