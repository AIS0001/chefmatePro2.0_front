-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Oct 01, 2024 at 06:46 PM
-- Server version: 5.7.40-log
-- PHP Version: 8.0.26

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `cloudnet_chefmate`
--

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
CREATE TABLE IF NOT EXISTS `categories` (
  `id` int(233) NOT NULL AUTO_INCREMENT,
  `name` varchar(233) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`) VALUES
(1, 'Breakfast'),
(2, 'Lunch'),
(3, 'Dinner'),
(4, 'test'),
(5, 'dasd');

-- --------------------------------------------------------

--
-- Table structure for table `images`
--

DROP TABLE IF EXISTS `images`;
CREATE TABLE IF NOT EXISTS `images` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` varchar(233) DEFAULT NULL,
  `filename` varchar(255) NOT NULL,
  `path` varchar(255) NOT NULL,
  `mimetype` varchar(100) NOT NULL,
  `size` int(11) NOT NULL,
  `dateUploaded` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=11 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `images`
--

INSERT INTO `images` (`id`, `product_id`, `filename`, `path`, `mimetype`, `size`, `dateUploaded`) VALUES
(1, '1', 'images-1726498522825.jpg', 'uploads\\images-1726498522825.jpg', 'image/jpeg', 822538, '2024-09-16 21:55:22'),
(2, '1', 'images-1726498522846.jpg', 'uploads\\images-1726498522846.jpg', 'image/jpeg', 838448, '2024-09-16 21:55:22'),
(7, '2', 'images-1726502706582.jpg', 'uploads\\images-1726502706582.jpg', 'image/jpeg', 609729, '2024-09-16 23:05:06'),
(8, '2', 'images-1726502706598.jpg', 'uploads\\images-1726502706598.jpg', 'image/jpeg', 276600, '2024-09-16 23:05:06'),
(9, '2', 'images-1726502706608.jpg', 'uploads\\images-1726502706608.jpg', 'image/jpeg', 276600, '2024-09-16 23:05:06'),
(10, '3', 'images-1726502750847.jpg', 'uploads\\images-1726502750847.jpg', 'image/jpeg', 224357, '2024-09-16 23:05:50');

-- --------------------------------------------------------

--
-- Table structure for table `items`
--

DROP TABLE IF EXISTS `items`;
CREATE TABLE IF NOT EXISTS `items` (
  `id` int(233) NOT NULL AUTO_INCREMENT,
  `catid` int(233) NOT NULL,
  `subcatid` int(233) UNSIGNED DEFAULT NULL,
  `iname` varchar(233) NOT NULL,
  `unit` varchar(23) NOT NULL,
  `tax` int(5) NOT NULL,
  `mrp` int(233) NOT NULL,
  `offerprice` int(233) NOT NULL,
  `description` text NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_items_catid` (`catid`),
  KEY `fk_items_subcatid` (`subcatid`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `items`
--

INSERT INTO `items` (`id`, `catid`, `subcatid`, `iname`, `unit`, `tax`, `mrp`, `offerprice`, `description`) VALUES
(1, 3, 10, 'gfdgfd', 'KG', 5, 545, 454, 'ghhfghgf'),
(2, 3, 10, 'gfdgfd', 'KG', 5, 545, 454, 'ghhfghgf'),
(3, 3, 10, 'fdfs', 'Ltr', 5, 45435, 654, 'ghfhfg'),
(18, 4, 3, 'gjhj', 'KG', 543, 677, 657, 'utyuyt'),
(19, 4, 11, 'hjgfj', 'Ltr', 543, 765, 765, 'utyu'),
(23, 3, 10, 'gfdggh', 'Ltr', 543, 656, 7667, 'vfcgb');

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usertype_id` int(11) DEFAULT NULL,
  `permission` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `usertype_id` (`usertype_id`)
) ENGINE=MyISAM AUTO_INCREMENT=14 DEFAULT CHARSET=latin1;

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
-- Table structure for table `subcategory`
--

DROP TABLE IF EXISTS `subcategory`;
CREATE TABLE IF NOT EXISTS `subcategory` (
  `id` int(233) UNSIGNED NOT NULL,
  `cat_id` int(233) DEFAULT NULL,
  `subcat` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `cat_id` (`cat_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `subcategory`
--

INSERT INTO `subcategory` (`id`, `cat_id`, `subcat`) VALUES
(3, 4, 'sdsa'),
(10, 3, 'sds'),
(11, 4, 'dffd'),
(12, 7, 'dffddsads');

-- --------------------------------------------------------

--
-- Table structure for table `tablelist`
--

DROP TABLE IF EXISTS `tablelist`;
CREATE TABLE IF NOT EXISTS `tablelist` (
  `id` int(233) NOT NULL AUTO_INCREMENT,
  `name` varchar(233) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `tablelist`
--

INSERT INTO `tablelist` (`id`, `name`) VALUES
(5, 'Table 1'),
(6, 'Table 2'),
(7, 'Table 3'),
(8, 'Table 4'),
(9, 'Table 5'),
(10, 'Table 1'),
(11, 'Tabl3'),
(12, 'Tabl5'),
(13, 'Table 7');

-- --------------------------------------------------------

--
-- Table structure for table `taxes`
--

DROP TABLE IF EXISTS `taxes`;
CREATE TABLE IF NOT EXISTS `taxes` (
  `id` int(233) NOT NULL AUTO_INCREMENT,
  `taxname` varchar(122) NOT NULL,
  `taxvalue` int(5) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `taxes`
--

INSERT INTO `taxes` (`id`, `taxname`, `taxvalue`) VALUES
(1, 'sdfg', 543),
(4, 'gst5%', 5);

-- --------------------------------------------------------

--
-- Table structure for table `units`
--

DROP TABLE IF EXISTS `units`;
CREATE TABLE IF NOT EXISTS `units` (
  `id` int(233) NOT NULL AUTO_INCREMENT,
  `name` varchar(233) NOT NULL,
  `description` varchar(233) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `units`
--

INSERT INTO `units` (`id`, `name`, `description`) VALUES
(2, 'KG', 'sdfjk gdsfg'),
(3, 'MG', 'gfhfgh'),
(4, 'Ltr', 'litre');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `uname` varchar(233) NOT NULL,
  `pass` text NOT NULL,
  `contact` varchar(233) NOT NULL DEFAULT '0',
  `email` varchar(233) NOT NULL,
  `type` varchar(112) NOT NULL,
  `status` int(11) NOT NULL DEFAULT '1',
  `last_loggedin` varchar(233) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=164 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `uname`, `pass`, `contact`, `email`, `type`, `status`, `last_loggedin`) VALUES
(123, 'Jyoti Thakur', 'Jyoti0001', '$2a$10$OktzxujrxGpv2H6a5OQ3JuSxpULhZPJ92uDr5Lwko0k1AI1rHf5D2', '0', 'abcs@gmail.com', 'admin', 1, '2024-10-02 00:26:56'),
(124, 'VInod Kumar', 'vicky', '$2a$10$RhcYysQ6.2rDbG2jCYYEGOy524lgcq6LlBSe5xBuUM9h0OQ6.Ujxu', '0', 'abcsf@gmail.com', 'admin', 1, '2023-12-14 15:51:57'),
(147, 'Vicky', '86845', '$2a$10$fJT8ki1bWWAH6m.XBXpOo.6A3GhenpdQ/rh5T3BN.V5fUUekd5z1i', '5662', 'hfnjh@gmail.com', 'admin', 1, '2024-05-17 01:39:57'),
(155, 'Vicky', '47895', '$2a$10$swPyegJ6GPXiQIty/MlNG.yJfINKnA42nSb/apwGzSU4WspTfqslS', '369', 'axiaccltour@gmail.com', 'admin', 1, '2024-05-27'),
(158, 'test01', '49159', '$2a$10$OS3KKewE1dmly2GFYmrTqOFra2uhrRknZaXQGvQ0fwLnC39lWDsJG', '415464', 'bjfk@gmail.com', 'admin', 1, '2024-07-07 13:20:20'),
(159, 'Rita', '18886', '$2a$10$7XHS/o90NIIs//zlgcJB5O50C4nl1oqS1lShTQLbMIihOpGCvZ/gO', '15', 'axialtoudr@gmail.com', 'cashier', 1, '2024-07-14 16:54:02'),
(160, 'Yulia', '96086', '$2a$10$J04AwJsvZotQPS1iqsu0NO254IXQQsP.jPFgmVpzeiip3wLhq5IFS', '4546546', 'bhbhujb@gmail.com', 'cashier', 1, '2024-07-14 22:10:12'),
(161, 'vcb', '11970', '$2a$10$4hcOeQIUDnvp/nfe.ZAO.OGZvAsYP1DmcawSV2wOyjtfpt5uvpXNq', '7654344', 'vhgggv@gmail.com', '5', 1, '2024-09-05'),
(162, 'ggggg', '17192', '$2a$10$xncktF3cEkkAqrX510DYnOpCx9XNOa5mYF6Y6h3EUf3ftvR5xqnbW', '7755', 'VHfdfVHJ@GMAIL.COM', '3', 1, '2024-09-05'),
(163, 'gggggggg', '90011', '$2a$10$s.CakNJ3h/rXKIMY58jCw.VBzb8kWrOxc.zMALIuFcU.2wUr2Lofi', '77553', 'VHfdfdVHJ@GMAIL.COM', 'Editor', 1, '2024-09-05');

-- --------------------------------------------------------

--
-- Table structure for table `usertypes`
--

DROP TABLE IF EXISTS `usertypes`;
CREATE TABLE IF NOT EXISTS `usertypes` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `description` text,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

--
-- Dumping data for table `usertypes`
--

INSERT INTO `usertypes` (`id`, `name`, `description`) VALUES
(1, 'Admin', 'Administrator with full access to all features.'),
(2, 'Editor', 'Editor with access to content creation and editing.'),
(3, 'Viewer', 'Viewer with read-only access to content.'),
(4, 'Contributor', 'Contributor with limited access to create and edit their own content.'),
(5, 'Guest', 'Guest with limited access to view public content.');

--
-- Constraints for dumped tables
--

--
-- Constraints for table `items`
--
ALTER TABLE `items`
  ADD CONSTRAINT `fk_items_catid` FOREIGN KEY (`catid`) REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_items_subcatid` FOREIGN KEY (`subcatid`) REFERENCES `subcategory` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
