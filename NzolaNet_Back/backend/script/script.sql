-- ============================================================
-- EXTENSÕES
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- FUNÇÃO
-- ============================================================

CREATE OR REPLACE FUNCTION update_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    foto_perfil VARCHAR(500),
    foto_capa VARCHAR(500),
    bio VARCHAR(300),
    data_nascimento DATE NOT NULL,
    genero VARCHAR(20) NOT NULL CHECK (genero IN ('masculino', 'feminino')),
    privacidade VARCHAR(10) DEFAULT 'publico' CHECK (privacidade IN ('publico', 'privado')),
    is_admin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    email_verificado_em TIMESTAMP NULL,
    ultimo_acesso_em TIMESTAMP NULL,
    criado_em TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_nome ON users(nome);

CREATE TRIGGER trigger_users_atualizado_em
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_atualizado_em();

-- ============================================================
-- EMAIL VERIFICATION TOKENS
-- ============================================================

CREATE TABLE email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expira_em TIMESTAMP NOT NULL,
    criado_em TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- PASSWORD RESET TOKENS
-- ============================================================

CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expira_em TIMESTAMP NOT NULL,
    usado BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- SESSIONS
-- ============================================================

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    ip VARCHAR(45),
    user_agent VARCHAR(500),
    expira_em TIMESTAMP NOT NULL,
    criado_em TIMESTAMP DEFAULT NOW(),
    logout_em TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- FOLLOWS
-- ============================================================

CREATE TABLE follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seguidor_id UUID NOT NULL,
    seguido_id UUID NOT NULL,
    status VARCHAR(10) DEFAULT 'aceite' CHECK (status IN ('pendente', 'aceite', 'rejeitado')),
    criado_em TIMESTAMP DEFAULT NOW(),
    UNIQUE (seguidor_id, seguido_id),
    FOREIGN KEY (seguidor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (seguido_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_follows_seguidor ON follows(seguidor_id);
CREATE INDEX idx_follows_seguido ON follows(seguido_id);

-- ============================================================
-- BLOCKS
-- ============================================================

CREATE TABLE blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bloqueador_id UUID NOT NULL,
    bloqueado_id UUID NOT NULL,
    criado_em TIMESTAMP DEFAULT NOW(),
    UNIQUE (bloqueador_id, bloqueado_id),
    FOREIGN KEY (bloqueador_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (bloqueado_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- POSTS
-- ============================================================

CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    conteudo TEXT,
    eliminado BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_posts_user ON posts(user_id);
CREATE INDEX idx_posts_criado_em ON posts(criado_em);

CREATE TRIGGER trigger_posts_atualizado_em
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_atualizado_em();

-- ============================================================
-- POST SHARES
-- ============================================================

CREATE TABLE post_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    post_original_id UUID NOT NULL,
    comentario_partilha TEXT,
    criado_em TIMESTAMP DEFAULT NOW(),
    UNIQUE (user_id, post_original_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_original_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- ============================================================
-- MEDIA
-- ============================================================

CREATE TABLE media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('imagem', 'video')),
    url VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100),
    tamanho_bytes BIGINT,
    ordem SMALLINT DEFAULT 0,
    criado_em TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE INDEX idx_media_post ON media(post_id, ordem);

-- ============================================================
-- BAZES
-- ============================================================

CREATE TABLE bazes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    post_id UUID NOT NULL,
    criado_em TIMESTAMP DEFAULT NOW(),
    UNIQUE (user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- ============================================================
-- COMMENTS
-- ============================================================

CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    post_id UUID NOT NULL,
    conteudo TEXT NOT NULL,
    eliminado BOOLEAN DEFAULT FALSE,
    removido_por_admin BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE INDEX idx_comments_post ON comments(post_id, criado_em);
CREATE INDEX idx_comments_user ON comments(user_id);

CREATE TRIGGER trigger_comments_atualizado_em
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_atualizado_em();

-- ============================================================
-- REPORTS
-- ============================================================

CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL,
    referencia_id UUID NOT NULL,
    referencia_tipo VARCHAR(10) NOT NULL CHECK (referencia_tipo IN ('post', 'comment', 'user')),
    motivo VARCHAR(20) NOT NULL CHECK (motivo IN ('spam', 'ofensivo', 'inapropriado', 'desinformacao', 'violencia', 'outro')),
    descricao TEXT,
    status VARCHAR(10) DEFAULT 'pendente' CHECK (status IN ('pendente', 'resolvido', 'ignorado')),
    resolvido_por UUID,
    criado_em TIMESTAMP DEFAULT NOW(),
    resolvido_em TIMESTAMP NULL,
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (resolvido_por) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- CONVERSATIONS
-- ============================================================

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID NOT NULL,
    user2_id UUID NOT NULL,
    criado_em TIMESTAMP DEFAULT NOW(),
    UNIQUE (user1_id, user2_id),
    FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_conv_user1 ON conversations(user1_id);
CREATE INDEX idx_conv_user2 ON conversations(user2_id);

-- ============================================================
-- MESSAGES
-- ============================================================

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    remetente_id UUID NOT NULL,
    conteudo TEXT NOT NULL,
    lida BOOLEAN DEFAULT FALSE,
    eliminado BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (remetente_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_messages_conv ON messages(conversation_id, criado_em);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    destinatario_id UUID NOT NULL,
    remetente_id UUID NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('baze', 'comentario', 'seguidor', 'pedido_follow', 'partilha', 'mensagem', 'report')),
    referencia_id UUID,
    referencia_tipo VARCHAR(20),
    lida BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (destinatario_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (remetente_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_notif_dest ON notifications(destinatario_id, lida, criado_em);