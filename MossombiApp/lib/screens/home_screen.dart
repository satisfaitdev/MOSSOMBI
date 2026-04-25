import 'package:flutter/material.dart';
import '../theme/colors.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Scaffold(
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Bonjour,',
                        style: TextStyle(fontSize: 16, color: AppColors.textSecondary),
                      ),
                      Text(
                        'John Doe 👋',
                        style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                      ),
                    ],
                  ),
                  CircleAvatar(
                    backgroundColor: AppColors.cyanLight.withOpacity(0.2),
                    radius: 24,
                    child: const Icon(Icons.person, color: AppColors.cyanDark),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              
              // Wallet Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  gradient: AppColors.darkGradient,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.blueDeep.withOpacity(0.3),
                      blurRadius: 15,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Solde Total',
                      style: TextStyle(color: Colors.white70, fontSize: 16),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      '425,50 \$',
                      style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _buildWalletAction(Icons.add, 'Recharger'),
                        _buildWalletAction(Icons.send, 'Envoyer'),
                        _buildWalletAction(Icons.qr_code_scanner, 'Payer'),
                      ],
                    )
                  ],
                ),
              ),
              const SizedBox(height: 32),
              
              // Services Grid
              const Text(
                'Services',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 16),
              GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: 4,
                mainAxisSpacing: 16,
                crossAxisSpacing: 16,
                children: [
                  _buildServiceItem(Icons.local_taxi, 'VTC', AppColors.cyanLight),
                  _buildServiceItem(Icons.restaurant, 'Food', AppColors.orangeLight),
                  _buildServiceItem(Icons.local_shipping, 'Colis', AppColors.purpleDeep),
                  _buildServiceItem(Icons.shopping_bag, 'Shopping', Colors.pinkAccent),
                  _buildServiceItem(Icons.flash_on, 'Énergie', Colors.amber),
                  _buildServiceItem(Icons.airplane_ticket, 'Voyage', Colors.teal),
                  _buildServiceItem(Icons.movie, 'Ciné', Colors.redAccent),
                  _buildServiceItem(Icons.more_horiz, 'Plus', Colors.grey),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildWalletAction(IconData icon, String label) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.2),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: Colors.white),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: const TextStyle(color: Colors.white, fontSize: 12),
        )
      ],
    );
  }

  Widget _buildServiceItem(IconData icon, String label, Color color) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: color.withOpacity(0.15),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Icon(icon, color: color, size: 28),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
          overflow: TextOverflow.ellipsis,
        )
      ],
    );
  }
}
