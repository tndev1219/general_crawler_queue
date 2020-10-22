/*
 Navicat Premium Data Transfer

 Source Server         : General_Crawler
 Source Server Type    : MySQL
 Source Server Version : 50726
 Source Host           : ls-a95546ac23693821685dd2ea26488d2c0c6de569.ckgtmtqtf3zi.us-east-1.rds.amazonaws.com:3306
 Source Schema         : dbaliexpress

 Target Server Type    : MySQL
 Target Server Version : 50726
 File Encoding         : 65001

 Date: 07/04/2020 16:05:07
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for aliexpress_stock_queue
-- ----------------------------
DROP TABLE IF EXISTS `aliexpress_stock_queue`;
CREATE TABLE `aliexpress_stock_queue`  (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` varchar(60) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `user_token` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `product_code` varchar(30) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `product_url` varchar(500) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `language` varchar(10) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `product_info_payload` text CHARACTER SET utf8 COLLATE utf8_general_ci NULL,
  `s3` text CHARACTER SET utf8 COLLATE utf8_general_ci NULL,
  `status` enum('RESERVED','READY','FINISHED','FAILED') CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT 'READY',
  `failed_at` timestamp(0) NULL DEFAULT NULL,
  `imported` tinyint(1) NOT NULL DEFAULT 0,
  `reserved_at` timestamp(0) NULL DEFAULT NULL,
  `finished_at` timestamp(0) NULL DEFAULT NULL,
  `created_at` timestamp(0) NULL DEFAULT NULL,
  `updated_at` timestamp(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `user_token`(`user_token`, `product_code`, `language`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

LOCK TABLES `aliexpress_stock_queue` WRITE;
/*!40000 ALTER TABLE `aliexpress_stock_queue` DISABLE KEYS */;

-- ----------------------------
-- Records of aliexpress_stock_queue
-- ----------------------------

/*!40000 ALTER TABLE `aliexpress_stock_queue` ENABLE KEYS */;
UNLOCK TABLES;

-- ----------------------------
-- Table structure for aliexpress_full_queue
-- ----------------------------
DROP TABLE IF EXISTS `aliexpress_full_queue`;
CREATE TABLE `aliexpress_full_queue`  (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` varchar(60) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `user_token` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `product_code` varchar(30) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `product_url` varchar(500) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `language` varchar(10) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `product_info_payload` text CHARACTER SET utf8 COLLATE utf8_general_ci NULL,
  `s3` text CHARACTER SET utf8 COLLATE utf8_general_ci NULL,
  `status` enum('RESERVED','READY','FINISHED','FAILED') CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT 'READY',
  `failed_at` timestamp(0) NULL DEFAULT NULL,
  `imported` tinyint(1) NOT NULL DEFAULT 0,
  `reserved_at` timestamp(0) NULL DEFAULT NULL,
  `finished_at` timestamp(0) NULL DEFAULT NULL,
  `created_at` timestamp(0) NULL DEFAULT NULL,
  `updated_at` timestamp(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `user_token`(`user_token`, `product_code`, `language`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

LOCK TABLES `aliexpress_full_queue` WRITE;
/*!40000 ALTER TABLE `aliexpress_full_queue` DISABLE KEYS */;

-- ----------------------------
-- Records of aliexpress_full_queue
-- ----------------------------

/*!40000 ALTER TABLE `aliexpress_full_queue` ENABLE KEYS */;
UNLOCK TABLES;

-- ----------------------------
-- Table structure for aliexpress_list
-- ----------------------------
DROP TABLE IF EXISTS `aliexpress_list`;
CREATE TABLE `aliexpress_list`  (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `category_url` varchar(500) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `category_id` varchar(30) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `product_url` varchar(500) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

LOCK TABLES `aliexpress_list` WRITE;
/*!40000 ALTER TABLE `aliexpress_list` DISABLE KEYS */;

-- ----------------------------
-- Records of aliexpress_list
-- ----------------------------

/*!40000 ALTER TABLE `aliexpress_list` ENABLE KEYS */;
UNLOCK TABLES;

-- ----------------------------
-- Table structure for banggood_full_queue
-- ----------------------------
DROP TABLE IF EXISTS `banggood_full_queue`;
CREATE TABLE `banggood_full_queue`  (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` varchar(60) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `user_token` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `product_id` varchar(30) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `language` varchar(10) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `product_url` varchar(500) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `product_info_payload` text CHARACTER SET utf8 COLLATE utf8_general_ci NULL,
  `s3` text CHARACTER SET utf8 COLLATE utf8_general_ci NULL,
  `status` enum('RESERVED','READY','FINISHED','FAILED') CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT 'READY',
  `failed_at` timestamp(0) NULL DEFAULT NULL,
  `imported` tinyint(1) NOT NULL DEFAULT 0,
  `reserved_at` timestamp(0) NULL DEFAULT NULL,
  `finished_at` timestamp(0) NULL DEFAULT NULL,
  `created_at` timestamp(0) NULL DEFAULT NULL,
  `updated_at` timestamp(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `user_token`(`user_token`, `product_id`, `language`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

LOCK TABLES `banggood_full_queue` WRITE;
/*!40000 ALTER TABLE `banggood_full_queue` DISABLE KEYS */;

-- ----------------------------
-- Records of banggood_full_queue
-- ----------------------------

/*!40000 ALTER TABLE `banggood_full_queue` ENABLE KEYS */;
UNLOCK TABLES;

-- ----------------------------
-- Table structure for banggood_stock_queue
-- ----------------------------
DROP TABLE IF EXISTS `banggood_stock_queue`;
CREATE TABLE `banggood_stock_queue`  (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` varchar(60) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `user_token` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `product_id` varchar(30) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `product_url` varchar(500) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `variant_id` varchar(500) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `warehouse` varchar(10) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `product_info_payload` text CHARACTER SET utf8 COLLATE utf8_general_ci NULL,
  `s3` text CHARACTER SET utf8 COLLATE utf8_general_ci NULL,
  `status` enum('RESERVED','READY','FINISHED','FAILED') CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT 'READY',
  `failed_at` timestamp(0) NULL DEFAULT NULL,
  `imported` tinyint(1) NOT NULL DEFAULT 0,
  `reserved_at` timestamp(0) NULL DEFAULT NULL,
  `finished_at` timestamp(0) NULL DEFAULT NULL,
  `created_at` timestamp(0) NULL DEFAULT NULL,
  `updated_at` timestamp(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `user_token`(`user_token`, `product_id`, `variant_id`, `warehouse`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

LOCK TABLES `banggood_stock_queue` WRITE;
/*!40000 ALTER TABLE `banggood_stock_queue` DISABLE KEYS */;

-- ----------------------------
-- Records of banggood_stock_queue
-- ----------------------------

/*!40000 ALTER TABLE `banggood_stock_queue` ENABLE KEYS */;
UNLOCK TABLES;

-- ----------------------------
-- Table structure for gearbest_full_queue
-- ----------------------------
DROP TABLE IF EXISTS `gearbest_full_queue`;
CREATE TABLE `gearbest_full_queue`  (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` varchar(60) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `user_token` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `goodsSn` varchar(30) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `language` varchar(10) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `product_url` varchar(500) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `product_info_payload` text CHARACTER SET utf8 COLLATE utf8_general_ci NULL,
  `s3` text CHARACTER SET utf8 COLLATE utf8_general_ci NULL,
  `status` enum('RESERVED','READY','FINISHED','FAILED') CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT 'READY',
  `failed_at` timestamp(0) NULL DEFAULT NULL,
  `imported` tinyint(1) NOT NULL DEFAULT 0,
  `reserved_at` timestamp(0) NULL DEFAULT NULL,
  `finished_at` timestamp(0) NULL DEFAULT NULL,
  `created_at` timestamp(0) NULL DEFAULT NULL,
  `updated_at` timestamp(0) NULL DEFAULT NULL,
  `shopCode` varchar(30) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `warehouseCode` varchar(30) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `categoryId` varchar(30) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `user_token`(`user_token`, `goodsSn`, `language`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

LOCK TABLES `gearbest_full_queue` WRITE;
/*!40000 ALTER TABLE `gearbest_full_queue` DISABLE KEYS */;

-- ----------------------------
-- Records of gearbest_full_queue
-- ----------------------------

/*!40000 ALTER TABLE `gearbest_full_queue` ENABLE KEYS */;
UNLOCK TABLES;

-- ----------------------------
-- Table structure for gearbest_stock_queue
-- ----------------------------
DROP TABLE IF EXISTS `gearbest_stock_queue`;
CREATE TABLE `gearbest_stock_queue`  (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` varchar(60) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `user_token` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `goodsSn` varchar(30) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `product_url` varchar(500) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `product_info_payload` text CHARACTER SET utf8 COLLATE utf8_general_ci NULL,
  `s3` text CHARACTER SET utf8 COLLATE utf8_general_ci NULL,
  `status` enum('RESERVED','READY','FINISHED','FAILED') CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT 'READY',
  `failed_at` timestamp(0) NULL DEFAULT NULL,
  `imported` tinyint(1) NOT NULL DEFAULT 0,
  `reserved_at` timestamp(0) NULL DEFAULT NULL,
  `finished_at` timestamp(0) NULL DEFAULT NULL,
  `created_at` timestamp(0) NULL DEFAULT NULL,
  `updated_at` timestamp(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `user_token`(`user_token`, `goodsSn`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

LOCK TABLES `gearbest_stock_queue` WRITE;
/*!40000 ALTER TABLE `gearbest_stock_queue` DISABLE KEYS */;

-- ----------------------------
-- Records of gearbest_stock_queue
-- ----------------------------

/*!40000 ALTER TABLE `gearbest_stock_queue` ENABLE KEYS */;
UNLOCK TABLES;

-- ----------------------------
-- Table structure for emma_full_queue
-- ----------------------------
DROP TABLE IF EXISTS `emma_full_queue`;
CREATE TABLE `emma_full_queue`  (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` varchar(60) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `user_token` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `product_id` varchar(30) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `product_url` varchar(500) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `product_info_payload` text CHARACTER SET utf8 COLLATE utf8_general_ci NULL,
  `s3` text CHARACTER SET utf8 COLLATE utf8_general_ci NULL,
  `status` enum('RESERVED','READY','FINISHED','FAILED') CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT 'READY',
  `failed_at` timestamp(0) NULL DEFAULT NULL,
  `imported` tinyint(1) NOT NULL DEFAULT 0,
  `reserved_at` timestamp(0) NULL DEFAULT NULL,
  `finished_at` timestamp(0) NULL DEFAULT NULL,
  `created_at` timestamp(0) NULL DEFAULT NULL,
  `updated_at` timestamp(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `user_token`(`user_token`, `product_url`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

LOCK TABLES `emma_full_queue` WRITE;
/*!40000 ALTER TABLE `emma_full_queue` DISABLE KEYS */;

-- ----------------------------
-- Records of emma_full_queue
-- ----------------------------

/*!40000 ALTER TABLE `emma_full_queue` ENABLE KEYS */;
UNLOCK TABLES;

-- ----------------------------
-- Table structure for shein_full_queue
-- ----------------------------
DROP TABLE IF EXISTS `shein_full_queue`;
CREATE TABLE `shein_full_queue`  (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` varchar(60) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `user_token` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `product_id` varchar(30) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `language` varchar(10) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `product_url` varchar(500) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `product_info_payload` text CHARACTER SET utf8 COLLATE utf8_general_ci NULL,
  `s3` text CHARACTER SET utf8 COLLATE utf8_general_ci NULL,
  `status` enum('RESERVED','READY','FINISHED','FAILED') CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT 'READY',
  `failed_at` timestamp(0) NULL DEFAULT NULL,
  `imported` tinyint(1) NOT NULL DEFAULT 0,
  `reserved_at` timestamp(0) NULL DEFAULT NULL,
  `finished_at` timestamp(0) NULL DEFAULT NULL,
  `created_at` timestamp(0) NULL DEFAULT NULL,
  `updated_at` timestamp(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `user_token`(`user_token`, `product_id`, `language`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

LOCK TABLES `shein_full_queue` WRITE;
/*!40000 ALTER TABLE `shein_full_queue` DISABLE KEYS */;

-- ----------------------------
-- Records of shein_full_queue
-- ----------------------------

/*!40000 ALTER TABLE `shein_full_queue` ENABLE KEYS */;
UNLOCK TABLES;

-- ----------------------------
-- Table structure for shein_stock_queue
-- ----------------------------
DROP TABLE IF EXISTS `shein_stock_queue`;
CREATE TABLE `shein_stock_queue`  (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` varchar(60) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `user_token` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `product_id` varchar(30) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `product_url` varchar(500) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `product_info_payload` text CHARACTER SET utf8 COLLATE utf8_general_ci NULL,
  `s3` text CHARACTER SET utf8 COLLATE utf8_general_ci NULL,
  `status` enum('RESERVED','READY','FINISHED','FAILED') CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT 'READY',
  `failed_at` timestamp(0) NULL DEFAULT NULL,
  `imported` tinyint(1) NOT NULL DEFAULT 0,
  `reserved_at` timestamp(0) NULL DEFAULT NULL,
  `finished_at` timestamp(0) NULL DEFAULT NULL,
  `created_at` timestamp(0) NULL DEFAULT NULL,
  `updated_at` timestamp(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `user_token`(`user_token`, `product_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

LOCK TABLES `shein_stock_queue` WRITE;
/*!40000 ALTER TABLE `shein_stock_queue` DISABLE KEYS */;

-- ----------------------------
-- Records of shein_stock_queue
-- ----------------------------

/*!40000 ALTER TABLE `shein_stock_queue` ENABLE KEYS */;
UNLOCK TABLES;

-- ----------------------------
-- Table structure for sources
-- ----------------------------
DROP TABLE IF EXISTS `sources`;
CREATE TABLE `sources`  (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `source_code` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `store_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `store_country` varchar(5) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `store_locale` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `country_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `store_language` varchar(5) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `store_url` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `banggood_contry_id` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `store_name`(`store_name`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

LOCK TABLES `sources` WRITE;
/*!40000 ALTER TABLE `sources` DISABLE KEYS */;

-- ----------------------------
-- Records of sources
-- ----------------------------
INSERT INTO `sources` VALUES (1, 'aliexpress-cn', 'Aliexpress', 'WW', 'en_US', NULL, 'EN', 'https://www.aliexpress.com/', NULL);
INSERT INTO `sources` VALUES (2, 'aliexpress-it', 'Aliexpress Italy', 'IT', 'it_IT', NULL, 'IT', 'https://it.aliexpress.com/', NULL);
INSERT INTO `sources` VALUES (3, 'aliexpress-es', 'Aliexpress Spain', 'ES', 'es_ES', NULL, 'ES', 'https://es.aliexpress.com/', NULL);
INSERT INTO `sources` VALUES (4, 'aliexpress-fr', 'Aliexpress France', 'FR', 'fr_FR', NULL, 'FR', 'https://fr.aliexpress.com/', NULL);
INSERT INTO `sources` VALUES (5, 'aliexpress-de', 'Aliexpress Germany', 'DE', 'de_DE', NULL, 'DE', 'https://de.aliexpress.com/', NULL);
INSERT INTO `sources` VALUES (6, 'aliexpress-nl', 'Aliexpress Netherland', 'NL', 'nl_nl', NULL, 'NL', 'https://nl.aliexpress.com/', NULL);
INSERT INTO `sources` VALUES (7, 'aliexpress-pt', 'Aliexpress Portugal', 'PT', 'pt_BR', NULL, 'PT', 'https://pt.aliexpress.com/', NULL);
INSERT INTO `sources` VALUES (8, 'aliexpress-pl', 'Aliexpress Poland', 'PL', 'pl_PL', NULL, 'PL', 'https://pl.aliexpress.com/', NULL);
INSERT INTO `sources` VALUES (9, 'aliexpress-tr', 'Aliexpress Turkey', 'TR', 'tr_TR', NULL, 'TR', 'https://tr.aliexpress.com/', NULL);
INSERT INTO `sources` VALUES (10, 'aliexpress-ru', 'Aliexpress Russia', 'RU', 'ru_RU', NULL, 'RU', 'https://ru.aliexpress.com/', NULL);
INSERT INTO `sources` VALUES (11, 'aliexpress-th', 'Aliexpress Thailand', 'TH', 'th_TH', NULL, 'TH', 'https://th.aliexpress.com/', NULL);
INSERT INTO `sources` VALUES (12, 'banggood-int', 'Banggood International', 'WW', NULL, NULL, 'WW', 'https://www.banggood.com/', NULL);
INSERT INTO `sources` VALUES (13, 'banggood-us', 'Banggood USA', 'USA', NULL, 'United States', 'USA', 'https://usa.banggood.com/', '223');
INSERT INTO `sources` VALUES (14, 'banggood-br', 'Banggood Brazil', 'BR', NULL, 'Brazil', 'BR', 'https://br.banggood.com/', '30');
INSERT INTO `sources` VALUES (15, 'banggood-de', 'Banggood Germany', 'DE', NULL, 'Germany', 'DE', 'https://de.banggood.com/', '81');
INSERT INTO `sources` VALUES (16, 'banggood-es', 'Banggood Spain', 'ES', NULL, 'Spain', 'ES', 'https://es.banggood.com/', '195');
INSERT INTO `sources` VALUES (17, 'banggood-fr', 'Banggood France', 'FR', NULL, 'France', 'FR', 'https://fr.banggood.com/', '73');
INSERT INTO `sources` VALUES (18, 'banggood-it', 'Banggood Italy', 'IT', NULL, 'Italy', 'IT', 'https://it.banggood.com/', '105');
INSERT INTO `sources` VALUES (19, 'banggood-uk', 'Banggood UK', 'UK', NULL, 'United Kingdom', 'UK', 'https://uk.banggood.com/', '222');
INSERT INTO `sources` VALUES (20, 'banggood-nl', 'Banggood Netherland', 'NL', NULL, 'Netherland', 'NL', 'https://nl.banggood.com/', '150');
INSERT INTO `sources` VALUES (21, 'banggood-in', 'Banggood India', 'IN', NULL, 'India', 'IN', 'https://www.banggood.in/', '99');
INSERT INTO `sources` VALUES (22, 'banggood-ru', 'Banggood Russia', 'RU', NULL, 'Russian Federation', 'RU', 'https://ru.banggood.com/', '176');
INSERT INTO `sources` VALUES (23, 'banggood-pt', 'Banggood Portugal', 'PT', NULL, 'Portugal', 'PT', 'https://pt.banggood.com/', '171');
INSERT INTO `sources` VALUES (24, 'banggood-tr', 'Banggood Turkey', 'TR', NULL, 'Turkey', 'TR', 'https://tr.banggood.com/', '215');
INSERT INTO `sources` VALUES (25, 'banggood-au', 'Banggood Australia', 'AU', NULL, 'Australia', 'AU', 'https://au.banggood.com/', '13');
INSERT INTO `sources` VALUES (26, 'banggood-pl', 'Banggood Poland', 'PL', NULL, 'Poland', 'PL', 'https://pl.banggood.com/', '170');
INSERT INTO `sources` VALUES (27, 'banggood-cn', 'Banggood China Warehouse', 'CN', NULL, NULL, 'CN', 'https://www.banggood.com/', NULL);
INSERT INTO `sources` VALUES (28, 'banggood-hk', 'Banggood Hong Kong Warehouse', 'HK', NULL, 'Hong Kong', 'HK', 'https://www.banggood.com/', '96');
INSERT INTO `sources` VALUES (29, 'banggood-cz', 'Banggood CZ', 'CZ', NULL, 'Czech Republic', 'CZ', 'https://www.banggood.com/', '56');
INSERT INTO `sources` VALUES (30, 'banggood-gwtr', 'Banggood GWTR', 'GWTR', NULL, NULL, 'GWTR', 'https://www.banggood.com/', NULL);
INSERT INTO `sources` VALUES (31, 'banggood-sea', 'Banggood South East Asia', 'SEA', NULL, 'South East Asia', 'SEA', 'https://sea.banggood.com/', NULL);
INSERT INTO `sources` VALUES (32, 'gearbest-ww', 'Gearbest Global', 'WW', NULL, 'Global', 'WW', 'https://www.gearbest.com/', NULL);
INSERT INTO `sources` VALUES (33, 'gearbest-fr', 'Gearbest France', 'FR', NULL, 'France', 'FR', 'https://fr.gearbest.com/', NULL);
INSERT INTO `sources` VALUES (34, 'gearbest-es', 'Gearbest Spain', 'ES', NULL, 'Spain', 'ES', 'https://es.gearbest.com/', NULL);
INSERT INTO `sources` VALUES (35, 'gearbest-ru', 'Gearbest Russia', 'RU', NULL, 'Russia', 'RU', 'https://ru.gearbest.com/', NULL);
INSERT INTO `sources` VALUES (36, 'gearbest-pt', 'Gearbest Portugal', 'PT', NULL, 'Portugal', 'PT', 'https://pt.gearbest.com/', NULL);
INSERT INTO `sources` VALUES (37, 'gearbest-it', 'Gearbest Italy', 'IT', NULL, 'Italy', 'IT', 'https://it.gearbest.com/', NULL);
INSERT INTO `sources` VALUES (38, 'gearbest-de', 'Gearbest Germany', 'DE', NULL, 'Germany', 'DE', 'https://de.gearbest.com/', NULL);
INSERT INTO `sources` VALUES (39, 'gearbest-br', 'Gearbest Brazil', 'BR', NULL, 'Brazil', 'BR', 'https://br.gearbest.com/', NULL);
INSERT INTO `sources` VALUES (40, 'gearbest-tr', 'Gearbest Turkey', 'TR', NULL, 'Turkey', 'TR', 'https://tr.gearbest.com/', NULL);
INSERT INTO `sources` VALUES (41, 'gearbest-pl', 'Gearbest Poland', 'PL', NULL, 'Polan', 'PL', 'https://pl.gearbest.com/', NULL);
INSERT INTO `sources` VALUES (42, 'gearbest-gr', 'Gearbest Greece', 'GR', NULL, 'Greece', 'GR', 'https://gr.gearbest.com/', NULL);
INSERT INTO `sources` VALUES (43, 'gearbest-mx', 'Gearbest Mexico', 'MX', NULL, 'Mexico', 'MX', 'https://mx.gearbest.com/', NULL);
INSERT INTO `sources` VALUES (44, 'gearbest-hu', 'Gearbest Hungary', 'HU', NULL, 'Hungary', 'HU', 'https://hu.gearbest.com/', NULL);
INSERT INTO `sources` VALUES (45, 'gearbest-sk', 'Gearbest Slovakia', 'SK', NULL, 'Slovakia', 'SK', 'https://sk.gearbest.com/', NULL);
INSERT INTO `sources` VALUES (46, 'gearbest-ro', 'Gearbest Romania', 'RO', NULL, 'Romania', 'RO', 'https://ro.gearbest.com/', NULL);
INSERT INTO `sources` VALUES (47, 'gearbest-cz', 'Gearbest Cz', 'CZ', NULL, 'CZ', 'CZ', 'https://cz.gearbest.com/', NULL);
INSERT INTO `sources` VALUES (48, 'dhgate-ww', 'Dhgate Global', 'WW', NULL, 'WW', 'WW', 'https://www.dhgate.com/', NULL);
INSERT INTO `sources` VALUES (49, 'dhgate-es', 'Dhgate Spain', 'ES', NULL, 'Spain', 'ES', 'https://es.dhgate.com/', NULL);
INSERT INTO `sources` VALUES (50, 'dhgate-pt', 'Dhgate Portugal', 'PT', NULL, 'Portugal', 'PT', 'https://pt.dhgate.com/', NULL);
INSERT INTO `sources` VALUES (51, 'dhgate-fr', 'Dhgate France', 'FR', NULL, 'France', 'FR', 'https://fr.dhgate.com/', NULL);
INSERT INTO `sources` VALUES (52, 'dhgate-de', 'Dhgate Germany', 'DE', NULL, 'Germany', 'DE', 'https://de.dhgate.com/', NULL);
INSERT INTO `sources` VALUES (53, 'dhgate-tr', 'Dhgate Turkey', 'TR', NULL, 'Turkey', 'TR', 'https://tr.dhgate.com/', NULL);
INSERT INTO `sources` VALUES (54, 'dhgate-ru', 'Dhgate Russia', 'RU', NULL, 'Russia', 'RU', 'https://ru.dhgate.com/', NULL);
INSERT INTO `sources` VALUES (55, 'shein-ww', 'Shein Global', 'WW', NULL, 'Global', 'WW', 'https://us.shein.com/', NULL);
INSERT INTO `sources` VALUES (56, 'shein-ww', 'Shein International', 'WW', NULL, 'Global', 'WW', 'https://www.shein.com/', NULL);
INSERT INTO `sources` VALUES (57, 'shein-us', 'Shein USA', 'US', NULL, 'USA', 'US', 'https://us.shein.com/', NULL);
INSERT INTO `sources` VALUES (58, 'shein-au', 'Shein Australia', 'AU', NULL, 'Australia', 'AU', 'https://au.shein.com/', NULL);
INSERT INTO `sources` VALUES (59, 'shein-eu', 'Shein Europa', 'EU', NULL, 'Europa', 'EU', 'https://eur.shein.com/', NULL);
INSERT INTO `sources` VALUES (60, 'shein-ar', 'Shein Emirates Arab Unite', 'AR', NULL, 'Emirates', 'AR', 'https://ar.shein.com/', NULL);
INSERT INTO `sources` VALUES (61, 'shein-br', 'Shein Brazil', 'BR', NULL, 'Brazil', 'BR', 'https://br.shein.com/', NULL);
INSERT INTO `sources` VALUES (62, 'shein-ca', 'Shein Canada', 'CA', NULL, 'Canada', 'CA', 'https://ca.shein.com/', NULL);
INSERT INTO `sources` VALUES (63, 'shein-cl', 'Shein Chile', 'CL', NULL, 'Chile', 'CL', 'https://cl.shein.com/', NULL);
INSERT INTO `sources` VALUES (64, 'shein-fr', 'Shein France', 'FR', NULL, 'France', 'FR', 'https://fr.shein.com/', NULL);
INSERT INTO `sources` VALUES (65, 'shein-de', 'Shein Germany', 'DE', NULL, 'Germany', 'DE', 'https://de.shein.com/', NULL);
INSERT INTO `sources` VALUES (66, 'shein-hk', 'Shein Hong Kong', 'HK', NULL, 'Hong Kong', 'HK', 'https://www.shein.com.hk/', NULL);
INSERT INTO `sources` VALUES (67, 'shein-in', 'Shein India', 'IN', NULL, 'India', 'IN', 'https://www.shein.in/', NULL);
INSERT INTO `sources` VALUES (68, 'shein-asia', 'Shein Asia', 'ASIA', NULL, 'Asia', 'ASIA', 'https://asia.shein.com/', NULL);
INSERT INTO `sources` VALUES (69, 'shein-il', 'Shein Istrael', 'IL', NULL, 'Istrael', 'IL', 'https://il.shein.com/', NULL);
INSERT INTO `sources` VALUES (70, 'shein-it', 'Shein Italy', 'IT', NULL, 'Italy', 'IT', 'https://it.shein.com/', NULL);
INSERT INTO `sources` VALUES (71, 'shein-mx', 'Shein Mexico', 'MX', NULL, 'Mexico', 'MX', 'https://www.shein.com.mx/', NULL);
INSERT INTO `sources` VALUES (72, 'shein-ma', 'Shein Morocco', 'MA', NULL, 'Morocco', 'MA', 'https://ma.shein.com/', NULL);
INSERT INTO `sources` VALUES (73, 'shein-nl', 'Shein Netherlands', 'NL', NULL, 'Netherlands', 'NL', 'https://nl.shein.com/', NULL);
INSERT INTO `sources` VALUES (74, 'shein-nz', 'Shein New Zeland', 'NZ', NULL, 'New Zeland', 'NZ', 'https://nz.shein.com/', NULL);
INSERT INTO `sources` VALUES (75, 'shein-pl', 'Shein Poland', 'PL', NULL, 'New Poland', 'PL', 'https://pl.shein.com/', NULL);
INSERT INTO `sources` VALUES (76, 'shein-ru', 'Shein Russia', 'RU', NULL, 'Russia', 'RU', 'https://ru.shein.com/', NULL);
INSERT INTO `sources` VALUES (77, 'shein-es', 'Shein Spain', 'ES', NULL, 'Spain', 'ES', 'https://es.shein.com/', NULL);
INSERT INTO `sources` VALUES (78, 'shein-se', 'Shein Sweden', 'SE', NULL, 'Sweden', 'SE', 'https://www.shein.se/', NULL);
INSERT INTO `sources` VALUES (79, 'shein-th', 'Shein Thailand', 'TH', NULL, 'Thailand', 'TH', 'https://th.shein.com/', NULL);
INSERT INTO `sources` VALUES (80, 'shein-uk', 'Shein UK', 'UK', NULL, 'UK', 'UK', 'https://www.shein.co.uk/', NULL);


/*!40000 ALTER TABLE `sources` ENABLE KEYS */;
UNLOCK TABLES;

-- ----------------------------
-- Table structure for stores
-- ----------------------------
DROP TABLE IF EXISTS `stores`;
CREATE TABLE `stores`  (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `store_id` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `store_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `store_url` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `store_feedbacks` double(8, 1) NULL DEFAULT NULL,
  `seller_since` date NULL DEFAULT NULL,
  `created_at` timestamp(0) NULL DEFAULT NULL,
  `modified_at` timestamp(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

LOCK TABLES `stores` WRITE;
/*!40000 ALTER TABLE `stores` DISABLE KEYS */;

-- ----------------------------
-- Records of stores
-- ----------------------------

/*!40000 ALTER TABLE `stores` ENABLE KEYS */;
UNLOCK TABLES;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` int(40) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_account_number` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `api_token` varchar(25) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `email` varchar(191) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `password` varchar(60) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `created_at` timestamp(0) NULL DEFAULT NULL,
  `updated_at` timestamp(0) NULL DEFAULT NULL,
  `deleted_at` timestamp(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `email`(`email`) USING BTREE,
  INDEX `account_number`(`user_account_number`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES (1, 'aliexpressdaslKL312312kdas', 'arjtT1zdp7dc54eC39HqLyjWD', 'aliexpress@email.com', '-', '2019-05-03 19:59:08', '2019-06-20 08:09:40', NULL);

/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

SET FOREIGN_KEY_CHECKS = 1;
