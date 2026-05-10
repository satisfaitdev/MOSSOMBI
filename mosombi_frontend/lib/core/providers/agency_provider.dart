import 'package:flutter/material.dart';
import '../models/agency_model.dart';
import '../models/agent_model.dart';
import '../models/agency_sale_model.dart';
import '../models/agency_staff_model.dart';
import 'package:mosombi_frontend/core/network/api_client.dart';

class AgencyProvider extends ChangeNotifier {
  final ApiClient _apiClient = ApiClient();

  Agency? _currentAgency;
  Agent? _currentAgent;
  String? _roleInAgency;
  List<String> _enabledServices = [];
  Map<String, dynamic> _servicePermissions = {};
  List<AgencySale> _sales = [];
  List<AgencyStaff> _staff = [];
  bool _isLoading = false;
  String? _error;

  Agency? get currentAgency => _currentAgency;
  Agent? get currentAgent => _currentAgent;
  String? get roleInAgency => _roleInAgency;
  List<String> get enabledServices => _enabledServices;
  Map<String, dynamic> get servicePermissions => _servicePermissions;
  List<AgencySale> get sales => _sales;
  List<AgencyStaff> get staff => _staff;
  bool get isLoading => _isLoading;
  String? get error => _error;

  AgencyProvider() {
     checkMyAgencyContext();
  }

  /// Check if the connected user already belongs to an Agency.
  /// Hits `GET /api/v1/agencies/my`
  Future<bool> checkMyAgencyContext() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiClient.dio.get('/agencies/my');
      
      if (response.statusCode == 200 && response.data['success'] == true) {
         final data = response.data['data'];
         if (data != null && data['agency'] != null) {
            _currentAgency = Agency(
              id: data['agency']['id'],
              name: data['agency']['name'],
              affiliationCode: data['agency']['affiliation_code'] ?? '------',
              ownerUserId: data['agency']['owner_user_id'],
              totalRevenue: double.tryParse(data['agency']['balance']?.toString() ?? '0') ?? 0.0,
              activeAgents: 1, // Fallback if backend doesn't provide agent count
              status: data['agency']['status'] ?? 'active',
              createdAt: DateTime.tryParse(data['agency']['created_at'] ?? '') ?? DateTime.now(),
            );
            
            _currentAgent = Agent(
              id: 'agent_${data['agency']['id']}', // Fallback since membership id isn't sent
              name: 'Moi',
              phone: '',
              agencyId: data['agency']['id'],
              status: data['agency']['status'] ?? 'active',
              joinedAt: DateTime.tryParse(data['agency']['created_at'] ?? '') ?? DateTime.now(),
            );
            
            _roleInAgency = data['role_in_agency'];
            _enabledServices = List<String>.from(data['enabled_service_ids'] ?? []);
            _servicePermissions = data['service_permissions'] as Map<String, dynamic>? ?? {};

            _isLoading = false;
            notifyListeners();
            return true;
         }
      }
    } catch (e) {
      debugPrint("Aucune agence ou erreur de connexion: $e");
    }
    
    _isLoading = false;
    notifyListeners();
    return false;
  }

  /// Join an Agency using a user_id_display (Public Agent ID)
  /// Hits `POST /api/v1/agencies/join-by-user-display`
  Future<bool> joinAgency(String code, String userName, String userPhone) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiClient.dio.post('/agencies/join-by-user-display', data: {
         'user_id_display': code,
      });

      if ((response.statusCode == 200 || response.statusCode == 201) && response.data['success'] == true) {
         // Successfully sent request (pending state)
         return true;
      } else {
         _error = "Une erreur serveur inattendue est survenue.";
         _isLoading = false;
         notifyListeners();
         return false;
      }
    } catch (e) {
       // Typically 404 or 400 for incorrect codes
      _error = "Le code d'affiliation est incorrect ou expiré.";
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Create a new Agency entirely
  /// Hits `POST /api/v1/agencies/apply`
  Future<bool> createAgency({
    required String name,
    required String phone,
    required String city,
    required String address,
    required String type,
    String logoUrl = '',
    List<Map<String, String>> documents = const [],
  }) async {
     _isLoading = true;
     _error = null;
     notifyListeners();

     try {
       final response = await _apiClient.dio.post('/agencies/apply', data: {
          'name': name,
          'city': city,
          'address': address,
          'logo_url': logoUrl,
          'services': [
             {
                'service_id': type,
                'payload_json': {},
             }
          ],
          'documents': documents,
       });

       if (response.statusCode == 201 && response.data['success'] == true) {
          // Immediately check for context
          return await checkMyAgencyContext();
       } else {
          _error = "Impossible de créer l'agence.";
       }
     } catch (e) {
        _error = "Erreur pendant la création de l'agence. Vérifiez votre connexion.";
     }

     _isLoading = false;
     notifyListeners();
     return false;
  }

  Future<void> fetchSales({String? serviceId}) async {
    _isLoading = true;
    notifyListeners();
    try {
      final queryParams = <String, dynamic>{};
      if (serviceId != null) queryParams['service_id'] = serviceId;
      final response = await _apiClient.dio.get('/agency-sales', queryParameters: queryParams);
      if (response.statusCode == 200 && response.data['success'] == true) {
        final items = response.data['data']['items'] as List;
        _sales = items.map((e) => AgencySale.fromJson(e)).toList();
      }
    } catch (e) {
      debugPrint("Erreur récupération ventes: $e");
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchStaff() async {
    _isLoading = true;
    notifyListeners();
    try {
      final response = await _apiClient.dio.get('/agencies/my/staff');
      if (response.statusCode == 200 && response.data['success'] == true) {
        final items = response.data['data']['items'] as List;
        _staff = items.map((e) => AgencyStaff.fromJson(e)).toList();
      }
    } catch (e) {
      debugPrint("Erreur récupération staff: $e");
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<bool> inviteStaff(String userIdDisplay) async {
    _isLoading = true;
    notifyListeners();
    try {
      final response = await _apiClient.dio.post('/agencies/my/invite-member', data: {
        'user_id_display': userIdDisplay,
        'role_in_agency': 'agent',
      });
      if (response.statusCode == 201 && response.data['success'] == true) {
        await fetchStaff();
        _isLoading = false;
        notifyListeners();
        return true;
      }
    } catch (e) {
      _error = "Identifiant introuvable ou utilisateur déjà membre.";
      debugPrint("Erreur invitation membre: $e");
    }
    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<bool> approveStaff(String membershipId) async {
    _isLoading = true;
    notifyListeners();
    try {
      final response = await _apiClient.dio.post('/agencies/memberships/$membershipId/approve');
      if (response.statusCode == 200 && response.data['success'] == true) {
        await fetchStaff();
        _isLoading = false;
        notifyListeners();
        return true;
      }
    } catch (e) {
      _error = "Erreur lors de l'approbation.";
      debugPrint("Erreur approbation: $e");
    }
    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<bool> rejectStaff(String membershipId) async {
    _isLoading = true;
    notifyListeners();
    try {
      final response = await _apiClient.dio.post('/agencies/memberships/$membershipId/reject');
      if (response.statusCode == 200 && response.data['success'] == true) {
        await fetchStaff();
        _isLoading = false;
        notifyListeners();
        return true;
      }
    } catch (e) {
      _error = "Erreur lors du refus.";
      debugPrint("Erreur refus: $e");
    }
    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<bool> changeStaffRole(String membershipId, String newRole) async {
    _isLoading = true;
    notifyListeners();
    try {
      final response = await _apiClient.dio.patch(
        '/agencies/memberships/$membershipId/role',
        data: {'role': newRole},
      );
      if (response.statusCode == 200 && response.data['success'] == true) {
        await fetchStaff();
        _isLoading = false;
        notifyListeners();
        return true;
      }
    } catch (e) {
      _error = "Erreur lors de la modification du rôle.";
      debugPrint("Erreur changement rôle: $e");
    }
    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<bool> removeStaff(String membershipId) async {
    _isLoading = true;
    notifyListeners();
    try {
      final response = await _apiClient.dio.delete('/agencies/memberships/$membershipId');
      if (response.statusCode == 200 && response.data['success'] == true) {
        await fetchStaff();
        _isLoading = false;
        notifyListeners();
        return true;
      }
    } catch (e) {
      _error = "Erreur lors de la suppression du membre.";
      debugPrint("Erreur suppression membre: $e");
    }
    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<bool> assignStaffTasks(String membershipId, Map<String, dynamic> tasks) async {
    _isLoading = true;
    notifyListeners();
    try {
      final response = await _apiClient.dio.patch(
        '/agencies/memberships/$membershipId/tasks',
        data: {'tasks': tasks},
      );
      if (response.statusCode == 200 && response.data['success'] == true) {
        await fetchStaff();
        _isLoading = false;
        notifyListeners();
        return true;
      }
    } catch (e) {
      _error = "Erreur lors de l'assignation des tâches.";
      debugPrint("Erreur assignation tâches: $e");
    }
    _isLoading = false;
    notifyListeners();
    return false;
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
