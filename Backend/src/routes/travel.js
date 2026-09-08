import express from 'express';
import Joi from 'joi';
import crypto from 'crypto';
import { dbAdmin } from '../config/db.js';
import { appDataSource } from '../db/dataSource.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

const busBookingSchema = Joi.object({
  bus_line_id: Joi.string().uuid().required(),
  seat_number: Joi.string().trim().required(),
  passenger_name: Joi.string().trim().required(),
  passenger_phone: Joi.string().trim().required(),
  departure_date: Joi.date().iso().required(),
  currency: Joi.string().default('XAF'),
});

const carpoolListingSchema = Joi.object({
  departure_city: Joi.string().trim().required(),
  destination_city: Joi.string().trim().required(),
  departure_date: Joi.date().iso().required(),
  departure_time: Joi.string().trim().required(),
  price: Joi.number().min(0).required(),
  seats_available: Joi.number().integer().min(1).required(),
  vehicle_info: Joi.string().allow('').max(500).optional(),
  notes: Joi.string().allow('').max(1000).optional(),
  currency: Joi.string().default('XAF'),
});

const carpoolBookSchema = Joi.object({
  listing_id: Joi.string().uuid().required(),
  seats: Joi.number().integer().min(1).required(),
  message: Joi.string().allow('').max(500).optional(),
});

const flightBookingSchema = Joi.object({
  flight_number: Joi.string().trim().required(),
  airline: Joi.string().trim().required(),
  departure_city: Joi.string().trim().required(),
  destination_city: Joi.string().trim().required(),
  departure_date: Joi.date().iso().required(),
  return_date: Joi.date().iso().optional().allow(null),
  passenger_name: Joi.string().trim().required(),
  passenger_email: Joi.string().email().optional().allow(''),
  passenger_phone: Joi.string().trim().required(),
  seat_class: Joi.string().valid('economy', 'business', 'first').default('economy'),
  price: Joi.number().min(0).required(),
  currency: Joi.string().default('XAF'),
});

const trainBookingSchema = Joi.object({
  train_line_id: Joi.string().uuid().required(),
  seat_number: Joi.string().trim().required(),
  passenger_name: Joi.string().trim().required(),
  passenger_phone: Joi.string().trim().required(),
  departure_date: Joi.date().iso().required(),
  currency: Joi.string().default('XAF'),
});

const ferryBookingSchema = Joi.object({
  ferry_line_id: Joi.string().uuid().required(),
  cabin_type: Joi.string().trim().default('standard'),
  passenger_name: Joi.string().trim().required(),
  passenger_phone: Joi.string().trim().required(),
  departure_date: Joi.date().iso().required(),
  currency: Joi.string().default('XAF'),
});

const carRentalBookSchema = Joi.object({
  vehicle_id: Joi.string().uuid().required(),
  pickup_date: Joi.date().iso().required(),
  return_date: Joi.date().iso().required(),
  driver_name: Joi.string().trim().required(),
  driver_phone: Joi.string().trim().required(),
  with_driver: Joi.boolean().default(false),
  currency: Joi.string().default('XAF'),
});

async function ensureTravelTables() {
  try {
    await appDataSource.query(`
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
    `);

    await appDataSource.query(`
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
    `);

    await appDataSource.query(`
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
    `);

    await appDataSource.query(`
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
    `);

    await appDataSource.query(`
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
    `);

    await appDataSource.query(`
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
    `);

    await appDataSource.query(`
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
    `);

    await appDataSource.query(`
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
    `);

    await appDataSource.query(`
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
    `);

    await appDataSource.query(`
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
    `);

    await appDataSource.query(`
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
    `);

    await appDataSource.query(`
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
    `);

    await appDataSource.query(`
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
    `);

    await appDataSource.query('CREATE INDEX IF NOT EXISTS idx_bus_lines_departure ON public.bus_lines(departure_city)');
    await appDataSource.query('CREATE INDEX IF NOT EXISTS idx_bus_lines_destination ON public.bus_lines(destination_city)');
    await appDataSource.query('CREATE INDEX IF NOT EXISTS idx_bus_lines_active ON public.bus_lines(is_active)');
    await appDataSource.query('CREATE INDEX IF NOT EXISTS idx_bus_bookings_user ON public.bus_bookings(user_id)');
    await appDataSource.query('CREATE INDEX IF NOT EXISTS idx_bus_bookings_line ON public.bus_bookings(bus_line_id)');

    await appDataSource.query('CREATE INDEX IF NOT EXISTS idx_carpool_listings_departure ON public.carpool_listings(departure_city)');
    await appDataSource.query('CREATE INDEX IF NOT EXISTS idx_carpool_listings_destination ON public.carpool_listings(destination_city)');
    await appDataSource.query('CREATE INDEX IF NOT EXISTS idx_carpool_listings_date ON public.carpool_listings(departure_date)');
    await appDataSource.query('CREATE INDEX IF NOT EXISTS idx_carpool_listings_driver ON public.carpool_listings(driver_user_id)');
    await appDataSource.query('CREATE INDEX IF NOT EXISTS idx_carpool_listings_status ON public.carpool_listings(status)');
    await appDataSource.query('CREATE INDEX IF NOT EXISTS idx_carpool_bookings_listing ON public.carpool_bookings(listing_id)');
    await appDataSource.query('CREATE INDEX IF NOT EXISTS idx_carpool_bookings_passenger ON public.carpool_bookings(passenger_user_id)');

    await appDataSource.query('CREATE INDEX IF NOT EXISTS idx_flight_bookings_user ON public.flight_bookings(user_id)');
    await appDataSource.query('CREATE INDEX IF NOT EXISTS idx_train_lines_active ON public.train_lines(is_active)');
    await appDataSource.query('CREATE INDEX IF NOT EXISTS idx_train_bookings_user ON public.train_bookings(user_id)');
    await appDataSource.query('CREATE INDEX IF NOT EXISTS idx_ferry_lines_active ON public.ferry_lines(is_active)');
    await appDataSource.query('CREATE INDEX IF NOT EXISTS idx_ferry_bookings_user ON public.ferry_bookings(user_id)');
    await appDataSource.query('CREATE INDEX IF NOT EXISTS idx_car_rentals_city ON public.car_rentals(location_city)');
    await appDataSource.query('CREATE INDEX IF NOT EXISTS idx_car_rentals_available ON public.car_rentals(is_available)');
    await appDataSource.query('CREATE INDEX IF NOT EXISTS idx_car_rental_bookings_user ON public.car_rental_bookings(user_id)');
    await appDataSource.query('CREATE INDEX IF NOT EXISTS idx_tourist_sites_city ON public.tourist_sites(city)');
    await appDataSource.query('CREATE INDEX IF NOT EXISTS idx_tourist_sites_active ON public.tourist_sites(is_active)');
    await appDataSource.query('CREATE INDEX IF NOT EXISTS idx_tour_guides_city ON public.tour_guides(city)');
    await appDataSource.query('CREATE INDEX IF NOT EXISTS idx_tour_guides_available ON public.tour_guides(is_available)');

    logger.info('✅ Travel tables ensured');
  } catch (e) {
    logger.warn('⚠️ Travel tables check failed', { message: e?.message });
  }
}

ensureTravelTables();

// All travel routes require authentication
router.use(authenticateToken);

// ============================================================
// BUS
// ============================================================

router.get('/bus-lines', asyncHandler(async (req, res) => {
  const { departure, destination, date } = req.query;
  let query = dbAdmin
    .from('bus_lines')
    .select('*')
    .eq('is_active', true);

  if (departure) query = query.ilike('departure_city', `%${departure}%`);
  if (destination) query = query.ilike('destination_city', `%${destination}%`);

  const { data, error } = await query.order('departure_time', { ascending: true });

  if (error) throw new ValidationError('Erreur lors du chargement des lignes de bus');

  return res.json({ success: true, data: Array.isArray(data) ? data : [] });
}));

router.get('/bus-lines/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { data, error } = await dbAdmin
    .from('bus_lines')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) throw new NotFoundError('Ligne de bus introuvable');
  return res.json({ success: true, data });
}));

router.post('/bus/book', asyncHandler(async (req, res) => {
  const { error, value } = busBookingSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const { data: busLine, error: lineErr } = await dbAdmin
    .from('bus_lines')
    .select('*')
    .eq('id', value.bus_line_id)
    .single();

  if (lineErr || !busLine) throw new NotFoundError('Ligne de bus introuvable');

  if (busLine.available_seats <= 0) {
    throw new ValidationError('Plus de sièges disponibles sur cette ligne');
  }

  const now = new Date().toISOString();
  const bookingId = crypto.randomUUID();

  const booking = {
    id: bookingId,
    bus_line_id: value.bus_line_id,
    user_id: req.user.id,
    seat_number: value.seat_number,
    passenger_name: value.passenger_name,
    passenger_phone: value.passenger_phone,
    departure_date: value.departure_date,
    status: 'confirmed',
    amount: busLine.price,
    currency: value.currency || 'XAF',
    created_at: now,
    updated_at: now,
  };

  const { data: created, error: insertErr } = await dbAdmin
    .from('bus_bookings')
    .insert(booking)
    .select('*')
    .single();

  if (insertErr || !created) {
    throw new ValidationError('Erreur lors de la réservation');
  }

  await dbAdmin
    .from('bus_lines')
    .update({ available_seats: busLine.available_seats - 1, updated_at: now })
    .eq('id', value.bus_line_id);

  logger.info(`Réservation bus #${bookingId}`, { userId: req.user.id, lineId: value.bus_line_id });

  return res.status(201).json({ success: true, data: created });
}));

router.get('/bus/bookings', asyncHandler(async (req, res) => {
  const { data, error } = await dbAdmin
    .from('bus_bookings')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) throw new ValidationError('Erreur lors du chargement des réservations');

  return res.json({ success: true, data: Array.isArray(data) ? data : [] });
}));

// ============================================================
// CARPOOL
// ============================================================

router.get('/carpool/listings', asyncHandler(async (req, res) => {
  const { departure, destination, date } = req.query;
  let query = dbAdmin
    .from('carpool_listings')
    .select('*')
    .eq('status', 'active');

  if (departure) query = query.ilike('departure_city', `%${departure}%`);
  if (destination) query = query.ilike('destination_city', `%${destination}%`);
  if (date) query = query.gte('departure_date', date);

  const { data, error } = await query.order('departure_date', { ascending: true });

  if (error) throw new ValidationError('Erreur lors du chargement des offres');
  return res.json({ success: true, data: Array.isArray(data) ? data : [] });
}));

router.post('/carpool/listings', asyncHandler(async (req, res) => {
  const { error, value } = carpoolListingSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const now = new Date().toISOString();
  const listingId = crypto.randomUUID();

  const listing = {
    id: listingId,
    driver_user_id: req.user.id,
    departure_city: value.departure_city,
    destination_city: value.destination_city,
    departure_date: value.departure_date,
    departure_time: value.departure_time,
    price: value.price,
    currency: value.currency || 'XAF',
    seats_available: value.seats_available,
    vehicle_info: value.vehicle_info || '',
    notes: value.notes || '',
    status: 'active',
    created_at: now,
    updated_at: now,
  };

  const { data: created, error: insertErr } = await dbAdmin
    .from('carpool_listings')
    .insert(listing)
    .select('*')
    .single();

  if (insertErr || !created) {
    throw new ValidationError('Erreur lors de la publication');
  }

  logger.info(`Nouveau covoiturage #${listingId}`, { userId: req.user.id });
  return res.status(201).json({ success: true, data: created });
}));

router.post('/carpool/book', asyncHandler(async (req, res) => {
  const { error, value } = carpoolBookSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const { data: listing, error: listErr } = await dbAdmin
    .from('carpool_listings')
    .select('*')
    .eq('id', value.listing_id)
    .single();

  if (listErr || !listing) throw new NotFoundError('Offre introuvable');
  if (listing.seats_available < value.seats) {
    throw new ValidationError('Pas assez de places disponibles');
  }

  const now = new Date().toISOString();
  const bookingId = crypto.randomUUID();

  const booking = {
    id: bookingId,
    listing_id: value.listing_id,
    passenger_user_id: req.user.id,
    seats: value.seats,
    total_price: listing.price * value.seats,
    currency: listing.currency,
    status: 'pending',
    message: value.message || '',
    created_at: now,
    updated_at: now,
  };

  const { data: created, error: insertErr } = await dbAdmin
    .from('carpool_bookings')
    .insert(booking)
    .select('*')
    .single();

  if (insertErr || !created) {
    throw new ValidationError('Erreur lors de la réservation');
  }

  await dbAdmin
    .from('carpool_listings')
    .update({ seats_available: listing.seats_available - value.seats, updated_at: now })
    .eq('id', value.listing_id);

  return res.status(201).json({ success: true, data: created });
}));

router.get('/carpool/my-rides', asyncHandler(async (req, res) => {
  const [driverRides, passengerRides] = await Promise.all([
    dbAdmin.from('carpool_listings').select('*').eq('driver_user_id', req.user.id).order('created_at', { ascending: false }),
    dbAdmin.from('carpool_bookings').select('*, listing:carpool_listings(*)').eq('passenger_user_id', req.user.id).order('created_at', { ascending: false }),
  ]);

  return res.json({
    success: true,
    data: {
      as_driver: Array.isArray(driverRides.data) ? driverRides.data : [],
      as_passenger: Array.isArray(passengerRides.data) ? passengerRides.data : [],
    },
  });
}));

// ============================================================
// FLIGHTS
// ============================================================

router.get('/flights/search', asyncHandler(async (req, res) => {
  const { departure, destination, date } = req.query;

  const { data, error } = await dbAdmin
    .from('flight_bookings')
    .select('*')
    .eq('departure_city', departure || '')
    .eq('destination_city', destination || '')
    .order('departure_date', { ascending: true });

  if (error) throw new ValidationError('Erreur lors de la recherche de vols');

  return res.json({ success: true, data: Array.isArray(data) ? data : [] });
}));

router.post('/flights/book', asyncHandler(async (req, res) => {
  const { error, value } = flightBookingSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const now = new Date().toISOString();
  const bookingId = crypto.randomUUID();

  const booking = {
    id: bookingId,
    user_id: req.user.id,
    flight_number: value.flight_number,
    airline: value.airline,
    departure_city: value.departure_city,
    destination_city: value.destination_city,
    departure_date: value.departure_date,
    return_date: value.return_date || null,
    passenger_name: value.passenger_name,
    passenger_email: value.passenger_email || '',
    passenger_phone: value.passenger_phone,
    seat_class: value.seat_class,
    amount: value.price,
    currency: value.currency || 'XAF',
    status: 'confirmed',
    created_at: now,
    updated_at: now,
  };

  const { data: created, error: insertErr } = await dbAdmin
    .from('flight_bookings')
    .insert(booking)
    .select('*')
    .single();

  if (insertErr || !created) {
    throw new ValidationError('Erreur lors de la réservation du vol');
  }

  logger.info(`Réservation vol #${bookingId}`, { userId: req.user.id });
  return res.status(201).json({ success: true, data: created });
}));

// ============================================================
// TRAINS
// ============================================================

router.get('/trains', asyncHandler(async (req, res) => {
  const { departure, destination } = req.query;
  let query = dbAdmin
    .from('train_lines')
    .select('*')
    .eq('is_active', true);

  if (departure) query = query.ilike('departure_city', `%${departure}%`);
  if (destination) query = query.ilike('destination_city', `%${destination}%`);

  const { data, error } = await query.order('departure_time', { ascending: true });

  if (error) throw new ValidationError('Erreur lors du chargement des trains');
  return res.json({ success: true, data: Array.isArray(data) ? data : [] });
}));

router.post('/trains/book', asyncHandler(async (req, res) => {
  const { error, value } = trainBookingSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const { data: trainLine, error: lineErr } = await dbAdmin
    .from('train_lines')
    .select('*')
    .eq('id', value.train_line_id)
    .single();

  if (lineErr || !trainLine) throw new NotFoundError('Train introuvable');
  if ((trainLine.available_seats || 0) <= 0) {
    throw new ValidationError('Plus de places disponibles');
  }

  const now = new Date().toISOString();
  const bookingId = crypto.randomUUID();

  const booking = {
    id: bookingId,
    train_line_id: value.train_line_id,
    user_id: req.user.id,
    seat_number: value.seat_number,
    passenger_name: value.passenger_name,
    passenger_phone: value.passenger_phone,
    departure_date: value.departure_date,
    status: 'confirmed',
    amount: trainLine.price,
    currency: value.currency || 'XAF',
    created_at: now,
    updated_at: now,
  };

  const { data: created, error: insertErr } = await dbAdmin
    .from('train_bookings')
    .insert(booking)
    .select('*')
    .single();

  if (insertErr || !created) throw new ValidationError('Erreur lors de la réservation');

  await dbAdmin
    .from('train_lines')
    .update({ available_seats: (trainLine.available_seats || 0) - 1, updated_at: now })
    .eq('id', value.train_line_id);

  return res.status(201).json({ success: true, data: created });
}));

// ============================================================
// FERRIES
// ============================================================

router.get('/ferries', asyncHandler(async (req, res) => {
  const { departure, destination } = req.query;
  let query = dbAdmin
    .from('ferry_lines')
    .select('*')
    .eq('is_active', true);

  if (departure) query = query.ilike('departure_city', `%${departure}%`);
  if (destination) query = query.ilike('destination_city', `%${destination}%`);

  const { data, error } = await query.order('departure_time', { ascending: true });

  if (error) throw new ValidationError('Erreur lors du chargement des bateaux');
  return res.json({ success: true, data: Array.isArray(data) ? data : [] });
}));

router.post('/ferries/book', asyncHandler(async (req, res) => {
  const { error, value } = ferryBookingSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const { data: ferryLine, error: lineErr } = await dbAdmin
    .from('ferry_lines')
    .select('*')
    .eq('id', value.ferry_line_id)
    .single();

  if (lineErr || !ferryLine) throw new NotFoundError('Ligne bateau introuvable');

  const now = new Date().toISOString();
  const bookingId = crypto.randomUUID();

  const booking = {
    id: bookingId,
    ferry_line_id: value.ferry_line_id,
    user_id: req.user.id,
    cabin_type: value.cabin_type,
    passenger_name: value.passenger_name,
    passenger_phone: value.passenger_phone,
    departure_date: value.departure_date,
    status: 'confirmed',
    amount: ferryLine.price,
    currency: value.currency || 'XAF',
    created_at: now,
    updated_at: now,
  };

  const { data: created, error: insertErr } = await dbAdmin
    .from('ferry_bookings')
    .insert(booking)
    .select('*')
    .single();

  if (insertErr || !created) throw new ValidationError('Erreur lors de la réservation');

  return res.status(201).json({ success: true, data: created });
}));

// ============================================================
// CAR RENTAL
// ============================================================

router.get('/car-rental/vehicles', asyncHandler(async (req, res) => {
  const { city, type } = req.query;
  let query = dbAdmin
    .from('car_rentals')
    .select('*')
    .eq('is_available', true);

  if (city) query = query.ilike('location_city', `%${city}%`);
  if (type) query = query.ilike('vehicle_type', `%${type}%`);

  const { data, error } = await query.order('price_per_day', { ascending: true });

  if (error) throw new ValidationError('Erreur lors du chargement des véhicules');
  return res.json({ success: true, data: Array.isArray(data) ? data : [] });
}));

router.post('/car-rental/book', asyncHandler(async (req, res) => {
  const { error, value } = carRentalBookSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const { data: vehicle, error: vehErr } = await dbAdmin
    .from('car_rentals')
    .select('*')
    .eq('id', value.vehicle_id)
    .single();

  if (vehErr || !vehicle) throw new NotFoundError('Véhicule introuvable');

  const pickup = new Date(value.pickup_date);
  const ret = new Date(value.return_date);
  const totalDays = Math.max(1, Math.ceil((ret.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24)));

  const now = new Date().toISOString();
  const bookingId = crypto.randomUUID();

  const booking = {
    id: bookingId,
    vehicle_id: value.vehicle_id,
    user_id: req.user.id,
    pickup_date: value.pickup_date,
    return_date: value.return_date,
    total_days: totalDays,
    total_price: vehicle.price_per_day * totalDays,
    currency: value.currency || 'XAF',
    driver_name: value.driver_name,
    driver_phone: value.driver_phone,
    with_driver: value.with_driver,
    status: 'confirmed',
    created_at: now,
    updated_at: now,
  };

  const { data: created, error: insertErr } = await dbAdmin
    .from('car_rental_bookings')
    .insert(booking)
    .select('*')
    .single();

  if (insertErr || !created) throw new ValidationError('Erreur lors de la réservation');

  return res.status(201).json({ success: true, data: created });
}));

// ============================================================
// TOURIST SITES & GUIDES
// ============================================================

router.get('/tourist-sites', asyncHandler(async (req, res) => {
  const { city, category } = req.query;
  let query = dbAdmin
    .from('tourist_sites')
    .select('*')
    .eq('is_active', true);

  if (city) query = query.ilike('city', `%${city}%`);
  if (category) query = query.eq('category', category);

  const { data, error } = await query.order('name', { ascending: true });

  if (error) throw new ValidationError('Erreur lors du chargement des sites');
  return res.json({ success: true, data: Array.isArray(data) ? data : [] });
}));

router.get('/tour-guides', asyncHandler(async (req, res) => {
  const { city } = req.query;
  let query = dbAdmin
    .from('tour_guides')
    .select('*')
    .eq('is_available', true);

  if (city) query = query.ilike('city', `%${city}%`);

  const { data, error } = await query.order('rating', { ascending: false });

  if (error) throw new ValidationError('Erreur lors du chargement des guides');
  return res.json({ success: true, data: Array.isArray(data) ? data : [] });
}));

export default router;
