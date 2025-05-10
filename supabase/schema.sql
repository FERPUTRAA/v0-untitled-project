-- Tabel untuk profil pengguna
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    username TEXT,
    avatar_emoji TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_online TIMESTAMPTZ DEFAULT NOW(),
    location TEXT,
    bio TEXT,
    age INTEGER,
    gender TEXT,
    share_location BOOLEAN DEFAULT FALSE,
    last_profile_change TIMESTAMPTZ
);

-- Tabel untuk pesan
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read BOOLEAN DEFAULT FALSE,
    encrypted BOOLEAN DEFAULT TRUE,
    media_type TEXT,
    media_url TEXT
);

-- Tabel untuk pertemanan
CREATE TABLE IF NOT EXISTS public.friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, friend_id)
);

-- Tabel untuk panggilan
CREATE TABLE IF NOT EXISTS public.calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    status TEXT NOT NULL CHECK (status IN ('missed', 'answered', 'rejected', 'ongoing')),
    call_type TEXT NOT NULL CHECK (call_type IN ('audio', 'video'))
);

-- Tabel untuk keamanan pengguna
CREATE TABLE IF NOT EXISTS public.user_security (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret TEXT,
    encryption_enabled BOOLEAN DEFAULT TRUE,
    public_key TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel untuk sesi pengguna
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    device_info TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_active TIMESTAMPTZ DEFAULT NOW()
);

-- Fungsi untuk mendapatkan daftar chat
CREATE OR REPLACE FUNCTION public.get_chat_list(user_id UUID)
RETURNS TABLE (
    contact_id UUID,
    contact_name TEXT,
    contact_avatar TEXT,
    last_message TEXT,
    last_message_time TIMESTAMPTZ,
    unread_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH contacts AS (
        -- Dapatkan semua kontak dari tabel friendships
        SELECT 
            CASE 
                WHEN f.user_id = user_id THEN f.friend_id
                ELSE f.user_id
            END AS id
        FROM public.friendships f
        WHERE (f.user_id = user_id OR f.friend_id = user_id)
        AND f.status = 'accepted'
        
        UNION
        
        -- Tambahkan kontak dari pesan yang belum memiliki pertemanan
        SELECT 
            CASE 
                WHEN m.sender_id = user_id THEN m.receiver_id
                ELSE m.sender_id
            END AS id
        FROM public.messages m
        WHERE m.sender_id = user_id OR m.receiver_id = user_id
    ),
    last_messages AS (
        -- Dapatkan pesan terakhir untuk setiap kontak
        SELECT DISTINCT ON (contact_id)
            CASE 
                WHEN m.sender_id = user_id THEN m.receiver_id
                ELSE m.sender_id
            END AS contact_id,
            m.content,
            m.created_at,
            m.sender_id = user_id AS is_sent_by_me
        FROM public.messages m
        WHERE m.sender_id = user_id OR m.receiver_id = user_id
        ORDER BY contact_id, m.created_at DESC
    ),
    unread_counts AS (
        -- Hitung jumlah pesan yang belum dibaca untuk setiap kontak
        SELECT
            m.sender_id AS contact_id,
            COUNT(*) AS count
        FROM public.messages m
        WHERE m.receiver_id = user_id AND m.read = FALSE
        GROUP BY m.sender_id
    )
    
    -- Gabungkan semua data
    SELECT
        c.id AS contact_id,
        u.full_name AS contact_name,
        u.avatar_emoji AS contact_avatar,
        lm.content AS last_message,
        lm.created_at AS last_message_time,
        COALESCE(uc.count, 0) AS unread_count
    FROM contacts c
    JOIN public.users u ON c.id = u.id
    LEFT JOIN last_messages lm ON c.id = lm.contact_id
    LEFT JOIN unread_counts uc ON c.id = uc.contact_id
    ORDER BY lm.created_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Indeks untuk meningkatkan performa
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON public.messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_friendships_user_friend ON public.friendships(user_id, friend_id);
CREATE INDEX IF NOT EXISTS idx_calls_caller_receiver ON public.calls(caller_id, receiver_id);

-- Trigger untuk memperbarui updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friendships_updated_at
BEFORE UPDATE ON public.friendships
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_security_updated_at
BEFORE UPDATE ON public.user_security
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
