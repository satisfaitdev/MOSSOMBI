import 'reflect-metadata';
import crypto from 'crypto';
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
import { AppSettings } from './entities/AppSettings.js';
import { AgencyArticle } from './entities/AgencyArticle.js';
import { AgencySale } from './entities/AgencySale.js';

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
    AppSettings,
    AgencyArticle,
    AgencySale,
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

  // Seed default plans if empty
  try {
    const [{ count }] = await appDataSource.query('SELECT COUNT(*) AS count FROM public.taxi_plans');
    if (Number(count) === 0) {
      const now = new Date().toISOString();
      const defaultPlans = [
        { id: crypto.randomUUID(), code: 'weekly_1', name: '1 Trajet / Jour (Semaine)', price: 7000, rides_per_day: 1, metadata: { duration_days: 7 } },
        { id: crypto.randomUUID(), code: 'weekly_2', name: 'Aller/Retour (Semaine)', price: 12000, rides_per_day: 2, metadata: { duration_days: 7 } },
        { id: crypto.randomUUID(), code: 'weekly_unlimited', name: 'Illimité (Semaine)', price: 18000, rides_per_day: 0, metadata: { duration_days: 7, unlimited: true } },
        { id: crypto.randomUUID(), code: 'monthly_1', name: '1 Trajet / Jour (Mois)', price: 25000, rides_per_day: 1, metadata: { duration_days: 30 } },
        { id: crypto.randomUUID(), code: 'monthly_2', name: 'Aller/Retour (Mois)', price: 40000, rides_per_day: 2, metadata: { duration_days: 30 } },
        { id: crypto.randomUUID(), code: 'monthly_unlimited', name: 'Illimité (Mois)', price: 60000, rides_per_day: 0, metadata: { duration_days: 30, unlimited: true } },
      ];
      for (const p of defaultPlans) {
        await appDataSource.query(`
          INSERT INTO public.taxi_plans (id, code, name, price, currency, rides_per_day, is_active, metadata, created_at, updated_at)
          VALUES ($1, $2, $3, $4, 'XAF', $5, true, $6, $7, $7)
        `, [p.id, p.code, p.name, p.price, p.rides_per_day, JSON.stringify(p.metadata), now]);
      }
    }
  } catch { /* ignore */ }
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
        latitude numeric NULL,
        longitude numeric NULL,
        use_internal_fleet_only boolean NOT NULL DEFAULT false,
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
  await safeQuery('ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS latitude numeric NULL');
  await safeQuery('ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS longitude numeric NULL');
  await safeQuery('ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS use_internal_fleet_only boolean NOT NULL DEFAULT false');
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
      CREATE TABLE IF NOT EXISTS public.agent_profiles (
        id uuid PRIMARY KEY,
        user_id uuid NOT NULL UNIQUE,
        agent_type text NOT NULL DEFAULT 'independant',
        service_ids text[] NOT NULL DEFAULT '{}',
        is_online boolean NOT NULL DEFAULT true,
        latitude numeric NULL,
        longitude numeric NULL,
        description text NOT NULL DEFAULT '',
        phone_visible boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

  await safeQuery('ALTER TABLE public.agent_profiles ADD COLUMN IF NOT EXISTS user_id uuid');
  await safeQuery("ALTER TABLE public.agent_profiles ADD COLUMN IF NOT EXISTS agent_type text NOT NULL DEFAULT 'independant'");
  await safeQuery("ALTER TABLE public.agent_profiles ADD COLUMN IF NOT EXISTS service_ids text[] NOT NULL DEFAULT '{}'");
  await safeQuery('ALTER TABLE public.agent_profiles ADD COLUMN IF NOT EXISTS is_online boolean NOT NULL DEFAULT true');
  await safeQuery('ALTER TABLE public.agent_profiles ADD COLUMN IF NOT EXISTS latitude numeric NULL');
  await safeQuery('ALTER TABLE public.agent_profiles ADD COLUMN IF NOT EXISTS longitude numeric NULL');
  await safeQuery("ALTER TABLE public.agent_profiles ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT ''");
  await safeQuery('ALTER TABLE public.agent_profiles ADD COLUMN IF NOT EXISTS phone_visible boolean NOT NULL DEFAULT true');
  await safeQuery('ALTER TABLE public.agent_profiles ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now()');
  await safeQuery('ALTER TABLE public.agent_profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_agent_profiles_user ON public.agent_profiles(user_id)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_agent_profiles_online ON public.agent_profiles(is_online)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_agent_profiles_type ON public.agent_profiles(agent_type)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_agent_profiles_services ON public.agent_profiles USING GIN (service_ids)');

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
      currency text NOT NULL DEFAULT 'XAF',
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
  await safeQuery("ALTER TABLE public.agency_sales ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'XAF'");
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

async function ensureFintechTables() {
  const safeQuery = async (sql, { label = '', critical = false } = {}) => {
    try {
      await appDataSource.query(sql);
    } catch (e) {
      if (critical) {
        console.error('DB init query failed', { label, message: e?.message, code: e?.code });
        throw e;
      }
    }
  };

  await safeQuery(`
    CREATE TABLE IF NOT EXISTS public.bill_payments (
      id uuid PRIMARY KEY,
      user_id uuid NOT NULL,
      provider text NOT NULL,
      amount numeric NOT NULL DEFAULT 0,
      reference text NOT NULL DEFAULT '',
      status text NOT NULL DEFAULT 'pending',
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `, { label: 'create bill_payments', critical: true });
  await safeQuery('ALTER TABLE public.bill_payments ADD COLUMN IF NOT EXISTS user_id uuid');
  await safeQuery('ALTER TABLE public.bill_payments ADD COLUMN IF NOT EXISTS provider text');
  await safeQuery('ALTER TABLE public.bill_payments ADD COLUMN IF NOT EXISTS amount numeric NOT NULL DEFAULT 0');
  await safeQuery('ALTER TABLE public.bill_payments ADD COLUMN IF NOT EXISTS reference text');
  await safeQuery("ALTER TABLE public.bill_payments ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'");
  await safeQuery('ALTER TABLE public.bill_payments ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now()');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_bill_payments_user ON public.bill_payments(user_id)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_bill_payments_status ON public.bill_payments(status)');

  await safeQuery(`
    CREATE TABLE IF NOT EXISTS public.savings_accounts (
      id uuid PRIMARY KEY,
      user_id uuid NOT NULL,
      balance numeric NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `, { label: 'create savings_accounts', critical: true });
  await safeQuery('ALTER TABLE public.savings_accounts ADD COLUMN IF NOT EXISTS user_id uuid');
  await safeQuery('ALTER TABLE public.savings_accounts ADD COLUMN IF NOT EXISTS balance numeric NOT NULL DEFAULT 0');
  await safeQuery('ALTER TABLE public.savings_accounts ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now()');
  await safeQuery('CREATE UNIQUE INDEX IF NOT EXISTS idx_savings_accounts_user ON public.savings_accounts(user_id)');

  await safeQuery(`
    CREATE TABLE IF NOT EXISTS public.savings_goals (
      id uuid PRIMARY KEY,
      user_id uuid NOT NULL,
      name text NOT NULL,
      target_amount numeric NOT NULL DEFAULT 0,
      current_amount numeric NOT NULL DEFAULT 0,
      deadline timestamptz NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `, { label: 'create savings_goals', critical: true });
  await safeQuery('ALTER TABLE public.savings_goals ADD COLUMN IF NOT EXISTS user_id uuid');
  await safeQuery('ALTER TABLE public.savings_goals ADD COLUMN IF NOT EXISTS name text');
  await safeQuery('ALTER TABLE public.savings_goals ADD COLUMN IF NOT EXISTS target_amount numeric NOT NULL DEFAULT 0');
  await safeQuery('ALTER TABLE public.savings_goals ADD COLUMN IF NOT EXISTS current_amount numeric NOT NULL DEFAULT 0');
  await safeQuery('ALTER TABLE public.savings_goals ADD COLUMN IF NOT EXISTS deadline timestamptz NULL');
  await safeQuery('ALTER TABLE public.savings_goals ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now()');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_savings_goals_user ON public.savings_goals(user_id)');

  await safeQuery(`
    CREATE TABLE IF NOT EXISTS public.savings_transactions (
      id uuid PRIMARY KEY,
      savings_id uuid NOT NULL,
      type text NOT NULL,
      amount numeric NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `, { label: 'create savings_transactions', critical: true });
  await safeQuery('ALTER TABLE public.savings_transactions ADD COLUMN IF NOT EXISTS savings_id uuid');
  await safeQuery('ALTER TABLE public.savings_transactions ADD COLUMN IF NOT EXISTS type text');
  await safeQuery('ALTER TABLE public.savings_transactions ADD COLUMN IF NOT EXISTS amount numeric NOT NULL DEFAULT 0');
  await safeQuery('ALTER TABLE public.savings_transactions ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now()');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_savings_transactions_savings ON public.savings_transactions(savings_id)');

  await safeQuery(`
    CREATE TABLE IF NOT EXISTS public.virtual_cards (
      id uuid PRIMARY KEY,
      user_id uuid NOT NULL,
      card_number_mask text NOT NULL DEFAULT '',
      brand text NOT NULL DEFAULT 'VISA',
      status text NOT NULL DEFAULT 'active',
      label text NOT NULL DEFAULT 'Ma Carte',
      expiry text NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `, { label: 'create virtual_cards', critical: true });
  await safeQuery('ALTER TABLE public.virtual_cards ADD COLUMN IF NOT EXISTS user_id uuid');
  await safeQuery("ALTER TABLE public.virtual_cards ADD COLUMN IF NOT EXISTS card_number_mask text NOT NULL DEFAULT ''");
  await safeQuery("ALTER TABLE public.virtual_cards ADD COLUMN IF NOT EXISTS brand text NOT NULL DEFAULT 'VISA'");
  await safeQuery("ALTER TABLE public.virtual_cards ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'");
  await safeQuery("ALTER TABLE public.virtual_cards ADD COLUMN IF NOT EXISTS label text NOT NULL DEFAULT 'Ma Carte'");
  await safeQuery("ALTER TABLE public.virtual_cards ADD COLUMN IF NOT EXISTS expiry text NOT NULL DEFAULT ''");
  await safeQuery('ALTER TABLE public.virtual_cards ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now()');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_virtual_cards_user ON public.virtual_cards(user_id)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_virtual_cards_status ON public.virtual_cards(status)');

  await safeQuery(`
    CREATE TABLE IF NOT EXISTS public.agent_cash_ins (
      id uuid PRIMARY KEY,
      agent_user_id uuid NOT NULL,
      client_user_id uuid NULL,
      client_phone text NOT NULL DEFAULT '',
      amount numeric NOT NULL DEFAULT 0,
      commission numeric NOT NULL DEFAULT 0,
      status text NOT NULL DEFAULT 'completed',
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `, { label: 'create agent_cash_ins', critical: true });
  await safeQuery('ALTER TABLE public.agent_cash_ins ADD COLUMN IF NOT EXISTS agent_user_id uuid');
  await safeQuery('ALTER TABLE public.agent_cash_ins ADD COLUMN IF NOT EXISTS client_user_id uuid NULL');
  await safeQuery("ALTER TABLE public.agent_cash_ins ADD COLUMN IF NOT EXISTS client_phone text NOT NULL DEFAULT ''");
  await safeQuery('ALTER TABLE public.agent_cash_ins ADD COLUMN IF NOT EXISTS amount numeric NOT NULL DEFAULT 0');
  await safeQuery('ALTER TABLE public.agent_cash_ins ADD COLUMN IF NOT EXISTS commission numeric NOT NULL DEFAULT 0');
  await safeQuery("ALTER TABLE public.agent_cash_ins ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'completed'");
  await safeQuery('ALTER TABLE public.agent_cash_ins ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now()');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_agent_cash_ins_agent ON public.agent_cash_ins(agent_user_id)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_agent_cash_ins_client ON public.agent_cash_ins(client_user_id)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_agent_cash_ins_created ON public.agent_cash_ins(created_at)');
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
      updated_at timestamptz NOT NULL DEFAULT now(),
      voice_note_url text NULL
    )
  `);
  await safeQuery('ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS voice_note_url text NULL');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_deliveries_sale ON public.deliveries(sale_id)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_deliveries_driver ON public.deliveries(driver_user_id)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_deliveries_status ON public.deliveries(status)');
  await safeQuery('ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS voice_note_url text NULL');

  // Zones de livraison géofencing
  await safeQuery(`
    CREATE TABLE IF NOT EXISTS public.logistics_zones (
      id uuid PRIMARY KEY,
      agency_id uuid NULL,
      name text NOT NULL,
      city text NOT NULL,
      boundary geometry(Polygon, 4326) NOT NULL,
      base_fee numeric NOT NULL DEFAULT 0,
      multiplier numeric NOT NULL DEFAULT 1,
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_logistics_zones_boundary ON public.logistics_zones USING GIST (boundary)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_logistics_zones_city ON public.logistics_zones(city)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_logistics_zones_active ON public.logistics_zones(is_active)');

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

async function ensureSmartCityTables() {
  const safeQuery = async (sql) => {
    try {
      await appDataSource.query(sql);
    } catch (e) {
      console.error('ensureSmartCityTables query failed:', e.message);
    }
  };

  await safeQuery(`
    CREATE TABLE IF NOT EXISTS public.property_listings (
      id uuid PRIMARY KEY,
      agent_id uuid NOT NULL,
      type text NOT NULL,
      transaction text NOT NULL,
      title text NOT NULL,
      description text NOT NULL DEFAULT '',
      price numeric NOT NULL DEFAULT 0,
      city text NOT NULL DEFAULT '',
      address text NOT NULL DEFAULT '',
      lat numeric NULL,
      lng numeric NULL,
      surface numeric NULL,
      rooms integer DEFAULT 0,
      bedrooms integer DEFAULT 0,
      bathrooms integer DEFAULT 0,
      images jsonb NOT NULL DEFAULT '[]'::jsonb,
      status text NOT NULL DEFAULT 'active',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_property_listings_status ON public.property_listings(status)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_property_listings_city ON public.property_listings(city)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_property_listings_type ON public.property_listings(type)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_property_listings_agent ON public.property_listings(agent_id)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_property_listings_transaction ON public.property_listings(transaction)');

  await safeQuery(`
    CREATE TABLE IF NOT EXISTS public.property_contacts (
      id uuid PRIMARY KEY,
      listing_id uuid NOT NULL,
      user_id uuid NOT NULL,
      agent_id uuid NOT NULL,
      message text NOT NULL DEFAULT '',
      name text NOT NULL DEFAULT '',
      phone text NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_property_contacts_listing ON public.property_contacts(listing_id)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_property_contacts_agent ON public.property_contacts(agent_id)');

  await safeQuery(`
    CREATE TABLE IF NOT EXISTS public.moving_requests (
      id uuid PRIMARY KEY,
      user_id uuid NOT NULL,
      from_address text NOT NULL DEFAULT '',
      to_address text NOT NULL DEFAULT '',
      date timestamptz NULL,
      volume_estimate text NOT NULL DEFAULT '',
      notes text NOT NULL DEFAULT '',
      status text NOT NULL DEFAULT 'pending',
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_moving_requests_user ON public.moving_requests(user_id)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_moving_requests_status ON public.moving_requests(status)');

  await safeQuery(`
    CREATE TABLE IF NOT EXISTS public.delivery_orders (
      id uuid PRIMARY KEY,
      user_id uuid NOT NULL,
      type text NOT NULL,
      pickup_address text NOT NULL DEFAULT '',
      dropoff_address text NOT NULL DEFAULT '',
      pickup_lat numeric NULL,
      pickup_lng numeric NULL,
      dropoff_lat numeric NULL,
      dropoff_lng numeric NULL,
      description text NOT NULL DEFAULT '',
      status text NOT NULL DEFAULT 'pending',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_delivery_orders_user ON public.delivery_orders(user_id)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_delivery_orders_status ON public.delivery_orders(status)');
}

async function ensureDigitalServicesTables() {
  const safeQuery = async (sql, { label = '', critical = false } = {}) => {
    try {
      await appDataSource.query(sql);
    } catch (e) {
      if (critical) {
        console.error('DB init query failed', { label, message: e?.message, code: e?.code });
        throw e;
      }
    }
  };

  await safeQuery(`
    CREATE TABLE IF NOT EXISTS public.digital_service_providers (
      id uuid PRIMARY KEY,
      name text NOT NULL,
      category text NOT NULL DEFAULT 'telephone',
      logo_url text NOT NULL DEFAULT '',
      requires_phone boolean NOT NULL DEFAULT true,
      requires_id boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `, { label: 'create digital_service_providers', critical: true });

  await safeQuery('ALTER TABLE public.digital_service_providers ADD COLUMN IF NOT EXISTS name text');
  await safeQuery("ALTER TABLE public.digital_service_providers ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'telephone'");
  await safeQuery("ALTER TABLE public.digital_service_providers ADD COLUMN IF NOT EXISTS logo_url text NOT NULL DEFAULT ''");
  await safeQuery('ALTER TABLE public.digital_service_providers ADD COLUMN IF NOT EXISTS requires_phone boolean NOT NULL DEFAULT true');
  await safeQuery('ALTER TABLE public.digital_service_providers ADD COLUMN IF NOT EXISTS requires_id boolean NOT NULL DEFAULT false');
  await safeQuery('ALTER TABLE public.digital_service_providers ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now()');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_dsp_category ON public.digital_service_providers(category)');

  await safeQuery(`
    CREATE TABLE IF NOT EXISTS public.digital_service_products (
      id uuid PRIMARY KEY,
      provider_id uuid NOT NULL,
      name text NOT NULL,
      price numeric NOT NULL DEFAULT 0,
      value numeric NOT NULL DEFAULT 0,
      type text NOT NULL DEFAULT 'topup',
      duration_days integer NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `, { label: 'create digital_service_products', critical: true });

  await safeQuery('ALTER TABLE public.digital_service_products ADD COLUMN IF NOT EXISTS provider_id uuid');
  await safeQuery('ALTER TABLE public.digital_service_products ADD COLUMN IF NOT EXISTS name text');
  await safeQuery('ALTER TABLE public.digital_service_products ADD COLUMN IF NOT EXISTS price numeric NOT NULL DEFAULT 0');
  await safeQuery('ALTER TABLE public.digital_service_products ADD COLUMN IF NOT EXISTS value numeric NOT NULL DEFAULT 0');
  await safeQuery("ALTER TABLE public.digital_service_products ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'topup'");
  await safeQuery('ALTER TABLE public.digital_service_products ADD COLUMN IF NOT EXISTS duration_days integer NULL');
  await safeQuery('ALTER TABLE public.digital_service_products ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now()');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_dsprods_provider ON public.digital_service_products(provider_id)');

  await safeQuery(`
    CREATE TABLE IF NOT EXISTS public.digital_service_purchases (
      id uuid PRIMARY KEY,
      user_id uuid NOT NULL,
      provider_id text NOT NULL,
      product_id text NOT NULL,
      recipient text NOT NULL DEFAULT '',
      amount numeric NOT NULL DEFAULT 0,
      status text NOT NULL DEFAULT 'pending',
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `, { label: 'create digital_service_purchases', critical: true });

  await safeQuery('ALTER TABLE public.digital_service_purchases ADD COLUMN IF NOT EXISTS user_id uuid');
  await safeQuery('ALTER TABLE public.digital_service_purchases ADD COLUMN IF NOT EXISTS provider_id text');
  await safeQuery('ALTER TABLE public.digital_service_purchases ADD COLUMN IF NOT EXISTS product_id text');
  await safeQuery("ALTER TABLE public.digital_service_purchases ADD COLUMN IF NOT EXISTS recipient text NOT NULL DEFAULT ''");
  await safeQuery('ALTER TABLE public.digital_service_purchases ADD COLUMN IF NOT EXISTS amount numeric NOT NULL DEFAULT 0');
  await safeQuery("ALTER TABLE public.digital_service_purchases ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'");
  await safeQuery('ALTER TABLE public.digital_service_purchases ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now()');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_dspurchases_user ON public.digital_service_purchases(user_id)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_dspurchases_status ON public.digital_service_purchases(status)');
  await safeQuery('CREATE INDEX IF NOT EXISTS idx_dspurchases_created ON public.digital_service_purchases(created_at)');
}

async function ensureTravelTables() {
  const safeQuery = async (sql, { label = '', critical = false } = {}) => {
    try {
      await appDataSource.query(sql);
    } catch (e) {
      if (critical) {
        console.error('DB init query failed', { label, message: e?.message, code: e?.code });
        throw e;
      }
    }
  };

  await safeQuery(`
    CREATE TABLE IF NOT EXISTS public.bus_lines (
      id uuid PRIMARY KEY,
      agency text NOT NULL DEFAULT '',
      departure_city text NOT NULL DEFAULT '',
      destination_city text NOT NULL DEFAULT '',
      departure_time text NOT NULL DEFAULT '',
      arrival_time text NOT NULL DEFAULT '',
      price numeric NOT NULL DEFAULT 0,
      currency text NOT NULL DEFAULT 'XAF',
      total_seats integer NOT NULL DEFAULT 40,
      available_seats integer NOT NULL DEFAULT 40,
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `, { label: 'create bus_lines' });

  await safeQuery(`
    CREATE TABLE IF NOT EXISTS public.bus_bookings (
      id uuid PRIMARY KEY,
      bus_line_id uuid NOT NULL,
      user_id uuid NOT NULL,
      seat_number text NOT NULL DEFAULT '',
      passenger_name text NOT NULL DEFAULT '',
      passenger_phone text NOT NULL DEFAULT '',
      departure_date timestamptz NOT NULL,
      status text NOT NULL DEFAULT 'confirmed',
      amount numeric NOT NULL DEFAULT 0,
      currency text NOT NULL DEFAULT 'XAF',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `, { label: 'create bus_bookings' });

  await safeQuery(`
    CREATE TABLE IF NOT EXISTS public.carpool_listings (
      id uuid PRIMARY KEY,
      driver_user_id uuid NOT NULL,
      departure_city text NOT NULL DEFAULT '',
      destination_city text NOT NULL DEFAULT '',
      departure_date timestamptz NOT NULL,
      departure_time text NOT NULL DEFAULT '',
      price numeric NOT NULL DEFAULT 0,
      currency text NOT NULL DEFAULT 'XAF',
      seats_available integer NOT NULL DEFAULT 1,
      vehicle_info text NOT NULL DEFAULT '',
      notes text NOT NULL DEFAULT '',
      status text NOT NULL DEFAULT 'active',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `, { label: 'create carpool_listings' });

  await safeQuery(`
    CREATE TABLE IF NOT EXISTS public.carpool_bookings (
      id uuid PRIMARY KEY,
      listing_id uuid NOT NULL,
      passenger_user_id uuid NOT NULL,
      seats integer NOT NULL DEFAULT 1,
      total_price numeric NOT NULL DEFAULT 0,
      currency text NOT NULL DEFAULT 'XAF',
      status text NOT NULL DEFAULT 'pending',
      message text NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `, { label: 'create carpool_bookings' });

  await safeQuery(`
    CREATE TABLE IF NOT EXISTS public.flight_bookings (
      id uuid PRIMARY KEY,
      user_id uuid NOT NULL,
      flight_number text NOT NULL DEFAULT '',
      airline text NOT NULL DEFAULT '',
      departure_city text NOT NULL DEFAULT '',
      destination_city text NOT NULL DEFAULT '',
      departure_date timestamptz NOT NULL,
      return_date timestamptz NULL,
      passenger_name text NOT NULL DEFAULT '',
      passenger_email text NOT NULL DEFAULT '',
      passenger_phone text NOT NULL DEFAULT '',
      seat_class text NOT NULL DEFAULT 'economy',
      amount numeric NOT NULL DEFAULT 0,
      currency text NOT NULL DEFAULT 'XAF',
      status text NOT NULL DEFAULT 'confirmed',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `, { label: 'create flight_bookings' });

  await safeQuery(`
    CREATE TABLE IF NOT EXISTS public.train_lines (
      id uuid PRIMARY KEY,
      operator text NOT NULL DEFAULT '',
      departure_city text NOT NULL DEFAULT '',
      destination_city text NOT NULL DEFAULT '',
      departure_time text NOT NULL DEFAULT '',
      arrival_time text NOT NULL DEFAULT '',
      price numeric NOT NULL DEFAULT 0,
      currency text NOT NULL DEFAULT 'XAF',
      total_seats integer NOT NULL DEFAULT 200,
      available_seats integer NOT NULL DEFAULT 200,
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `, { label: 'create train_lines' });

  await safeQuery(`
    CREATE TABLE IF NOT EXISTS public.train_bookings (
      id uuid PRIMARY KEY,
      train_line_id uuid NOT NULL,
      user_id uuid NOT NULL,
      seat_number text NOT NULL DEFAULT '',
      passenger_name text NOT NULL DEFAULT '',
      passenger_phone text NOT NULL DEFAULT '',
      departure_date timestamptz NOT NULL,
      status text NOT NULL DEFAULT 'confirmed',
      amount numeric NOT NULL DEFAULT 0,
      currency text NOT NULL DEFAULT 'XAF',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `, { label: 'create train_bookings' });

  await safeQuery(`
    CREATE TABLE IF NOT EXISTS public.ferry_lines (
      id uuid PRIMARY KEY,
      operator text NOT NULL DEFAULT '',
      departure_city text NOT NULL DEFAULT '',
      destination_city text NOT NULL DEFAULT '',
      departure_time text NOT NULL DEFAULT '',
      arrival_time text NOT NULL DEFAULT '',
      price numeric NOT NULL DEFAULT 0,
      currency text NOT NULL DEFAULT 'XAF',
      cabin_types jsonb NOT NULL DEFAULT '[]'::jsonb,
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `, { label: 'create ferry_lines' });

  await safeQuery(`
    CREATE TABLE IF NOT EXISTS public.ferry_bookings (
      id uuid PRIMARY KEY,
      ferry_line_id uuid NOT NULL,
      user_id uuid NOT NULL,
      cabin_type text NOT NULL DEFAULT 'standard',
      passenger_name text NOT NULL DEFAULT '',
      passenger_phone text NOT NULL DEFAULT '',
      departure_date timestamptz NOT NULL,
      status text NOT NULL DEFAULT 'confirmed',
      amount numeric NOT NULL DEFAULT 0,
      currency text NOT NULL DEFAULT 'XAF',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `, { label: 'create ferry_bookings' });

  await safeQuery(`
    CREATE TABLE IF NOT EXISTS public.car_rentals (
      id uuid PRIMARY KEY,
      agency_id uuid NULL,
      vehicle_name text NOT NULL DEFAULT '',
      vehicle_type text NOT NULL DEFAULT '',
      transmission text NOT NULL DEFAULT 'manual',
      seats integer NOT NULL DEFAULT 5,
      price_per_day numeric NOT NULL DEFAULT 0,
      currency text NOT NULL DEFAULT 'XAF',
      location_city text NOT NULL DEFAULT '',
      with_driver_available boolean NOT NULL DEFAULT false,
      image_url text NOT NULL DEFAULT '',
      is_available boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `, { label: 'create car_rentals' });

  await safeQuery(`
    CREATE TABLE IF NOT EXISTS public.car_rental_bookings (
      id uuid PRIMARY KEY,
      vehicle_id uuid NOT NULL,
      user_id uuid NOT NULL,
      pickup_date timestamptz NOT NULL,
      return_date timestamptz NOT NULL,
      total_days integer NOT NULL DEFAULT 1,
      total_price numeric NOT NULL DEFAULT 0,
      currency text NOT NULL DEFAULT 'XAF',
      driver_name text NOT NULL DEFAULT '',
      driver_phone text NOT NULL DEFAULT '',
      with_driver boolean NOT NULL DEFAULT false,
      status text NOT NULL DEFAULT 'confirmed',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `, { label: 'create car_rental_bookings' });

  await safeQuery(`
    CREATE TABLE IF NOT EXISTS public.tourist_sites (
      id uuid PRIMARY KEY,
      name text NOT NULL DEFAULT '',
      city text NOT NULL DEFAULT '',
      description text NOT NULL DEFAULT '',
      category text NOT NULL DEFAULT 'nature',
      latitude numeric NULL,
      longitude numeric NULL,
      image_url text NOT NULL DEFAULT '',
      rating text NOT NULL DEFAULT '4.5',
      entry_fee numeric NOT NULL DEFAULT 0,
      currency text NOT NULL DEFAULT 'XAF',
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `, { label: 'create tourist_sites' });

  await safeQuery(`
    CREATE TABLE IF NOT EXISTS public.tour_guides (
      id uuid PRIMARY KEY,
      name text NOT NULL DEFAULT '',
      city text NOT NULL DEFAULT '',
      phone text NOT NULL DEFAULT '',
      email text NOT NULL DEFAULT '',
      languages text NOT NULL DEFAULT '[]',
      specialties text NOT NULL DEFAULT '[]',
      rating text NOT NULL DEFAULT '4.5',
      price_per_hour numeric NOT NULL DEFAULT 0,
      currency text NOT NULL DEFAULT 'XAF',
      is_available boolean NOT NULL DEFAULT true,
      avatar_url text NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `, { label: 'create tour_guides' });
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
  await ensureSmartCityTables();
  await ensureTravelTables();
  return appDataSource;
}
