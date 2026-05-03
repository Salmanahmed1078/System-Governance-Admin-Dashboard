-- ===================================================================
-- MODULE 9 SEED DATA — Local Development & Grading
-- Run after SPM_Centralized_Db.sql schema
-- ===================================================================

-- Skills
INSERT INTO skills (skill_name, category, is_active) VALUES
('React', 'Frontend', true), ('Next.js', 'Frontend', true), ('Python', 'Backend', true),
('Node.js', 'Backend', true), ('PostgreSQL', 'Database', true), ('Docker', 'DevOps', true),
('UI/UX Design', 'Design', true), ('Machine Learning', 'AI', true), ('Cloud Architecture', 'DevOps', true),
('TypeScript', 'Frontend', true), ('GraphQL', 'Backend', true), ('DevOps', 'DevOps', true),
('Flutter', 'Mobile', true), ('Kubernetes', 'DevOps', true), ('Data Science', 'AI', true),
('System Architecture', 'Backend', true), ('QA Testing', 'QA', true), ('Blockchain', 'Backend', true),
('Vue.js', 'Frontend', true), ('Django', 'Backend', true)
ON CONFLICT (skill_name) DO NOTHING;

-- Marketplace categories
INSERT INTO marketplace_categories (name, slug, description, is_active) VALUES
('Web Development', 'web-development', 'Frontend and backend web projects', true),
('Mobile Development', 'mobile-development', 'iOS and Android development', true),
('Data Science & AI', 'data-science-ai', 'ML, AI and data analytics', true),
('UI/UX Design', 'ui-ux-design', 'Interface and experience design', true),
('DevOps & Cloud', 'devops-cloud', 'Infrastructure and deployment', true),
('QA & Testing', 'qa-testing', 'Quality assurance and testing', true),
('Blockchain', 'blockchain', 'Smart contracts and DeFi', true)
ON CONFLICT (name) DO NOTHING;

-- Users (admins, freelancers, clients)
INSERT INTO users (email, password_hash, first_name, last_name, role, account_status, is_email_verified, is_identity_verified, country, created_at) VALUES
-- Admins
('admin@platform.io', '$2b$10$hashedpw1', 'James', 'Admin', 'admin'::user_role, 'active'::account_status, true, true, 'US', NOW() - INTERVAL '365 days'),
('mod@platform.io', '$2b$10$hashedpw2', 'Sara', 'Moderator', 'moderator'::user_role, 'active'::account_status, true, true, 'UK', NOW() - INTERVAL '300 days'),
-- Freelancers
('fl.alice@example.com', '$2b$10$hashedpw3', 'Alice', 'Chen', 'freelancer'::user_role, 'active'::account_status, true, true, 'US', NOW() - INTERVAL '280 days'),
('fl.bob@example.com', '$2b$10$hashedpw4', 'Bob', 'Martinez', 'freelancer'::user_role, 'active'::account_status, true, true, 'CA', NOW() - INTERVAL '250 days'),
('fl.carol@example.com', '$2b$10$hashedpw5', 'Carol', 'Singh', 'freelancer'::user_role, 'active'::account_status, true, true, 'IN', NOW() - INTERVAL '230 days'),
('fl.david@example.com', '$2b$10$hashedpw6', 'David', 'Lee', 'freelancer'::user_role, 'active'::account_status, true, true, 'KR', NOW() - INTERVAL '220 days'),
('fl.eve@example.com', '$2b$10$hashedpw7', 'Eve', 'Johnson', 'freelancer'::user_role, 'active'::account_status, true, true, 'AU', NOW() - INTERVAL '200 days'),
('fl.frank@example.com', '$2b$10$hashedpw8', 'Frank', 'Williams', 'freelancer'::user_role, 'active'::account_status, true, false, 'DE', NOW() - INTERVAL '180 days'),
('fl.grace@example.com', '$2b$10$hashedpw9', 'Grace', 'Brown', 'freelancer'::user_role, 'active'::account_status, true, true, 'FR', NOW() - INTERVAL '160 days'),
('fl.henry@example.com', '$2b$10$hashedpw10', 'Henry', 'Davis', 'freelancer'::user_role, 'active'::account_status, true, true, 'US', NOW() - INTERVAL '140 days'),
('fl.iris@example.com', '$2b$10$hashedpw11', 'Iris', 'Wilson', 'freelancer'::user_role, 'active'::account_status, true, true, 'UK', NOW() - INTERVAL '120 days'),
('fl.jack@example.com', '$2b$10$hashedpw12', 'Jack', 'Taylor', 'freelancer'::user_role, 'active'::account_status, true, false, 'CA', NOW() - INTERVAL '100 days'),
('fl.kate@example.com', '$2b$10$hashedpw13', 'Kate', 'Anderson', 'freelancer'::user_role, 'active'::account_status, true, true, 'NZ', NOW() - INTERVAL '90 days'),
('fl.liam@example.com', '$2b$10$hashedpw14', 'Liam', 'Thomas', 'freelancer'::user_role, 'active'::account_status, true, true, 'US', NOW() - INTERVAL '80 days'),
('fl.mia@example.com', '$2b$10$hashedpw15', 'Mia', 'Jackson', 'freelancer'::user_role, 'active'::account_status, true, true, 'IN', NOW() - INTERVAL '70 days'),
('fl.noah@example.com', '$2b$10$hashedpw16', 'Noah', 'White', 'freelancer'::user_role, 'suspended'::account_status, true, true, 'US', NOW() - INTERVAL '60 days'),
('fl.olivia@example.com', '$2b$10$hashedpw17', 'Olivia', 'Harris', 'freelancer'::user_role, 'active'::account_status, true, true, 'AU', NOW() - INTERVAL '50 days'),
('fl.peter@example.com', '$2b$10$hashedpw18', 'Peter', 'Martin', 'freelancer'::user_role, 'active'::account_status, false, false, 'ZA', NOW() - INTERVAL '40 days'),
('fl.quinn@example.com', '$2b$10$hashedpw19', 'Quinn', 'Garcia', 'freelancer'::user_role, 'active'::account_status, true, true, 'MX', NOW() - INTERVAL '30 days'),
('fl.rose@example.com', '$2b$10$hashedpw20', 'Rose', 'Thompson', 'freelancer'::user_role, 'active'::account_status, true, true, 'US', NOW() - INTERVAL '20 days'),
('fl.sam@example.com', '$2b$10$hashedpw21', 'Sam', 'Robinson', 'freelancer'::user_role, 'active'::account_status, true, false, 'UK', NOW() - INTERVAL '10 days'),
-- Clients
('cl.techcorp@example.com', '$2b$10$hashedpw22', 'Tech', 'Corp', 'client'::user_role, 'active'::account_status, true, true, 'US', NOW() - INTERVAL '270 days'),
('cl.startup@example.com', '$2b$10$hashedpw23', 'Startup', 'Hub', 'client'::user_role, 'active'::account_status, true, true, 'UK', NOW() - INTERVAL '240 days'),
('cl.mediahouse@example.com', '$2b$10$hashedpw24', 'Media', 'House', 'client'::user_role, 'active'::account_status, true, false, 'CA', NOW() - INTERVAL '210 days'),
('cl.fintech@example.com', '$2b$10$hashedpw25', 'Fin', 'Tech', 'client'::user_role, 'active'::account_status, true, true, 'SG', NOW() - INTERVAL '180 days'),
('cl.healthco@example.com', '$2b$10$hashedpw26', 'Health', 'Co', 'client'::user_role, 'active'::account_status, true, true, 'AU', NOW() - INTERVAL '150 days'),
('cl.retailinc@example.com', '$2b$10$hashedpw27', 'Retail', 'Inc', 'client'::user_role, 'active'::account_status, true, true, 'US', NOW() - INTERVAL '120 days'),
('cl.edubrand@example.com', '$2b$10$hashedpw28', 'Edu', 'Brand', 'client'::user_role, 'active'::account_status, true, false, 'IN', NOW() - INTERVAL '90 days'),
('cl.logistix@example.com', '$2b$10$hashedpw29', 'Logis', 'Tix', 'client'::user_role, 'active'::account_status, true, true, 'DE', NOW() - INTERVAL '60 days'),
('cl.aiventures@example.com', '$2b$10$hashedpw30', 'AI', 'Ventures', 'client'::user_role, 'active'::account_status, true, true, 'US', NOW() - INTERVAL '30 days')
ON CONFLICT (email) DO NOTHING;

-- Profiles for freelancers (users 3–20)
INSERT INTO profiles (user_id, headline, bio, location, hourly_rate, experience_years, availability_status, trust_score, total_reviews, average_rating, tier_level)
SELECT 
  u.id,
  CASE u.role WHEN 'freelancer' THEN 'Senior ' || (ARRAY['Full-Stack Dev','Data Scientist','UI/UX Designer','Cloud Architect','ML Engineer','DevOps Engineer','QA Lead','Blockchain Dev','Mobile Dev','System Architect'])[((u.id - 3) % 10) + 1] END,
  'Experienced professional with a passion for delivering high-quality results.',
  CASE (u.id % 5) WHEN 0 THEN 'New York, US' WHEN 1 THEN 'London, UK' WHEN 2 THEN 'Toronto, CA' WHEN 3 THEN 'Sydney, AU' ELSE 'Berlin, DE' END,
  (50 + (u.id * 7) % 150)::decimal,
  ((u.id % 10) + 1)::decimal,
  'available',
  (3.5 + ((u.id * 0.13) % 1.5))::numeric(3,2),
  (u.id * 3 % 50) + 5,
  (4.0 + ((u.id * 0.04) % 0.9))::numeric(2,1),
  CASE (u.id % 3) WHEN 0 THEN 'elite' WHEN 1 THEN 'advanced' ELSE 'intermediate' END
FROM users u WHERE u.role = 'freelancer'
ON CONFLICT (user_id) DO NOTHING;

-- Jobs (posted by clients): spread across YTD with per-row hash — avoids identical 7‑day ladders from every client pairing (which drew the “pulse” chart).
INSERT INTO jobs (client_id, title, description, category_id, budget_min, budget_max, deadline, status, created_at)
SELECT
  c.id,
  (ARRAY[
    'Build a React Dashboard', 'Python ML Pipeline', 'Mobile App UI Redesign',
    'PostgreSQL Performance Tuning', 'Docker/K8s Migration', 'E-commerce Platform',
    'AI Chatbot Integration', 'REST API Development', 'Cloud Infrastructure Setup',
    'QA Automation Framework', 'Blockchain Smart Contract', 'Data Visualization Tool',
    'Next.js Web App', 'DevOps CI/CD Pipeline', 'Flutter Mobile App'
  ])[(gs % 15) + 1],
  'Detailed project description for professional freelancers with relevant skills and experience.',
  (gs % 7) + 1,
  (500 + gs * 100)::decimal,
  (1500 + gs * 200)::decimal,
  CURRENT_DATE + (gs * 3) + 10,
  (ARRAY['open','in_progress','completed','completed','open'])[gs % 5 + 1],
  (DATE_TRUNC('year', CURRENT_DATE)::date)::timestamptz
    + (
        MOD(
          ABS(hashtext(CONCAT_WS('|', 'jobseed', c.id::text, gs::text))),
          GREATEST(1, (CURRENT_DATE - DATE_TRUNC('year', CURRENT_DATE)::date)::integer + 1)
        )
        * INTERVAL '1 day'
      )
    + (MOD(ABS(hashtext(CONCAT_WS('s', c.email, gs::text))), 86400) * INTERVAL '1 second')
FROM users c, generate_series(1, 30) gs
WHERE c.role = 'client'
LIMIT 60;

-- Bids
INSERT INTO bids (job_id, freelancer_id, cover_letter, proposed_rate, estimated_days, status, submitted_at)
SELECT
  j.id,
  f.id,
  'I am highly qualified for this project and can deliver excellent results on time.',
  (j.budget_min + ((f.id * 50) % (j.budget_max - j.budget_min + 1)::int))::decimal,
  (7 + (f.id % 23)),
  CASE j.status 
    WHEN 'completed' THEN 'accepted'
    WHEN 'in_progress' THEN (ARRAY['accepted','rejected','pending'])[f.id % 3 + 1]
    ELSE 'pending'
  END,
  j.created_at + (
      MOD(
        ABS(hashtext(CONCAT_WS(':', 'bid', j.id::text, f.id::text))),
        GREATEST(
          60,
          CEIL(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - j.created_at - INTERVAL '1 minute')))::integer
        )
      )::bigint * INTERVAL '1 second'
    )
FROM jobs j
CROSS JOIN (SELECT id FROM users WHERE role = 'freelancer' LIMIT 10) f
ON CONFLICT (job_id, freelancer_id) DO NOTHING;

-- ── Extra workload for Platform Activity (jobs + bids) — bursty multi-day variance, deterministic (not uniform 7-day spacing)
INSERT INTO jobs (client_id, title, description, category_id, budget_min, budget_max, deadline, status, created_at)
SELECT
  cli.id AS client_id,
  'Workload spread job ' || gs::text,
  'Synthetic daily distribution for dashboard trend (deterministic offsets).',
  1 + ((gs + 2) % 7),
  LEAST(
    (750 + ((gs % 42) * 55))::decimal,
    (2100 + ((gs % 55) * 85))::decimal
  ),
  GREATEST(
    (750 + ((gs % 42) * 55))::decimal,
    (2100 + ((gs % 55) * 85))::decimal
  ),
  CURRENT_DATE + 40 + ((gs % 35)),
  (ARRAY['open', 'open', 'open', 'in_progress', 'completed']) [1 + (gs % 5)],
  (DATE_TRUNC('year', CURRENT_DATE)::date)::timestamptz
    + (MOD(ABS(hashtext('wl|' || gs::text)), span.n_days) * INTERVAL '1 day')
    + (MOD(ABS(hashtext('wx|' || gs::text)), 86400) * INTERVAL '1 second')
FROM generate_series(1, 290) gs
CROSS JOIN LATERAL (
  SELECT GREATEST(1, (CURRENT_DATE - DATE_TRUNC('year', CURRENT_DATE)::date)::integer + 1) AS n_days
) span
CROSS JOIN LATERAL (
  SELECT COUNT(*)::int AS n FROM users WHERE role = 'client'
) cc
JOIN LATERAL (
  SELECT id FROM users WHERE role = 'client' ORDER BY id
  OFFSET ((gs - 1) % cc.n)
  FETCH FIRST ROW ONLY
) cli ON cc.n > 0;

INSERT INTO bids (job_id, freelancer_id, cover_letter, proposed_rate, estimated_days, status, submitted_at)
SELECT DISTINCT ON (j.id, fx.id)
  j.id,
  fx.id,
  'Workload spread bid.',
  LEAST(GREATEST(j.budget_min, j.budget_min + ((fx.id * 173) % 1800)::numeric + 120), j.budget_max)::decimal,
  6 + MOD(ABS(hashtext(concat(',', j.id::text, ',', fx.id::text))), 28),
  CASE
    WHEN j.status IN ('completed', 'in_progress') AND (fx.id % 7) = (j.id % 7) THEN 'accepted'
    WHEN MOD(ABS(hashtext(concat_ws(':', 'p', j.id::text, fx.id::text))), 5) <= 3 THEN 'pending'
    ELSE 'rejected'
  END,
  j.created_at + (
      MOD(
        ABS(hashtext(CONCAT_WS('~', j.id::text, fx.id::text))),
        GREATEST(
          120,
          CEIL(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - j.created_at - INTERVAL '45 seconds')))::integer
        )
      )::bigint * INTERVAL '1 second'
    )
FROM jobs j
INNER JOIN users fx ON fx.role = 'freelancer'
  AND MOD(ABS(hashtext(concat_ws(':', 'bid', j.id::text, fx.id::text))), 23) BETWEEN 17 AND 20
WHERE j.description = 'Synthetic daily distribution for dashboard trend (deterministic offsets).'
ORDER BY j.id, fx.id
ON CONFLICT (job_id, freelancer_id) DO NOTHING;

-- Projects (from accepted bids)
INSERT INTO projects (job_id, bid_id, client_id, freelancer_id, title, description, agreed_amount, currency, status, start_date, deadline, completed_at, created_at)
SELECT DISTINCT ON (b.job_id)
  b.job_id,
  b.id,
  j.client_id,
  b.freelancer_id,
  j.title,
  j.description,
  b.proposed_rate,
  'USD',
  (CASE j.status WHEN 'completed' THEN 'completed' WHEN 'in_progress' THEN 'in_progress' ELSE 'open' END)::contract_status,
  j.created_at::date + 3,
  j.deadline,
  CASE WHEN j.status = 'completed' THEN j.created_at + '45 days'::interval ELSE NULL END,
  j.created_at + '3 days'::interval
FROM bids b
JOIN jobs j ON j.id = b.job_id
WHERE b.status = 'accepted'
LIMIT 30
ON CONFLICT (bid_id) DO NOTHING;

-- Reviews (freelancers get reviewed)
INSERT INTO reviews (freelancer_id, reviewer_id, rating, comment, communication_rating, quality_rating, deadline_rating, is_public, created_at)
SELECT
  p.freelancer_id,
  p.client_id,
  (4 + (p.id % 2)),
  (ARRAY['Excellent work! Highly recommend.','Great communication and quality delivery.','Met all deadlines, very professional.','Outstanding results, will hire again.','Good work, minor revisions needed.'])[p.id % 5 + 1],
  (4 + (p.id % 2)),
  (4 + ((p.id + 1) % 2)),
  (3 + (p.id % 3)),
  true,
  LEAST(
    COALESCE(p.completed_at, p.created_at)
      + ((p.id % 7) + 1) * INTERVAL '1 day'
      + ((p.id % 18) || ' hours')::interval,
    CURRENT_TIMESTAMP - INTERVAL '1 minute'
  )
FROM projects p
WHERE p.status = 'completed';

-- Verification requests
INSERT INTO verification_requests (user_id, verification_type, verification_status, requested_at, reviewed_at)
SELECT
  u.id,
  (ARRAY['identity','skill','professional','email'])[u.id % 4 + 1],
  (ARRAY['verified','pending','in_review','rejected','verified','verified'])[u.id % 6 + 1]::verification_status,
  CURRENT_TIMESTAMP - ((MOD(u.id * 17, 26) || ' hours')::interval * (MOD(u.id, 18) + 1)),
  CASE
    WHEN u.id % 6 < 4
    THEN CURRENT_TIMESTAMP - ((MOD(u.id * 13, 22) || ' hours')::interval * (MOD(u.id, 14) + 1))
    ELSE NULL
  END
FROM users u WHERE u.role IN ('freelancer', 'client');

-- Gamification user progress (for freelancers)
INSERT INTO gamification_user_progress (user_id, total_points, current_level, activity_count, avg_rating, completion_rate, trust_score, streak_days, created_at, updated_at)
SELECT
  u.id,
  (500 + u.id * 47) % 5000,
  (u.id % 10) + 1,
  (u.id * 3) % 100 + 10,
  (4.0 + ((u.id * 0.06) % 0.9))::numeric(3,2),
  (0.80 + ((u.id * 0.008) % 0.18))::numeric(5,4),
  (60 + (u.id * 1.7) % 35)::numeric(5,2),
  (u.id % 30),
  NOW() - ((u.id * 10) || ' days')::interval,
  NOW() - ((u.id * 2) || ' days')::interval
FROM users u WHERE u.role = 'freelancer'
ON CONFLICT (user_id) DO NOTHING;

-- Wallets for all users
INSERT INTO wallets (user_id, currency_code, available_balance, held_balance, reserved_balance, wallet_status)
SELECT id, 'USD', (id * 137 % 5000)::decimal, (id * 23 % 500)::decimal, 0, 'active'
FROM users
ON CONFLICT (user_id) DO NOTHING;

-- Transactions
INSERT INTO transactions (wallet_id, sender_user_id, receiver_user_id, transaction_type, amount, currency_code, status, created_at, processed_at)
SELECT
  w.id,
  p.client_id,
  p.freelancer_id,
  'project_payment',
  p.agreed_amount,
  'USD',
  'completed',
  p.created_at + '48 days'::interval,
  p.created_at + '48 days'::interval + '2 hours'::interval
FROM projects p
JOIN wallets w ON w.user_id = p.client_id
WHERE p.status = 'completed';

-- Job required skills
INSERT INTO job_required_skills (job_id, skill_id, skill_name, created_at)
SELECT
  j.id,
  s.id,
  s.skill_name,
  j.created_at
FROM jobs j
CROSS JOIN (SELECT id, skill_name FROM skills ORDER BY id LIMIT 8) s
WHERE j.id % 8 = s.id % 8
ON CONFLICT (job_id, skill_id) DO NOTHING;

-- Extra skills per posting (stronger KPI “Top Skill Demand” + Skills page mix)
INSERT INTO job_required_skills (job_id, skill_id, skill_name, created_at)
SELECT j.id, s.id, s.skill_name, j.created_at
FROM jobs j
CROSS JOIN LATERAL (
  SELECT id, skill_name FROM skills WHERE is_active ORDER BY id
  OFFSET (MOD(j.id + 11, GREATEST(1, (SELECT COUNT(*) FROM skills WHERE is_active)))) LIMIT 1
) s
ON CONFLICT (job_id, skill_id) DO NOTHING;
INSERT INTO job_required_skills (job_id, skill_id, skill_name, created_at)
SELECT j.id, s.id, s.skill_name, j.created_at
FROM jobs j
CROSS JOIN LATERAL (
  SELECT id, skill_name FROM skills WHERE is_active ORDER BY id
  OFFSET (MOD(j.id * 17 + 3, GREATEST(1, (SELECT COUNT(*) FROM skills WHERE is_active)))) LIMIT 1
) s
ON CONFLICT (job_id, skill_id) DO NOTHING;
INSERT INTO job_required_skills (job_id, skill_id, skill_name, created_at)
SELECT j.id, s.id, s.skill_name, j.created_at
FROM jobs j
CROSS JOIN LATERAL (
  SELECT id, skill_name FROM skills WHERE is_active ORDER BY id
  OFFSET (MOD(j.id * 41 + 19, GREATEST(1, (SELECT COUNT(*) FROM skills WHERE is_active)))) LIMIT 1
) s
ON CONFLICT (job_id, skill_id) DO NOTHING;

-- User skills
INSERT INTO user_skills (user_id, skill_id, skill_level, years_of_experience, is_certified, verified_by_test, test_score, created_at)
SELECT
  u.id,
  s.id,
  (ARRAY['beginner','intermediate','advanced','expert'])[((u.id + s.id) % 4) + 1]::skill_level,
  ((u.id + s.id) % 8 + 1)::decimal,
  (u.id + s.id) % 3 = 0,
  (u.id + s.id) % 2 = 0,
  CASE WHEN (u.id + s.id) % 2 = 0 THEN 60 + (u.id * s.id % 40) ELSE NULL END,
  NOW() - ((u.id * 7 + s.id) || ' days')::interval
FROM users u
CROSS JOIN skills s
WHERE u.role = 'freelancer' AND (u.id + s.id) % 3 < 2
ON CONFLICT (user_id, skill_id) DO NOTHING;

-- ===================================================================
-- MODULE 9 TABLES
-- ===================================================================

-- M9 KPI Snapshots (last 90 days)
INSERT INTO m9_kpi_snapshots (snapshot_date, total_users, active_freelancers, active_clients, total_projects, completed_projects, disputed_projects, total_transaction_volume, platform_revenue, avg_project_completion_days, avg_rating, certifications_issued, active_gigs, created_at)
SELECT
  CURRENT_DATE - gs,
  450 + (gs * 2 % 80),
  280 + (gs % 40),
  120 + (gs % 20),
  600 + (gs % 100),
  400 + (gs % 80),
  5 + (gs % 8),
  (85000 + gs * 1200 + (gs * gs % 5000))::decimal,
  (8500 + gs * 120 + (gs * gs % 500))::decimal,
  (28 + (gs % 12))::decimal,
  (4.20 + ((gs % 10) * 0.05))::numeric(3,2),
  15 + (gs % 10),
  180 + (gs % 40),
  NOW() - (gs || ' days')::interval
FROM generate_series(0, 89) gs
ON CONFLICT (snapshot_date) DO NOTHING;

-- M9 Monitoring Rules
INSERT INTO m9_monitoring_rules (rule_name, metric_name, operator, threshold, severity, evaluation_interval_minutes, is_active, created_at) VALUES
('CPU Usage Threshold', 'cpu_usage_percent', '>', 85, 'critical', 5, true, NOW() - INTERVAL '60 days'),
('Memory Pressure', 'free_memory_mb', '<', 256, 'warning', 5, true, NOW() - INTERVAL '60 days'),
('Auth Failure Velocity', 'failed_logins_per_minute', '>', 10, 'critical', 1, true, NOW() - INTERVAL '55 days'),
('Disk I/O Latency', 'disk_latency_ms', '>', 200, 'warning', 10, false, NOW() - INTERVAL '55 days'),
('Traffic Anomaly L3', 'requests_per_minute', '>', 5000, 'warning', 5, true, NOW() - INTERVAL '50 days'),
('DB Capacity Threshold', 'db_connections_percent', '>', 90, 'critical', 3, true, NOW() - INTERVAL '45 days'),
('API Response Time', 'api_response_ms', '>', 2000, 'warning', 5, true, NOW() - INTERVAL '40 days'),
('System Maintenance Log', 'scheduled_backup_status', '=', 1, 'info', 1440, true, NOW() - INTERVAL '35 days'),
('Error Rate Spike', 'error_rate_percent', '>', 5, 'warning', 5, true, NOW() - INTERVAL '30 days'),
('Queue Backlog Alert', 'queue_depth', '>', 1000, 'warning', 10, true, NOW() - INTERVAL '25 days'),
('Export Job Monitor', 'export_job_duration_sec', '>', 300, 'info', 60, true, NOW() - INTERVAL '20 days'),
('New User Fraud Score', 'fraud_score', '>', 0.8, 'critical', 15, true, NOW() - INTERVAL '15 days'),
('Payment Gateway Latency', 'payment_latency_ms', '>', 3000, 'warning', 5, true, NOW() - INTERVAL '10 days'),
('Null Bid Rate', 'zero_bid_jobs_percent', '>', 30, 'info', 60, true, NOW() - INTERVAL '5 days')
ON CONFLICT (rule_name) DO NOTHING;

-- ===================================================================
-- M9 DEMO EVENT DATA (analytics, alerts, exports) — graphs read Tables only at runtime.
-- Scheduler may mutate alert rows live; seeded rows coexist for UI demos.
-- ===================================================================

INSERT INTO ec_skill_assessments (skill_id, assessment_name, description, difficulty_level, is_active) VALUES
  (2, 'TypeScript Lint Lab', 'Practical lint & types.', 'advanced', true),
  (9, 'Cloud Architecture Drill', 'Service design prompts.', 'expert', true),
  (12, 'GraphQL Queries', 'Schema & resolver basics.', 'intermediate', true)
ON CONFLICT (skill_id, assessment_name) DO NOTHING;

-- Extra reviews spanning last ~90 days (Quality Score Distribution in range windows)
INSERT INTO reviews (freelancer_id, reviewer_id, rating, comment, communication_rating, quality_rating, deadline_rating, is_public, created_at)
SELECT
  f.id,
  c.id,
  (ARRAY[5, 5, 4, 4, 5, 3, 5, 4, 3, 5, 4, 2, 5, 5, 4, 1, 5, 3])[
    1 + MOD(ABS(hashtext(concat_ws('~', f.id::text, c.id::text, rn::text))), 18)],
  'Synthetic review aggregate for KPI quality chart.',
  4 + MOD(rn + f.id::int + c.id::int, 2),
  4 + MOD(rn + f.id::int + 3, 2),
  3 + MOD(rn + c.id::int, 3),
  true,
  LEAST(
    CURRENT_TIMESTAMP - INTERVAL '45 seconds',
    CURRENT_TIMESTAMP - (MOD(ABS(hashtext(concat('|', f.id::text, c.id::text, rn::text))), 91) || ' days')::interval
      - (MOD(ABS(hashtext(concat('s', f.id::text, c.id::text, rn::text))), 86300) || ' seconds')::interval
  )
FROM users f
CROSS JOIN users c
CROSS JOIN generate_series(1, 2) AS rn
WHERE f.role = 'freelancer'
  AND c.role = 'client'
  AND f.id <> c.id
  AND MOD(ABS(hashtext(concat('x', f.id::text, c.id::text, rn::text))), 37) BETWEEN 22 AND 32
LIMIT 220;

UPDATE users SET created_at = CURRENT_TIMESTAMP
  - ((MOD(id * 7919 + 331, 40) || ' days')::interval + (MOD(id * 9931, 86400) || ' seconds')::interval)
WHERE role IN ('freelancer', 'client')
  AND account_status = 'active';

-- Usage page + KPI totalSessions + audits (page_view telemetry)
INSERT INTO m9_analytics_logs (session_id, user_id, role_flag, action, metadata, ip_address, log_timestamp)
SELECT
  'm9demo-sess-' || gs::text,
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
  (ARRAY['admin', 'admin', 'moderator', 'analyst', 'analyst'])[1 + MOD(gs::bigint, 5)],
  CASE
    WHEN MOD(gs::bigint, 23) = 0 THEN 'export_triggered'
    WHEN MOD(gs::bigint, 91) = 0 THEN 'failed_login_demo'
    WHEN MOD(gs::bigint, 151) = 0 THEN 'backup_completed'
    ELSE 'page_view'
  END::varchar(100),
  jsonb_strip_nulls(jsonb_build_object(
    'page', (ARRAY['/dashboard','/skills','/clients','/usage','/alerts','/freelancers'])[1 + MOD(gs::bigint, 6)],
    'device', (ARRAY['desktop','mobile','tablet'])[1 + MOD(gs::bigint, 3)],
    'browser', (ARRAY['Chrome','Firefox','Safari','Edge'])[1 + MOD(gs::bigint, 4)],
    'duration_ms', (400 + MOD(gs * 313, 120000)),
    'export_type', CASE WHEN MOD(gs::bigint, 23) = 0 THEN 'platform_kpis' ELSE NULL END
  )),
  (('192.168.' || LEAST(MOD(gs::int, 223) + 1, 253)::text || '.' || LEAST(MOD(gs * 17, 251) + 1, 253)::text))::inet,
  CURRENT_TIMESTAMP
    - ((MOD(gs * 83, 40) || ' days')::interval + (MOD(gs * 971, 86400) || ' seconds')::interval)
FROM generate_series(1, 520) AS gs;

-- Governance alert feed samples
INSERT INTO m9_alert_records (rule_id, metric_value, expected_value, deviation_percentage, triggered_at, resolved_at, status, resolution_notes, auto_resolved)
SELECT
  r.rule_id,
  ROUND(((r.threshold * (112 + MOD(gs::bigint, 55))) / 100)::numeric, 4),
  r.threshold,
  (8 + MOD(gs::bigint, 120))::numeric(8,2),
  CURRENT_TIMESTAMP - ((MOD(gs * 139, 45) || ' hours')::interval * (MOD(gs::bigint, 8) + 1)),
  CASE
    WHEN MOD(gs::bigint, 9) BETWEEN 7 AND 8
    THEN CURRENT_TIMESTAMP - ((MOD(gs * 173, 30) || ' hours')::interval)
    ELSE NULL
  END,
  CASE MOD(gs::bigint, 13)
    WHEN 0 THEN 'acknowledged'::varchar(20)
    WHEN 11 THEN 'resolved'::varchar(20)
    ELSE 'open'::varchar(20)
  END,
  'Demo seeded alert row for Overview / Alerts UX.',
  (MOD(gs::bigint, 13) = 11)
FROM generate_series(1, 56) gs
JOIN LATERAL (
  SELECT rule_id, threshold
  FROM m9_monitoring_rules
  ORDER BY rule_id
  OFFSET MOD(gs::bigint, GREATEST(1, (SELECT COUNT(*) FROM m9_monitoring_rules)::int))
  FETCH FIRST ROW ONLY
) r ON TRUE;

-- Export history (Reports page)
INSERT INTO m9_export_records (admin_id, format, export_type, filters_applied, row_count, file_size_bytes, file_url, generated_at, expires_at)
SELECT
  u.id,
  (ARRAY['CSV', 'CSV', 'PDF'])[1 + MOD(gs::bigint, 3)],
  (ARRAY[
    'freelancer_analytics', 'client_statistics', 'skill_trends', 'platform_kpis', 'audit_log', 'usage_report'
  ])[1 + MOD(gs::bigint, 6)],
  '{"dateRange":"30d"}'::jsonb,
  (80 + MOD(gs * 19, 400))::integer,
  (7500 + MOD(gs * 113, 400000))::bigint,
  '/demo/exports/mock-' || gs::text || '.bin',
  CURRENT_TIMESTAMP - ((MOD(gs * 113, 25) || ' days')::interval + (MOD(gs * 997, 3600) || ' seconds')::interval),
  CURRENT_TIMESTAMP + ((60 + MOD(gs::bigint, 120)) || ' days')::interval
FROM generate_series(1, 14) gs
JOIN LATERAL (SELECT id FROM users WHERE role = 'admin' LIMIT 1) u ON TRUE;
