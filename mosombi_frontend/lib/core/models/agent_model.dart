class Agent {
  final String id;
  final String name;
  final String phone;
  final String agencyId;
  final double generatedCommissions;
  final String status; // 'active', 'pending', 'suspended'
  final DateTime joinedAt;

  Agent({
    required this.id,
    required this.name,
    required this.phone,
    required this.agencyId,
    this.generatedCommissions = 0.0,
    this.status = 'active',
    required this.joinedAt,
  });
}
