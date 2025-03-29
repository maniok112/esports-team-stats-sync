CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    age INT,
    team TEXT,
    -- ...inne kolumny...
    created_at TIMESTAMP DEFAULT NOW()
);
