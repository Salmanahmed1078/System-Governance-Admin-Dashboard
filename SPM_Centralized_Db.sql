-- ===================================================================
-- NATIONAL FREELANCE & SKILL VERIFICATION PLATFORM
-- FINAL MERGED SCHEMA - PRODUCTION READY
-- Total Tables: 115 | Hybrid Identifier Security | Full Audit Trails
-- ===================================================================

-- ===================================================================
-- ENUMS
-- ===================================================================

CREATE TYPE user_role AS ENUM ('freelancer', 'client', 'admin', 'moderator');
CREATE TYPE account_status AS ENUM ('active', 'suspended', 'banned', 'pending_verification');
CREATE TYPE contract_status AS ENUM ('open', 'in_progress', 'under_review', 'completed', 'disputed', 'cancelled');
CREATE TYPE escrow_status AS ENUM ('pending', 'active', 'partial', 'completed', 'frozen', 'refunded', 'cancelled');
CREATE TYPE dispute_status AS ENUM ('submitted', 'evidence_uploaded', 'under_review', 'mediation', 'admin_arbitration', 'resolution_completed');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'active', 'completed', 'cancelled', 'disputed');
CREATE TYPE skill_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
CREATE TYPE verification_status AS ENUM ('pending', 'in_review', 'verified', 'rejected', 'expired');

-- ===================================================================
-- MODULE 1: USER IDENTITY, PROFILE & PORTFOLIO
-- ===================================================================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    display_name VARCHAR(100) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    role user_role NOT NULL DEFAULT 'freelancer',
    account_status account_status DEFAULT 'active',
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_identity_verified BOOLEAN DEFAULT FALSE,
    phone_number VARCHAR(20),
    country VARCHAR(100),
    profile_flags INTEGER DEFAULT 0,
    moderation_notes TEXT,
    last_moderated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    last_moderated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    headline VARCHAR(150),
    bio TEXT,
    location VARCHAR(100),
    profile_image_url VARCHAR(500),
    banner_image_url VARCHAR(500),
    hourly_rate DECIMAL(18,4),
    experience_years DECIMAL(3,1) DEFAULT 0,
    availability_status VARCHAR(20) DEFAULT 'available',
    impact_points INTEGER DEFAULT 0,
    social_contribution_level VARCHAR(20) DEFAULT 'bronze',
    national_builder_badge BOOLEAN DEFAULT FALSE,
    reputation_level INTEGER DEFAULT 1,
    tier_level VARCHAR(20) DEFAULT 'beginner',
    achievement_points INTEGER DEFAULT 0,
    trust_score NUMERIC(3,2) DEFAULT 0 CHECK (trust_score BETWEEN 0 AND 5),
    total_reviews INTEGER DEFAULT 0,
    average_rating NUMERIC(2,1) DEFAULT 0,
    skills TEXT[] DEFAULT '{}',
    badges TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE skills (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    skill_name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE skill_badges (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    badge_name VARCHAR(150) NOT NULL,
    level skill_level DEFAULT 'intermediate',
    issue_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    certificate_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, skill_id)
);

CREATE TABLE user_skills (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    skill_level skill_level DEFAULT 'intermediate',
    years_of_experience DECIMAL(3,1),
    is_certified BOOLEAN DEFAULT FALSE,
    verified_by_test BOOLEAN DEFAULT FALSE,
    test_score INTEGER,
    last_tested_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, skill_id)
);

CREATE TABLE certifications (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    certification_name VARCHAR(200) NOT NULL,
    issuing_authority VARCHAR(150) NOT NULL,
    credential_id VARCHAR(100),
    issue_date DATE NOT NULL,
    expiry_date DATE,
    verification_status verification_status DEFAULT 'pending',
    verification_url VARCHAR(500),
    certificate_file_url VARCHAR(500),
    verified_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE portfolio_projects (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    project_url VARCHAR(500),
    github_url VARCHAR(500),
    featured_image VARCHAR(500),
    is_featured BOOLEAN DEFAULT FALSE,
    completion_date DATE,
    sort_order INTEGER DEFAULT 0,
    technologies TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE project_technologies (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES portfolio_projects(id) ON DELETE CASCADE,
    skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    UNIQUE(project_id, skill_id)
);

CREATE TABLE work_history (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(150) NOT NULL,
    job_title VARCHAR(150) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    description TEXT,
    location VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    freelancer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contract_id INTEGER,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
    quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
    deadline_rating INTEGER CHECK (deadline_rating BETWEEN 1 AND 5),
    is_public BOOLEAN DEFAULT TRUE,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (freelancer_id != reviewer_id)
);

CREATE TABLE verification_requests (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    verification_type VARCHAR(50) NOT NULL CHECK (verification_type IN ('identity', 'email', 'phone', 'skill', 'professional')),
    verification_status verification_status DEFAULT 'pending',
    document_url VARCHAR(500),
    document_type VARCHAR(50),
    rejection_reason TEXT,
    verified_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMP,
    expires_at TIMESTAMP,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP
);

CREATE TABLE badges (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    badge_name VARCHAR(100) UNIQUE NOT NULL,
    badge_description TEXT,
    badge_icon_url VARCHAR(500),
    category VARCHAR(50),
    points_value INTEGER DEFAULT 0
);

CREATE TABLE user_badges (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id INTEGER NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    awarded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_displayed BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, badge_id)
);

-- ===================================================================
-- MODULE 2: SKILL TESTING & CERTIFICATION
-- ===================================================================

CREATE TABLE ec_skill_assessments (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    assessment_name VARCHAR(150) NOT NULL,
    description TEXT,
    difficulty_level skill_level DEFAULT 'intermediate',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(skill_id, assessment_name)
);

CREATE TABLE ec_questions (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    assessment_id INTEGER NOT NULL REFERENCES ec_skill_assessments(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('MCQ', 'CODING', 'PRACTICAL')),
    options JSONB,
    correct_answer TEXT NOT NULL,
    points INTEGER DEFAULT 1 CHECK (points > 0),
    explanation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ec_test_attempts (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assessment_id INTEGER NOT NULL REFERENCES ec_skill_assessments(id) ON DELETE CASCADE,
    score INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    percentage_score DECIMAL(5,2),
    status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'passed', 'failed', 'expired')),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    time_taken_seconds INTEGER
);

CREATE TABLE ec_submissions (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    attempt_id INTEGER NOT NULL REFERENCES ec_test_attempts(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES ec_questions(id) ON DELETE CASCADE,
    given_answer TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    points_earned INTEGER DEFAULT 0,
    auto_graded BOOLEAN DEFAULT FALSE,
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    reviewer_comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(attempt_id, question_id)
);

CREATE TABLE ec_certificates (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assessment_id INTEGER NOT NULL REFERENCES ec_skill_assessments(id) ON DELETE CASCADE,
    attempt_id INTEGER NOT NULL REFERENCES ec_test_attempts(id) ON DELETE CASCADE,
    certificate_number VARCHAR(100) UNIQUE NOT NULL,
    certificate_url VARCHAR(500),
    issue_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiry_date DATE,
    is_verified BOOLEAN DEFAULT TRUE,
    blockchain_hash VARCHAR(255),
    UNIQUE(user_id, assessment_id)
);

CREATE TABLE ec_proctoring_sessions (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    attempt_id INTEGER NOT NULL REFERENCES ec_test_attempts(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    proctor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'flagged', 'invalidated')),
    flagged_reason TEXT,
    screen_recording_url VARCHAR(500),
    webcam_images JSONB,
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================
-- MODULE 3: PROJECT & GIT MARKETPLACE
-- ===================================================================

CREATE TABLE marketplace_categories (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    parent_id INTEGER REFERENCES marketplace_categories(id) ON DELETE SET NULL,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    description TEXT,
    icon_url VARCHAR(500),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE marketplace_tags (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(80) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    tag_type VARCHAR(20) NOT NULL CHECK (tag_type IN ('skill', 'technology', 'industry', 'keyword')),
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category_id INTEGER NOT NULL REFERENCES marketplace_categories(id),
    budget_min DECIMAL(18,4) NOT NULL CHECK (budget_min >= 0),
    budget_max DECIMAL(18,4) NOT NULL CHECK (budget_max >= budget_min),
    deadline DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'in_progress', 'completed', 'cancelled', 'disputed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE job_required_skills (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    skill_name VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_id, skill_id)
);

CREATE TABLE bids (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    freelancer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cover_letter TEXT NOT NULL,
    proposed_rate DECIMAL(18,4) NOT NULL CHECK (proposed_rate >= 0),
    estimated_days INTEGER NOT NULL CHECK (estimated_days > 0),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_id, freelancer_id)
);

CREATE TABLE gigs (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    freelancer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES marketplace_categories(id),
    title VARCHAR(120) NOT NULL,
    description TEXT NOT NULL,
    base_price DECIMAL(18,4) NOT NULL CHECK (base_price >= 0),
    delivery_days INTEGER NOT NULL CHECK (delivery_days > 0),
    is_active BOOLEAN DEFAULT TRUE,
    revision_limit INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    orders_count INTEGER DEFAULT 0,
    rating_avg DECIMAL(2,1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE gig_pricing_tiers (
    id SERIAL PRIMARY KEY,
    gig_id INTEGER NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
    tier_name VARCHAR(20) NOT NULL CHECK (tier_name IN ('basic', 'standard', 'premium')),
    price DECIMAL(18,4) NOT NULL CHECK (price >= 0),
    delivery_days INTEGER NOT NULL CHECK (delivery_days > 0),
    deliverables TEXT NOT NULL,
    revisions INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(gig_id, tier_name)
);

CREATE TABLE gig_portfolio_samples (
    id SERIAL PRIMARY KEY,
    gig_id INTEGER NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
    file_url VARCHAR(512) NOT NULL,
    file_type VARCHAR(10) NOT NULL CHECK (file_type IN ('image', 'pdf', 'video')),
    file_size_kb INTEGER NOT NULL CHECK (file_size_kb <= 10240),
    display_order INTEGER DEFAULT 0,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE gig_required_skills (
    id SERIAL PRIMARY KEY,
    gig_id INTEGER NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES marketplace_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(gig_id, tag_id)
);

CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    job_id INTEGER NOT NULL REFERENCES jobs(id),
    bid_id INTEGER UNIQUE NOT NULL REFERENCES bids(id),
    client_id INTEGER NOT NULL REFERENCES users(id),
    freelancer_id INTEGER NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    agreed_amount DECIMAL(18,4) NOT NULL CHECK (agreed_amount >= 0),
    currency VARCHAR(3) DEFAULT 'USD',
    status contract_status NOT NULL DEFAULT 'open',
    start_date DATE NOT NULL,
    deadline DATE NOT NULL,
    is_milestone_based BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    admin_flag BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE project_milestones (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    amount DECIMAL(18,4) NOT NULL CHECK (amount >= 0),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'submitted', 'approved', 'rejected', 'paid')),
    due_date DATE NOT NULL,
    sort_order INTEGER NOT NULL,
    submitted_at TIMESTAMP,
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE project_git_repos (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    project_id INTEGER UNIQUE NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    repo_url VARCHAR(500) NOT NULL,
    repo_provider VARCHAR(20) DEFAULT 'github' CHECK (repo_provider IN ('github', 'gitlab', 'bitbucket')),
    repo_name VARCHAR(200) NOT NULL,
    branch VARCHAR(100) DEFAULT 'main',
    last_commit_hash VARCHAR(40),
    last_synced_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE marketplace_notifications_log (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    event_type VARCHAR(30) NOT NULL,
    triggered_by INTEGER NOT NULL REFERENCES users(id),
    recipient_id INTEGER NOT NULL REFERENCES users(id),
    reference_type VARCHAR(20) NOT NULL CHECK (reference_type IN ('job', 'bid', 'project', 'milestone', 'gig')),
    reference_id INTEGER NOT NULL,
    payload JSONB,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================
-- MODULE 5: COLLABORATION & TEAM WORKSPACE
-- ===================================================================

CREATE TABLE workspaces (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    project_id INTEGER UNIQUE NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE workspace_roles (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    role_name VARCHAR(100) NOT NULL,
    permissions JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(workspace_id, role_name)
);

CREATE TABLE workspace_members (
    workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES workspace_roles(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (workspace_id, user_id)
);

CREATE TABLE workspace_invitations (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    invited_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invitee_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    invitee_email VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(workspace_id, invitee_email)
);

CREATE TABLE workspace_tasks (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    parent_task_id INTEGER REFERENCES workspace_tasks(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'under_review', 'done')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    deadline TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE workspace_task_comments (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    task_id INTEGER NOT NULL REFERENCES workspace_tasks(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE workspace_files (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    task_id INTEGER REFERENCES workspace_tasks(id) ON DELETE SET NULL,
    uploaded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    mime_type VARCHAR(100),
    file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes >= 0),
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE workspace_activity_logs (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    actor_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER NOT NULL,
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workspace_settings (
    workspace_id INTEGER PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
    allow_task_comments BOOLEAN DEFAULT TRUE,
    allow_file_sharing BOOLEAN DEFAULT TRUE,
    default_task_visibility VARCHAR(20) DEFAULT 'all_members',
    retention_days INTEGER DEFAULT 30,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================
-- MODULE 6: COMMUNICATION & NOTIFICATIONS
-- ===================================================================

CREATE TABLE chat_rooms (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    room_type VARCHAR(10) NOT NULL CHECK (room_type IN ('direct', 'group')),
    room_name VARCHAR(100),
    workspace_id INTEGER REFERENCES workspaces(id) ON DELETE SET NULL,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    CHECK ((room_type = 'direct' AND room_name IS NULL) OR (room_type = 'group' AND room_name IS NOT NULL))
);

CREATE TABLE chat_room_members (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    room_id INTEGER NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    member_role VARCHAR(10) DEFAULT 'member' CHECK (member_role IN ('admin', 'member')),
    last_read_at TIMESTAMP,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    left_at TIMESTAMP,
    UNIQUE(room_id, user_id)
);

CREATE TABLE chat_media_files (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    uploader_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_id INTEGER NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(10) NOT NULL CHECK (file_type IN ('image', 'video', 'pdf', 'doc', 'other')),
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes >= 0),
    storage_url TEXT NOT NULL,
    thumbnail_url TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE chat_meeting_links (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_id INTEGER NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('zoom', 'google_meet', 'microsoft_teams', 'other')),
    meeting_url TEXT NOT NULL,
    meeting_id VARCHAR(100),
    passcode VARCHAR(50),
    scheduled_at TIMESTAMP,
    duration_minutes INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_expired BOOLEAN DEFAULT FALSE
);

CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    room_id INTEGER NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reply_to_msg_id INTEGER REFERENCES chat_messages(id) ON DELETE SET NULL,
    message_type VARCHAR(15) DEFAULT 'text' CHECK (message_type IN ('text', 'media', 'meeting_link', 'system', 'file')),
    content TEXT,
    media_id INTEGER REFERENCES chat_media_files(id) ON DELETE SET NULL,
    meeting_link_id INTEGER REFERENCES chat_meeting_links(id) ON DELETE SET NULL,
    status VARCHAR(10) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_for_all BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    retry_count SMALLINT DEFAULT 0
);

CREATE TABLE chat_message_receipts (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    message_id INTEGER NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    UNIQUE(message_id, recipient_id)
);

CREATE TABLE chat_typing_status (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    room_id INTEGER NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_typing BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(room_id, user_id)
);

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(30) NOT NULL,
    related_room_id INTEGER REFERENCES chat_rooms(id) ON DELETE SET NULL,
    related_message_id INTEGER REFERENCES chat_messages(id) ON DELETE SET NULL,
    related_entity_type VARCHAR(30),
    related_entity_id INTEGER,
    title VARCHAR(255),
    content TEXT NOT NULL,
    action_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

CREATE TABLE notification_preferences (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(30) NOT NULL,
    email_enabled BOOLEAN DEFAULT TRUE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, notification_type)
);

CREATE TABLE email_queue (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    recipient_email VARCHAR(150) NOT NULL,
    recipient_name VARCHAR(150),
    subject VARCHAR(255) NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'retry')),
    retry_count SMALLINT DEFAULT 0,
    last_error TEXT,
    sent_at TIMESTAMP,
    scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================
-- MODULE 7: PAYMENT & ESCROW
-- ===================================================================

CREATE TABLE wallets (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    currency_code VARCHAR(10) DEFAULT 'USD' NOT NULL,
    available_balance DECIMAL(18,4) DEFAULT 0 NOT NULL CHECK (available_balance >= 0),
    held_balance DECIMAL(18,4) DEFAULT 0 NOT NULL CHECK (held_balance >= 0),
    reserved_balance DECIMAL(18,4) DEFAULT 0 NOT NULL CHECK (reserved_balance >= 0),
    wallet_status VARCHAR(20) DEFAULT 'active' NOT NULL CHECK (wallet_status IN ('active', 'frozen', 'closed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payment_methods (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    method_type VARCHAR(20) NOT NULL CHECK (method_type IN ('bank', 'digital_wallet', 'card')),
    provider_name VARCHAR(100) NOT NULL,
    account_title VARCHAR(200) NOT NULL,
    account_number_masked VARCHAR(50) NOT NULL,
    iban_or_wallet_id TEXT NOT NULL,
    country_code CHAR(2) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    is_default BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE currency_rates (
    id SERIAL PRIMARY KEY,
    base_currency CHAR(3) NOT NULL,
    target_currency CHAR(3) DEFAULT 'USD' NOT NULL,
    exchange_rate DECIMAL(18,8) NOT NULL CHECK (exchange_rate > 0),
    source_api VARCHAR(100) NOT NULL,
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    UNIQUE(base_currency, target_currency, fetched_at)
);

CREATE TABLE escrow_accounts (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    project_id INTEGER UNIQUE NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    client_user_id INTEGER NOT NULL REFERENCES users(id),
    freelancer_user_id INTEGER NOT NULL REFERENCES users(id),
    currency_code VARCHAR(10) NOT NULL,
    total_amount DECIMAL(18,4) NOT NULL CHECK (total_amount > 0),
    funded_amount DECIMAL(18,4) DEFAULT 0 NOT NULL CHECK (funded_amount >= 0),
    released_amount DECIMAL(18,4) DEFAULT 0 NOT NULL CHECK (released_amount >= 0),
    refunded_amount DECIMAL(18,4) DEFAULT 0 NOT NULL CHECK (refunded_amount >= 0),
    escrow_status escrow_status NOT NULL DEFAULT 'pending',
    funded_at TIMESTAMP,
    closed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE milestone_payments (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    escrow_id INTEGER NOT NULL REFERENCES escrow_accounts(id) ON DELETE CASCADE,
    milestone_id INTEGER UNIQUE NOT NULL REFERENCES project_milestones(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    amount DECIMAL(18,4) NOT NULL CHECK (amount > 0),
    due_date DATE,
    approval_status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    release_status VARCHAR(20) DEFAULT 'not_released' NOT NULL CHECK (release_status IN ('not_released', 'released', 'refunded')),
    approved_at TIMESTAMP,
    released_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    milestone_payment_id INTEGER UNIQUE NOT NULL REFERENCES milestone_payments(id) ON DELETE CASCADE,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    client_user_id INTEGER NOT NULL REFERENCES users(id),
    freelancer_user_id INTEGER NOT NULL REFERENCES users(id),
    gross_amount DECIMAL(18,4) NOT NULL,
    platform_fee DECIMAL(18,4) DEFAULT 0 NOT NULL,
    tax_amount DECIMAL(18,4) DEFAULT 0 NOT NULL,
    net_amount DECIMAL(18,4) NOT NULL,
    currency_code VARCHAR(10) NOT NULL,
    invoice_pdf_url VARCHAR(500),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (net_amount = gross_amount - platform_fee - tax_amount)
);

CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    wallet_id INTEGER NOT NULL REFERENCES wallets(id),
    escrow_id INTEGER REFERENCES escrow_accounts(id),
    invoice_id INTEGER REFERENCES invoices(id),
    rate_id INTEGER REFERENCES currency_rates(id),
    sender_user_id INTEGER REFERENCES users(id),
    receiver_user_id INTEGER REFERENCES users(id),
    transaction_type VARCHAR(30) NOT NULL,
    amount DECIMAL(18,4) NOT NULL CHECK (amount > 0),
    currency_code VARCHAR(10) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
    reference_no VARCHAR(200),
    description VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    processed_at TIMESTAMP
);

CREATE TABLE withdrawal_requests (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id),
    wallet_id INTEGER NOT NULL REFERENCES wallets(id),
    payment_method_id INTEGER NOT NULL REFERENCES payment_methods(id),
    transaction_id INTEGER UNIQUE REFERENCES transactions(id),
    amount DECIMAL(18,4) NOT NULL CHECK (amount > 0),
    processing_fee DECIMAL(18,4) DEFAULT 0 NOT NULL,
    net_amount DECIMAL(18,4) NOT NULL CHECK (net_amount > 0),
    currency_code VARCHAR(10) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    admin_note TEXT
);

CREATE TABLE refund_requests (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    transaction_id INTEGER NOT NULL REFERENCES transactions(id),
    escrow_id INTEGER NOT NULL REFERENCES escrow_accounts(id),
    milestone_payment_id INTEGER REFERENCES milestone_payments(id),
    requested_by INTEGER NOT NULL REFERENCES users(id),
    approved_by_admin INTEGER REFERENCES users(id),
    reason TEXT NOT NULL,
    refund_amount DECIMAL(18,4) NOT NULL CHECK (refund_amount > 0),
    status VARCHAR(20) DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

CREATE TABLE platform_fee_logs (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    transaction_id INTEGER NOT NULL REFERENCES transactions(id),
    project_id INTEGER NOT NULL REFERENCES projects(id),
    fee_type VARCHAR(20) NOT NULL,
    fee_percentage DECIMAL(5,4) NOT NULL,
    fee_amount DECIMAL(18,4) NOT NULL CHECK (fee_amount > 0),
    currency_code VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payment_notifications (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    transaction_id INTEGER REFERENCES transactions(id),
    withdrawal_id INTEGER REFERENCES withdrawal_requests(id),
    refund_id INTEGER REFERENCES refund_requests(id),
    recipient_id INTEGER NOT NULL REFERENCES users(id),
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    channel VARCHAR(20) DEFAULT 'in_app',
    status VARCHAR(20) DEFAULT 'pending',
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================
-- MODULE 8: DISPUTE & ADMIN
-- ===================================================================

CREATE TABLE admin_profiles (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'dispute_moderator',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE disputes (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    complainant_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    respondent_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_admin_id INTEGER REFERENCES admin_profiles(id) ON DELETE SET NULL,
    dispute_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    status dispute_status NOT NULL DEFAULT 'submitted',
    mediation_deadline TIMESTAMP,
    mediation_escalated BOOLEAN DEFAULT FALSE,
    escrow_freeze_triggered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    CHECK (complainant_id != respondent_id)
);

CREATE TABLE dispute_evidence (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    dispute_id INTEGER NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
    uploaded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(20) NOT NULL,
    file_size_kb INTEGER NOT NULL CHECK (file_size_kb <= 51200),
    file_path VARCHAR(500) NOT NULL,
    is_visible_to_parties BOOLEAN DEFAULT FALSE,
    is_reviewed BOOLEAN DEFAULT FALSE,
    reviewed_by INTEGER REFERENCES admin_profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dispute_mediation_records (
    id SERIAL PRIMARY KEY,
    dispute_id INTEGER NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    statement TEXT NOT NULL,
    is_system_message BOOLEAN DEFAULT FALSE,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dispute_arbitration_decisions (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    dispute_id INTEGER UNIQUE NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
    admin_id INTEGER NOT NULL REFERENCES admin_profiles(id) ON DELETE CASCADE,
    outcome VARCHAR(50) NOT NULL,
    split_percentage_client DECIMAL(5,2),
    split_percentage_freelancer DECIMAL(5,2),
    decision_notes TEXT NOT NULL,
    refund_amount DECIMAL(18,4),
    release_amount DECIMAL(18,4),
    payment_signal_sent BOOLEAN DEFAULT FALSE,
    payment_signal_sent_at TIMESTAMP,
    decided_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dispute_resolution_reports (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    dispute_id INTEGER UNIQUE NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
    decision_id INTEGER UNIQUE NOT NULL REFERENCES dispute_arbitration_decisions(id) ON DELETE CASCADE,
    dispute_summary TEXT NOT NULL,
    evidence_summary TEXT NOT NULL,
    mediation_summary TEXT NOT NULL,
    admin_decision TEXT NOT NULL,
    decision_notes TEXT NOT NULL,
    delivered_to_parties BOOLEAN DEFAULT FALSE,
    delivered_to_client_at TIMESTAMP,
    delivered_to_freelancer_at TIMESTAMP,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dispute_admin_audit_log (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES admin_profiles(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL,
    target_entity_id INTEGER NOT NULL,
    target_entity_type VARCHAR(30) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    ip_address INET,
    details TEXT,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dispute_status_history (
    id SERIAL PRIMARY KEY,
    dispute_id INTEGER NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
    old_status VARCHAR(50) NOT NULL,
    new_status VARCHAR(50) NOT NULL,
    changed_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    change_reason TEXT
);

CREATE TABLE dispute_templates (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    template_name VARCHAR(100) NOT NULL,
    template_type VARCHAR(30) NOT NULL,
    subject_line VARCHAR(255),
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER NOT NULL REFERENCES admin_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================
-- MODULE 9: ANALYTICS & GOVERNANCE
-- ===================================================================

CREATE TABLE m9_monitoring_rules (
    rule_id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    rule_name VARCHAR(100) UNIQUE NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    operator VARCHAR(5) NOT NULL,
    threshold NUMERIC(18,4) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    evaluation_interval_minutes INTEGER DEFAULT 60,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE m9_alert_records (
    alert_id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    rule_id INTEGER NOT NULL REFERENCES m9_monitoring_rules(rule_id) ON DELETE CASCADE,
    metric_value NUMERIC(18,4),
    expected_value NUMERIC(18,4),
    deviation_percentage DECIMAL(8,2),
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'open',
    resolution_notes TEXT,
    auto_resolved BOOLEAN DEFAULT FALSE
);

CREATE TABLE m9_export_records (
    export_id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    format VARCHAR(10) NOT NULL,
    export_type VARCHAR(50) NOT NULL,
    filters_applied JSONB,
    include_schema BOOLEAN DEFAULT FALSE,
    row_count INTEGER DEFAULT 0,
    file_size_bytes BIGINT,
    file_hash VARCHAR(64),
    file_url VARCHAR(500),
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    downloaded_at TIMESTAMPTZ
);

CREATE TABLE m9_data_connectors (
    connector_id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    source_module VARCHAR(50) NOT NULL,
    source_table VARCHAR(100),
    endpoint VARCHAR(500) NOT NULL,
    auth_type VARCHAR(30),
    auth_config JSONB,
    sync_frequency_minutes INTEGER DEFAULT 60,
    last_fetched TIMESTAMPTZ,
    last_status VARCHAR(20),
    last_error_message TEXT,
    records_fetched INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE m9_dashboard_configs (
    config_id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    config_name VARCHAR(100) NOT NULL,
    dashboard_type VARCHAR(30) NOT NULL,
    widgets JSONB NOT NULL,
    layout JSONB,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, config_name)
);

CREATE TABLE m9_kpi_snapshots (
    snapshot_id BIGSERIAL PRIMARY KEY,
    snapshot_date DATE UNIQUE NOT NULL,
    total_users INTEGER DEFAULT 0,
    active_freelancers INTEGER DEFAULT 0,
    active_clients INTEGER DEFAULT 0,
    total_projects INTEGER DEFAULT 0,
    completed_projects INTEGER DEFAULT 0,
    disputed_projects INTEGER DEFAULT 0,
    total_transaction_volume DECIMAL(18,4) DEFAULT 0,
    platform_revenue DECIMAL(18,4) DEFAULT 0,
    avg_project_completion_days DECIMAL(6,2),
    avg_rating NUMERIC(3,2),
    certifications_issued INTEGER DEFAULT 0,
    active_gigs INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE m9_scheduled_reports (
    report_id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    report_name VARCHAR(100) NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    recipient_emails TEXT[] NOT NULL,
    schedule_cron VARCHAR(100) NOT NULL,
    filters JSONB,
    format VARCHAR(10) DEFAULT 'PDF',
    is_active BOOLEAN DEFAULT TRUE,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE m9_scheduled_report_history (
    history_id BIGSERIAL PRIMARY KEY,
    report_id INTEGER NOT NULL REFERENCES m9_scheduled_reports(report_id) ON DELETE CASCADE,
    export_id BIGINT REFERENCES m9_export_records(export_id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE m9_analytics_logs (
    log_id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    session_id VARCHAR(100),
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    role_flag VARCHAR(20),
    action VARCHAR(100),
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    log_timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================
-- MODULE 10: SOCIAL IMPACT & VOLUNTEERING
-- ===================================================================

CREATE TABLE social_ngos (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE,
    password_hash VARCHAR(255),
    description TEXT,
    logo_url VARCHAR(500),
    website_url VARCHAR(500),
    contact_phone VARCHAR(30),
    contact_person VARCHAR(150),
    address TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    trust_score NUMERIC(3,2) DEFAULT 0,
    total_volunteers_engaged INTEGER DEFAULT 0,
    total_impact_points_generated INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE social_projects (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    ngo_id INTEGER NOT NULL REFERENCES social_ngos(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100),
    location VARCHAR(150),
    is_remote BOOLEAN DEFAULT FALSE,
    required_skills JSONB,
    volunteers_needed INTEGER DEFAULT 1,
    volunteers_enrolled INTEGER DEFAULT 0,
    start_date DATE,
    end_date DATE,
    application_deadline DATE,
    status VARCHAR(20) DEFAULT 'open',
    impact_points_per_hour INTEGER DEFAULT 10,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP
);

CREATE TABLE social_applications (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id INTEGER NOT NULL REFERENCES social_projects(id) ON DELETE CASCADE,
    cover_message TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    review_note TEXT,
    UNIQUE(user_id, project_id)
);

CREATE TABLE social_contributions (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id INTEGER NOT NULL REFERENCES social_projects(id) ON DELETE CASCADE,
    application_id INTEGER REFERENCES social_applications(id) ON DELETE SET NULL,
    hours NUMERIC(6,2) NOT NULL CHECK (hours >= 0),
    impact_score INTEGER DEFAULT 0,
    impact_points_earned INTEGER DEFAULT 0,
    task_description TEXT,
    contribution_date DATE DEFAULT CURRENT_DATE,
    verified_by_ngo BOOLEAN DEFAULT FALSE,
    verified_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE social_project_feedback (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES social_projects(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, user_id)
);

CREATE TABLE social_ngo_feedback (
    id SERIAL PRIMARY KEY,
    ngo_id INTEGER NOT NULL REFERENCES social_ngos(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ngo_id, user_id)
);

CREATE TABLE social_skill_exchanges (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    volunteer_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    skill_level skill_level DEFAULT 'intermediate',
    hourly_rate DECIMAL(18,4) DEFAULT 0,
    is_pro_bono BOOLEAN DEFAULT TRUE,
    max_students INTEGER,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(volunteer_user_id, skill_id)
);

CREATE TABLE social_exchange_sessions (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    exchange_id INTEGER NOT NULL REFERENCES social_skill_exchanges(id) ON DELETE CASCADE,
    learner_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMP NOT NULL,
    duration_minutes INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled',
    completion_rating INTEGER CHECK (completion_rating BETWEEN 1 AND 5),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE social_impact_leaderboard (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period_type VARCHAR(10) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_hours NUMERIC(8,2) DEFAULT 0,
    total_impact_points INTEGER DEFAULT 0,
    rank_position INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, period_type, period_start)
);

-- ===================================================================
-- MODULE 11: GAMIFICATION
-- ===================================================================

CREATE TABLE gamification_user_progress (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_points INTEGER NOT NULL DEFAULT 0,
    current_level INTEGER NOT NULL DEFAULT 1,
    activity_count INTEGER NOT NULL DEFAULT 0,
    avg_rating NUMERIC(3,2) NOT NULL DEFAULT 0,
    completion_rate NUMERIC(5,4) NOT NULL DEFAULT 0,
    trust_score NUMERIC(5,2),
    streak_days INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (trust_score IS NULL OR (trust_score >= 0 AND trust_score <= 100))
);

CREATE TABLE gamification_points_ledger (
    ledger_id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES gamification_user_progress(user_id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    action_reference_id INTEGER,
    points INTEGER NOT NULL CHECK (points != 0),
    multiplier_applied DECIMAL(3,2) DEFAULT 1.00,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE gamification_badges (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    badge_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(30),
    icon_url VARCHAR(500),
    points_awarded INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE gamification_user_badges (
    user_id INTEGER NOT NULL REFERENCES gamification_user_progress(user_id) ON DELETE CASCADE,
    badge_id INTEGER NOT NULL REFERENCES gamification_badges(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    displayed_on_profile BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (user_id, badge_id)
);

CREATE TABLE gamification_challenges (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    challenge_code VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    target_count INTEGER NOT NULL,
    reward_points INTEGER NOT NULL,
    expiry_days INTEGER NOT NULL,
    challenge_type VARCHAR(20),
    action_required VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE gamification_user_challenges (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES gamification_user_progress(user_id) ON DELETE CASCADE,
    challenge_id INTEGER NOT NULL REFERENCES gamification_challenges(id) ON DELETE CASCADE,
    current_progress INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    start_date TIMESTAMPTZ DEFAULT NOW(),
    completed_date TIMESTAMPTZ,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, challenge_id)
);

CREATE TABLE gamification_weekly_points_log (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES gamification_user_progress(user_id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    points_earned INTEGER NOT NULL DEFAULT 0,
    activity_count INTEGER NOT NULL DEFAULT 0,
    projects_completed INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, week_start)
);

CREATE TABLE gamification_leaderboard_cache (
    id BIGSERIAL PRIMARY KEY,
    period VARCHAR(10) NOT NULL,
    user_id INTEGER NOT NULL REFERENCES gamification_user_progress(user_id) ON DELETE CASCADE,
    rank_position INTEGER NOT NULL,
    points_for_rank INTEGER NOT NULL,
    total_points INTEGER NOT NULL,
    activity_count INTEGER NOT NULL,
    period_start DATE,
    period_end DATE,
    snapshot_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(period, user_id)
);

CREATE TABLE gamification_trust_score_history (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES gamification_user_progress(user_id) ON DELETE CASCADE,
    trust_score NUMERIC(5,2) NOT NULL,
    avg_rating NUMERIC(3,2) NOT NULL,
    completion_rate NUMERIC(5,4) NOT NULL,
    dispute_count INTEGER DEFAULT 0,
    reason TEXT,
    calculated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE gamification_notifications (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES gamification_user_progress(user_id) ON DELETE CASCADE,
    notification_type VARCHAR(20) NOT NULL,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    related_entity_type VARCHAR(30),
    related_entity_id VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE gamification_level_definitions (
    level_number INTEGER PRIMARY KEY,
    min_points INTEGER NOT NULL CHECK (min_points >= 0),
    max_points INTEGER,
    title VARCHAR(50) NOT NULL,
    perks JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(min_points)
);

CREATE TABLE gamification_admin_audit_logs (
    log_id BIGSERIAL PRIMARY KEY,
    admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    target_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================================================
-- MODULE 12: HARDWARE & ASSET RENTAL 
-- ===================================================================

CREATE TABLE rental_asset_categories (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    parent_id INTEGER REFERENCES rental_asset_categories(id) ON DELETE SET NULL,
    category_name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    description TEXT,
    icon_url VARCHAR(500),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rental_assets (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    asset_name VARCHAR(200) NOT NULL,
    category_id INTEGER NOT NULL REFERENCES rental_asset_categories(id),
    description TEXT NOT NULL,
    condition VARCHAR(20) NOT NULL,
    daily_rate DECIMAL(18,4) NOT NULL CHECK (daily_rate > 0),
    security_deposit DECIMAL(18,4) NOT NULL CHECK (security_deposit >= 0),
    pickup_location VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    images JSONB,
    status VARCHAR(20) DEFAULT 'available',
    requires_advance_booking BOOLEAN DEFAULT FALSE,
    advance_booking_days INTEGER DEFAULT 0,
    total_rentals INTEGER DEFAULT 0,
    avg_rating DECIMAL(3,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE rental_asset_availability (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER NOT NULL REFERENCES rental_assets(id) ON DELETE CASCADE,
    unavailable_date DATE NOT NULL,
    reason VARCHAR(50) DEFAULT 'booked',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(asset_id, unavailable_date)
);

CREATE TABLE rental_bookings (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    asset_id INTEGER NOT NULL REFERENCES rental_assets(id) ON DELETE CASCADE,
    renter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    rental_days INTEGER NOT NULL,
    daily_rate DECIMAL(18,4) NOT NULL,
    total_rental_amount DECIMAL(18,4) NOT NULL,
    security_deposit DECIMAL(18,4) NOT NULL,
    total_amount DECIMAL(18,4) NOT NULL,
    escrow_transaction_id INTEGER UNIQUE REFERENCES transactions(id),
    escrow_released BOOLEAN DEFAULT FALSE,
    booking_status booking_status DEFAULT 'pending',
    renter_notes TEXT,
    owner_notes TEXT,
    cancellation_reason TEXT,
    cancelled_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    cancelled_at TIMESTAMP,
    pickup_verified_at TIMESTAMP,
    pickup_verified_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    return_verified_at TIMESTAMP,
    return_verified_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (end_date > start_date)
);

CREATE TABLE rental_handover_records (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES rental_bookings(id) ON DELETE CASCADE,
    handover_type VARCHAR(20) NOT NULL,
    verification_method VARCHAR(20) NOT NULL,
    qr_code_data VARCHAR(500) UNIQUE,
    qr_code_url VARCHAR(500),
    otp_code VARCHAR(6),
    otp_expires_at TIMESTAMP,
    verified_at TIMESTAMP,
    verified_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    verification_status VARCHAR(20) DEFAULT 'pending',
    failed_attempts INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

CREATE TABLE rental_asset_reviews (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER UNIQUE NOT NULL REFERENCES rental_bookings(id) ON DELETE CASCADE,
    asset_id INTEGER NOT NULL REFERENCES rental_assets(id) ON DELETE CASCADE,
    reviewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    condition_rating INTEGER CHECK (condition_rating BETWEEN 1 AND 5),
    owner_communication_rating INTEGER CHECK (owner_communication_rating BETWEEN 1 AND 5),
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rental_owner_reviews (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER UNIQUE NOT NULL REFERENCES rental_bookings(id) ON DELETE CASCADE,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    responsiveness_rating INTEGER CHECK (responsiveness_rating BETWEEN 1 AND 5),
    asset_condition_rating INTEGER CHECK (asset_condition_rating BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rental_disputes (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES rental_bookings(id) ON DELETE CASCADE,
    raised_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dispute_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    requested_amount DECIMAL(18,4),
    status VARCHAR(20) DEFAULT 'open',
    resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    refund_amount DECIMAL(18,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

CREATE TABLE rental_wishlist (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    asset_id INTEGER NOT NULL REFERENCES rental_assets(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, asset_id)
);

CREATE TABLE rental_asset_views (
    id BIGSERIAL PRIMARY KEY,
    asset_id INTEGER NOT NULL REFERENCES rental_assets(id) ON DELETE CASCADE,
    viewer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================
-- INDEXES FOR PERFORMANCE
-- ===================================================================

-- Users Module Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_account_status ON users(account_status);
CREATE INDEX idx_users_uuid ON users(uuid);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_skills ON profiles USING GIN(skills);
CREATE INDEX idx_profiles_trust_score ON profiles(trust_score);

CREATE INDEX idx_user_skills_user ON user_skills(user_id);
CREATE INDEX idx_user_skills_skill ON user_skills(skill_id);

-- Marketplace Indexes
CREATE INDEX idx_jobs_client ON jobs(client_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_category ON jobs(category_id);
CREATE INDEX idx_jobs_deadline ON jobs(deadline);

CREATE INDEX idx_bids_job ON bids(job_id);
CREATE INDEX idx_bids_freelancer ON bids(freelancer_id);
CREATE INDEX idx_bids_status ON bids(status);

CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_projects_freelancer ON projects(freelancer_id);
CREATE INDEX idx_projects_status ON projects(status);

-- Payment Indexes
CREATE INDEX idx_wallets_user ON wallets(user_id);
CREATE INDEX idx_escrow_project ON escrow_accounts(project_id);
CREATE INDEX idx_escrow_status ON escrow_accounts(escrow_status);
CREATE INDEX idx_transactions_wallet ON transactions(wallet_id);
CREATE INDEX idx_transactions_created ON transactions(created_at);
CREATE INDEX idx_transactions_uuid ON transactions(uuid);

-- Communication Indexes
CREATE INDEX idx_chat_messages_room ON chat_messages(room_id);
CREATE INDEX idx_chat_messages_sent_at ON chat_messages(sent_at);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Rental Module Indexes
CREATE INDEX idx_rental_assets_owner ON rental_assets(owner_id);
CREATE INDEX idx_rental_assets_status ON rental_assets(status);
CREATE INDEX idx_rental_assets_category ON rental_assets(category_id);
CREATE INDEX idx_rental_assets_location ON rental_assets(city);
CREATE INDEX idx_rental_assets_uuid ON rental_assets(uuid);
CREATE INDEX idx_rental_bookings_renter ON rental_bookings(renter_id);
CREATE INDEX idx_rental_bookings_asset ON rental_bookings(asset_id);
CREATE INDEX idx_rental_bookings_status ON rental_bookings(booking_status);
CREATE INDEX idx_rental_bookings_dates ON rental_bookings(start_date, end_date);
CREATE INDEX idx_rental_bookings_uuid ON rental_bookings(uuid);

-- Dispute Indexes
CREATE INDEX idx_disputes_uuid ON disputes(uuid);
CREATE INDEX idx_dispute_evidence_uuid ON dispute_evidence(uuid);
CREATE INDEX idx_dispute_arbitration_decisions_uuid ON dispute_arbitration_decisions(uuid);
CREATE INDEX idx_dispute_resolution_reports_uuid ON dispute_resolution_reports(uuid);

-- Social Indexes
CREATE INDEX idx_social_ngos_uuid ON social_ngos(uuid);
CREATE INDEX idx_social_projects_uuid ON social_projects(uuid);
CREATE INDEX idx_social_contributions_uuid ON social_contributions(uuid);

-- Analytics Indexes
CREATE INDEX idx_m9_export_records_uuid ON m9_export_records(uuid);

-- ===================================================================
-- MODULE 13: DATABASE TRIGGERS (Derived Data Maintenance)
-- ===================================================================
/*
Note: Tables like `profiles`, `gigs`, `rental_assets`, and `gamification_user_progress` 
contain derived aggregate columns (e.g., `average_rating`, `trust_score`, `total_reviews`). 

To maintain these fields accurately, you must implement Postgres Database Triggers 
(or strictly enforce backend background jobs via a message broker like RabbitMQ/Kafka). 
An example trigger function for profile ratings would look like this:

CREATE OR REPLACE FUNCTION update_profile_ratings()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles
    SET 
        total_reviews = (SELECT COUNT(*) FROM reviews WHERE freelancer_id = NEW.freelancer_id),
        average_rating = (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE freelancer_id = NEW.freelancer_id)
    WHERE user_id = NEW.freelancer_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ratings
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_profile_ratings();
*/