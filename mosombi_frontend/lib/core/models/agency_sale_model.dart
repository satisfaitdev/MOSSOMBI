class AgencySale {
  final String id;
  final String agencyId;
  final String serviceId;
  final double amount;
  final String currency;
  final String clientName;
  final String clientPhone;
  final double? commissionAmount;
  final String deliveryStatus;
  final DateTime createdAt;

  AgencySale({
    required this.id,
    required this.agencyId,
    required this.serviceId,
    required this.amount,
    required this.currency,
    required this.clientName,
    required this.clientPhone,
    this.commissionAmount,
    required this.deliveryStatus,
    required this.createdAt,
  });

  factory AgencySale.fromJson(Map<String, dynamic> json) {
    return AgencySale(
      id: json['id'] as String? ?? '',
      agencyId: json['agency_id'] as String? ?? '',
      serviceId: json['service_id'] as String? ?? '',
      amount: double.tryParse(json['amount']?.toString() ?? '0') ?? 0.0,
      currency: json['currency'] as String? ?? 'CDF',
      clientName: json['client_name'] as String? ?? '',
      clientPhone: json['client_phone'] as String? ?? '',
      commissionAmount: json['commission_amount'] != null ? double.tryParse(json['commission_amount'].toString()) : null,
      deliveryStatus: json['delivery_status'] as String? ?? 'pending',
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at']) : DateTime.now(),
    );
  }
}
