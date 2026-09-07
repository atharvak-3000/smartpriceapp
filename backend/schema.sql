-- ========================================================
-- SmartPrice MySQL Database Schema
-- Compatible with Hostinger MySQL & phpMyAdmin
-- ========================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- 1. Table structure for table `users`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('owner', 'admin', 'staff', 'salesperson') NOT NULL DEFAULT 'staff',
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 2. Table structure for table `products`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `productName` VARCHAR(255) NOT NULL,
  `productCode` VARCHAR(100) NOT NULL UNIQUE,
  `barcode` VARCHAR(100) UNIQUE DEFAULT NULL,
  `category` VARCHAR(100) NOT NULL,
  `brand` VARCHAR(100) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `salePrice` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `mrpPrice` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `wholesalePrice` DECIMAL(10, 2) DEFAULT NULL,
  `stock` INT NOT NULL DEFAULT 0,
  `imageUrl` VARCHAR(500) DEFAULT NULL,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_brand` (`brand`),
  INDEX `idx_category` (`category`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 3. Default Seed Data: Users
-- Default Password for both accounts: Password123
-- --------------------------------------------------------
INSERT IGNORE INTO `users` (`id`, `name`, `email`, `password`, `role`) VALUES
(1, 'Store Owner', 'owner@smartprice.com', '$2a$10$Kh8jGUmZEuey.SM61lIwxufwzkTzSuvxB0tsDeaADGQQZVdlB9dKO', 'owner'),
(2, 'Sales Person', 'sales@smartprice.com', '$2a$10$Kh8jGUmZEuey.SM61lIwxufwzkTzSuvxB0tsDeaADGQQZVdlB9dKO', 'staff');

-- --------------------------------------------------------
-- 4. Default Seed Data: Sample Products
-- --------------------------------------------------------
INSERT IGNORE INTO `products` (`id`, `productName`, `productCode`, `barcode`, `category`, `brand`, `price`, `salePrice`, `mrpPrice`, `wholesalePrice`, `stock`) VALUES
(1, 'Havells Life Line FR 1.5 Sq mm Wire Red', 'HW-15-RD', '8901786151011', 'Wires & Cables', 'Havells', 1540.00, 1540.00, 1925.00, 1309.00, 50),
(2, 'Havells Life Line FR 2.5 Sq mm Wire Black', 'HW-25-BK', '8901786151028', 'Wires & Cables', 'Havells', 2450.00, 2450.00, 3063.00, 2083.00, 50),
(3, 'Polycab Green FR 1.0 Sq mm Wire Blue', 'PW-10-BL', '8902891100345', 'Wires & Cables', 'Polycab', 1120.00, 1120.00, 1400.00, 952.00, 50),
(4, 'Anchor Roma 1 Way Switch 10A', 'AR-SW1-10', '8901112001015', 'Switches & Sockets', 'Anchor', 35.00, 35.00, 44.00, 30.00, 50),
(5, 'Anchor Roma 2 Way Switch 10A', 'AR-SW2-10', '8901112001022', 'Switches & Sockets', 'Anchor', 55.00, 55.00, 69.00, 47.00, 50),
(6, 'Legrand Arteor 1 Way Switch 20A', 'LG-SW1-20', '8901234005011', 'Switches & Sockets', 'Legrand', 180.00, 180.00, 225.00, 153.00, 50),
(7, 'Philips Stellar Bright LED Bulb 9W Cool Day Light', 'PL-LED9-CD', '8901097312015', 'LED & Lighting', 'Philips', 110.00, 110.00, 138.00, 94.00, 50),
(8, 'Philips Stellar Bright LED Bulb 12W Warm White', 'PL-LED12-WW', '8901097312039', 'LED & Lighting', 'Philips', 145.00, 145.00, 181.00, 123.00, 50),
(9, 'Havells Octane LED Batten 20W Cool White', 'HL-BT20-CW', '8901786520309', 'LED & Lighting', 'Havells', 320.00, 320.00, 400.00, 272.00, 50);

SET FOREIGN_KEY_CHECKS = 1;
