-- =========================================================
-- Digital Document Vault MySQL Database Schema
-- Database Name: digital_document_vault
-- =========================================================

CREATE DATABASE IF NOT EXISTS `digital_document_vault` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `digital_document_vault`;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `full_name` VARCHAR(120) NOT NULL,
    `email` VARCHAR(120) NOT NULL UNIQUE,
    `phone` VARCHAR(20) DEFAULT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `plan_tier` VARCHAR(50) DEFAULT 'Free Vault',
    `storage_used_bytes` BIGINT DEFAULT 0,
    `is_2fa_enabled` TINYINT(1) DEFAULT 0,
    `device` VARCHAR(150) DEFAULT 'Komal\'s Laptop (Windows x64)',
    `is_new_user` TINYINT(1) DEFAULT 1,
    `login_count` INT DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS `categories` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Documents Table
CREATE TABLE IF NOT EXISTS `documents` (
    `id` VARCHAR(64) PRIMARY KEY,
    `user_id` INT NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `category` VARCHAR(80) NOT NULL DEFAULT 'Others',
    `file_path` VARCHAR(500) DEFAULT NULL,
    `file_size_bytes` BIGINT NOT NULL DEFAULT 0,
    `mime_type` VARCHAR(100) DEFAULT NULL,
    `extension` VARCHAR(20) NOT NULL DEFAULT 'txt',
    `icon_color` VARCHAR(20) NOT NULL DEFAULT '#3b82f6',
    `is_favorite` TINYINT(1) DEFAULT 0,
    `is_deleted` TINYINT(1) DEFAULT 0,
    `file_data_base64` LONGTEXT DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Shared Documents Table
CREATE TABLE IF NOT EXISTS `shared_documents` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `document_id` VARCHAR(64) NOT NULL,
    `shared_by_user_id` INT NOT NULL,
    `shared_with_email` VARCHAR(120) NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`shared_by_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Support Tickets Table
CREATE TABLE IF NOT EXISTS `support_tickets` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT DEFAULT NULL,
    `user_email` VARCHAR(120) NOT NULL,
    `subject` VARCHAR(200) NOT NULL,
    `message` TEXT NOT NULL,
    `status` VARCHAR(40) DEFAULT 'Open',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
