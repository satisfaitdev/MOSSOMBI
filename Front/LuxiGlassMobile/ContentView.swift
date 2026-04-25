import SwiftUI

nonisolated enum AppRoute: Hashable, Sendable {
    case settings
    case design
    case services
    case wallet
    case serviceDetail(String)
    case shopping
    case transport
    case voyage
    case finance
    case livraison
    case servicesPublic
    case coins
    case transfer
    case pay
    case recharge
    case scan
    case editProfile
    case productDetail(String)
    case cart
    case checkout
    case tripSearch
    case rentalSearch
    case flightSearch
    case hotelSearch
    case visaAssistance
    case touristGuide
    case visaDossierTracking
    case notifications
    case carnet
}

struct ContentView: View {
    @State private var showSplash: Bool = true
    @State private var selectedTab: Int = 0

    var body: some View {
        ZStack {
            if showSplash {
                SplashAdView {
                    withAnimation(.spring(response: 0.5, dampingFraction: 0.85)) {
                        showSplash = false
                    }
                }
                .transition(.opacity.combined(with: .scale(scale: 1.05)))
            } else {
                mainTabView
                    .transition(.opacity)
            }
        }
    }

    private var mainTabView: some View {
        TabView(selection: $selectedTab) {
            Tab(value: 0) {
                NavigationStack {
                    HomeView()
                        .navigationDestination(for: AppRoute.self) { route in
                            destinationView(for: route)
                        }
                }
            } label: {
                Label {
                    Text("Accueil")
                } icon: {
                    Image(systemName: selectedTab == 0 ? "house.fill" : "house")
                        .foregroundStyle(selectedTab == 0 ? AnyShapeStyle(Brand.linearGradient) : AnyShapeStyle(.secondary))
                }
            }

            Tab(value: 1) {
                NavigationStack {
                    ServicesView()
                        .navigationDestination(for: AppRoute.self) { route in
                            destinationView(for: route)
                        }
                }
            } label: {
                Label {
                    Text("Services")
                } icon: {
                    Image(systemName: selectedTab == 1 ? "square.grid.2x2.fill" : "square.grid.2x2")
                        .foregroundStyle(selectedTab == 1 ? AnyShapeStyle(Brand.linearGradient) : AnyShapeStyle(.secondary))
                }
            }

            Tab(value: 2) {
                NavigationStack {
                    OrdersView()
                        .navigationDestination(for: AppRoute.self) { route in
                            destinationView(for: route)
                        }
                }
            } label: {
                Label {
                    Text("Commandes")
                } icon: {
                    Image(systemName: selectedTab == 2 ? "list.clipboard.fill" : "list.clipboard")
                        .foregroundStyle(selectedTab == 2 ? AnyShapeStyle(Brand.linearGradient) : AnyShapeStyle(.secondary))
                }
            }

            Tab(value: 3) {
                NavigationStack {
                    ProfileView()
                        .toolbar {
                            ToolbarItem(placement: .topBarTrailing) {
                                NavigationLink(value: AppRoute.settings) {
                                    Image(systemName: "gearshape.fill")
                                        .font(.body)
                                        .foregroundStyle(.secondary)
                                }
                            }
                        }
                        .navigationDestination(for: AppRoute.self) { route in
                            destinationView(for: route)
                        }
                }
            } label: {
                Label {
                    Text("Profil")
                } icon: {
                    Image(systemName: selectedTab == 3 ? "person.fill" : "person")
                        .foregroundStyle(selectedTab == 3 ? AnyShapeStyle(Brand.linearGradient) : AnyShapeStyle(.secondary))
                }
            }
        }
        .tint(Brand.cyan)
        .sensoryFeedback(.selection, trigger: selectedTab)
    }

    @ViewBuilder
    private func destinationView(for route: AppRoute) -> some View {
        switch route {
        case .settings:
            SettingsView()
        case .design:
            DesignSystemDemoView()
        case .services:
            ServicesView()
        case .wallet:
            WalletView()
        case .serviceDetail(let id):
            ServiceDetailView(serviceId: id)
        case .shopping:
            ShoppingView()
        case .transport:
            TransportView()
        case .voyage:
            VoyageView()
        case .finance:
            FinanceView()
        case .livraison:
            LivraisonView()
        case .servicesPublic:
            ServicesPublicView()
        case .coins:
            CoinsView()
        case .transfer:
            TransferView()
        case .pay:
            PayView()
        case .recharge:
            RechargeView()
        case .scan:
            ScanView()
        case .editProfile:
            EditProfileView()
        case .productDetail(let id):
            ProductDetailView(productId: id)
        case .cart:
            CartView()
        case .checkout:
            CheckoutView()
        case .tripSearch:
            TripSearchView()
        case .rentalSearch:
            RentalSearchView()
        case .flightSearch:
            FlightSearchView()
        case .hotelSearch:
            HotelSearchView()
        case .visaAssistance:
            VisaAssistanceView()
        case .touristGuide:
            TouristGuideView()
        case .visaDossierTracking:
            VisaDossierTrackingView()
        case .notifications:
            NotificationsView()
        case .carnet:
            CarnetView()
        }
    }
}
