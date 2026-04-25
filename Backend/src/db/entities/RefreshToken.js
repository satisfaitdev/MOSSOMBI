import { EntitySchema } from 'typeorm';

export const RefreshToken = new EntitySchema({
  name: 'RefreshToken',
  tableName: 'refresh_tokens',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    user_id: { type: 'uuid' },
    token_hash: { type: 'text' },
    expires_at: { type: 'timestamptz' },
    revoked_at: { type: 'timestamptz', nullable: true },
    replaced_by_token_id: { type: 'uuid', nullable: true },
    created_by_ip: { type: 'text', nullable: true },
    user_agent: { type: 'text', nullable: true },
    created_at: { type: 'timestamptz', createDate: true },
  },
  indices: [
    { columns: ['user_id'] },
    { columns: ['token_hash'], unique: true },
  ],
});
