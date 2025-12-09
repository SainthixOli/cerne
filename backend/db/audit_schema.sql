CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id TEXT,
    action_type TEXT, -- 'APPROVE', 'REJECT', 'UPDATE_PROFILE'
    target_id TEXT, -- ID of the affiliation or profile affected
    details TEXT, -- JSON or text description
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(admin_id) REFERENCES profiles(id)
);
