-- 个人版本数据初始化脚本
-- 创建默认用户（ID=1）

USE todolist_db;

-- 插入默认用户（如果不存在）
INSERT INTO users (id, username, email, password_hash, created_at, updated_at)
VALUES (1, 'user', 'local@user.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', NOW(), NOW())
ON DUPLICATE KEY UPDATE username=username;

-- 为默认用户创建默认清单（如果不存在）
INSERT INTO task_lists (user_id, name, is_default, sort_order, created_at, updated_at)
VALUES (1, '我的任务', TRUE, 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE name=name;

SELECT '默认用户和清单初始化完成！' AS message;
