import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:mosombi_frontend/core/providers/agency_provider.dart';
import 'package:mosombi_frontend/core/models/agency_staff_model.dart';
import 'package:mosombi_frontend/core/widgets/glass_container.dart';
import 'package:mosombi_frontend/core/widgets/custom_app_bars.dart';
import 'package:mosombi_frontend/core/widgets/animated_gradient_bg.dart';
import 'package:mosombi_frontend/core/theme/app_colors.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart' hide Consumer;
import 'package:mosombi_frontend/core/providers/auth_provider.dart';

class AgencyTeamScreen extends ConsumerStatefulWidget {
  const AgencyTeamScreen({super.key});

  @override
  ConsumerState<AgencyTeamScreen> createState() => _AgencyTeamScreenState();
}

class _AgencyTeamScreenState extends ConsumerState<AgencyTeamScreen> {
  String _selectedFilter = 'Tous';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AgencyProvider>().fetchStaff();
    });
  }

  void _showInviteModal(BuildContext context, bool isDark) {
    final agency = context.read<AgencyProvider>().currentAgency;
    if (agency == null) return;
    // Obtenir le vrai code d'affiliation
    final currentUser = ref.read(authProvider).user;
    final affiliationCode = (agency.affiliationCode != '------' ? agency.affiliationCode : (currentUser?.userIdDisplay ?? '')).replaceAll(RegExp(r'[^0-9]'), '');
    
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        return Container(
          decoration: BoxDecoration(
            color: isDark ? AppColors.bgDark1 : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: const EdgeInsets.all(24),
          child: SafeArea(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.withValues(alpha: 0.5), borderRadius: BorderRadius.circular(2))),
                const SizedBox(height: 24),
                Text('Inviter dans l\'équipe', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: isDark ? Colors.white : Colors.black)),
                const SizedBox(height: 16),
                const Text('Partagez le code de l\'agence. Le collaborateur l\'utilisera lors de son inscription sur Mossombi.', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey)),
                const SizedBox(height: 32),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                  decoration: BoxDecoration(
                    color: AppColors.violet.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.violet.withValues(alpha: 0.2)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(affiliationCode, style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: AppColors.violet, letterSpacing: 2)),
                      const SizedBox(width: 16),
                      GestureDetector(
                        onTap: () {
                          Clipboard.setData(ClipboardData(text: affiliationCode));
                          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Code copié !')));
                        },
                        child: const Icon(Icons.copy_rounded, color: AppColors.violet),
                      )
                    ],
                  ),
                ),
                const SizedBox(height: 32),
                ElevatedButton.icon(
                  onPressed: () {
                    final link = 'https://app.mossombi.com/join?code=$affiliationCode';
                    Clipboard.setData(ClipboardData(text: link));
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Lien copié !')));
                  },
                  icon: const Icon(Icons.share_rounded, color: Colors.white),
                  label: const Text('Partager le lien d\'invitation', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.violet,
                    minimumSize: const Size(double.infinity, 54),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                ),
                const SizedBox(height: 12),
              ],
            ),
          ),
        );
      }
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.textPrimaryLight;
    final hintColor = isDark ? Colors.white70 : AppColors.textSecondaryLight;

    return Scaffold(
      body: AnimatedGradientBg(
        isDark: isDark,
        child: Consumer<AgencyProvider>(
          builder: (context, provider, child) {
            List<AgencyStaff> filteredStaff = List.from(provider.staff);

            // Tri : Le propriétaire toujours en premier
            filteredStaff.sort((a, b) {
              final ownerId = provider.currentAgency?.ownerUserId;
              if (a.userId == ownerId) return -1;
              if (b.userId == ownerId) return 1;
              return 0;
            });

            if (_selectedFilter == 'Approuvés') {
              filteredStaff = filteredStaff.where((s) => s.status != 'pending').toList();
            } else if (_selectedFilter == 'Agents') {
              filteredStaff = filteredStaff.where((s) => s.roleInAgency == 'agent').toList();
            } else if (_selectedFilter == 'Agences') {
              filteredStaff = filteredStaff.where((s) => s.roleInAgency == 'sub_agent').toList();
            } else if (_selectedFilter == 'En attente') {
              filteredStaff = filteredStaff.where((s) => s.status == 'pending').toList();
            }

            final totalCount = provider.staff.length;
            final agentCount = provider.staff.where((s) => s.roleInAgency == 'agent' && s.userId != provider.currentAgency?.ownerUserId).length;
            final agencyCount = provider.staff.where((s) => s.roleInAgency == 'sub_agent').length;

            return RefreshIndicator(
              color: AppColors.violet,
              onRefresh: () => context.read<AgencyProvider>().fetchStaff(),
              child: CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                slivers: [
                  MossombiSliverAppBar(
                    title: 'Équipe',
                    actionIcon: const Icon(Icons.person_add_alt_1_rounded, color: AppColors.violet, size: 24),
                    onActionTap: () => _showAddByIdDialog(context, isDark),
                  ),
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(child: _buildStatCard('Membres', totalCount.toString(), Icons.groups_rounded, AppColors.violet, isDark)),
                              const SizedBox(width: 12),
                              Expanded(child: _buildStatCard('Agents', agentCount.toString(), Icons.person_rounded, Colors.blue, isDark)),
                              const SizedBox(width: 12),
                              Expanded(child: _buildStatCard('Agences', agencyCount.toString(), Icons.domain_rounded, AppColors.coral, isDark)),
                            ],
                          ),
                          const SizedBox(height: 24),
                          SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            physics: const BouncingScrollPhysics(),
                            child: Row(
                              children: [
                                _buildFilterChip('Tous', isDark),
                                const SizedBox(width: 8),
                                _buildFilterChip('Agents', isDark),
                                const SizedBox(width: 8),
                                _buildFilterChip('Agences', isDark),
                                const SizedBox(width: 8),
                                _buildFilterChip('En attente', isDark),
                              ],
                            ),
                          ),
                          const SizedBox(height: 8),
                        ],
                      ),
                    ),
                  ),
                  if (provider.isLoading && provider.staff.isEmpty)
                    const SliverFillRemaining(
                      child: Center(child: CircularProgressIndicator()),
                    )
                  else if (filteredStaff.isEmpty)
                    SliverFillRemaining(
                      child: Center(
                        child: Text('Aucun membre trouvé.', style: TextStyle(color: hintColor)),
                      ),
                    )
                  else
                    SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final member = filteredStaff[index];
                          return _buildStaffCard(member, textColor, hintColor, isDark)
                              .animate(delay: (index * 50).ms)
                              .fade()
                              .slideY(begin: 0.2, end: 0);
                        },
                        childCount: filteredStaff.length,
                      ),
                    ),
                ],
              ),
            );
          },
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showInviteModal(context, isDark),
        backgroundColor: AppColors.violet,
        child: const Icon(Icons.share_rounded, color: Colors.white),
      ),
    );
  }

  Widget _buildFilterChip(String label, bool isDark) {
    final isSelected = _selectedFilter == label;
    return GestureDetector(
      onTap: () => setState(() => _selectedFilter = label),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.violet : (isDark ? Colors.white.withValues(alpha: 0.1) : Colors.black.withValues(alpha: 0.05)),
          borderRadius: BorderRadius.circular(24),
          boxShadow: isSelected ? [BoxShadow(color: AppColors.violet.withValues(alpha: 0.3), blurRadius: 8, offset: const Offset(0, 4))] : [],
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : (isDark ? Colors.white70 : Colors.black87),
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            fontSize: 13,
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color, bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
      decoration: BoxDecoration(
        color: isDark ? color.withValues(alpha: 0.15) : color.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 28),
          const SizedBox(height: 12),
          Text(value, style: TextStyle(color: isDark ? Colors.white : Colors.black87, fontSize: 24, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(title, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _buildStaffCard(AgencyStaff member, Color textColor, Color hintColor, bool isDark) {
    final isOwner = member.userId == context.read<AgencyProvider>().currentAgency?.ownerUserId;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
      child: GestureDetector(
        onTap: isOwner ? null : () => _showStaffOptionsBottomSheet(context, member, isDark),
        child: GlassContainer(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              CircleAvatar(
                radius: 22,
                backgroundColor: AppColors.violet.withValues(alpha: 0.15),
                backgroundImage: member.userAvatarUrl != null && member.userAvatarUrl!.isNotEmpty
                    ? NetworkImage(member.userAvatarUrl!)
                    : null,
                child: member.userAvatarUrl == null || member.userAvatarUrl!.isEmpty
                    ? const Icon(Icons.person, color: AppColors.violet)
                    : null,
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      member.userFullName?.isNotEmpty == true ? member.userFullName! : 'Agent Inconnu',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: textColor),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      member.userIdDisplay ?? 'N/A',
                      style: TextStyle(color: hintColor, fontSize: 12),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.coral.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '${member.salesCount} Ventes',
                            style: const TextStyle(color: AppColors.coral, fontSize: 11, fontWeight: FontWeight.bold),
                          ),
                        ),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.violet.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: (() {
                            String badgeText = member.roleInAgency.toUpperCase();
                            if (isOwner) badgeText = 'PROPRIÉTAIRE';
                            else if (badgeText == 'SUB_AGENT') badgeText = 'AGENCE';

                            return Text(
                              member.status == 'pending' ? 'EN ATTENTE' : badgeText,
                              style: TextStyle(color: member.status == 'pending' ? AppColors.coral : AppColors.violet, fontSize: 10, fontWeight: FontWeight.bold),
                            );
                          })(),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              if (!isOwner) const Icon(Icons.more_vert_rounded, color: Colors.grey),
            ],
          ),
        ),
      ),
    );
  }

  void _showStaffOptionsBottomSheet(BuildContext context, AgencyStaff member, bool isDark) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: isDark ? AppColors.bgDark1 : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: SafeArea(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.withValues(alpha: 0.5), borderRadius: BorderRadius.circular(2))),
                const SizedBox(height: 24),
                Text('Options pour ${member.userFullName ?? "Agent"}', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: isDark ? Colors.white : Colors.black)),
                const SizedBox(height: 24),

                if (member.status == 'pending')
                  ListTile(
                    leading: const Icon(Icons.check_circle_rounded, color: Colors.green),
                    title: Text('Approuver l\'agent', style: TextStyle(color: isDark ? Colors.white : Colors.black, fontWeight: FontWeight.bold)),
                    onTap: () async {
                      final provider = context.read<AgencyProvider>();
                      final scaffold = ScaffoldMessenger.of(context);
                      Navigator.pop(context);
                      final success = await provider.approveStaff(member.id);
                      if (success) {
                         scaffold.showSnackBar(const SnackBar(content: Text('Agent approuvé !')));
                      } else {
                         scaffold.showSnackBar(const SnackBar(content: Text('Erreur lors de l\'approbation.')));
                      }
                    },
                  ),
                if (member.status == 'pending')
                  ListTile(
                    leading: const Icon(Icons.cancel_rounded, color: Colors.red),
                    title: Text('Refuser / Supprimer', style: TextStyle(color: isDark ? Colors.white : Colors.black, fontWeight: FontWeight.bold)),
                    onTap: () async {
                      final provider = context.read<AgencyProvider>();
                      final scaffold = ScaffoldMessenger.of(context);
                      Navigator.pop(context);
                      final success = await provider.rejectStaff(member.id);
                      if (success) {
                         scaffold.showSnackBar(const SnackBar(content: Text('Demande refusée.')));
                      } else {
                         scaffold.showSnackBar(const SnackBar(content: Text('Erreur lors du refus.')));
                      }
                    },
                  ),
                if (member.status != 'pending')
                  ListTile(
                    leading: const Icon(Icons.assignment_ind_rounded, color: AppColors.violet),
                    title: Text('Assigner des tâches (Rôles)', style: TextStyle(color: isDark ? Colors.white : Colors.black, fontWeight: FontWeight.bold)),
                    subtitle: const Text('Définir les permissions par service', style: TextStyle(color: Colors.grey, fontSize: 12)),
                    onTap: () {
                      Navigator.pop(context);
                      _showAssignTasksDialog(context, member, isDark);
                    },
                  ),
                if (member.status != 'pending')
                  ListTile(
                    leading: Icon(member.roleInAgency == 'agent' ? Icons.upgrade_rounded : Icons.south_east_rounded, color: AppColors.coral),
                    title: Text(member.roleInAgency == 'agent' ? 'Promouvoir en Agence' : 'Rétrograder en Agent', style: TextStyle(color: isDark ? Colors.white : Colors.black, fontWeight: FontWeight.bold)),
                    subtitle: Text(member.roleInAgency == 'agent' ? 'Passer au statut Agence' : 'Repasser au statut Agent classique', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                    onTap: () async {
                      final provider = context.read<AgencyProvider>();
                      Navigator.pop(context);
                      final newRole = member.roleInAgency == 'agent' ? 'sub_agent' : 'agent';
                      final success = await provider.changeStaffRole(member.id, newRole);
                      if (success) {
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(newRole == 'sub_agent' ? 'Membre promu en Agence !' : 'Membre rétrogradé en Agent.')));
                      }
                    },
                  ),
                if (member.status != 'pending')
                  ListTile(
                    leading: const Icon(Icons.insights_rounded, color: Colors.green),
                    title: Text('Statistiques Détaillées', style: TextStyle(color: isDark ? Colors.white : Colors.black, fontWeight: FontWeight.bold)),
                    subtitle: const Text('Voir toutes les ventes', style: TextStyle(color: Colors.grey, fontSize: 12)),
                    onTap: () {
                      Navigator.pop(context);
                      _showDetailedStatsBottomSheet(context, member, isDark);
                    },
                  ),
                if (member.status != 'pending')
                  ListTile(
                    leading: const Icon(Icons.person_remove_rounded, color: Colors.red),
                    title: const Text('Retirer de l\'équipe', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
                    onTap: () {
                      Navigator.pop(context);
                      _showDeleteStaffDialog(context, member, isDark);
                    },
                  ),
              ],
            ),
          ),
        );
      }
    );
  }

  void _showDeleteStaffDialog(BuildContext context, AgencyStaff member, bool isDark) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: isDark ? AppColors.bgDark1 : Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Text('Retirer ${member.userFullName ?? "l\'agent"} ?', style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
          content: Text('Êtes-vous sûr de vouloir retirer cette personne de votre agence ? Ses accès seront révoqués.', style: TextStyle(color: isDark ? Colors.white70 : Colors.black87)),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Annuler', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
            ),
            ElevatedButton(
              onPressed: () async {
                final provider = context.read<AgencyProvider>();
                Navigator.pop(context);
                final success = await provider.removeStaff(member.id);
                if (success) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Ce membre a été retiré de l\'équipe.')));
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Erreur lors de la suppression.')));
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Confirmer', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ],
        );
      }
    );
  }

  void _showAssignTasksDialog(BuildContext context, AgencyStaff member, bool isDark) {
    Map<String, dynamic> currentTasks = Map<String, dynamic>.from(member.servicePermissions);

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setState) {
            Widget buildServiceRolesSection(String title, String serviceKey, List<String> roles) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: TextStyle(color: isDark ? Colors.white : Colors.black87, fontWeight: FontWeight.w900, fontSize: 16)),
                    const SizedBox(height: 8),
                    ...roles.map((role) {
                       final serviceRoles = List<String>.from(currentTasks[serviceKey] ?? []);
                       final isChecked = serviceRoles.contains(role);
                       
                       return CheckboxListTile(
                         title: Text(role, style: TextStyle(color: isDark ? Colors.white70 : Colors.black54, fontSize: 14)),
                         value: isChecked,
                         activeColor: AppColors.violet,
                         contentPadding: EdgeInsets.zero,
                         controlAffinity: ListTileControlAffinity.leading,
                         visualDensity: VisualDensity.compact,
                         onChanged: (bool? value) {
                           setState(() {
                             if (value == true) {
                               serviceRoles.add(role);
                             } else {
                               serviceRoles.remove(role);
                             }
                             currentTasks[serviceKey] = serviceRoles;
                           });
                         },
                       );
                    }),
                  ],
                ),
              );
            }

            return AlertDialog(
              backgroundColor: isDark ? AppColors.bgDark1 : Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              title: Text('Assigner des Tâches: ${member.userFullName}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Définissez les autorisations de cet agent selon les services activés par votre agence.', style: TextStyle(color: Colors.grey, fontSize: 13)),
                    const SizedBox(height: 16),
                    
                    if (context.read<AgencyProvider>().enabledServices.isEmpty)
                       const Padding(
                         padding: EdgeInsets.symmetric(vertical: 20),
                         child: Center(child: Text('Aucun service activé pour le moment.', style: TextStyle(color: Colors.grey))),
                       )
                    else ...[
                      if (context.read<AgencyProvider>().enabledServices.contains('store'))
                        buildServiceRolesSection('🛒 Boutique', 'store', ['Vendeur / Caissier', 'Gestionnaire de Stock', 'Finance', 'Livreur']),
                      if (context.read<AgencyProvider>().enabledServices.contains('taxi'))
                        buildServiceRolesSection('🚕 Taxi', 'taxi', ['Chauffeur', 'Gestionnaire de flotte']),
                      if (context.read<AgencyProvider>().enabledServices.contains('tickets'))
                        buildServiceRolesSection('🎟️ Billetterie', 'tickets', ['Guichetier', 'Contrôleur', 'Finance']),
                    ],
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Fermer', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
                ),
                ElevatedButton(
                  onPressed: () async {
                    final provider = context.read<AgencyProvider>();
                    Navigator.pop(context);
                    final success = await provider.assignStaffTasks(member.id, currentTasks);
                    if (success) {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Déploiement des tâches enregistré avec succès !')));
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.violet,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Enregistrer', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                ),
              ],
            );
          }
        );
      }
    );
  }

  void _showDetailedStatsBottomSheet(BuildContext context, AgencyStaff member, bool isDark) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: isDark ? AppColors.bgDark1 : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: SafeArea(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.withValues(alpha: 0.5), borderRadius: BorderRadius.circular(2)))),
                const SizedBox(height: 24),
                Text('Statistiques de ${member.userFullName ?? "l\'Agent"}', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: isDark ? Colors.white : Colors.black)),
                const SizedBox(height: 16),
                _buildStatDetailRow('Identifiant (ID)', member.userIdDisplay ?? 'N/A', isDark),
                _buildStatDetailRow('Membre depuis le', "${member.createdAt.day.toString().padLeft(2, '0')}/${member.createdAt.month.toString().padLeft(2, '0')}/${member.createdAt.year}", isDark),
                const Divider(height: 32),
                _buildStatDetailRow('Nombre de Ventes', '${member.salesCount}', isDark),
                _buildStatDetailRow('Volume Total', '${member.salesAmount} CFA', isDark),
                _buildStatDetailRow('Commissions Générées', '${member.commissionAmount} CFA', isDark, isHighlight: true),
                const SizedBox(height: 24),
              ],
            ),
          ),
        );
      }
    );
  }

  Widget _buildStatDetailRow(String label, String value, bool isDark, {bool isHighlight = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: isDark ? Colors.white70 : Colors.black54, fontSize: 14)),
          Text(value, style: TextStyle(color: isHighlight ? AppColors.violet : (isDark ? Colors.white : Colors.black), fontSize: 16, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  void _showAddByIdDialog(BuildContext context, bool isDark) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: isDark ? AppColors.bgDark1 : Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Text('Ajouter via ID', style: TextStyle(fontWeight: FontWeight.bold)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Entrez l\'identifiant unique (Mossombi ID) ou le numéro de téléphone de l\'utilisateur.', style: TextStyle(color: isDark ? Colors.white70 : Colors.black87, fontSize: 13)),
              const SizedBox(height: 16),
              TextField(
                controller: controller,
                style: TextStyle(color: isDark ? Colors.white : Colors.black),
                decoration: InputDecoration(
                  hintText: 'MSB-XXXX ou 07...',
                  hintStyle: const TextStyle(color: Colors.grey),
                  filled: true,
                  fillColor: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.05),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                  prefixIcon: const Icon(Icons.search_rounded, color: Colors.grey),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Annuler', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.violet,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: () async {
                String code = controller.text.trim();
                if (code.isNotEmpty) {
                  // Format automatic to "MSB-XXXXXX"
                  if (RegExp(r'^[0-9]{4,8}$').hasMatch(code)) {
                    code = 'MSB-$code'; // If user just typed "753380"
                  } else if (code.toUpperCase().startsWith('MBS-') || code.toUpperCase().startsWith('MSB-')) {
                    code = 'MSB-${code.replaceAll(RegExp(r'[^0-9]'), '')}'; // Fix "MBS-753380"
                  }

                  final provider = context.read<AgencyProvider>();
                  final scaffold = ScaffoldMessenger.of(context);
                  Navigator.pop(context);
                  
                  final success = await provider.inviteStaff(code);
                  if (mounted) {
                    if (success) {
                      scaffold.showSnackBar(
                        const SnackBar(content: Text('Agent ajouté avec succès !')),
                      );
                    } else {
                      final errorMsg = provider.error ?? 'Agent introuvable ou erreur serveur.';
                      scaffold.showSnackBar(
                        SnackBar(content: Text(errorMsg)),
                      );
                    }
                  }
                }
              },
              child: const Text('Ajouter', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ],
        );
      },
    );
  }
}
