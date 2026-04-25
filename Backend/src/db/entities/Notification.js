import { EntitySchema } from 'typeorm';

export const Notification = new EntitySchema({
  name: 'Notification',
  tableName: 'notifications',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    user_id: { type: 'uuid' },
    type: { type: 'text' },
    title: { type: 'text' },
    message: { type: 'text' },
    data: { type: 'jsonb', nullable: true },
    is_read: { type: 'boolean', default: false },
    created_at: { type: 'timestamptz', createDate: true },
  },
  indices: [
    { columns: ['user_id'] },
  ],
});
