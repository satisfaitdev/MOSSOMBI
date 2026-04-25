enum NotificationCategory { transport, marketplace, fintech, system }

class NotificationModel {
  final String id;
  final String title;
  final String message;
  final DateTime date;
  final NotificationCategory category;
  bool isRead;

  NotificationModel({
    required this.id,
    required this.title,
    required this.message,
    required this.date,
    required this.category,
    this.isRead = false,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'message': message,
    'date': date.toIso8601String(),
    'category': category.index,
    'isRead': isRead,
  };

  factory NotificationModel.fromJson(Map<String, dynamic> json) => NotificationModel(
    id: json['id'] as String,
    title: json['title'] as String,
    message: json['message'] as String,
    date: DateTime.parse(json['date'] as String),
    category: NotificationCategory.values[json['category'] as int],
    isRead: json['isRead'] as bool,
  );

  NotificationModel copyWith({
    String? id,
    String? title,
    String? message,
    DateTime? date,
    NotificationCategory? category,
    bool? isRead,
  }) {
    return NotificationModel(
      id: id ?? this.id,
      title: title ?? this.title,
      message: message ?? this.message,
      date: date ?? this.date,
      category: category ?? this.category,
      isRead: isRead ?? this.isRead,
    );
  }
}
