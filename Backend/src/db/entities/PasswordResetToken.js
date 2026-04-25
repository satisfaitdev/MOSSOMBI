import { EntitySchema } from 'typeorm';

export const PasswordResetToken = new EntitySchema({
  name: 'PasswordResetToken',
  tableName: 'password_reset_tokens',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    user_id: { type: 'uuid' },
    token_hash: { type: 'text' },
    expires_at: { type: 'timestamptz' },
    is_used: { type: 'boolean', nullable: true, default: false },
    used_at: { type: 'timestamptz', nullable: true },
    created_at: { type: 'timestamptz', createDate: true },
  },
  indices: [
    { columns: ['user_id'] },
    { columns: ['expires_at'] },
  ],
});
