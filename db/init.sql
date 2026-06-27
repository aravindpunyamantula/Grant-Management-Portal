-- Create database if not exists (handled by Docker env var)
-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    oauth_provider VARCHAR(50),
    oauth_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User roles join table (many-to-many)
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

-- Grants table
CREATE TABLE IF NOT EXISTS grants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    deadline TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'OPEN',
    grantor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    grantee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    grant_id UUID NOT NULL REFERENCES grants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(grantee_id, grant_id)
);

-- Seed roles
INSERT INTO roles (name, description) VALUES
    ('ADMIN', 'System administrator with full access'),
    ('GRANTOR', 'Can create and manage grants'),
    ('GRANTEE', 'Can view grants and submit applications')
ON CONFLICT (name) DO NOTHING;

-- Seed admin user (password: Admin@123456 - bcrypt hash)
INSERT INTO users (id, name, email, password)
VALUES (
    uuid_generate_v4(),
    'System Admin',
    'admin@example.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
) ON CONFLICT (email) DO NOTHING;

-- Assign ADMIN role to admin user
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'admin@example.com' AND r.name = 'ADMIN'
ON CONFLICT DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_grants_grantor ON grants(grantor_id);
CREATE INDEX IF NOT EXISTS idx_applications_grant ON applications(grant_id);
CREATE INDEX IF NOT EXISTS idx_applications_grantee ON applications(grantee_id);
