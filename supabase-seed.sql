-- ============================================================
-- SEED DATA — SME Association Labuan (test run)
-- Run this AFTER supabase-setup.sql
-- ============================================================

-- ============================================================
-- MEMBERS (mix of statuses and types)
-- ============================================================

INSERT INTO members (member_id, full_name, email, phone, business_name, business_sector, business_size, membership_type, status, member_since, expiry_date, payment_ref) VALUES
('SMEL-L-001', 'Ahmad Razali bin Othman',   'ahmad.razali@example.com',   '+60 12-345 6789', 'Razali Trading Sdn Bhd',       'Manufacturing', 'Medium', 'Life',     'active',  '2020-01-15', NULL,         'TT/2020/001'),
('SMEL-L-002', 'Siti Norzahra binti Yusof', 'siti.norzahra@example.com',  '+60 16-234 5678', 'SN Garment Industries',         'Manufacturing', 'Small',  'Life',     'active',  '2021-03-20', NULL,         'TT/2021/045'),
('SMEL-L-003', 'Lim Chee Keong',            'lim.ck@example.com',         '+60 17-456 7890', 'CK Engineering Works',          'Manufacturing', 'Small',  'Life',     'active',  '2021-06-10', NULL,         'TT/2021/089'),
('SMEL-O-001', 'Mohd Faizal bin Hamid',     'faizal.hamid@example.com',   '+60 11-345 6789', 'Faizal F&B Enterprise',         'Services',      'Micro',  'Ordinary', 'active',  '2022-02-01', '2026-02-01', 'TT/2022/012'),
('SMEL-O-002', 'Nurul Ain binti Zakaria',   'nurul.ain@example.com',      '+60 14-567 8901', 'Ain Beauty & Wellness',         'Services',      'Micro',  'Ordinary', 'active',  '2022-05-15', '2026-05-15', 'TT/2022/056'),
('SMEL-O-003', 'Tan Wei Ming',              'tan.weiming@example.com',    '+60 12-678 9012', 'Wei Ming Electrical Supplies',  'Trading',       'Small',  'Ordinary', 'active',  '2023-01-10', '2026-01-10', 'TT/2023/003'),
('SMEL-O-004', 'Rozita binti Mahmud',       'rozita.mahmud@example.com',  '+60 19-789 0123', 'Rozita Catering Services',      'Services',      'Micro',  'Ordinary', 'active',  '2023-04-20', '2026-04-20', 'TT/2023/041'),
('SMEL-O-005', 'Krishnan a/l Suppiah',      'krishnan.s@example.com',     '+60 16-890 1234', 'KS Logistics & Transport',      'Services',      'Small',  'Ordinary', 'active',  '2023-07-01', '2026-07-01', 'TT/2023/078'),
('SMEL-O-006', 'Wan Norhaslinda bt Wan Ali','wanhaslinda@example.com',    '+60 13-901 2345', 'Haslinda Boutique',             'Trading',       'Micro',  'Ordinary', 'expired', '2022-08-15', '2024-08-15', 'TT/2022/094'),
('SMEL-O-007', 'Ismail bin Nordin',         'ismail.nordin@example.com',  '+60 17-012 3456', 'IN Construction & Renovation',  'Construction',  'Small',  'Ordinary', 'expired', '2022-11-01', '2024-11-01', 'TT/2022/112'),
(NULL,          'Hafizah binti Zainol',      'hafizah.z@example.com',      '+60 12-234 5670', 'Hafizah Gift & Craft',          'Trading',       'Micro',  'Ordinary', 'pending', NULL,         NULL,         NULL),
(NULL,          'Lee Chong Huat',            'lee.ch@example.com',         '+60 11-345 6780', 'Lee Brothers Hardware',         'Trading',       'Small',  'Ordinary', 'pending', NULL,         NULL,         NULL),
(NULL,          'Fatimah binti Idris',       'fatimah.idris@example.com',  '+60 14-456 7891', 'FI Food Processing',            'Manufacturing', 'Micro',  'Life',     'pending', NULL,         NULL,         NULL);


-- ============================================================
-- EVENTS
-- ============================================================

INSERT INTO events (title, venue, event_date, access_type, registered_count, description) VALUES
('SME Labuan Annual Dinner 2026',           'Sheraton Labuan Hotel',           '2026-07-12', 'members_only', 87,  'Annual dinner and awards night for all SME Association Labuan members. Dress code: formal.'),
('Business Networking Breakfast',           'Grand Dorsett Labuan',            '2026-06-15', 'open',         34,  'Monthly networking breakfast open to all business owners in Labuan.'),
('Digital Marketing Workshop',              'SME Corp Malaysia, Labuan Office', '2026-06-28', 'members_only', 22,  'Half-day workshop on social media marketing and e-commerce strategies for SMEs.'),
('Labuan Business Forum 2026',             'Labuan International Business Financial Centre', '2026-08-05', 'open', 120, 'Annual forum bringing together SMEs, government agencies, and financial institutions.'),
('Export Readiness Seminar',               'Labuan Maritime & Labour Office',  '2026-09-10', 'members_only', 15,  'Seminar on export procedures, documentation, and market access for manufacturing SMEs.');


-- ============================================================
-- DEALS
-- ============================================================

INSERT INTO deals (merchant_name, offer_description, category, discount_value, valid_until, status) VALUES
('Dorsett Labuan Hotel',        '15% discount on room rates for business travellers. Complimentary breakfast included.',              'Travel',   '15% off',    '2026-12-31', 'active'),
('Maybank Labuan Branch',       'Preferential SME financing rates and waived processing fees for association members.',               'Business', 'Fee waived', '2026-12-31', 'active'),
('Restoran Selera Labuan',      'Members enjoy 10% off total bill for groups of 5 or more. Valid Mon–Fri.',                           'F&B',      '10% off',    '2026-09-30', 'active'),
('Labuan Medical Centre',       'Free health screening package worth RM 250 (blood pressure, blood sugar, BMI, cholesterol).',        'Health',   'Free',       '2026-06-30', 'active'),
('One Mart Labuan',             '5% discount on all office supplies and stationery purchases above RM 100.',                          'Business', '5% off',     '2026-12-31', 'active'),
('Kedai Kopi Tanjung Aru',      'Complimentary drink with any meal order for card-carrying SME Labuan members.',                      'F&B',      'Free drink', '2026-08-31', 'active'),
('Labuan Airport Taxi Service', 'Fixed rate RM 15 from airport to any Labuan town destination (normal rate RM 25).',                  'Travel',   'RM 15 flat', '2026-12-31', 'active'),
('Print & Go Labuan',           '20% off business cards, banners, and promotional materials printing for members.',                   'Business', '20% off',    '2026-03-31', 'expired');


-- ============================================================
-- ADVERTISEMENTS
-- ============================================================

INSERT INTO advertisements (advertiser_name, headline, image_url, period_start, period_end, click_count, status) VALUES
('Labuan IBFC',         'Grow Your Business in Labuan — Asia''s Premier Offshore Hub',       NULL, '2026-05-01', '2026-07-31', 42, 'active'),
('Dorsett Labuan',      'Exclusive Member Rates — Book Direct & Save 15%',                   NULL, '2026-05-01', '2026-06-30', 18, 'active'),
('Maybank SME',         'SME Financing Made Easy — Apply Today, Get Approved Fast',          NULL, '2026-06-01', '2026-08-31',  7, 'active');


-- ============================================================
-- ACTIVITY LOG
-- ============================================================

-- Get the admin user id for logging (uses the admin you inserted earlier)
DO $$
DECLARE
  v_admin_id uuid;
  m1 uuid; m2 uuid; m3 uuid; m4 uuid; m5 uuid; m6 uuid; m7 uuid; m8 uuid;
BEGIN
  SELECT id INTO v_admin_id FROM admin_users LIMIT 1;
  SELECT id INTO m1 FROM members WHERE member_id = 'SMEL-L-001';
  SELECT id INTO m2 FROM members WHERE member_id = 'SMEL-L-002';
  SELECT id INTO m3 FROM members WHERE member_id = 'SMEL-O-001';
  SELECT id INTO m4 FROM members WHERE member_id = 'SMEL-O-002';
  SELECT id INTO m5 FROM members WHERE member_id = 'SMEL-O-006';
  SELECT id INTO m6 FROM members WHERE member_id = 'SMEL-O-007';
  SELECT id INTO m7 FROM members WHERE full_name = 'Hafizah binti Zainol';
  SELECT id INTO m8 FROM members WHERE full_name = 'Lee Chong Huat';

  INSERT INTO activity_log (member_id, admin_id, action, details, payment_ref, created_at) VALUES
  (m1, v_admin_id, 'approved', 'Approved as SMEL-L-001 (Life, Medium)',         'TT/2020/001', '2020-01-15 09:30:00+08'),
  (m2, v_admin_id, 'approved', 'Approved as SMEL-L-002 (Life, Small)',          'TT/2021/045', '2021-03-20 10:15:00+08'),
  (m3, v_admin_id, 'approved', 'Approved as SMEL-O-001 (Ordinary, Micro)',      'TT/2022/012', '2022-02-01 11:00:00+08'),
  (m4, v_admin_id, 'approved', 'Approved as SMEL-O-002 (Ordinary, Micro)',      'TT/2022/056', '2022-05-15 09:45:00+08'),
  (m3, v_admin_id, 'renewed',  'Annual renewal approved, expiry to 2026-02-01', 'TT/2025/008', '2025-02-03 14:20:00+08'),
  (m4, v_admin_id, 'renewed',  'Annual renewal approved, expiry to 2026-05-15', 'TT/2025/051', '2025-05-16 10:30:00+08'),
  (m5, v_admin_id, 'rejected', 'Renewal not processed — member did not pay',    NULL,          '2024-09-01 09:00:00+08'),
  (m6, v_admin_id, 'rejected', 'Renewal not processed — member did not pay',    NULL,          '2024-12-01 09:00:00+08'),
  (m7, v_admin_id, 'approved', 'New application received — pending review',     NULL,          now() - interval '2 days'),
  (m8, v_admin_id, 'approved', 'New application received — pending review',     NULL,          now() - interval '1 day');
END $$;
