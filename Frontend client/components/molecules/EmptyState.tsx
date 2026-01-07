import React from 'react';
import { EmptyStateLayout } from '@/components/layouts';

// ==========================================
// TYPES (Migration Phase 3)
// ==========================================

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'default' | 'compact' | 'minimal';
}

// ==========================================
// EMPTY STATE COMPONENT
// ==========================================

/**
 * EmptyState - État vide avec action
 * 
 * @example
 * <EmptyState
 *   icon={<Package size={64} />}
 *   title="Aucun résultat"
 *   message="Essayez de modifier vos critères"
 *   actionLabel="Réinitialiser"
 *   onAction={handleReset}
 * />
 */
/**
 * EmptyState - Wrapper pour EmptyStateLayout (Migration Phase 3)
 * Maintient la compatibilité avec l'API existante
 */
export default function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  variant = 'default',
}: EmptyStateProps) {
  return (
    <EmptyStateLayout
      type="custom"
      icon={icon}
      title={title}
      message={message}
      actionText={actionLabel}
      onAction={onAction}
      variant={variant}
    />
  );
}
