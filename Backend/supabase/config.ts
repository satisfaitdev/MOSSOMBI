// =====================================================
// CONFIGURATION SUPABASE - MOSSOMBI
// Projet ID: ysehwpykzgksmaayaqek
// Créé le: 5 novembre 2025
// =====================================================

export const SUPABASE_CONFIG = {
  // URL du projet Supabase
  url: 'https://ysehwpykzgksmaayaqek.supabase.co',
  
  // Clé publique (anon) - SAFE pour le client
  publishableKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzZWh3cHlremdrc21hYXlhcWVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNDgzNjksImV4cCI6MjA3NzkyNDM2OX0.ZKWG_fBHSrpLqHUqZp77DfNN5sWyxfWolUH7_datT1Y',
  
  // Informations du projet
  project: {
    id: 'ysehwpykzgksmaayaqek',
    name: 'Mossombi',
    region: 'eu-west-1',
    organization: 'satusthebrain@gmail.com\'s Org'
  }
} as const;

// Variables d'environnement pour React Native
export const ENV_VARIABLES = {
  // Pour Expo
  EXPO_PUBLIC_SUPABASE_URL: 'https://ysehwpykzgksmaayaqek.supabase.co',
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzZWh3cHlremdrc21hYXlhcWVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNDgzNjksImV4cCI6MjA3NzkyNDM2OX0.ZKWG_fBHSrpLqHUqZp77DfNN5sWyxfWolUH7_datT1Y',
  
  // Pour React Native CLI
  REACT_NATIVE_SUPABASE_URL: 'https://ysehwpykzgksmaayaqek.supabase.co',
  REACT_NATIVE_SUPABASE_PUBLISHABLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzZWh3cHlremdrc21hYXlhcWVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNDgzNjksImV4cCI6MjA3NzkyNDM2OX0.ZKWG_fBHSrpLqHUqZp77DfNN5sWyxfWolUH7_datT1Y'
} as const;
