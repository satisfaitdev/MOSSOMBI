class AgencyStaff {
  final String id;
  final String agencyId;
  final String userId;
  final String roleInAgency;
  final String status;
  final DateTime createdAt;
  
  final String? userFullName;
  final String? userPhone;
  final String? userIdDisplay;
  final String? userAvatarUrl;
  
  final int salesCount;
  final double salesAmount;
  final double commissionAmount;
  
  final Map<String, dynamic> servicePermissions;

  AgencyStaff({
    required this.id,
    required this.agencyId,
    required this.userId,
    required this.roleInAgency,
    required this.status,
    required this.createdAt,
    this.userFullName,
    this.userPhone,
    this.userIdDisplay,
    this.userAvatarUrl,
    required this.salesCount,
    required this.salesAmount,
    required this.commissionAmount,
    this.servicePermissions = const {},
  });

  factory AgencyStaff.fromJson(Map<String, dynamic> json) {
    final user = json['user'] as Map<String, dynamic>? ?? {};
    final stats = json['stats'] as Map<String, dynamic>? ?? {};

    return AgencyStaff(
      id: json['id'] as String? ?? '',
      agencyId: json['agency_id'] as String? ?? '',
      userId: json['user_id'] as String? ?? '',
      roleInAgency: json['role_in_agency'] as String? ?? 'agent',
      status: json['status'] as String? ?? 'pending',
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at']) : DateTime.now(),
      
      userFullName: user['full_name'] as String?,
      userPhone: user['phone'] as String?,
      userIdDisplay: (user['user_id_display'] as String?)?.replaceAll(RegExp(r'[^0-9]'), ''),
      userAvatarUrl: user['avatar_url'] as String?,
      
      salesCount: int.tryParse(stats['sales_count']?.toString() ?? '0') ?? 0,
      salesAmount: double.tryParse(stats['sales_amount']?.toString() ?? '0') ?? 0.0,
      commissionAmount: double.tryParse(stats['commission_amount']?.toString() ?? '0') ?? 0.0,
      servicePermissions: json['service_permissions'] as Map<String, dynamic>? ?? {},
    );
  }
}
