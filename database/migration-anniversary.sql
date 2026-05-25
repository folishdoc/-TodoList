-- 纪念日表
CREATE TABLE IF NOT EXISTS anniversaries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    repeat_type VARCHAR(20) DEFAULT 'NONE' COMMENT 'NONE/YEARLY/MONTHLY/WEEKLY',
    remind_enabled TINYINT DEFAULT 0,
    remind_days_before VARCHAR(100) DEFAULT '0' COMMENT '逗号分隔提前天数，如 0,1,3,7',
    remind_time TIME DEFAULT '09:00:00',
    tags VARCHAR(255) COMMENT 'JSON数组',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='纪念日表';

-- 提醒日志表（去重提醒）
CREATE TABLE IF NOT EXISTS reminder_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    anniversary_id BIGINT NOT NULL,
    remind_datetime DATETIME NOT NULL,
    is_read TINYINT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_anniversary_id (anniversary_id),
    INDEX idx_is_read (is_read),
    INDEX idx_remind_datetime (remind_datetime),
    FOREIGN KEY (anniversary_id) REFERENCES anniversaries(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='提醒日志表';
