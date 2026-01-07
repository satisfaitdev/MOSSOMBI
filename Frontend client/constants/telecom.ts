/**
 * Constantes pour les opérateurs télécom et fournisseurs internet
 * Utilisées dans: phone, internet, withdraw, deposit, transfer, etc.
 */

export interface TelecomOperator {
  id: string;
  name: string;
  color?: string;
}

export interface InternetProvider {
  id: string;
  name: string;
}

/**
 * Opérateurs téléphoniques en RDC
 */
export const TELECOM_OPERATORS: TelecomOperator[] = [
  {
    id: 'vodacom',
    name: 'Vodacom',
    color: '#E60000',
  },
  {
    id: 'airtel',
    name: 'Airtel',
    color: '#FF0000',
  },
  {
    id: 'orange',
    name: 'Orange',
    color: '#FF7900',
  },
  {
    id: 'africell',
    name: 'Africell',
    color: '#0066CC',
  },
];

/**
 * Fournisseurs internet en RDC
 */
export const INTERNET_PROVIDERS: InternetProvider[] = [
  { id: 'vodacom', name: 'Vodacom' },
  { id: 'airtel', name: 'Airtel' },
  { id: 'orange', name: 'Orange' },
  { id: 'africell', name: 'Africell' },
];

/**
 * Helper pour obtenir un opérateur par ID
 */
export const getOperatorById = (id: string): TelecomOperator | undefined => {
  return TELECOM_OPERATORS.find((op) => op.id === id);
};

/**
 * Helper pour obtenir un provider par ID
 */
export const getProviderById = (id: string): InternetProvider | undefined => {
  return INTERNET_PROVIDERS.find((p) => p.id === id);
};
