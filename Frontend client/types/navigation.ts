/**
 * Types de navigation pour l'application Mossombi
 * Élimine tous les usages de 'as any' dans router.push()
 */

export type AppRoute =
  // Tabs
  | '/'
  | '/services'
  | '/orders'
  | '/wallet'
  | '/profile'
  
  // Auth
  | '/auth/login'
  | '/auth/register-step1'
  | '/auth/register-step2'
  | '/auth/register-step3'
  | '/auth/forgot-password-step1'
  | '/auth/forgot-password-step2'
  | '/auth/forgot-password-step3'
  
  // Profile & Settings
  | '/profile/edit'
  | '/settings'
  | '/security'
  | '/language'
  | '/privacy'
  | '/help'
  | '/help-center'
  | '/notifications'
  
  // Wallet
  | '/wallet/recharge'
  | '/wallet/withdraw'
  | '/wallet/transactions'
  
  // Services
  | '/coins'
  | '/billetterie'
  | '/digital-services'
  | '/backpack'
  | '/level'
  | '/agent'
  | '/team'
  | '/stats'
  | '/reports'
  | '/chat'
  
  // Public Services
  | '/public-services'
  | '/public-services/electricity'
  | '/public-services/water'
  | '/public-services/internet'
  | '/public-services/phone'
  | '/public-services/rent'
  | '/public-services/school'
  | '/public-services/documents'
  
  // Supermarket
  | '/supermarket'
  | '/supermarket/food'
  | '/supermarket/electronics'
  | '/supermarket/phones'
  | '/supermarket/clothing'
  | '/supermarket/clothing-complete'
  | '/supermarket/computers'
  | '/supermarket/baby'
  | '/supermarket/beauty'
  
  // Bookings
  | '/bookings'
  | '/bookings/flight'
  | '/bookings/hotel'
  | '/bookings/hotel-test'
  | '/bookings/train'
  | '/bookings/bus'
  | '/bookings/car'
  | '/bookings/guide'
  | '/bookings/visa'
  
  // Delivery
  | '/delivery'
  | '/delivery/taxi'
  | '/delivery/package'
  | '/delivery/moving'
  | '/delivery/gas'
  
  // Banking
  | '/banking'
  | '/banking/transfer'
  | '/banking/virtual-card'
  | '/banking/savings'
  | '/banking/withdraw';

/**
 * Type guard pour vérifier si une string est une route valide
 */
export function isAppRoute(route: string): route is AppRoute {
  const validRoutes: AppRoute[] = [
    '/', '/services', '/orders', '/wallet', '/profile',
    '/auth/login', '/settings', '/notifications',
    // ... autres routes
  ];
  return validRoutes.includes(route as AppRoute);
}
