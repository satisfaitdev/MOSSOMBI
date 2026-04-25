import { EntitySchema } from 'typeorm';

export const UserSession = new EntitySchema({
  name: 'UserSession',
  tableName: 'user_sessions',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    user_id: { type: 'uuid' },
    session_token: { type: 'text' },
    device_type: { type: 'text', default: 'mobile' },
    device_name: { type: 'text', nullable: true },
    os_name: { type: 'text', nullable: true },
    os_version: { type: 'text', nullable: true },
    ip_address: { type: 'text', nullable: true },
    user_agent: { type: 'text', nullable: true },
    location_country: { type: 'text', nullable: true },
    location_city: { type: 'text', nullable: true },
    is_active: { type: 'boolean', default: true },
    last_activity_at: { type: 'timestamptz', nullable: true },
    expires_at: { type: 'timestamptz', nullable: true },
    created_at: { type: 'timestamptz', createDate: true },
  },
  indices: [
    { columns: ['user_id'] },
    { columns: ['session_token'], unique: true },
  ],
});
