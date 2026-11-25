-- ============================================================================
-- Tırnak Atölyesi (https://tirnakatolyesi.ir) — MySQL 8.0+ / MariaDB Schema
-- Complete cPanel phpMyAdmin SQL Import File
-- Tables: users, site_gallery, customer_gallery, reservations, time_slots
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Table: users (Customers & Role-Based Salon Admins)
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `full_name` VARCHAR(120) NOT NULL,
  `mobile` VARCHAR(20) NOT NULL UNIQUE,
  `username` VARCHAR(60) DEFAULT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seeded Default Admin Account (admin / Admin@1234)
INSERT INTO `users` (`full_name`, `mobile`, `username`, `password_hash`, `role`)
VALUES (
  'مدیر آتلیه ناخن (Tırnak Atölyesi)',
  '09120000000',
  'admin',
  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'admin'
) ON DUPLICATE KEY UPDATE `role` = 'admin';

-- 2. Table: site_gallery («تصاویر نمونه خود سایت» — Official Salon Designs)
CREATE TABLE IF NOT EXISTS `site_gallery` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(32) NOT NULL UNIQUE,
  `title_fa` VARCHAR(180) NOT NULL,
  `title_tr` VARCHAR(180) NOT NULL,
  `category` ENUM('gelish', 'minimal', 'french', 'manicure', 'pedicure', 'ombre') NOT NULL DEFAULT 'gelish',
  `price_toman` INT UNSIGNED NOT NULL DEFAULT 750000,
  `duration_min` SMALLINT UNSIGNED NOT NULL DEFAULT 60,
  `image_url` TEXT NOT NULL,
  `primary_color_hex` VARCHAR(16) NOT NULL DEFAULT '#D42663',
  `secondary_color_hex` VARCHAR(16) NOT NULL DEFAULT '#FAF0E6',
  `default_shape` ENUM('almond', 'coffin', 'square', 'round') NOT NULL DEFAULT 'almond',
  `prompt_description` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Table: customer_gallery («نمونه تصاویر مشتریان» — Public Customer Showcase)
CREATE TABLE IF NOT EXISTS `customer_gallery` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `customer_first_name` VARCHAR(80) NOT NULL,
  `service_type` VARCHAR(40) NOT NULL DEFAULT 'vip_design',
  `service_label_fa` VARCHAR(180) NOT NULL,
  `service_label_tr` VARCHAR(180) NOT NULL,
  `date_fa` VARCHAR(32) NOT NULL,
  `image_url` LONGTEXT NOT NULL,
  `design_code` VARCHAR(32) DEFAULT NULL,
  `comment_fa` TEXT DEFAULT NULL,
  `reservation_id` INT UNSIGNED DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Table: reservations (Appointments + Dual Image Upload Columns)
CREATE TABLE IF NOT EXISTS `reservations` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tracking_code` VARCHAR(32) NOT NULL UNIQUE,
  `user_id` INT UNSIGNED DEFAULT NULL,
  `customer_name` VARCHAR(120) NOT NULL,
  `customer_mobile` VARCHAR(20) NOT NULL,
  `service_type` ENUM('manicure', 'pedicure', 'gelish', 'extension', 'repair', 'vip_design') NOT NULL DEFAULT 'vip_design',
  `reservation_date` VARCHAR(20) NOT NULL,
  `time_slot` VARCHAR(16) NOT NULL,
  `notes` TEXT DEFAULT NULL,
  `selected_design_code` VARCHAR(32) DEFAULT NULL,
  `selected_design_title` VARCHAR(180) DEFAULT NULL,
  `nail_shape` ENUM('almond', 'coffin', 'square', 'round') NOT NULL DEFAULT 'almond',
  `nail_color_hex` VARCHAR(16) NOT NULL DEFAULT '#D42663',
  `hand_image` LONGTEXT DEFAULT NULL COMMENT 'Upload Box 1: Original customer hand photo',
  `ai_final_image` LONGTEXT DEFAULT NULL COMMENT 'Upload Box 1: Final high-res composite reference design',
  `customer_reference_image` LONGTEXT DEFAULT NULL COMMENT 'Upload Box 2: Independent customer reference design photo',
  `status` ENUM('pending', 'confirmed', 'completed') NOT NULL DEFAULT 'pending',
  `published_to_customer_gallery` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_date_slot` (`reservation_date`, `time_slot`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Table: time_slots (Working Hours & Blocked Time Slots)
CREATE TABLE IF NOT EXISTS `time_slots` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `slot_date` VARCHAR(20) NOT NULL,
  `slot_time` VARCHAR(16) NOT NULL,
  `is_blocked` TINYINT(1) NOT NULL DEFAULT 1,
  `reason` VARCHAR(180) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_blocked_slot` (`slot_date`, `slot_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
