import { EntitySchema } from 'typeorm';

export const Transaction = new EntitySchema({
  name: 'Transaction',
  tableName: 'transactions',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    user_id: { type: 'uuid' },
    transaction_id: { type: 'text' },
    type: { type: 'text' },
    amount: { type: 'numeric' },
    description: { type: 'text', nullable: true },
    recipient_id: { type: 'uuid', nullable: true },
    payment_method: { type: 'text', nullable: true },
    status: { type: 'text', default: 'pending' },
    metadata: { type: 'jsonb', nullable: true },
    created_at: { type: 'timestamptz', createDate: true },
    updated_at: { type: 'timestamptz', updateDate: true },
  },
  indices: [
    { columns: ['user_id'] },
    { columns: ['transaction_id'], unique: true },
    { columns: ['created_at'] },
    { columns: ['status'] },
    { columns: ['type'] },
  ],
});
