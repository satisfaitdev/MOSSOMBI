class Agency {
  final String id;
  final String name;
  final String affiliationCode;
  final String? ownerUserId;
  final double totalRevenue;
  final int activeAgents;
  final String status;
  final DateTime createdAt;

  Agency({
    required this.id,
    required this.name,
    required this.affiliationCode,
    this.ownerUserId,
    this.totalRevenue = 0.0,
    this.activeAgents = 0,
    this.status = 'active',
    required this.createdAt,
  });
}
