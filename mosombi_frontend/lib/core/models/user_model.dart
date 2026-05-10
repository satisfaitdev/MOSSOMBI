class User {
  final String id;
  final String? phone;
  final String? email;
  final String? fullName;
  final String role;
  final bool isActive;
  final bool isVerified;
  final String? avatarUrl;
  final double points;
  final String? userIdDisplay;
  final String kycStatus;

  User({
    required this.id,
    this.phone,
    this.email,
    this.fullName,
    required this.role,
    this.isActive = false,
    this.isVerified = false,
    this.avatarUrl,
    this.points = 0.0,
    this.userIdDisplay,
    this.kycStatus = 'pending',
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String? ?? '',
      phone: json['phone'] as String?,
      email: json['email'] as String?,
      fullName: json['full_name'] as String?,
      role: json['role'] as String? ?? 'user',
      isActive: json['is_active'] as bool? ?? false,
      isVerified: json['is_verified'] as bool? ?? false,
      avatarUrl: json['avatar_url'] as String?,
      points: _parseDouble(json['points']),
      userIdDisplay: (json['user_id_display'] as String?)?.replaceAll(RegExp(r'[^0-9]'), ''),
      kycStatus: json['kyc_status'] as String? ?? 'pending',
    );
  }

  static double _parseDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'phone': phone,
      'email': email,
      'full_name': fullName,
      'role': role,
      'is_active': isActive,
      'is_verified': isVerified,
      'avatar_url': avatarUrl,
      'points': points,
      'user_id_display': userIdDisplay,
      'kyc_status': kycStatus,
    };
  }
}
