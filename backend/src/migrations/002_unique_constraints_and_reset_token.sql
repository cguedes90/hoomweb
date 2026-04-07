-- Migration 002: Unique constraints em clients + reset de senha

-- Unique em document (CPF/CNPJ): NULL é permitido (vários clientes sem documento)
ALTER TABLE clients ADD CONSTRAINT uk_clients_document UNIQUE (document);

-- Unique em email de cliente: NULL é permitido
ALTER TABLE clients ADD CONSTRAINT uk_clients_email UNIQUE (email);

-- Colunas para fluxo de reset de senha
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);
