import { EntitySchema } from 'typeorm';

export const AgencySale = new EntitySchema({
  name: 'agency_sales',
  tableName: 'agency_sales',
  columns: {
    id: { type: 'uuid', primary: true },
    agency_id: { type: 'uuid' },
    service_id: { type: 'text', default: 'store' },
    amount: { type: 'numeric', precision: 15, scale: 2 },
    currency: { type: 'text', default: 'XAF' },
    client_user_id: { type: 'uuid', nullable: true },
    client_name: { type: 'text', nullable: true },
    client_phone: { type: 'text', nullable: true },
    sold_by_user_id: { type: 'uuid', nullable: true },
    reference_type: { type: 'text', nullable: true },
    reference_id: { type: 'uuid', nullable: true },
    commission_amount: { type: 'numeric', precision: 15, scale: 2, nullable: true },
    metadata: { type: 'jsonb', nullable: true },
    created_at: { type: 'timestamptz', createDate: true },
    updated_at: { type: 'timestamptz', updateDate: true },
  },
});
