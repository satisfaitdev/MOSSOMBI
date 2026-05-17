import { EntitySchema } from 'typeorm';

export const AgencyArticle = new EntitySchema({
  name: 'agency_articles',
  tableName: 'agency_articles',
  columns: {
    id: { type: 'uuid', primary: true },
    agency_id: { type: 'uuid' },
    name: { type: 'text' },
    description: { type: 'text', nullable: true },
    price: { type: 'numeric', precision: 15, scale: 2 },
    in_stock: { type: 'boolean', default: true },
    country: { type: 'text', nullable: true },
    delivery_time: { type: 'text', nullable: true },
    status: { type: 'text', default: 'active' },
    shipping_unit: { type: 'text', nullable: true },
    shipping_value: { type: 'numeric', precision: 15, scale: 2, nullable: true },
    metadata: { type: 'jsonb', nullable: true },
    created_at: { type: 'timestamptz', createDate: true },
    updated_at: { type: 'timestamptz', updateDate: true },
  },
});
