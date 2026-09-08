import { EntitySchema } from 'typeorm';

export const UserBackpackItem = new EntitySchema({
  name: 'UserBackpackItem',
  tableName: 'user_backpack',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    user_id: { type: 'uuid' },
    name: { type: 'text' },
    description: { type: 'text', nullable: true },
    category: { type: 'text' },
    rarity: { type: 'text', default: 'common' },
    metadata: { type: 'jsonb', nullable: true },
    is_equipped: { type: 'boolean', default: false },
    quantity: { type: 'int', default: 1 },
    obtained_at: { type: 'timestamptz', nullable: true },
    created_at: { type: 'timestamptz', createDate: true },
  },
  indices: [
    { columns: ['user_id'] },
  ],
});
