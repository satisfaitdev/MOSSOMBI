import SwiftUI

struct RentalSearchView: View {
    @State private var selectedType: String = "Tous"
    @State private var searchText: String = ""
    @State private var appeared: Bool = false
    @State private var typeTrigger: Int = 0

    private let types = ["Tous", "Berline", "SUV", "Luxe", "Pickup"]

    private var filteredCars: [RentalCar] {
        var results = MockData.rentalCars
        if selectedType != "Tous" {
            results = results.filter { $0.type == selectedType }
        }
        if !searchText.isEmpty {
            results = results.filter { $0.name.localizedStandardContains(searchText) }
        }
        return results
    }

    var body: some View {
        ScrollView {
            VStack(spacing: MossombiSpacing.lg) {
                PremiumInput("Rechercher un véhicule...", text: $searchText, icon: "magnifyingglass")
                typeFilter
                resultsList
            }
            .padding(.horizontal, MossombiSpacing.md)
            .padding(.bottom, MossombiSpacing.xxl)
            .opacity(appeared ? 1 : 0)
            .offset(y: appeared ? 0 : 10)
        }
        .scrollIndicators(.hidden)
        .background { AppBackground() }
        .navigationTitle("Location de véhicule")
        .navigationBarTitleDisplayMode(.large)
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.8).delay(0.05)) {
                appeared = true
            }
        }
    }

    private var typeFilter: some View {
        ScrollView(.horizontal) {
            HStack(spacing: MossombiSpacing.xs) {
                ForEach(types, id: \.self) { type in
                    Button {
                        withAnimation(.snappy) { selectedType = type }
                        typeTrigger += 1
                    } label: {
                        Text(type)
                            .font(.subheadline.weight(.medium))
                            .padding(.horizontal, MossombiSpacing.md)
                            .padding(.vertical, MossombiSpacing.xs)
                            .foregroundStyle(selectedType == type ? .white : .primary)
                            .background {
                                if selectedType == type {
                                    Capsule(style: .continuous).fill(Brand.linearGradientHorizontal)
                                } else {
                                    Capsule(style: .continuous).fill(.ultraThinMaterial)
                                        .overlay { Capsule(style: .continuous).strokeBorder(MossombiColors.glassBorder, lineWidth: 0.5) }
                                }
                            }
                    }
                    .sensoryFeedback(.selection, trigger: typeTrigger)
                }
            }
        }
        .contentMargins(.horizontal, 0)
        .scrollIndicators(.hidden)
    }

    private var resultsList: some View {
        VStack(alignment: .leading, spacing: MossombiSpacing.sm) {
            Text("\(filteredCars.count) véhicule\(filteredCars.count > 1 ? "s" : "") disponible\(filteredCars.count > 1 ? "s" : "")")
                .font(.headline)

            ForEach(filteredCars) { car in
                RentalCarDetailCard(car: car)
            }
        }
    }
}

struct RentalCarDetailCard: View {
    let car: RentalCar
    @State private var showBooking: Bool = false

    var body: some View {
        Card3D(radius: MossombiRadius.lg, padding: MossombiSpacing.md) {
            VStack(spacing: MossombiSpacing.md) {
                HStack(spacing: MossombiSpacing.md) {
                    ZStack {
                        RoundedRectangle(cornerRadius: MossombiRadius.md, style: .continuous)
                            .fill(
                                LinearGradient(
                                    colors: [Brand.cyan.opacity(0.1), Brand.violet.opacity(0.08)],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .frame(width: 88, height: 88)
                        Image(systemName: car.icon)
                            .font(.system(size: 36, weight: .light))
                            .foregroundStyle(Brand.linearGradient)
                    }

                    VStack(alignment: .leading, spacing: MossombiSpacing.xxs) {
                        HStack {
                            Text(car.name)
                                .font(.headline)
                            if let badge = car.badge {
                                Text(badge)
                                    .font(.system(size: 9, weight: .bold))
                                    .foregroundStyle(.white)
                                    .padding(.horizontal, 6)
                                    .padding(.vertical, 2)
                                    .background(Brand.violet, in: .capsule)
                            }
                        }
                        Text(car.type)
                            .font(.caption)
                            .foregroundStyle(.secondary)

                        HStack(spacing: MossombiSpacing.md) {
                            Label("\(car.seats)", systemImage: "person.fill")
                            Label(car.transmission, systemImage: "gearshape.fill")
                        }
                        .font(.system(size: 11))
                        .foregroundStyle(.secondary)
                    }
                }

                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("\(Int(car.pricePerDay).formatted(.number.grouping(.automatic))) F")
                            .font(.title3.weight(.bold))
                            .foregroundStyle(Brand.linearGradient)
                        Text("par jour")
                            .font(.caption)
                            .foregroundStyle(.tertiary)
                    }
                    Spacer()
                    Button {
                        showBooking = true
                    } label: {
                        Text("Réserver")
                            .font(.subheadline.weight(.bold))
                            .foregroundStyle(.white)
                            .padding(.horizontal, MossombiSpacing.lg)
                            .padding(.vertical, MossombiSpacing.sm)
                            .background(Brand.linearGradientHorizontal, in: .capsule)
                    }
                }
            }
        }
        .sheet(isPresented: $showBooking) {
            RentalBookingSheet(car: car)
        }
    }
}

struct RentalBookingSheet: View {
    let car: RentalCar
    @Environment(\.dismiss) private var dismiss
    @State private var days: Int = 1
    @State private var booked: Bool = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: MossombiSpacing.xl) {
                    if booked {
                        VStack(spacing: MossombiSpacing.lg) {
                            Spacer().frame(height: 20)
                            ZStack {
                                Circle().fill(MossombiColors.success.opacity(0.12)).frame(width: 100, height: 100)
                                Image(systemName: "checkmark.circle.fill")
                                    .font(.system(size: 48))
                                    .foregroundStyle(MossombiColors.success)
                            }
                            Text("Réservation confirmée!")
                                .font(.title3.weight(.bold))
                            Text("\(car.name) • \(days) jour\(days > 1 ? "s" : "")")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                    } else {
                        VStack(spacing: MossombiSpacing.md) {
                            Text(car.name)
                                .font(.title3.weight(.bold))

                            Card3D(radius: MossombiRadius.md, padding: MossombiSpacing.md) {
                                HStack {
                                    Text("Durée")
                                        .font(.subheadline.weight(.medium))
                                    Spacer()
                                    HStack(spacing: MossombiSpacing.md) {
                                        Button { if days > 1 { days -= 1 } } label: {
                                            Image(systemName: "minus.circle.fill")
                                                .font(.title3)
                                                .foregroundStyle(days > 1 ? AnyShapeStyle(Brand.linearGradient) : AnyShapeStyle(.tertiary))
                                        }
                                        Text("\(days) jour\(days > 1 ? "s" : "")")
                                            .font(.headline)
                                            .frame(width: 80)
                                        Button { if days < 30 { days += 1 } } label: {
                                            Image(systemName: "plus.circle.fill")
                                                .font(.title3)
                                                .foregroundStyle(Brand.linearGradient)
                                        }
                                    }
                                }
                            }

                            Card3D(radius: MossombiRadius.md, padding: MossombiSpacing.md) {
                                VStack(spacing: MossombiSpacing.sm) {
                                    HStack {
                                        Text("Prix/jour").font(.subheadline).foregroundStyle(.secondary)
                                        Spacer()
                                        Text("\(Int(car.pricePerDay).formatted(.number.grouping(.automatic))) F").font(.subheadline.weight(.medium))
                                    }
                                    Divider()
                                    HStack {
                                        Text("Total").font(.headline)
                                        Spacer()
                                        Text("\(Int(car.pricePerDay * Double(days)).formatted(.number.grouping(.automatic))) F")
                                            .font(.title3.weight(.bold))
                                            .foregroundStyle(Brand.linearGradient)
                                    }
                                }
                            }

                            PremiumButton("Confirmer la réservation", icon: "checkmark", variant: .primary) {
                                withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                                    booked = true
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal, MossombiSpacing.md)
                .padding(.top, MossombiSpacing.md)
            }
            .background { AppBackground() }
            .navigationTitle("Réservation")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { dismiss() } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.title3)
                            .foregroundStyle(.tertiary)
                    }
                }
            }
        }
    }
}
