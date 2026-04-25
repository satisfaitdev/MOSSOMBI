import Foundation

nonisolated struct MockUser: Sendable {
    let firstName: String
    let lastName: String
    let email: String
    let level: String
    let avatarInitials: String
    let memberSince: String

    var fullName: String { "\(firstName) \(lastName)" }
}

nonisolated enum TransactionStatus: String, Sendable {
    case completed = "Complété"
    case pending = "En attente"
    case failed = "Échoué"
}

nonisolated struct Transaction: Identifiable, Sendable {
    let id: String
    let title: String
    let subtitle: String
    let amount: Double
    let isCredit: Bool
    let status: TransactionStatus
    let date: Date
    let icon: String
}

nonisolated struct ServiceItem: Identifiable, Sendable {
    let id: String
    let name: String
    let icon: String
    let category: String
    let isNew: Bool
    let isPopular: Bool
    let rating: Double

    init(id: String, name: String, icon: String, category: String, isNew: Bool = false, isPopular: Bool = false, rating: Double = 4.5) {
        self.id = id
        self.name = name
        self.icon = icon
        self.category = category
        self.isNew = isNew
        self.isPopular = isPopular
        self.rating = rating
    }
}

nonisolated struct ServiceCategory: Identifiable, Sendable {
    let id: String
    let name: String
    let icon: String
    let services: [ServiceItem]
}

nonisolated struct OfferItem: Identifiable, Sendable {
    let id: String
    let title: String
    let subtitle: String
    let icon: String
}

nonisolated struct BannerAd: Identifiable, Sendable {
    let id: String
    let title: String
    let subtitle: String
    let cta: String
    let icon: String
}

nonisolated struct SplashAd: Sendable {
    let title: String
    let subtitle: String
    let cta: String
    let icon: String
}

nonisolated struct Product: Identifiable, Sendable {
    let id: String
    let name: String
    let price: Double
    let originalPrice: Double?
    let icon: String
    let category: String
    let badge: String?
    let rating: Double
    let reviewCount: Int

    init(id: String, name: String, price: Double, originalPrice: Double? = nil, icon: String, category: String, badge: String? = nil, rating: Double = 4.5, reviewCount: Int = 120) {
        self.id = id
        self.name = name
        self.price = price
        self.originalPrice = originalPrice
        self.icon = icon
        self.category = category
        self.badge = badge
        self.rating = rating
        self.reviewCount = reviewCount
    }
}

nonisolated struct Trip: Identifiable, Sendable {
    let id: String
    let from: String
    let to: String
    let departureTime: String
    let arrivalTime: String
    let price: Double
    let type: String
    let icon: String
    let badge: String?
    let seatsLeft: Int

    init(id: String, from: String, to: String, departureTime: String, arrivalTime: String, price: Double, type: String, icon: String, badge: String? = nil, seatsLeft: Int = 12) {
        self.id = id
        self.from = from
        self.to = to
        self.departureTime = departureTime
        self.arrivalTime = arrivalTime
        self.price = price
        self.type = type
        self.icon = icon
        self.badge = badge
        self.seatsLeft = seatsLeft
    }
}

nonisolated struct RentalCar: Identifiable, Sendable {
    let id: String
    let name: String
    let pricePerDay: Double
    let icon: String
    let type: String
    let seats: Int
    let transmission: String
    let badge: String?

    init(id: String, name: String, pricePerDay: Double, icon: String, type: String, seats: Int = 5, transmission: String = "Auto", badge: String? = nil) {
        self.id = id
        self.name = name
        self.pricePerDay = pricePerDay
        self.icon = icon
        self.type = type
        self.seats = seats
        self.transmission = transmission
        self.badge = badge
    }
}

nonisolated struct Flight: Identifiable, Sendable {
    let id: String
    let from: String
    let to: String
    let date: String
    let price: Double
    let airline: String
    let duration: String
    let badge: String?
}

nonisolated struct Hotel: Identifiable, Sendable {
    let id: String
    let name: String
    let location: String
    let pricePerNight: Double
    let rating: Double
    let icon: String
    let badge: String?
}

nonisolated struct DeliveryItem: Identifiable, Sendable {
    let id: String
    let title: String
    let subtitle: String
    let price: Double
    let icon: String
    let estimatedTime: String
    let badge: String?
}

nonisolated struct FinanceProduct: Identifiable, Sendable {
    let id: String
    let name: String
    let subtitle: String
    let icon: String
    let value: String
    let badge: String?
}

nonisolated struct PublicService: Identifiable, Sendable {
    let id: String
    let name: String
    let provider: String
    let icon: String
    let lastPayment: String
    let amount: Double
    let badge: String?
}

nonisolated struct Order: Identifiable, Sendable {
    let id: String
    let title: String
    let subtitle: String
    let status: OrderStatus
    let date: String
    let amount: Double
    let icon: String
}

nonisolated enum OrderStatus: String, Sendable {
    case processing = "En cours"
    case shipped = "Expédié"
    case delivered = "Livré"
    case cancelled = "Annulé"
}

nonisolated struct CoinItem: Identifiable, Sendable {
    let id: String
    let name: String
    let symbol: String
    let price: Double
    let change24h: Double
    let icon: String
    let marketCap: String
}

nonisolated struct Contact: Identifiable, Sendable {
    let id: String
    let name: String
    let phone: String
    let initials: String
    let isFavorite: Bool

    init(id: String, name: String, phone: String, initials: String, isFavorite: Bool = false) {
        self.id = id
        self.name = name
        self.phone = phone
        self.initials = initials
        self.isFavorite = isFavorite
    }
}

nonisolated struct RechargeOperator: Identifiable, Sendable {
    let id: String
    let name: String
    let icon: String
    let color: String
}

nonisolated struct VisaCountry: Identifiable, Sendable {
    let id: String
    let country: String
    let flag: String
    let types: [String]
    let processingTime: String
    let price: Double
    let successRate: String
}

nonisolated struct VisaDossier: Identifiable, Sendable {
    let id: String
    let country: String
    let type: String
    let status: VisaDossierStatus
    let submittedDate: String
    let lastUpdate: String
}

nonisolated enum VisaDossierStatus: String, Sendable {
    case submitted = "Soumis"
    case inReview = "En examen"
    case approved = "Approuvé"
    case rejected = "Rejeté"
    case documentsNeeded = "Documents requis"
}

nonisolated struct TouristPlace: Identifiable, Sendable {
    let id: String
    let name: String
    let city: String
    let country: String
    let description: String
    let icon: String
    let rating: Double
    let category: String
}

nonisolated struct CartItem: Identifiable, Sendable {
    let id: String
    let product: Product
    let quantity: Int
}

nonisolated struct NotificationItem: Identifiable, Sendable {
    let id: String
    let title: String
    let message: String
    let icon: String
    let type: NotificationType
    let timeAgo: String
    let isRead: Bool

    init(id: String, title: String, message: String, icon: String, type: NotificationType, timeAgo: String, isRead: Bool = false) {
        self.id = id
        self.title = title
        self.message = message
        self.icon = icon
        self.type = type
        self.timeAgo = timeAgo
        self.isRead = isRead
    }
}

nonisolated enum NotificationType: String, Sendable {
    case transaction
    case promotion
    case security
    case system
    case social
}

nonisolated struct SavedAddress: Identifiable, Sendable {
    let id: String
    let label: String
    let address: String
    let icon: String
    let isFavorite: Bool

    init(id: String, label: String, address: String, icon: String, isFavorite: Bool = false) {
        self.id = id
        self.label = label
        self.address = address
        self.icon = icon
        self.isFavorite = isFavorite
    }
}

nonisolated struct SavedTrip: Identifiable, Sendable {
    let id: String
    let from: String
    let to: String
    let type: String
    let icon: String
    let lastUsed: String
}

nonisolated struct SavedContact: Identifiable, Sendable {
    let id: String
    let name: String
    let phone: String
    let initials: String
    let isFavorite: Bool

    init(id: String, name: String, phone: String, initials: String, isFavorite: Bool = false) {
        self.id = id
        self.name = name
        self.phone = phone
        self.initials = initials
        self.isFavorite = isFavorite
    }
}

nonisolated struct WalletAction: Identifiable, Sendable {
    let id: String
    let label: String
    let accountNumber: String
    let provider: String
    let icon: String
}

enum MockData {
    static let user = MockUser(
        firstName: "Aminata",
        lastName: "Diallo",
        email: "aminata@mossombi.com",
        level: "Gold",
        avatarInitials: "AD",
        memberSince: "Mars 2023"
    )

    static let walletBalance: Double = 247_850.00
    static let loyaltyPoints: Int = 3_420

    static let splashAd = SplashAd(
        title: "Mossombi Premium",
        subtitle: "Transferts gratuits, cashback 5% et avantages exclusifs pour les membres Premium.",
        cta: "Découvrir",
        icon: "crown.fill"
    )

    static let bannerAds: [BannerAd] = [
        BannerAd(id: "b1", title: "Cashback 5%", subtitle: "Sur tous vos transferts ce mois", cta: "En profiter", icon: "percent"),
        BannerAd(id: "b2", title: "Parrainage", subtitle: "Gagnez 2000 FCFA par filleul", cta: "Inviter", icon: "person.2.fill"),
    ]

    static let transactions: [Transaction] = [
        Transaction(id: "1", title: "Orange Money", subtitle: "Transfert envoyé", amount: -15000, isCredit: false, status: .completed, date: Date().addingTimeInterval(-3600), icon: "arrow.up.right"),
        Transaction(id: "2", title: "Salaire", subtitle: "Virement reçu", amount: 350000, isCredit: true, status: .completed, date: Date().addingTimeInterval(-86400), icon: "arrow.down.left"),
        Transaction(id: "3", title: "SENELEC", subtitle: "Facture électricité", amount: -28500, isCredit: false, status: .completed, date: Date().addingTimeInterval(-172800), icon: "bolt.fill"),
        Transaction(id: "4", title: "Wave", subtitle: "Recharge mobile", amount: -5000, isCredit: false, status: .pending, date: Date().addingTimeInterval(-259200), icon: "phone.fill"),
        Transaction(id: "5", title: "Freelance", subtitle: "Paiement client", amount: 125000, isCredit: true, status: .completed, date: Date().addingTimeInterval(-345600), icon: "briefcase.fill"),
        Transaction(id: "6", title: "SEN'EAU", subtitle: "Facture eau", amount: -12000, isCredit: false, status: .failed, date: Date().addingTimeInterval(-432000), icon: "drop.fill"),
        Transaction(id: "7", title: "Canal+", subtitle: "Abonnement TV", amount: -9900, isCredit: false, status: .completed, date: Date().addingTimeInterval(-518400), icon: "tv.fill"),
        Transaction(id: "8", title: "Remboursement", subtitle: "Retour marchandise", amount: 7500, isCredit: true, status: .pending, date: Date().addingTimeInterval(-604800), icon: "arrow.uturn.left"),
    ]

    static let offers: [OfferItem] = [
        OfferItem(id: "1", title: "Cashback 5%", subtitle: "Sur tous vos transferts ce mois", icon: "percent"),
        OfferItem(id: "2", title: "Parrainage", subtitle: "Gagnez 2000 FCFA par filleul", icon: "person.2.fill"),
        OfferItem(id: "3", title: "Épargne Boost", subtitle: "Taux préférentiel de 8%", icon: "chart.line.uptrend.xyaxis"),
    ]

    static let categories: [ServiceCategory] = [
        ServiceCategory(id: "shopping", name: "Shopping", icon: "bag.fill", services: [
            ServiceItem(id: "s1", name: "Supermarché", icon: "cart.fill", category: "Shopping", isPopular: true),
            ServiceItem(id: "s2", name: "Électronique", icon: "desktopcomputer", category: "Shopping", isNew: true),
            ServiceItem(id: "s3", name: "Téléphones", icon: "iphone", category: "Shopping", isPopular: true),
            ServiceItem(id: "s4", name: "Ordinateurs", icon: "laptopcomputer", category: "Shopping"),
            ServiceItem(id: "s5", name: "Mode", icon: "tshirt.fill", category: "Shopping"),
            ServiceItem(id: "s6", name: "Beauté", icon: "sparkles", category: "Shopping", isNew: true),
        ]),
        ServiceCategory(id: "transport", name: "Transport", icon: "car.fill", services: [
            ServiceItem(id: "t1", name: "Taxi", icon: "car.fill", category: "Transport", isPopular: true),
            ServiceItem(id: "t2", name: "Bus", icon: "bus.fill", category: "Transport"),
            ServiceItem(id: "t3", name: "Train", icon: "tram.fill", category: "Transport"),
            ServiceItem(id: "t4", name: "Location", icon: "key.fill", category: "Transport", isNew: true),
        ]),
        ServiceCategory(id: "voyage", name: "Voyage", icon: "airplane", services: [
            ServiceItem(id: "v1", name: "Vols", icon: "airplane.departure", category: "Voyage", isPopular: true),
            ServiceItem(id: "v2", name: "Hôtels", icon: "building.2.fill", category: "Voyage"),
            ServiceItem(id: "v3", name: "Visa", icon: "doc.text.fill", category: "Voyage"),
            ServiceItem(id: "v4", name: "Guides", icon: "map.fill", category: "Voyage", isNew: true),
        ]),
        ServiceCategory(id: "livraison", name: "Livraison", icon: "shippingbox.fill", services: [
            ServiceItem(id: "l1", name: "Colis", icon: "shippingbox.fill", category: "Livraison", isPopular: true),
            ServiceItem(id: "l2", name: "Gaz", icon: "flame.fill", category: "Livraison"),
            ServiceItem(id: "l3", name: "Déménagement", icon: "box.truck.fill", category: "Livraison"),
        ]),
        ServiceCategory(id: "finance", name: "Finance", icon: "banknote.fill", services: [
            ServiceItem(id: "f1", name: "Wallet", icon: "wallet.bifold.fill", category: "Finance", isPopular: true),
            ServiceItem(id: "f2", name: "Banking", icon: "building.columns.fill", category: "Finance"),
            ServiceItem(id: "f3", name: "Épargne", icon: "chart.line.uptrend.xyaxis", category: "Finance"),
            ServiceItem(id: "f4", name: "Carte virtuelle", icon: "creditcard.fill", category: "Finance", isNew: true),
        ]),
        ServiceCategory(id: "services-publics", name: "Services publics", icon: "building.fill", services: [
            ServiceItem(id: "sp1", name: "Électricité", icon: "bolt.fill", category: "Services publics", isPopular: true),
            ServiceItem(id: "sp2", name: "Eau", icon: "drop.fill", category: "Services publics"),
            ServiceItem(id: "sp3", name: "Internet", icon: "wifi", category: "Services publics"),
            ServiceItem(id: "sp4", name: "Téléphone", icon: "phone.fill", category: "Services publics"),
            ServiceItem(id: "sp5", name: "Documents", icon: "doc.fill", category: "Services publics"),
            ServiceItem(id: "sp6", name: "Loyer", icon: "house.fill", category: "Services publics"),
            ServiceItem(id: "sp7", name: "École", icon: "graduationcap.fill", category: "Services publics", isNew: true),
        ]),
        ServiceCategory(id: "coins", name: "Coins", icon: "bitcoinsign.circle.fill", services: [
            ServiceItem(id: "c1", name: "Bitcoin", icon: "bitcoinsign.circle.fill", category: "Coins", isPopular: true),
            ServiceItem(id: "c2", name: "Ethereum", icon: "circle.hexagongrid.fill", category: "Coins", isPopular: true),
            ServiceItem(id: "c3", name: "Trading", icon: "chart.xyaxis.line", category: "Coins", isNew: true),
        ]),
    ]

    static let popularServices: [ServiceItem] = {
        categories.flatMap(\.services).filter(\.isPopular)
    }()

    static let newServices: [ServiceItem] = {
        categories.flatMap(\.services).filter(\.isNew)
    }()

    static let allServices: [ServiceItem] = {
        categories.flatMap(\.services)
    }()

    static let filterChips: [String] = ["Populaire", "Nouveautés", "Promos"]

    // MARK: - Products (Shopping)

    static let products: [Product] = [
        Product(id: "p1", name: "iPhone 15 Pro Max", price: 899000, originalPrice: 950000, icon: "iphone", category: "Téléphones", badge: "Promo", rating: 4.8, reviewCount: 342),
        Product(id: "p2", name: "Samsung Galaxy S24", price: 650000, icon: "iphone.gen3", category: "Téléphones", badge: "Nouveau", rating: 4.6, reviewCount: 189),
        Product(id: "p3", name: "MacBook Air M3", price: 1250000, icon: "laptopcomputer", category: "Ordinateurs", badge: "Recommandé", rating: 4.9, reviewCount: 521),
        Product(id: "p4", name: "AirPods Pro 2", price: 185000, originalPrice: 210000, icon: "airpodspro", category: "Électronique", badge: "Promo", rating: 4.7, reviewCount: 890),
        Product(id: "p5", name: "Nike Air Max 90", price: 75000, icon: "shoe.fill", category: "Mode", rating: 4.5, reviewCount: 234),
        Product(id: "p6", name: "Crème Visage Premium", price: 28000, icon: "sparkles", category: "Beauté", badge: "Nouveau", rating: 4.3, reviewCount: 67),
        Product(id: "p7", name: "iPad Pro M4", price: 850000, icon: "ipad", category: "Électronique", badge: "Nouveau", rating: 4.8, reviewCount: 156),
        Product(id: "p8", name: "Riz 25kg Premium", price: 15000, icon: "cart.fill", category: "Supermarché", rating: 4.4, reviewCount: 445),
        Product(id: "p9", name: "Huile d'Argan Bio", price: 12000, icon: "leaf.fill", category: "Beauté", badge: "Bio", rating: 4.6, reviewCount: 98),
        Product(id: "p10", name: "PlayStation 5", price: 420000, originalPrice: 480000, icon: "gamecontroller.fill", category: "Électronique", badge: "Promo", rating: 4.9, reviewCount: 678),
        Product(id: "p11", name: "Robe Élégante", price: 45000, icon: "tshirt.fill", category: "Mode", badge: "Tendance", rating: 4.2, reviewCount: 134),
        Product(id: "p12", name: "Sac à Main Cuir", price: 85000, icon: "bag.fill", category: "Mode", badge: "Recommandé", rating: 4.7, reviewCount: 201),
    ]

    // MARK: - Trips (Transport)

    static let trips: [Trip] = [
        Trip(id: "tr1", from: "Dakar", to: "Saint-Louis", departureTime: "08:00", arrivalTime: "12:30", price: 8500, type: "Bus", icon: "bus.fill", badge: "Populaire", seatsLeft: 5),
        Trip(id: "tr2", from: "Dakar", to: "Thiès", departureTime: "09:15", arrivalTime: "10:45", price: 3500, type: "Train", icon: "tram.fill", seatsLeft: 22),
        Trip(id: "tr3", from: "Dakar", to: "Mbour", departureTime: "07:30", arrivalTime: "09:00", price: 5000, type: "Bus", icon: "bus.fill", badge: "Nouveau", seatsLeft: 8),
        Trip(id: "tr4", from: "Dakar", to: "Ziguinchor", departureTime: "06:00", arrivalTime: "18:00", price: 18000, type: "Bus VIP", icon: "bus.doubledecker.fill", badge: "VIP", seatsLeft: 3),
        Trip(id: "tr5", from: "Dakar", to: "Kaolack", departureTime: "10:00", arrivalTime: "13:30", price: 7000, type: "Bus", icon: "bus.fill", seatsLeft: 15),
        Trip(id: "tr6", from: "Dakar", to: "Touba", departureTime: "11:30", arrivalTime: "15:00", price: 6500, type: "Express", icon: "car.fill", badge: "Recommandé", seatsLeft: 4),
    ]

    static let rentalCars: [RentalCar] = [
        RentalCar(id: "rc1", name: "Toyota Corolla", pricePerDay: 35000, icon: "car.fill", type: "Berline", seats: 5, transmission: "Auto", badge: "Populaire"),
        RentalCar(id: "rc2", name: "Toyota RAV4", pricePerDay: 55000, icon: "car.rear.fill", type: "SUV", seats: 5, transmission: "Auto", badge: "Recommandé"),
        RentalCar(id: "rc3", name: "Renault Duster", pricePerDay: 40000, icon: "car.fill", type: "SUV", seats: 5, transmission: "Manuel"),
        RentalCar(id: "rc4", name: "Mercedes Classe E", pricePerDay: 95000, icon: "car.fill", type: "Luxe", seats: 5, transmission: "Auto", badge: "Premium"),
        RentalCar(id: "rc5", name: "Toyota Hilux", pricePerDay: 65000, icon: "truck.pickup.side.fill", type: "Pickup", seats: 5, transmission: "Manuel", badge: "Nouveau"),
    ]

    // MARK: - Flights & Hotels (Voyage)

    static let flights: [Flight] = [
        Flight(id: "fl1", from: "Dakar", to: "Paris", date: "15 Mar 2025", price: 485000, airline: "Air Sénégal", duration: "5h30", badge: "Direct"),
        Flight(id: "fl2", from: "Dakar", to: "Abidjan", date: "18 Mar 2025", price: 195000, airline: "ASKY", duration: "2h15", badge: nil),
        Flight(id: "fl3", from: "Dakar", to: "Casablanca", date: "20 Mar 2025", price: 245000, airline: "Royal Air Maroc", duration: "3h00", badge: "Promo"),
        Flight(id: "fl4", from: "Dakar", to: "Istanbul", date: "22 Mar 2025", price: 395000, airline: "Turkish Airlines", duration: "7h45", badge: nil),
        Flight(id: "fl5", from: "Dakar", to: "New York", date: "25 Mar 2025", price: 685000, airline: "Air France", duration: "9h30", badge: "Recommandé"),
    ]

    static let hotels: [Hotel] = [
        Hotel(id: "h1", name: "Radisson Blu", location: "Dakar, Almadies", pricePerNight: 95000, rating: 4.7, icon: "building.2.fill", badge: "Populaire"),
        Hotel(id: "h2", name: "Terrou-Bi", location: "Dakar, Corniche", pricePerNight: 120000, rating: 4.8, icon: "building.2.fill", badge: "Luxe"),
        Hotel(id: "h3", name: "Palm Beach", location: "Saly, Mbour", pricePerNight: 65000, rating: 4.5, icon: "building.2.fill", badge: nil),
        Hotel(id: "h4", name: "Hôtel du Phare", location: "Dakar, Mamelles", pricePerNight: 45000, rating: 4.3, icon: "building.2.fill", badge: "Bon plan"),
    ]

    // MARK: - Delivery

    static let deliveryItems: [DeliveryItem] = [
        DeliveryItem(id: "d1", title: "Livraison Express", subtitle: "Colis jusqu'à 5kg", price: 3500, icon: "shippingbox.fill", estimatedTime: "2-4h", badge: "Rapide"),
        DeliveryItem(id: "d2", title: "Livraison Standard", subtitle: "Colis jusqu'à 20kg", price: 5000, icon: "shippingbox.fill", estimatedTime: "24-48h", badge: nil),
        DeliveryItem(id: "d3", title: "Bouteille de Gaz 12kg", subtitle: "Livraison à domicile", price: 8500, icon: "flame.fill", estimatedTime: "1-3h", badge: "Populaire"),
        DeliveryItem(id: "d4", title: "Déménagement Studio", subtitle: "Transport + manutention", price: 45000, icon: "box.truck.fill", estimatedTime: "Sur RDV", badge: nil),
        DeliveryItem(id: "d5", title: "Déménagement Maison", subtitle: "Service complet", price: 120000, icon: "box.truck.fill", estimatedTime: "Sur RDV", badge: "Premium"),
        DeliveryItem(id: "d6", title: "Coursier Moto", subtitle: "Documents & petits colis", price: 2000, icon: "bicycle", estimatedTime: "30min-1h", badge: "Nouveau"),
    ]

    // MARK: - Finance

    static let financeProducts: [FinanceProduct] = [
        FinanceProduct(id: "fp1", name: "Compte Épargne", subtitle: "Taux 5.5% annuel", icon: "chart.line.uptrend.xyaxis", value: "125 000 F", badge: "Recommandé"),
        FinanceProduct(id: "fp2", name: "Carte Virtuelle", subtitle: "Visa prépayée", icon: "creditcard.fill", value: "Gratuite", badge: "Nouveau"),
        FinanceProduct(id: "fp3", name: "Micro-Crédit", subtitle: "Jusqu'à 500 000 F", icon: "banknote.fill", value: "3.9%/mois", badge: nil),
        FinanceProduct(id: "fp4", name: "Assurance Mobile", subtitle: "Protection écran + vol", icon: "shield.checkered", value: "2 500 F/mois", badge: nil),
        FinanceProduct(id: "fp5", name: "Transfert International", subtitle: "150+ pays", icon: "globe.europe.africa.fill", value: "Frais 1.5%", badge: "Populaire"),
        FinanceProduct(id: "fp6", name: "Compte Business", subtitle: "Pour entrepreneurs", icon: "briefcase.fill", value: "5 000 F/mois", badge: "Pro"),
    ]

    // MARK: - Public Services

    static let publicServices: [PublicService] = [
        PublicService(id: "ps1", name: "SENELEC", provider: "Électricité", icon: "bolt.fill", lastPayment: "Feb 2025", amount: 28500, badge: nil),
        PublicService(id: "ps2", name: "SEN'EAU", provider: "Eau", icon: "drop.fill", lastPayment: "Feb 2025", amount: 12000, badge: nil),
        PublicService(id: "ps3", name: "Orange Internet", provider: "Fibre 100Mb", icon: "wifi", lastPayment: "Feb 2025", amount: 25000, badge: "Actif"),
        PublicService(id: "ps4", name: "Free Mobile", provider: "Forfait illimité", icon: "phone.fill", lastPayment: "Feb 2025", amount: 10000, badge: nil),
        PublicService(id: "ps5", name: "Extrait de Naissance", provider: "État Civil", icon: "doc.fill", lastPayment: "-", amount: 2500, badge: "Nouveau"),
        PublicService(id: "ps6", name: "Loyer Mensuel", provider: "Immobilier", icon: "house.fill", lastPayment: "Feb 2025", amount: 150000, badge: nil),
        PublicService(id: "ps7", name: "Frais Scolarité", provider: "Éducation", icon: "graduationcap.fill", lastPayment: "Jan 2025", amount: 85000, badge: "En cours"),
    ]

    // MARK: - Orders

    static let orders: [Order] = [
        Order(id: "o1", title: "iPhone 15 Pro Max", subtitle: "Shopping • 1 article", status: .shipped, date: "12 Mar 2025", amount: 899000, icon: "iphone"),
        Order(id: "o2", title: "Trajet Dakar → Thiès", subtitle: "Transport • Bus", status: .delivered, date: "10 Mar 2025", amount: 3500, icon: "bus.fill"),
        Order(id: "o3", title: "Livraison Express", subtitle: "Livraison • Colis 3kg", status: .processing, date: "14 Mar 2025", amount: 3500, icon: "shippingbox.fill"),
        Order(id: "o4", title: "Vol Dakar → Paris", subtitle: "Voyage • Air Sénégal", status: .processing, date: "15 Mar 2025", amount: 485000, icon: "airplane.departure"),
        Order(id: "o5", title: "AirPods Pro 2", subtitle: "Shopping • 1 article", status: .delivered, date: "8 Mar 2025", amount: 185000, icon: "airpodspro"),
        Order(id: "o6", title: "Bouteille de Gaz", subtitle: "Livraison • 12kg", status: .cancelled, date: "5 Mar 2025", amount: 8500, icon: "flame.fill"),
    ]

    // MARK: - Coins

    static let contacts: [Contact] = [
        Contact(id: "ct1", name: "Moussa Ba", phone: "+221 77 123 45 67", initials: "MB", isFavorite: true),
        Contact(id: "ct2", name: "Fatou Sow", phone: "+221 78 234 56 78", initials: "FS", isFavorite: true),
        Contact(id: "ct3", name: "Ibrahima Diop", phone: "+221 76 345 67 89", initials: "ID", isFavorite: true),
        Contact(id: "ct4", name: "Aïssatou Ndiaye", phone: "+221 77 456 78 90", initials: "AN"),
        Contact(id: "ct5", name: "Omar Fall", phone: "+221 78 567 89 01", initials: "OF"),
        Contact(id: "ct6", name: "Mariama Sy", phone: "+221 76 678 90 12", initials: "MS"),
        Contact(id: "ct7", name: "Cheikh Mbaye", phone: "+221 77 789 01 23", initials: "CM"),
        Contact(id: "ct8", name: "Rama Touré", phone: "+221 78 890 12 34", initials: "RT"),
    ]

    static let rechargeOperators: [RechargeOperator] = [
        RechargeOperator(id: "op1", name: "Orange", icon: "antenna.radiowaves.left.and.right", color: "orange"),
        RechargeOperator(id: "op2", name: "Free", icon: "wifi", color: "blue"),
        RechargeOperator(id: "op3", name: "Expresso", icon: "phone.fill", color: "green"),
        RechargeOperator(id: "op4", name: "Promobile", icon: "simcard.fill", color: "purple"),
    ]

    static let visaCountries: [VisaCountry] = [
        VisaCountry(id: "vc1", country: "États-Unis", flag: "🇺🇸", types: ["Tourisme B1/B2", "Étudiant F1", "Travail H1B", "Transit C1"], processingTime: "3-6 semaines", price: 185000, successRate: "72%"),
        VisaCountry(id: "vc2", country: "France", flag: "🇫🇷", types: ["Schengen Court", "Étudiant", "Travail", "Famille"], processingTime: "2-4 semaines", price: 95000, successRate: "85%"),
        VisaCountry(id: "vc3", country: "Canada", flag: "🇨🇦", types: ["Tourisme", "Étudiant", "Travail", "Résidence"], processingTime: "4-8 semaines", price: 125000, successRate: "68%"),
        VisaCountry(id: "vc4", country: "Royaume-Uni", flag: "🇬🇧", types: ["Visiteur", "Étudiant", "Travail"], processingTime: "3-5 semaines", price: 145000, successRate: "75%"),
        VisaCountry(id: "vc5", country: "Allemagne", flag: "🇩🇪", types: ["Schengen", "Étudiant", "Travail"], processingTime: "2-4 semaines", price: 95000, successRate: "80%"),
        VisaCountry(id: "vc6", country: "Turquie", flag: "🇹🇷", types: ["eVisa Tourisme", "Travail"], processingTime: "1-3 jours", price: 35000, successRate: "95%"),
    ]

    static let visaDossiers: [VisaDossier] = [
        VisaDossier(id: "vd1", country: "France", type: "Schengen Court", status: .inReview, submittedDate: "28 Fév 2025", lastUpdate: "10 Mar 2025"),
        VisaDossier(id: "vd2", country: "États-Unis", type: "Étudiant F1", status: .documentsNeeded, submittedDate: "15 Jan 2025", lastUpdate: "5 Mar 2025"),
        VisaDossier(id: "vd3", country: "Canada", type: "Tourisme", status: .approved, submittedDate: "10 Déc 2024", lastUpdate: "20 Fév 2025"),
    ]

    static let touristPlaces: [TouristPlace] = [
        TouristPlace(id: "tp1", name: "Île de Gorée", city: "Dakar", country: "Sénégal", description: "Site historique UNESCO, mémoire de la traite négrière", icon: "building.columns.fill", rating: 4.8, category: "Histoire"),
        TouristPlace(id: "tp2", name: "Lac Rose", city: "Dakar", country: "Sénégal", description: "Lac aux eaux roses unique au monde", icon: "water.waves", rating: 4.6, category: "Nature"),
        TouristPlace(id: "tp3", name: "Tour Eiffel", city: "Paris", country: "France", description: "Monument emblématique de Paris", icon: "building.2.fill", rating: 4.7, category: "Monument"),
        TouristPlace(id: "tp4", name: "Statue de la Liberté", city: "New York", country: "États-Unis", description: "Symbole de liberté et d'accueil", icon: "figure.stand", rating: 4.8, category: "Monument"),
        TouristPlace(id: "tp5", name: "Parc National du Niokolo-Koba", city: "Tambacounda", country: "Sénégal", description: "Réserve naturelle avec faune sauvage", icon: "leaf.fill", rating: 4.5, category: "Nature"),
        TouristPlace(id: "tp6", name: "Mosquée de la Divinité", city: "Dakar", country: "Sénégal", description: "Mosquée au bord de l'océan", icon: "moon.stars.fill", rating: 4.7, category: "Religion"),
        TouristPlace(id: "tp7", name: "Big Ben", city: "Londres", country: "Royaume-Uni", description: "Horloge historique du Parlement", icon: "clock.fill", rating: 4.6, category: "Monument"),
        TouristPlace(id: "tp8", name: "Delta du Saloum", city: "Fatick", country: "Sénégal", description: "Mangroves et oiseaux migrateurs", icon: "bird.fill", rating: 4.4, category: "Nature"),
    ]

    // MARK: - Notifications

    static let notifications: [NotificationItem] = [
        NotificationItem(id: "n1", title: "Transfert reçu", message: "Vous avez reçu 50 000 F de Moussa Ba", icon: "arrow.down.left.circle.fill", type: .transaction, timeAgo: "Il y a 5 min"),
        NotificationItem(id: "n2", title: "Cashback crédité", message: "2 500 F de cashback ajoutés à votre solde", icon: "gift.fill", type: .promotion, timeAgo: "Il y a 1h"),
        NotificationItem(id: "n3", title: "Connexion détectée", message: "Nouvelle connexion depuis iPhone 15 Pro, Dakar", icon: "lock.shield.fill", type: .security, timeAgo: "Il y a 2h", isRead: true),
        NotificationItem(id: "n4", title: "Offre spéciale", message: "Transferts gratuits ce weekend ! En profiter maintenant", icon: "sparkles", type: .promotion, timeAgo: "Il y a 3h"),
        NotificationItem(id: "n5", title: "Facture SENELEC", message: "Votre facture de 28 500 F est disponible", icon: "bolt.fill", type: .transaction, timeAgo: "Il y a 5h", isRead: true),
        NotificationItem(id: "n6", title: "Mise à jour", message: "Nouvelle version disponible avec des améliorations", icon: "arrow.down.circle.fill", type: .system, timeAgo: "Hier", isRead: true),
        NotificationItem(id: "n7", title: "Parrainage réussi", message: "Fatou Sow a rejoint Mossombi ! 2 000 F crédités", icon: "person.badge.plus", type: .social, timeAgo: "Hier"),
        NotificationItem(id: "n8", title: "Paiement confirmé", message: "Paiement de 15 000 F à Orange Money confirmé", icon: "checkmark.circle.fill", type: .transaction, timeAgo: "Il y a 2j", isRead: true),
        NotificationItem(id: "n9", title: "Alerte sécurité", message: "Changement de mot de passe effectué avec succès", icon: "key.fill", type: .security, timeAgo: "Il y a 3j", isRead: true),
        NotificationItem(id: "n10", title: "Nouveau service", message: "La livraison express est maintenant disponible !", icon: "shippingbox.fill", type: .system, timeAgo: "Il y a 5j", isRead: true),
    ]

    // MARK: - Carnet

    static let savedAddresses: [SavedAddress] = [
        SavedAddress(id: "a1", label: "Maison", address: "Rue 12, Almadies, Dakar", icon: "house.fill", isFavorite: true),
        SavedAddress(id: "a2", label: "Bureau", address: "Avenue Cheikh Anta Diop, Plateau, Dakar", icon: "building.2.fill", isFavorite: true),
        SavedAddress(id: "a3", label: "Famille", address: "Quartier Médina, Saint-Louis", icon: "heart.fill"),
        SavedAddress(id: "a4", label: "Salle de sport", address: "Route de Ngor, Dakar", icon: "figure.run"),
        SavedAddress(id: "a5", label: "Supermarché", address: "Casino, Sea Plaza, Dakar", icon: "cart.fill"),
    ]

    static let savedTrips: [SavedTrip] = [
        SavedTrip(id: "st1", from: "Dakar", to: "Thiès", type: "Train", icon: "tram.fill", lastUsed: "12 Mar 2025"),
        SavedTrip(id: "st2", from: "Maison", to: "Bureau", type: "Taxi", icon: "car.fill", lastUsed: "Aujourd'hui"),
        SavedTrip(id: "st3", from: "Dakar", to: "Saint-Louis", type: "Bus", icon: "bus.fill", lastUsed: "5 Mar 2025"),
        SavedTrip(id: "st4", from: "Dakar", to: "Mbour", type: "Bus", icon: "bus.fill", lastUsed: "28 Fév 2025"),
    ]

    static let savedContacts: [SavedContact] = [
        SavedContact(id: "sc1", name: "Moussa Ba", phone: "+221 77 123 45 67", initials: "MB", isFavorite: true),
        SavedContact(id: "sc2", name: "Fatou Sow", phone: "+221 78 234 56 78", initials: "FS", isFavorite: true),
        SavedContact(id: "sc3", name: "Ibrahima Diop", phone: "+221 76 345 67 89", initials: "ID", isFavorite: true),
        SavedContact(id: "sc4", name: "Aïssatou Ndiaye", phone: "+221 77 456 78 90", initials: "AN"),
        SavedContact(id: "sc5", name: "Omar Fall", phone: "+221 78 567 89 01", initials: "OF"),
        SavedContact(id: "sc6", name: "Mariama Sy", phone: "+221 76 678 90 12", initials: "MS"),
    ]

    static let walletActions: [WalletAction] = [
        WalletAction(id: "wa1", label: "Orange Money", accountNumber: "**** 4567", provider: "Orange", icon: "phone.fill"),
        WalletAction(id: "wa2", label: "Wave", accountNumber: "**** 8901", provider: "Wave", icon: "wave.3.right"),
        WalletAction(id: "wa3", label: "Free Money", accountNumber: "**** 2345", provider: "Free", icon: "wifi"),
        WalletAction(id: "wa4", label: "Carte Visa", accountNumber: "**** 6789", provider: "Visa", icon: "creditcard.fill"),
        WalletAction(id: "wa5", label: "Compte Épargne", accountNumber: "SN076 **** 1234", provider: "CBAO", icon: "building.columns.fill"),
    ]

    static let coins: [CoinItem] = [
        CoinItem(id: "coin1", name: "Bitcoin", symbol: "BTC", price: 42_850_000, change24h: 2.34, icon: "bitcoinsign.circle.fill", marketCap: "835B $"),
        CoinItem(id: "coin2", name: "Ethereum", symbol: "ETH", price: 2_150_000, change24h: -1.12, icon: "circle.hexagongrid.fill", marketCap: "258B $"),
        CoinItem(id: "coin3", name: "BNB", symbol: "BNB", price: 198_500, change24h: 0.85, icon: "diamond.fill", marketCap: "30B $"),
        CoinItem(id: "coin4", name: "Solana", symbol: "SOL", price: 62_400, change24h: 5.67, icon: "sun.max.fill", marketCap: "27B $"),
        CoinItem(id: "coin5", name: "XRP", symbol: "XRP", price: 350, change24h: -0.45, icon: "drop.circle.fill", marketCap: "19B $"),
        CoinItem(id: "coin6", name: "Cardano", symbol: "ADA", price: 285, change24h: 3.21, icon: "hexagon.fill", marketCap: "10B $"),
        CoinItem(id: "coin7", name: "Dogecoin", symbol: "DOGE", price: 52, change24h: 8.90, icon: "dog.fill", marketCap: "7B $"),
        CoinItem(id: "coin8", name: "Polygon", symbol: "MATIC", price: 485, change24h: -2.15, icon: "triangle.fill", marketCap: "4B $"),
    ]
}
