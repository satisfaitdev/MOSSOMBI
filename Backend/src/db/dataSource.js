import 'reflect-metadata';
import dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from './entities/User.js';
import { RefreshToken } from './entities/RefreshToken.js';
import { Notification } from './entities/Notification.js';
import { UserSession } from './entities/UserSession.js';
import { AuditEvent } from './entities/AuditEvent.js';
import { UserBackpackItem } from './entities/UserBackpackItem.js';
import { Transaction } from './entities/Transaction.js';
import { UserWallet } from './entities/UserWallet.js';
import { TwoFactorCode } from './entities/TwoFactorCode.js';
import { PasswordResetToken } from './entities/PasswordResetToken.js';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL est requis dans les variables d\'environnement');
}

export const appDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  entities: [
    User,
    RefreshToken,
    Notification,
    UserSession,
    AuditEvent,
    UserBackpackItem,
    Transaction,
    UserWallet,
    TwoFactorCode,
    PasswordResetToken,
  ],
  synchronize: process.env.DB_SYNCHRONIZE === 'true' || process.env.NODE_ENV === 'development',
  logging: process.env.TYPEORM_LOGGING === 'true',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  extra: {
    options: '-c search_path=public',
  },
});

async function ensureUsersTableFields() {
  try {
    await appDataSource.query("ALTER TABLE public.users ADD COLUMN IF NOT EXISTS first_name text DEFAULT ''");
    await appDataSource.query("ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_name text DEFAULT ''");
    await appDataSource.query("ALTER TABLE public.users ADD COLUMN IF NOT EXISTS birth_date text DEFAULT NULL");
    await appDataSource.query("ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referral_code text DEFAULT ''");
    await appDataSource.query("ALTER TABLE public.users ADD COLUMN IF NOT EXISTS acquisition_source text DEFAULT ''");
    await appDataSource.query("ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url text DEFAULT ''");
    await appDataSource.query("ALTER TABLE public.users ADD COLUMN IF NOT EXISTS kyc_status text DEFAULT 'pending'");
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Error adding new fields to users table', e);
  }
}

async function ensureUserRoleColumn() {
  try {
    await appDataSource.query("ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role text DEFAULT 'user'");
    await appDataSource.query("UPDATE public.users SET role = 'user' WHERE role IS NULL OR role = ''");
    await appDataSource.query(
      "UPDATE public.users SET role = 'super_admin' WHERE is_super_admin = true AND (role IS NULL OR role = '' OR role = 'user')"
    );
  } catch {
    // ignore
  }
}

async function ensureTaxiTables() {
  const safeQuery = async (sql, { label = '', critical = false } = {}) => {
    try {
      await appDataSource.query(sql);
    } catch (e) {
      if (critical) {
        // eslint-disable-next-line no-console
        console.error('DB init query failed', {
          label,
          message: e?.message,
          code: e?.code,
        });
        throw e;
      }
    }
  };

  await safeQuery(`
    CREATE TABLE IF NOT EXISTS public.taxi_rides (
      id uuid PRIMARY KEY,
      service_id text NOT NULL DEFAULT 'taxi',
      client_user_id uuid NOT NULL,
      driver_user_id uuid NULL,
      status text NOT NULL DEFAULT 'requested',
      pickup_address text NOT NULL DEFAULT '',
      dropoff_address text NOT NULL DEFAULT '',
      pickup_lat numeric NULL,
      pickup_lng numeric NULL,
      dropoff_lat numeric NULL,
      dropoff_lng numeric NULL,
      scheduled_for timestamptz NULL,
      is_shared boolean NOT NULL DEFAULT false,
      options jsonb NOT NULL DEFAULT '{}'::jsonb,
      estimated_price numeric NULL,
      final_price numeric NULL,
      currency text NOT NULL DEFAULT 'XAF',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `, { label: 'create taxi_rides', critical: true });

  await safeQuery("ALTER TABLE public.taxi_rides ADD COLUMN IF NOT EXISTS service_id text NOT NULL DEFAULT 'taxi'");
  await safeQuery('ALTER TABLE public.taxi_rides ADD COLUMN IF NOT EXISTS client_user_id uuid');
  await safeQuery('ALTER TABLE public.taxi_rides ADD COLUMN IF NOT EXISTS driver_user_id uuid NULL');
  await safeQuery("ALTER TABLE public.taxi_rides ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'requested'");
  await safeQuery("ALTER TABLE public.taxi_rides ADD COLUMN IF NOT EXISTS pickup_address text NOT NULL DEFAULT ''");
  await safeQuery("ALTER TABLE public.taxi_rides ADD COLUMN IF NOT EXISTS dropoff_address text NOT NULL DEFAULT ''");
  await safeQuery('ALTER TABLE public.taxi_rides ADD COLUMN IF NOT EXISTS pickup_lat numeric NULL');
  await safeQuery('ALTER TABLE public.taxi_rides ADD COLUMN IF NOT EXISTS pickup_lng numeric NULL');
  await safeQuery('ALTER TABLE public.taxi_rides ADD COLUMN IF NOT EXISTS dropoff_lat numeric NULL');
  await safeQuery('ALTER TABLE public.taxi_rides ADD COLUMN IF NOT EXISTS dropoff_lng numeric NULL');
  await safeQuery('ALTER TABLE public.taxi_rides ADD COLUMN IF NOT EXISTS scheduled_for timestamptz NULL');
  await safeQuery('ALTER TABLE public.taxi_rides ADD COLUMN IF NOT EXISTS is_shared boolean NOT NULL DEFAULT false');
  await safeQuery("ALTER TABLE public.taxi_rides ADD COLUMN IF NOT EXISTS options jsonb NOT NULL DEFAULT '{}'::jsonb");
  await safeQuery('ALTER TABLE public.taxi_rides ADD COLUMN IF NOT EXISTS estimated_price numeric NULL');
  await safeQuery('ALTER TABLE public.taxi_rides ADD COLUMN IF NOT EXISTS final_price numeric NULL');
  await safeQuery("ALTER TABLE public.taxi_rides ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'XAF'");
  await safeQuery('ALTER TABLE public.taxi_rides ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now()');
  await safeQuery('ALTER TABLE public.taxi_rides ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()');

  await safeQuery('CREATE INDEX IF NOT EXISTS idx_taxi_rides_service ON public.taxi_rides(service_id)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_taxi_rides_status ON public.taxi_rides(status)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_taxi_rides_client ON public.taxi_rides(client_user_id)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_taxi_rides_driver ON public.taxi_rides(driver_user_id)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_taxi_rides_scheduled_for ON public.taxi_rides(scheduled_for)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_taxi_rides_created_at ON public.taxi_rides(created_at)');

  await safeQuery(`
    CREATE TABLE IF NOT EXISTS public.taxi_ride_events (
      id uuid PRIMARY KEY,
      ride_id uuid NOT NULL,
      type text NOT NULL,
      payload jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `, { label: 'create taxi_ride_events', critical: true });

  await safeQuery('ALTER TABLE public.taxi_ride_events ADD COLUMN IF NOT EXISTS ride_id uuid');
  await safeQuery('ALTER TABLE public.taxi_ride_events ADD COLUMN IF NOT EXISTS type text');
  await safeQuery("ALTER TABLE public.taxi_ride_events ADD COLUMN IF NOT EXISTS payload jsonb NOT NULL DEFAULT '{}'::jsonb");
  await safeQuery('ALTER TABLE public.taxi_ride_events ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now()');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_taxi_ride_events_ride ON public.taxi_ride_events(ride_id)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_taxi_ride_events_created ON public.taxi_ride_events(created_at)');

  await safeQuery(`
    CREATE TABLE IF NOT EXISTS public.taxi_plans (
      id uuid PRIMARY KEY,
      code text NOT NULL,
      name text NOT NULL DEFAULT '',
      price numeric NOT NULL DEFAULT 0,
      currency text NOT NULL DEFAULT 'XAF',
      rides_per_day integer NOT NULL DEFAULT 0,
      is_active boolean NOT NULL DEFAULT true,
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(code)
    )
  `, { label: 'create taxi_plans', critical: true });

  await safeQuery('ALTER TABLE public.taxi_plans ADD COLUMN IF NOT EXISTS code text');
  await safeQuery("ALTER TABLE public.taxi_plans ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT ''");
  await safeQuery('ALTER TABLE public.taxi_plans ADD COLUMN IF NOT EXISTS price numeric NOT NULL DEFAULT 0');
  await safeQuery("ALTER TABLE public.taxi_plans ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'XAF'");
  await safeQuery('ALTER TABLE public.taxi_plans ADD COLUMN IF NOT EXISTS rides_per_day integer NOT NULL DEFAULT 0');
  await safeQuery('ALTER TABLE public.taxi_plans ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true');
  await safeQuery("ALTER TABLE public.taxi_plans ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb");
  await safeQuery('ALTER TABLE public.taxi_plans ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now()');
  await safeQuery('ALTER TABLE public.taxi_plans ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_taxi_plans_active ON public.taxi_plans(is_active)');

  await safeQuery(`
    CREATE TABLE IF NOT EXISTS public.taxi_subscriptions (
      id uuid PRIMARY KEY,
      user_id uuid NOT NULL,
      plan_id uuid NOT NULL,
      status text NOT NULL DEFAULT 'active',
      current_period_start timestamptz NULL,
      current_period_end timestamptz NULL,
      rides_used_today integer NOT NULL DEFAULT 0,
      last_usage_day date NULL,
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `, { label: 'create taxi_subscriptions', critical: true });

  await safeQuery('ALTER TABLE public.taxi_subscriptions ADD COLUMN IF NOT EXISTS user_id uuid');
  await safeQuery('ALTER TABLE public.taxi_subscriptions ADD COLUMN IF NOT EXISTS plan_id uuid');
  await safeQuery("ALTER TABLE public.taxi_subscriptions ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'");
  await safeQuery('ALTER TABLE public.taxi_subscriptions ADD COLUMN IF NOT EXISTS current_period_start timestamptz NULL');
  await safeQuery('ALTER TABLE public.taxi_subscriptions ADD COLUMN IF NOT EXISTS current_period_end timestamptz NULL');
  await safeQuery('ALTER TABLE public.taxi_subscriptions ADD COLUMN IF NOT EXISTS rides_used_today integer NOT NULL DEFAULT 0');
  await safeQuery('ALTER TABLE public.taxi_subscriptions ADD COLUMN IF NOT EXISTS last_usage_day date NULL');
  await safeQuery("ALTER TABLE public.taxi_subscriptions ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb");
  await safeQuery('ALTER TABLE public.taxi_subscriptions ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now()');
  await safeQuery('ALTER TABLE public.taxi_subscriptions ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_taxi_subscriptions_user ON public.taxi_subscriptions(user_id)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_taxi_subscriptions_status ON public.taxi_subscriptions(status)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_taxi_subscriptions_period_end ON public.taxi_subscriptions(current_period_end)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_taxi_subscriptions_last_usage_day ON public.taxi_subscriptions(last_usage_day)');
}

async function ensureAgenciesTables() {
  const safeQuery = async (sql, { label = '', critical = false } = {}) => {
    try {
      await appDataSource.query(sql);
    } catch (e) {
      if (critical) {
        // eslint-disable-next-line no-console
        console.error('DB init query failed', {
          label,
          message: e?.message,
          code: e?.code,
        });
        throw e;
      }
    }
  };

  await safeQuery('CREATE EXTENSION IF NOT EXISTS pgcrypto');
  await safeQuery('CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public', {
    label: 'create extension postgis',
    critical: true,
  });

  await safeQuery(`
      CREATE TABLE IF NOT EXISTS public.agencies (
        id uuid PRIMARY KEY,
        name text NOT NULL,
        city text NOT NULL DEFAULT '',
        address text NOT NULL DEFAULT '',
        logo_url text NOT NULL DEFAULT '',
        owner_user_id uuid NULL,
        status text NOT NULL DEFAULT 'pending',
        is_active boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

  await safeQuery("ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS city text NOT NULL DEFAULT ''");
  await safeQuery("ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS address text NOT NULL DEFAULT ''");
  await safeQuery("ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS logo_url text NOT NULL DEFAULT ''");
  await safeQuery('ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS owner_user_id uuid NULL');
  await safeQuery("ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'");
  await safeQuery('ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT false');
  await safeQuery('ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now()');
  await safeQuery('ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()');

  await safeQuery('CREATE INDEX IF NOT EXISTS idx_agencies_status ON public.agencies(status)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_agencies_active ON public.agencies(is_active)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_agencies_owner ON public.agencies(owner_user_id)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_agencies_city ON public.agencies(city)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_agencies_name ON public.agencies(name)');
  await safeQuery('CREATE UNIQUE INDEX IF NOT EXISTS idx_agencies_owner_unique ON public.agencies(owner_user_id) WHERE owner_user_id IS NOT NULL');

  await safeQuery(`
      CREATE TABLE IF NOT EXISTS public.agency_memberships (
        id uuid PRIMARY KEY,
        agency_id uuid NOT NULL,
        user_id uuid NOT NULL,
        role_in_agency text NOT NULL DEFAULT 'host',
        status text NOT NULL DEFAULT 'pending',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(agency_id, user_id)
      )
    `);

  await safeQuery('CREATE INDEX IF NOT EXISTS idx_agency_memberships_agency ON public.agency_memberships(agency_id)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_agency_memberships_user ON public.agency_memberships(user_id)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_agency_memberships_status ON public.agency_memberships(status)');

  await safeQuery(`
      CREATE TABLE IF NOT EXISTS public.agency_service_requests (
        id uuid PRIMARY KEY,
        agency_id uuid NOT NULL,
        requested_by_user_id uuid NOT NULL,
        service_id text NOT NULL,
        payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
        status text NOT NULL DEFAULT 'pending',
        admin_notes text NOT NULL DEFAULT '',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

  await safeQuery('ALTER TABLE public.agency_service_requests ADD COLUMN IF NOT EXISTS agency_id uuid');
  await safeQuery('ALTER TABLE public.agency_service_requests ADD COLUMN IF NOT EXISTS requested_by_user_id uuid');
  await safeQuery('ALTER TABLE public.agency_service_requests ADD COLUMN IF NOT EXISTS service_id text');
  await safeQuery("ALTER TABLE public.agency_service_requests ADD COLUMN IF NOT EXISTS payload_json jsonb NOT NULL DEFAULT '{}'::jsonb");
  await safeQuery("ALTER TABLE public.agency_service_requests ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'");
  await safeQuery("ALTER TABLE public.agency_service_requests ADD COLUMN IF NOT EXISTS admin_notes text NOT NULL DEFAULT ''");
  await safeQuery('ALTER TABLE public.agency_service_requests ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now()');
  await safeQuery('ALTER TABLE public.agency_service_requests ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()');

  await safeQuery('CREATE INDEX IF NOT EXISTS idx_agency_service_requests_agency ON public.agency_service_requests(agency_id)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_agency_service_requests_status ON public.agency_service_requests(status)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_agency_service_requests_service ON public.agency_service_requests(service_id)');

  await safeQuery(`
      CREATE TABLE IF NOT EXISTS public.agency_documents (
        id uuid PRIMARY KEY,
        agency_id uuid NOT NULL,
        user_id uuid NOT NULL,
        service_id text NOT NULL DEFAULT '',
        doc_type text NOT NULL DEFAULT '',
        file_url text NOT NULL DEFAULT '',
        status text NOT NULL DEFAULT 'pending',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

  await safeQuery('ALTER TABLE public.agency_documents ADD COLUMN IF NOT EXISTS agency_id uuid');
  await safeQuery('ALTER TABLE public.agency_documents ADD COLUMN IF NOT EXISTS user_id uuid');
  await safeQuery('ALTER TABLE public.agency_documents ADD COLUMN IF NOT EXISTS service_id text');
  await safeQuery('ALTER TABLE public.agency_documents ADD COLUMN IF NOT EXISTS doc_type text');
  await safeQuery('ALTER TABLE public.agency_documents ADD COLUMN IF NOT EXISTS file_url text');
  await safeQuery("ALTER TABLE public.agency_documents ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'");
  await safeQuery('ALTER TABLE public.agency_documents ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now()');
  await safeQuery('ALTER TABLE public.agency_documents ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()');

  await safeQuery('CREATE INDEX IF NOT EXISTS idx_agency_documents_agency ON public.agency_documents(agency_id)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_agency_documents_user ON public.agency_documents(user_id)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_agency_documents_status ON public.agency_documents(status)');

  await safeQuery(`
      CREATE TABLE IF NOT EXISTS public.agency_invites (
        id uuid PRIMARY KEY,
        agency_id uuid NOT NULL,
        created_by_user_id uuid NOT NULL,
        code text NOT NULL,
        role_in_agency text NOT NULL DEFAULT 'sub_agent',
        max_uses integer NOT NULL DEFAULT 1,
        used_count integer NOT NULL DEFAULT 0,
        expires_at timestamptz NULL,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(code)
      )
    `);

  await safeQuery('ALTER TABLE public.agency_invites ADD COLUMN IF NOT EXISTS agency_id uuid');
  await safeQuery('ALTER TABLE public.agency_invites ADD COLUMN IF NOT EXISTS created_by_user_id uuid');
  await safeQuery('ALTER TABLE public.agency_invites ADD COLUMN IF NOT EXISTS code text');
  await safeQuery("ALTER TABLE public.agency_invites ADD COLUMN IF NOT EXISTS role_in_agency text NOT NULL DEFAULT 'sub_agent'");
  await safeQuery('ALTER TABLE public.agency_invites ADD COLUMN IF NOT EXISTS max_uses integer NOT NULL DEFAULT 1');
  await safeQuery('ALTER TABLE public.agency_invites ADD COLUMN IF NOT EXISTS used_count integer NOT NULL DEFAULT 0');
  await safeQuery('ALTER TABLE public.agency_invites ADD COLUMN IF NOT EXISTS expires_at timestamptz NULL');
  await safeQuery('ALTER TABLE public.agency_invites ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true');
  await safeQuery('ALTER TABLE public.agency_invites ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now()');
  await safeQuery('ALTER TABLE public.agency_invites ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()');

  await safeQuery('CREATE INDEX IF NOT EXISTS idx_agency_invites_agency ON public.agency_invites(agency_id)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_agency_invites_code ON public.agency_invites(code)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_agency_invites_active ON public.agency_invites(is_active)');

  await safeQuery(`
      CREATE TABLE IF NOT EXISTS public.commission_rules (
        id uuid PRIMARY KEY,
        service_id text NOT NULL,
        context text NOT NULL,
        app_pct numeric NOT NULL DEFAULT 0,
        worker_pct numeric NOT NULL DEFAULT 0,
        upline_pct numeric NOT NULL DEFAULT 0,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(service_id, context)
      )
    `);

  await safeQuery('CREATE INDEX IF NOT EXISTS idx_commission_rules_context ON public.commission_rules(context)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_commission_rules_active ON public.commission_rules(is_active)');

  // Marketplace (Articles)
  await safeQuery(`
    CREATE TABLE IF NOT EXISTS public.agency_articles (
      id uuid PRIMARY KEY,
      agency_id uuid NOT NULL,
      created_by_user_id uuid NOT NULL,
      name text NOT NULL,
      description text,
      price numeric NOT NULL,
      in_stock boolean NOT NULL DEFAULT true,
      country text NOT NULL DEFAULT 'RD Congo',
      delivery_time text NOT NULL DEFAULT '24-48h',
      status text NOT NULL DEFAULT 'active',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_agency_articles_agency ON public.agency_articles(agency_id)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_agency_articles_status ON public.agency_articles(status)');
  await safeQuery("ALTER TABLE public.agency_articles ADD COLUMN IF NOT EXISTS image_url text NOT NULL DEFAULT ''");
  await safeQuery("ALTER TABLE public.agency_articles ADD COLUMN IF NOT EXISTS shipping_unit text NOT NULL DEFAULT 'kg'");
  await safeQuery("ALTER TABLE public.agency_articles ADD COLUMN IF NOT EXISTS shipping_value numeric NOT NULL DEFAULT 0");

  // Billetterie (Tickets)
  await safeQuery(`
    CREATE TABLE IF NOT EXISTS public.agency_tickets (
      id uuid PRIMARY KEY,
      agency_id uuid NOT NULL,
      created_by_user_id uuid NOT NULL,
      event_name text NOT NULL,
      event_date timestamptz NULL,
      venue text,
      ticket_type text NOT NULL DEFAULT 'standard',
      price numeric NOT NULL,
      quantity_total integer NOT NULL DEFAULT 0,
      quantity_sold integer NOT NULL DEFAULT 0,
      status text NOT NULL DEFAULT 'active',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_agency_tickets_agency ON public.agency_tickets(agency_id)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_agency_tickets_status ON public.agency_tickets(status)');

  // Ventes unifiées (Store, Billetterie, Taxi/Coursier, Voyages, Covoiturage)
  await safeQuery(`
    CREATE TABLE IF NOT EXISTS public.agency_sales (
      id uuid PRIMARY KEY,
      agency_id uuid NOT NULL,
      service_id text NOT NULL,
      amount numeric NOT NULL DEFAULT 0,
      currency text NOT NULL DEFAULT 'CDF',
      client_user_id uuid NULL,
      client_name text NOT NULL DEFAULT '',
      client_phone text NOT NULL DEFAULT '',
      sold_by_user_id uuid NOT NULL,
      reference_type text NOT NULL DEFAULT '',
      reference_id text NOT NULL DEFAULT '',
      commission_amount numeric NULL,
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  await safeQuery('ALTER TABLE public.agency_sales ADD COLUMN IF NOT EXISTS agency_id uuid');
  await safeQuery('ALTER TABLE public.agency_sales ADD COLUMN IF NOT EXISTS service_id text');
  await safeQuery('ALTER TABLE public.agency_sales ADD COLUMN IF NOT EXISTS amount numeric NOT NULL DEFAULT 0');
  await safeQuery("ALTER TABLE public.agency_sales ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'CDF'");
  await safeQuery('ALTER TABLE public.agency_sales ADD COLUMN IF NOT EXISTS client_user_id uuid NULL');
  await safeQuery("ALTER TABLE public.agency_sales ADD COLUMN IF NOT EXISTS client_name text NOT NULL DEFAULT ''");
  await safeQuery("ALTER TABLE public.agency_sales ADD COLUMN IF NOT EXISTS client_phone text NOT NULL DEFAULT ''");
  await safeQuery('ALTER TABLE public.agency_sales ADD COLUMN IF NOT EXISTS sold_by_user_id uuid');
  await safeQuery("ALTER TABLE public.agency_sales ADD COLUMN IF NOT EXISTS reference_type text NOT NULL DEFAULT ''");
  await safeQuery("ALTER TABLE public.agency_sales ADD COLUMN IF NOT EXISTS reference_id text NOT NULL DEFAULT ''");
  await safeQuery('ALTER TABLE public.agency_sales ADD COLUMN IF NOT EXISTS commission_amount numeric NULL');
  await safeQuery("ALTER TABLE public.agency_sales ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb");
  await safeQuery('ALTER TABLE public.agency_sales ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now()');
  await safeQuery('ALTER TABLE public.agency_sales ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()');

  await safeQuery('CREATE INDEX IF NOT EXISTS idx_agency_sales_agency ON public.agency_sales(agency_id)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_agency_sales_service ON public.agency_sales(service_id)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_agency_sales_created ON public.agency_sales(created_at)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_agency_sales_sold_by ON public.agency_sales(sold_by_user_id)');

  // Live location streaming (Taxi/Coursier)
  await safeQuery(`
    CREATE TABLE IF NOT EXISTS public.live_locations (
      user_id uuid PRIMARY KEY,
      service_id text NOT NULL,
      city text NOT NULL DEFAULT '',
      is_visible boolean NOT NULL DEFAULT true,
      is_busy boolean NOT NULL DEFAULT false,
      location geography(Point, 4326) NOT NULL,
      heading numeric NULL,
      speed numeric NULL,
      accuracy numeric NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `, { label: 'create live_locations', critical: true });

  await safeQuery('ALTER TABLE public.live_locations ADD COLUMN IF NOT EXISTS service_id text', {
    label: 'alter live_locations service_id',
    critical: true,
  });
  await safeQuery("ALTER TABLE public.live_locations ADD COLUMN IF NOT EXISTS city text NOT NULL DEFAULT ''", {
    label: 'alter live_locations city',
    critical: true,
  });
  await safeQuery('ALTER TABLE public.live_locations ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true', {
    label: 'alter live_locations is_visible',
    critical: true,
  });
  await safeQuery('ALTER TABLE public.live_locations ADD COLUMN IF NOT EXISTS is_busy boolean NOT NULL DEFAULT false', {
    label: 'alter live_locations is_busy',
    critical: true,
  });
  await safeQuery('ALTER TABLE public.live_locations ADD COLUMN IF NOT EXISTS location geography(Point, 4326)', {
    label: 'alter live_locations location',
    critical: true,
  });
  await safeQuery('ALTER TABLE public.live_locations ADD COLUMN IF NOT EXISTS heading numeric NULL', {
    label: 'alter live_locations heading',
    critical: true,
  });
  await safeQuery('ALTER TABLE public.live_locations ADD COLUMN IF NOT EXISTS speed numeric NULL', {
    label: 'alter live_locations speed',
    critical: true,
  });
  await safeQuery('ALTER TABLE public.live_locations ADD COLUMN IF NOT EXISTS accuracy numeric NULL', {
    label: 'alter live_locations accuracy',
    critical: true,
  });
  await safeQuery('ALTER TABLE public.live_locations ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now()', {
    label: 'alter live_locations created_at',
    critical: true,
  });
  await safeQuery('ALTER TABLE public.live_locations ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()', {
    label: 'alter live_locations updated_at',
    critical: true,
  });

  await safeQuery('CREATE INDEX IF NOT EXISTS idx_live_locations_service ON public.live_locations(service_id)', {
    label: 'index live_locations service',
    critical: true,
  });
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_live_locations_city ON public.live_locations(city)', {
    label: 'index live_locations city',
    critical: true,
  });
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_live_locations_updated ON public.live_locations(updated_at)', {
    label: 'index live_locations updated',
    critical: true,
  });
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_live_locations_location_gist ON public.live_locations USING GIST (location)', {
    label: 'index live_locations location gist',
    critical: true,
  });
}

async function ensureAdsTable() {
  try {
    await appDataSource.query(`
      CREATE TABLE IF NOT EXISTS public.ads (
        id uuid PRIMARY KEY,
        type text NOT NULL,
        title text NOT NULL DEFAULT '',
        link_url text NOT NULL DEFAULT '',
        image_url text NOT NULL DEFAULT '',
        target_cities text[] NOT NULL DEFAULT '{}',
        starts_at timestamptz NULL,
        ends_at timestamptz NULL,
        priority integer NOT NULL DEFAULT 0,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await appDataSource.query("ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS target_cities text[] NOT NULL DEFAULT '{}'");
    await appDataSource.query("CREATE INDEX IF NOT EXISTS idx_ads_type ON public.ads(type)");
    await appDataSource.query("CREATE INDEX IF NOT EXISTS idx_ads_active ON public.ads(is_active)");
    await appDataSource.query("CREATE INDEX IF NOT EXISTS idx_ads_priority ON public.ads(priority)");
  } catch {
    // ignore
  }
}

async function ensureStoreLogisticsTables() {
  const safeQuery = async (sql) => {
    try {
      await appDataSource.query(sql);
    } catch (e) {
      console.error('ensureStoreLogisticsTables query failed:', e.message);
    }
  };

  // Paramètres globaux dynamiques (tarifs de livraison, etc.)
  await safeQuery(`
    CREATE TABLE IF NOT EXISTS public.app_settings (
      key text PRIMARY KEY,
      value jsonb NOT NULL DEFAULT '{}'::jsonb,
      description text NOT NULL DEFAULT '',
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  // Logistique de livraison Store
  await safeQuery(`
    CREATE TABLE IF NOT EXISTS public.deliveries (
      id uuid PRIMARY KEY,
      sale_id uuid NOT NULL,
      driver_user_id uuid NULL,
      status text NOT NULL DEFAULT 'pending_assignment',
      pickup_lat numeric NULL,
      pickup_lng numeric NULL,
      dropoff_lat numeric NULL,
      dropoff_lng numeric NULL,
      tracking_history jsonb NOT NULL DEFAULT '[]'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_deliveries_sale ON public.deliveries(sale_id)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_deliveries_driver ON public.deliveries(driver_user_id)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_deliveries_status ON public.deliveries(status)');

  // Litiges
  await safeQuery(`
    CREATE TABLE IF NOT EXISTS public.disputes (
      id uuid PRIMARY KEY,
      sale_id uuid NOT NULL,
      complainant_user_id uuid NOT NULL,
      reason text NOT NULL,
      status text NOT NULL DEFAULT 'open',
      admin_notes text NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_disputes_sale ON public.disputes(sale_id)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_disputes_status ON public.disputes(status)');
}

export async function initDatabase() {
  if (appDataSource.isInitialized) return appDataSource;
  await appDataSource.initialize();
  await ensureUserRoleColumn();
  await ensureUsersTableFields();
  await ensureAdsTable();
  await ensureAgenciesTables();
  await ensureTaxiTables();
  await ensureStoreLogisticsTables();
  return appDataSource;
}
