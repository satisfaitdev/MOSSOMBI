import { EntitySchema } from 'typeorm';

export const TwoFactorCode = new EntitySchema({
  name: 'TwoFactorCode',
  tableName: 'two_factor_codes',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    user_id: { type: 'uuid' },
    code: { type: 'text' },
    method: { type: 'text', default: 'whatsapp' },
    is_used: { type: 'boolean', nullable: true, default: false },
    attempts: { type: 'int', default: 0 },
    expires_at: { type: 'timestamptz' },
    used_at: { type: 'timestamptz', nullable: true },
    invalidated_at: { type: 'timestamptz', nullable: true },
    created_at: { type: 'timestamptz', createDate: true },
  },
  indices: [
    { columns: ['user_id'] },
    { columns: ['user_id', 'method'] },
    { columns: ['expires_at'] },
  ],
});
