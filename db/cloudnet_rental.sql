-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Sep 18, 2024 at 12:09 PM
-- Server version: 8.3.0
-- PHP Version: 8.2.18

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `cloudnet_rental`
--

-- --------------------------------------------------------

--
-- Table structure for table `contract`
--

DROP TABLE IF EXISTS `contract`;
CREATE TABLE IF NOT EXISTS `contract` (
  `id` int NOT NULL AUTO_INCREMENT,
  `agent_id` varchar(233) NOT NULL,
  `property_id` int NOT NULL,
  `created_date` date NOT NULL,
  `customer_name` varchar(150) NOT NULL,
  `startdate` date NOT NULL,
  `enddate` date NOT NULL,
  `totalmonths` int NOT NULL,
  `advance` int NOT NULL,
  `rent` int NOT NULL,
  `description` varchar(233) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_contract_agent` (`agent_id`),
  KEY `fk_contract_property` (`property_id`)
) ENGINE=MyISAM AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `contract`
--

INSERT INTO `contract` (`id`, `agent_id`, `property_id`, `created_date`, `customer_name`, `startdate`, `enddate`, `totalmonths`, `advance`, `rent`, `description`) VALUES
(7, 'Jyoti0001', 5, '2024-09-18', 'VIx', '2024-09-17', '2024-09-17', 3, 20000, 15000, 'Test desc'),
(8, 'Jyoti0001', 6, '2024-09-18', 'Gigi', '2024-09-19', '2024-09-19', 3, 25000, 13000, 'gdfgdfgdfg gdfgfdgdfg gfdgfd');

-- --------------------------------------------------------

--
-- Table structure for table `customer_images`
--

DROP TABLE IF EXISTS `customer_images`;
CREATE TABLE IF NOT EXISTS `customer_images` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` varchar(233) DEFAULT NULL,
  `filename` varchar(255) NOT NULL,
  `path` varchar(255) NOT NULL,
  `mimetype` varchar(100) NOT NULL,
  `size` int NOT NULL,
  `dateUploaded` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=10 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `customer_images`
--

INSERT INTO `customer_images` (`id`, `product_id`, `filename`, `path`, `mimetype`, `size`, `dateUploaded`) VALUES
(4, '7', 'images-1726660608462.png', 'uploads\\images-1726660608462.png', 'image/png', 18417, '2024-09-18 18:56:48'),
(5, '7', 'images-1726660608462.png', 'uploads\\images-1726660608462.png', 'image/png', 24603, '2024-09-18 18:56:48'),
(6, '8', 'images-1726660776200.png', 'uploads\\images-1726660776200.png', 'image/png', 292672, '2024-09-18 18:59:36'),
(7, '8', 'images-1726660776201.png', 'uploads\\images-1726660776201.png', 'image/png', 256504, '2024-09-18 18:59:36'),
(8, '8', 'images-1726660776202.png', 'uploads\\images-1726660776202.png', 'image/png', 76743, '2024-09-18 18:59:36'),
(9, '8', 'images-1726660776203.png', 'uploads\\images-1726660776203.png', 'image/png', 182965, '2024-09-18 18:59:36');

-- --------------------------------------------------------

--
-- Table structure for table `images`
--

DROP TABLE IF EXISTS `images`;
CREATE TABLE IF NOT EXISTS `images` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` varchar(233) DEFAULT NULL,
  `filename` varchar(255) NOT NULL,
  `path` varchar(255) NOT NULL,
  `mimetype` varchar(100) NOT NULL,
  `size` int NOT NULL,
  `dateUploaded` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=29 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `images`
--

INSERT INTO `images` (`id`, `product_id`, `filename`, `path`, `mimetype`, `size`, `dateUploaded`) VALUES
(20, NULL, 'images-1726653326419.png', 'uploads\\images-1726653326419.png', 'image/png', 2119755, '2024-09-18 16:55:26'),
(19, '1', 'images-1726649755992.png', 'uploads\\images-1726649755992.png', 'image/png', 1719173, '2024-09-18 15:55:56'),
(17, '6', 'images-1726648510045.png', 'uploads\\images-1726648510045.png', 'image/png', 76743, '2024-09-18 15:35:10'),
(14, '5', 'images-1726472604554.png', 'uploads\\images-1726472604554.png', 'image/png', 85756, '2024-09-16 14:43:24'),
(15, '5', 'images-1726472604554.png', 'uploads\\images-1726472604554.png', 'image/png', 292672, '2024-09-16 14:43:24'),
(18, '6', 'images-1726648510046.png', 'uploads\\images-1726648510046.png', 'image/png', 182965, '2024-09-18 15:35:10'),
(13, '5', 'images-1726472604553.png', 'uploads\\images-1726472604553.png', 'image/png', 44881, '2024-09-16 14:43:24'),
(21, NULL, 'images-1726653326424.png', 'uploads\\images-1726653326424.png', 'image/png', 2491466, '2024-09-18 16:55:26'),
(22, NULL, 'images-1726653326429.png', 'uploads\\images-1726653326429.png', 'image/png', 1567166, '2024-09-18 16:55:26'),
(23, NULL, 'images-1726653326433.png', 'uploads\\images-1726653326433.png', 'image/png', 2832, '2024-09-18 16:55:26'),
(24, '2', 'images-1726653490100.png', 'uploads\\images-1726653490100.png', 'image/png', 28451, '2024-09-18 16:58:10'),
(25, '2', 'images-1726653490100.png', 'uploads\\images-1726653490100.png', 'image/png', 18417, '2024-09-18 16:58:10'),
(26, '2', 'images-1726653490100.png', 'uploads\\images-1726653490100.png', 'image/png', 24603, '2024-09-18 16:58:10'),
(27, '3', 'images-1726653790424.png', 'uploads\\images-1726653790424.png', 'image/png', 100110, '2024-09-18 17:03:10'),
(28, '3', 'images-1726653790424.png', 'uploads\\images-1726653790424.png', 'image/png', 1719173, '2024-09-18 17:03:10');

-- --------------------------------------------------------

--
-- Table structure for table `listing`
--

DROP TABLE IF EXISTS `listing`;
CREATE TABLE IF NOT EXISTS `listing` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_date` date NOT NULL,
  `agent_id` varchar(112) NOT NULL,
  `property_name` varchar(233) NOT NULL,
  `address` text NOT NULL,
  `totalrooms` int NOT NULL,
  `totaltoilets` int NOT NULL,
  `building` varchar(110) NOT NULL,
  `floor` varchar(5) NOT NULL,
  `room` varchar(10) NOT NULL,
  `type` varchar(110) NOT NULL,
  `description` text,
  `ownername` varchar(233) NOT NULL,
  `idproof` varchar(233) NOT NULL,
  `owneraddress` text NOT NULL,
  `status` varchar(25) NOT NULL DEFAULT 'vaccant',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=7 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `listing`
--

INSERT INTO `listing` (`id`, `created_date`, `agent_id`, `property_name`, `address`, `totalrooms`, `totaltoilets`, `building`, `floor`, `room`, `type`, `description`, `ownername`, `idproof`, `owneraddress`, `status`) VALUES
(5, '2024-09-18', 'Jyoti0001', 'Arcadia Beach Continenetal ', '1', 2, 1, 'Arcadia Beach Continenetal ', '12', '1', 'Rental', 'test property ggg', '', '', '', 'occupied'),
(6, '2024-09-18', 'Jyoti0001', 'Unixx', 'Pratamnak', 2, 2, 'Unixx', '19', '1907', 'Rental', 'Cozy Area', '', 'Bangkok', 'Bangkok soi 7', 'occupied');

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usertype_id` int DEFAULT NULL,
  `permission` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `usertype_id` (`usertype_id`)
) ENGINE=MyISAM AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `permissions`
--

INSERT INTO `permissions` (`id`, `usertype_id`, `permission`) VALUES
(1, 1, 'view'),
(2, 1, 'edit'),
(3, 1, 'delete'),
(4, 1, 'create'),
(5, 1, 'manage_users'),
(6, 2, 'view'),
(7, 2, 'edit'),
(8, 2, 'create'),
(9, 3, 'view'),
(10, 4, 'view'),
(11, 4, 'create'),
(12, 4, 'edit_own'),
(13, 5, 'view_public');

-- --------------------------------------------------------

--
-- Table structure for table `property_type`
--

DROP TABLE IF EXISTS `property_type`;
CREATE TABLE IF NOT EXISTS `property_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` varchar(233) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=7 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `property_type`
--

INSERT INTO `property_type` (`id`, `type`) VALUES
(1, 'Rental'),
(2, 'Sale'),
(6, 'Both');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `uname` varchar(233) NOT NULL,
  `pass` text NOT NULL,
  `contact` varchar(233) NOT NULL DEFAULT '0',
  `email` varchar(233) NOT NULL,
  `type` varchar(112) NOT NULL,
  `status` int NOT NULL DEFAULT '1',
  `last_loggedin` varchar(233) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=193 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `uname`, `pass`, `contact`, `email`, `type`, `status`, `last_loggedin`) VALUES
(123, 'Jyoti Thakur', 'Jyoti0001', '$2a$10$HRrtYU.nW.xn5hAinDERe.Yadd9wWV5/0/HG1NYf0NQJYVVzpD5T.', '0', 'abcs@gmail.com', 'admin', 1, '2024-09-18 19:00:18'),
(165, 'vick', '12531', '$2a$10$HtFmCuHU9k1xin5.Lbz6mOBf6wYR7Un0jIvdaIOfUH.WYx7kwRoVm', '155', 'AXIALITSOLUTIONS0001@GMAIL.COM', '1', 1, '2024-09-05'),
(169, 'gdfg', '82939', '$2a$10$mEFx41QSY0IWAhO4uFCTFuQxcRTGTGxwB2qITItUOi.FuKoIJRMJO', '43543', 'ggkjbffjk@gmail.com', '', 1, '2024-09-05'),
(178, 'bkjk', '40185', '$2a$10$L6nk9phF8hoZ7IOf6uoUous0PpLBJqS3UVp1qYLQzuPxMOy9gAjmK', '546', 'nmkk@gmail.com', 'undefined', 1, '2024-09-09'),
(179, 'bjbk', '71100', '$2a$10$oTaNgfCf3x/l08CA1GqQwup/KdglpgIbsNOp3R1XLeUKjkl3bFpvK', '54645', 'bnjbk@gmail.com', 'Viewer', 1, '2024-09-09'),
(180, 'undefined', '75690', '$2a$10$EU9fY38v6mK58aHcJ8Ahh.RsY4WC3N6GNo.Zk9uWrARrB28AwkuOe', 'undefined', 'bnjdsadsdddk@gmail.com', 'undefined', 1, '2024-09-09'),
(181, 'undefined', '46144', '$2a$10$4r54ObXH8bE.CkbWr4fph.D5Smub9ENL3g2Lxkxa6W4wILosHdDmK', 'undefined', 'undefined', 'undefined', 1, '2024-09-09'),
(182, 'dsfds', '18491', '$2a$10$2dgWfUY0O4VmVnFPO3YlbO.H2B.j193oE7K3oDDtqadlJYUVHVwqC', 'undefined', 'undefined', 'Admin', 1, '2024-09-09'),
(183, 'undefined', '59190', '$2a$10$Yb8DmRsbwPgj8paWDX1Ch.Z3sc11oVh4m78HPSGrLe/HpyoEi8YDm', 'undefined', 'undefined', 'undefined', 1, '2024-09-09'),
(184, 'undefined', '7977', '$2a$10$kBZ8bH.FCmpzgf43DgtzPuPy5VBwMHKTjbw8VNTuNarIkKa3MBTK2', 'undefined', 'undefined', 'undefined', 1, '2024-09-09'),
(185, 'bcjbk', '8737', '$2a$10$z3uagbe2wllRcjgatdLB.OIJzUW7x5oOaMPSV5/H2Rx4VMtwk5VAq', '15453', 'jkijol@gmail.com', 'Editor', 1, '2024-09-09'),
(186, 'undefined', '69403', '$2a$10$M8Mk.TANCMAEvbVu9QkHE.n1FCIGJljHo4QA35onIEO8UBLulpsS.', 'undefined', 'undefined', 'undefined', 1, '2024-09-09'),
(187, 'esdfdsf', '82869', '$2a$10$afpvaDQXZKkFbd.GGQPRseCSwguvfFS4NMYQ6tKH2JimE8esYmHGK', '5435', 'jkigvfgjol@gmail.com', 'Contributor', 1, '2024-09-09'),
(188, 'gfdg', '85814', '$2a$10$21quAwPDyWY1RLnBkn1mIeRini4PAM16LGPdZOaEfrI3mJZIlzp1m', '5435', 'jgdfgkigvfgjol@gmail.com', 'Guest', 1, '2024-09-09'),
(189, 'gfdg', '64096', '$2a$10$oLIMs8XGX5GMAc0nj0mMte/r5atHa/Je7KOWJZ.7po84Ur9jUmrOO', '6546', 'gdf@gmail.com', 'Viewer', 1, '2024-09-09'),
(190, 'gfdgfdf', '45643', '$2a$10$JTJ6gBr8dYTmPIotVhj4ce9wzCFvmwoezCYYYCwnOYjgpwdJlM622', '654655', 'gdfgg@gmail.com', 'Contributor', 1, '2024-09-09'),
(191, 'gfdgfdfdfdfh', '75756', '$2a$10$puouNJjF2ZqsxcsZRe/mi.fr.ilO9fx9MB9wRMdwhXSuZ92Ux2WrG', '6546556', 'gdfggg@gmail.com', 'Editor', 1, '2024-09-09'),
(192, 'gfdgd', '51205', '$2a$10$uTa2yiVwnf1KL0GsmTnNx..r4fmxpt/icNWXMul6X3GOnE/GEwUQ2', '1232', 'mkmk@gmail.com', 'Editor', 1, '2024-09-09');

-- --------------------------------------------------------

--
-- Table structure for table `usertypes`
--

DROP TABLE IF EXISTS `usertypes`;
CREATE TABLE IF NOT EXISTS `usertypes` (
  `id` int NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `description` text,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `usertypes`
--

INSERT INTO `usertypes` (`id`, `name`, `description`) VALUES
(1, 'Admin', 'Administrator with full access to all features.'),
(2, 'Editor', 'Editor with access to content creation and editing.'),
(3, 'Viewer', 'Viewer with read-only access to content.'),
(4, 'Contributor', 'Contributor with limited access to create and edit their own content.'),
(5, 'Guest', 'Guest with limited access to view public content.');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
