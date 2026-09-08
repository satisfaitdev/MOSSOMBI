import { EntitySchema } from 'typeorm';

export const UserWallet = new EntitySchema({
  name: 'UserWallet',
  tableName: 'user_wallets',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    user_id: { type: 'uuid' },
    balance: { type: 'numeric', default: 0 },
    currency: { type: 'text', default: 'XAF' },
    status: { type: 'text', default: 'active' },
    last_transaction_at: { type: 'timestamptz', nullable: true },
    created_at: { type: 'timestamptz', createDate: true },
    updated_at: { type: 'timestamptz', updateDate: true },
  },
  indices: [
    { columns: ['user_id'], unique: true },
    { columns: ['status'] },
  ],
});
