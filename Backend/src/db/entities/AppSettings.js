import { EntitySchema } from 'typeorm';

export const AppSettings = new EntitySchema({
  name: 'app_settings',
  tableName: 'app_settings',
  columns: {
    key: {
      primary: true,
      type: 'text',
    },
    value: {
      type: 'jsonb',
      default: {},
    },
    description: {
      type: 'text',
      default: '',
    },
    updated_at: {
      type: 'timestamptz',
      createDate: true,
      updateDate: true,
    },
  },
});
