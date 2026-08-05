-- ============================================================================
-- MEXO ECOSYSTEM MASTER DATABASE ARCHITECTURE
-- Migration: V8__mexo_seed_data.sql
-- Description: Seed initial default data (Roles, Products, Reserved Names, Sample Data)
-- Engine: Supabase PostgreSQL
-- ============================================================================

-- ============================================================================
-- 1. SEED DEFAULT ROLES
-- ============================================================================
INSERT INTO mexo_identity.roles (id, role_name, description) VALUES
('11111111-1111-1111-1111-111111111111', 'ROLE_USER', 'Standard MEXO Ecosystem User'),
('22222222-2222-2222-2222-222222222222', 'ROLE_ADMIN', 'Platform System Administrator')
ON CONFLICT (role_name) DO NOTHING;

-- ============================================================================
-- 2. SEED DEFAULT PRODUCTS
-- ============================================================================
INSERT INTO mexo_identity.products (id, product_key, name, status) VALUES
('a1111111-1111-1111-1111-111111111111', 'MAIL', 'MEXO Mail', 'ACTIVE'),
('a2222222-2222-2222-2222-222222222222', 'FORMS', 'MEXO Forms', 'PLANNED'),
('a3333333-3333-3333-3333-333333333333', 'FILES', 'MEXO Files', 'PLANNED'),
('a4444444-4444-4444-4444-444444444444', 'CALENDAR', 'MEXO Calendar', 'PLANNED'),
('a5555555-5555-5555-5555-555555555555', 'MEET', 'MEXO Meet', 'PLANNED')
ON CONFLICT (product_key) DO NOTHING;

-- ============================================================================
-- 3. SEED RESERVED USERNAMES
-- ============================================================================
INSERT INTO mexo_identity.reserved_usernames (username, reason) VALUES
('admin', 'System Reserved Handle'),
('administrator', 'System Reserved Handle'),
('support', 'Official Support Identity'),
('help', 'Official Help Handle'),
('security', 'Official Security Incident Response'),
('abuse', 'Official Abuse Reporting Handle'),
('postmaster', 'RFC Standard Handle'),
('noreply', 'Automated Outbound Sender'),
('system', 'System Internal Operations'),
('root', 'System Reserved Handle'),
('mailer-daemon', 'RFC Standard Handle')
ON CONFLICT (username) DO NOTHING;

-- ============================================================================
-- 4. SEED SAMPLE TEST USERS & PROFILES
-- ============================================================================
-- User 1: Manikandan Prabhu
INSERT INTO mexo_identity.users (id, username, primary_address, status) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'manikandan', 'manikandan@mexo.com', 'ACTIVE')
ON CONFLICT (username) DO NOTHING;

INSERT INTO mexo_identity.profiles (user_id, first_name, last_name, display_name) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Manikandan', 'Prabhu', 'Manikandan Prabhu')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO mexo_identity.user_roles (user_id, role_id) VALUES
('550e8400-e29b-41d4-a716-446655440001', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (user_id, role_id) DO NOTHING;

-- User 2: Admin System User
INSERT INTO mexo_identity.users (id, username, primary_address, status) VALUES
('550e8400-e29b-41d4-a716-446655440002', 'adminuser', 'adminuser@mexo.com', 'ACTIVE')
ON CONFLICT (username) DO NOTHING;

INSERT INTO mexo_identity.profiles (user_id, first_name, last_name, display_name) VALUES
('550e8400-e29b-41d4-a716-446655440002', 'System', 'Admin', 'MEXO Platform Admin')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO mexo_identity.user_roles (user_id, role_id) VALUES
('550e8400-e29b-41d4-a716-446655440002', '22222222-2222-2222-2222-222222222222')
ON CONFLICT (user_id, role_id) DO NOTHING;
