/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-11.6.2-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: anti_food_waste
-- ------------------------------------------------------
-- Server version	11.6.2-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `conturi_utilizatori`
--

DROP TABLE IF EXISTS `conturi_utilizatori`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `conturi_utilizatori` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nume` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `parola` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conturi_utilizatori`
--

LOCK TABLES `conturi_utilizatori` WRITE;
/*!40000 ALTER TABLE `conturi_utilizatori` DISABLE KEYS */;
INSERT INTO `conturi_utilizatori` VALUES
(1,'Delia-Andreea','deliaa86@yahoo.com','$2a$10$QXmK6FRd6rf3s/ciqdTwyOMeIVGErpDjWR9cnv0Kvby11THCDHPQa'),
(2,'Florina','florina22@yahoo.com','$2a$10$Knh4iYzagB4MpMOpYhSwC.OOdRyVev7AaW4C8V/TkI3WRlR1ynO1S');
/*!40000 ALTER TABLE `conturi_utilizatori` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `group_invitations`
--

DROP TABLE IF EXISTS `group_invitations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `group_invitations` (
  `id_invitatie` int(11) NOT NULL AUTO_INCREMENT,
  `id_grup` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `status` enum('pending','accepted','rejected') DEFAULT 'pending',
  `data_invitatie` datetime NOT NULL,
  `data_raspuns` datetime DEFAULT NULL,
  PRIMARY KEY (`id_invitatie`),
  UNIQUE KEY `unique_invitation` (`id_grup`,`email`),
  CONSTRAINT `group_invitations_ibfk_1` FOREIGN KEY (`id_grup`) REFERENCES `grupuri_prieteni` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `group_invitations`
--

LOCK TABLES `group_invitations` WRITE;
/*!40000 ALTER TABLE `group_invitations` DISABLE KEYS */;
INSERT INTO `group_invitations` VALUES
(1,1,'deliaa86@yahoo.com','pending','2025-01-18 14:30:14',NULL),
(2,1,'gefirebianca@yahoo.com','pending','2025-01-19 17:09:05',NULL),
(3,1,'biancagefire@yahoo.com','pending','2025-01-19 19:23:46',NULL),
(5,1,'bianca_gefire@gmail.com','pending','2025-01-19 17:55:43',NULL),
(6,1,'angeldelia22@stud.ase.ro','pending','2025-01-19 17:15:18',NULL);
/*!40000 ALTER TABLE `group_invitations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `grupuri_prieteni`
--

DROP TABLE IF EXISTS `grupuri_prieteni`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `grupuri_prieteni` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_creator` int(11) DEFAULT NULL,
  `nume_grup` varchar(100) DEFAULT NULL,
  `eticheta` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_creator` (`id_creator`),
  CONSTRAINT `grupuri_prieteni_ibfk_1` FOREIGN KEY (`id_creator`) REFERENCES `conturi_utilizatori` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `grupuri_prieteni`
--

LOCK TABLES `grupuri_prieteni` WRITE;
/*!40000 ALTER TABLE `grupuri_prieteni` DISABLE KEYS */;
INSERT INTO `grupuri_prieteni` VALUES
(1,1,'Lujerului','Vegetarieni'),
(3,1,'ase','vegani');
/*!40000 ALTER TABLE `grupuri_prieteni` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `membri_grup`
--

DROP TABLE IF EXISTS `membri_grup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `membri_grup` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_grup` int(11) DEFAULT NULL,
  `id_membru` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_grup` (`id_grup`),
  KEY `id_membru` (`id_membru`),
  CONSTRAINT `membri_grup_ibfk_1` FOREIGN KEY (`id_grup`) REFERENCES `grupuri_prieteni` (`id`),
  CONSTRAINT `membri_grup_ibfk_2` FOREIGN KEY (`id_membru`) REFERENCES `conturi_utilizatori` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `membri_grup`
--

LOCK TABLES `membri_grup` WRITE;
/*!40000 ALTER TABLE `membri_grup` DISABLE KEYS */;
INSERT INTO `membri_grup` VALUES
(1,1,1),
(3,1,2),
(4,3,1);
/*!40000 ALTER TABLE `membri_grup` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `produse`
--

DROP TABLE IF EXISTS `produse`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `produse` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `denumire` varchar(255) NOT NULL,
  `categorie` varchar(255) NOT NULL,
  `data_expirare` date NOT NULL,
  `id_client` int(11) DEFAULT NULL,
  `disponibil` tinyint(1) DEFAULT 1,
  `is_shared` tinyint(1) DEFAULT 0,
  `is_claimed` tinyint(1) DEFAULT 0,
  `claimed_by` int(11) DEFAULT NULL,
  `claimed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_client` (`id_client`),
  KEY `claimed_by` (`claimed_by`),
  CONSTRAINT `produse_ibfk_1` FOREIGN KEY (`id_client`) REFERENCES `conturi_utilizatori` (`id`),
  CONSTRAINT `produse_ibfk_2` FOREIGN KEY (`claimed_by`) REFERENCES `conturi_utilizatori` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `produse`
--

LOCK TABLES `produse` WRITE;
/*!40000 ALTER TABLE `produse` DISABLE KEYS */;
INSERT INTO `produse` VALUES
(1,'papanasi de Sibiu','homemade','2025-01-09',1,1,0,0,NULL,NULL),
(5,'papanasi','Alltime Bistro','2025-01-16',1,1,1,1,2,'2025-01-19 17:24:54'),
(10,'choux a la creme','carrefour express','2025-01-21',2,1,1,1,1,'2025-01-19 13:24:22'),
(11,'iaurt capsuni','casa buna','2025-01-20',2,1,1,1,1,'2025-01-19 13:24:26'),
(13,'placinta cu mere','homemade','2025-01-20',1,1,1,1,2,'2025-01-19 17:25:01'),
(14,'placinta cu dovleac','homemade','2025-01-23',1,1,0,0,NULL,NULL),
(15,'e2ipfjpi3','ef2io4','2025-01-21',1,1,1,1,2,'2025-01-19 17:26:01');
/*!40000 ALTER TABLE `produse` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2025-01-20  9:53:10
