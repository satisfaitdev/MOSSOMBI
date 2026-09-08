class BackpackItem {
  final String id;
  final String name;
  final String description;
  final String category;
  final String rarity;
  final bool isEquipped;
  final DateTime? acquiredAt;
  final Map<String, dynamic>? metadata;

  BackpackItem({
    required this.id,
    required this.name,
    this.description = '',
    required this.category,
    this.rarity = 'common',
    this.isEquipped = false,
    this.acquiredAt,
    this.metadata,
  });

  factory BackpackItem.fromJson(Map<String, dynamic> json) {
    return BackpackItem(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      category: json['category'] ?? 'item',
      rarity: json['rarity'] ?? 'common',
      isEquipped: json['is_equipped'] ?? false,
      acquiredAt: json['obtained_at'] != null
          ? DateTime.tryParse(json['obtained_at'])
          : null,
      metadata: json['metadata'] as Map<String, dynamic>?,
    );
  }

  String get rarityLabel {
    switch (rarity) {
      case 'common': return 'Commun';
      case 'rare': return 'Rare';
      case 'epic': return 'Épique';
      case 'legendary': return 'Légendaire';
      default: return rarity;
    }
  }
}
