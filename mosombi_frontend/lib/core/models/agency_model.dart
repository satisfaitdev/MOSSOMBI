class Agency {
  final String id;
  final String name;
  final String affiliationCode;
  final String? ownerUserId;
  final double totalRevenue;
  final int activeAgents;
  final String status;
  final DateTime createdAt;
  
  // Nouveaux champs pour la logistique intelligente
  final double? latitude;
  final double? longitude;
  final bool useInternalFleetOnly;

  Agency({
    required this.id,
    required this.name,
    required this.affiliationCode,
    this.ownerUserId,
    this.totalRevenue = 0.0,
    this.activeAgents = 0,
    this.status = 'active',
    required this.createdAt,
    this.latitude,
    this.longitude,
    this.useInternalFleetOnly = false,
  });

  factory Agency.fromJson(Map<String, dynamic> json) {
    return Agency(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      affiliationCode: json['affiliation_code'] ?? '------',
      ownerUserId: json['owner_user_id'],
      totalRevenue: double.tryParse(json['balance']?.toString() ?? '0') ?? 0.0,
      activeAgents: 1,
      status: json['status'] ?? 'active',
      createdAt: DateTime.tryParse(json['created_at'] ?? '') ?? DateTime.now(),
      latitude: double.tryParse(json['latitude']?.toString() ?? ''),
      longitude: double.tryParse(json['longitude']?.toString() ?? ''),
      useInternalFleetOnly: json['use_internal_fleet_only'] ?? false,
    );
  }
}
