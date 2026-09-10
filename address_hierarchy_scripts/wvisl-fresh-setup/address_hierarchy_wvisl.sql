DROP TABLE IF EXISTS `address_hierarchy_address_to_entry_map`;
DROP TABLE IF EXISTS `address_hierarchy_entry`;
DROP TABLE IF EXISTS `address_hierarchy_level`;

/* Address Hierarchy Levels*/;

CREATE TABLE `address_hierarchy_level` (
  `address_hierarchy_level_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(160) DEFAULT NULL,
  `parent_level_id` int DEFAULT NULL,
  `address_field` varchar(50) DEFAULT NULL,
  `uuid` char(38) NOT NULL,
  `required` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`address_hierarchy_level_id`),
  UNIQUE KEY `parent_level_id` (`parent_level_id`),
  KEY `address_field_unique` (`address_field`),
  CONSTRAINT `parent_level` FOREIGN KEY (`parent_level_id`) REFERENCES `address_hierarchy_level` (`address_hierarchy_level_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `address_hierarchy_level` WRITE;

INSERT INTO `address_hierarchy_level` VALUES 
(1,'Country',NULL,'STATE_PROVINCE','9a73e452-7944-4fc4-9e2a-2d9643cd1fa4',0),
(2,'Province',1,'COUNTY_DISTRICT','913672ad-ef36-4fa1-becb-9b87443c160a',0),
(3,'Pin Code',2,'POSTAL_CODE','714da506-1edf-47be-8179-44ffb3d76ee6',0),
(4,'District',3,'CITY_VILLAGE','111b84eb-3c69-4a15-aa07-4ae19fc6f326',0),
(5,'Chiefdom',4,'ADDRESS_2','96b6fd69-f36f-4780-955f-c2bcdabee4f4',0),
(6,'City/Village',5,'ADDRESS_1','ddb33616-ded8-4254-b932-ab0bba33ffec',0),
(7,'House number/Flat number',6,'ADDRESS_3','9b3070f7-ec1b-4ba3-b2eb-8eb15778824e',0);

UNLOCK TABLES;

/* Address Hierarchy Entries */;

CREATE TABLE `address_hierarchy_entry` (
  `address_hierarchy_entry_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(160) DEFAULT NULL,
  `level_id` int NOT NULL,
  `parent_id` int DEFAULT NULL,
  `user_generated_id` varchar(11) DEFAULT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `elevation` double DEFAULT NULL,
  `uuid` char(38) NOT NULL,
  PRIMARY KEY (`address_hierarchy_entry_id`),
  KEY `address_hierarchy_entry_name_idx` (`name`),
  KEY `level_name` (`level_id`,`name`),
  KEY `parent_name` (`parent_id`,`name`),
  CONSTRAINT `level_to_level` FOREIGN KEY (`level_id`) REFERENCES `address_hierarchy_level` (`address_hierarchy_level_id`),
  CONSTRAINT `parent-to-parent` FOREIGN KEY (`parent_id`) REFERENCES `address_hierarchy_entry` (`address_hierarchy_entry_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=90 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `address_hierarchy_entry` WRITE;

INSERT INTO `address_hierarchy_entry` VALUES 
(1, 'Sierra Leone', 1, NULL, NULL ,NULL, NULL, NULL, UUID()),
(2, 'Western Area', 2, 1, NULL, NULL, NULL, NULL, UUID()),
(3, 'Western Area Urban', 4, 2, NULL, NULL, NULL, NULL, UUID()),
(4, 'Western Area Rural', 4, 2, NULL, NULL, NULL, NULL, UUID()),
(5, 'Greater Freetown', 5, 3, NULL, NULL, NULL, NULL, UUID()),
(6, 'Koya Chiefdom', 5, 4, NULL, NULL, NULL, NULL, UUID()),
(7, 'Waterloo Chiefdom', 5, 4, NULL, NULL, NULL, NULL, UUID()),
(8, 'Freetown', 6, 5, NULL, NULL, NULL, NULL, UUID()),
(9, 'Wilberforce', 6, 5, NULL, NULL, NULL, NULL, UUID()),
(10, 'Congo Town', 6, 5, NULL, NULL, NULL, NULL, UUID()),
(11, 'Songo', 6, 6, NULL, NULL, NULL, NULL, UUID()),
(12, 'Waterloo', 6, 7, NULL, NULL, NULL, NULL, UUID()),
(13, 'Northern', 2, 1, NULL, NULL, NULL, NULL, UUID()),
(14, 'Bombali', 4, 13, NULL, NULL, NULL, NULL, UUID()),
(15, 'Tonkolili', 4, 13, NULL, NULL, NULL, NULL, UUID()),
(16, 'Makeni Kakoya', 5, 14, NULL, NULL, NULL, NULL, UUID()),
(17, 'Safroko Limba', 5, 14, NULL, NULL, NULL, NULL, UUID()),
(18, 'Kunike Barina', 5, 15, NULL, NULL, NULL, NULL, UUID()),
(19, 'Malal Mara', 5, 15, NULL, NULL, NULL, NULL, UUID()),
(20, 'Makeni', 6, 16, NULL, NULL, NULL, NULL, UUID()),
(21, 'Binkolo', 6, 17, NULL, NULL, NULL, NULL, UUID()),
(22, 'Magburaka', 6, 18, NULL, NULL, NULL, NULL, UUID()),
(23, 'Yonibana', 6, 19, NULL, NULL, NULL, NULL, UUID()),
(24, 'North West', 2, 1, NULL, NULL, NULL, NULL, UUID()),
(25, 'Kambia', 4, 24, NULL, NULL, NULL, NULL, UUID()),
(26, 'Port Loko', 4, 24, NULL, NULL, NULL, NULL, UUID()),
(27, 'Magbema', 5, 25, NULL, NULL, NULL, NULL, UUID()),
(28, 'Mambolo', 5, 25, NULL, NULL, NULL, NULL, UUID()),
(29, 'Kaffu Bullom', 5, 26, NULL, NULL, NULL, NULL, UUID()),
(30, 'Marampa', 5, 26, NULL, NULL, NULL, NULL, UUID()),
(31, 'Kambia', 6, 27, NULL, NULL, NULL, NULL, UUID()),
(32, 'Mambolo', 6, 28, NULL, NULL, NULL, NULL, UUID()),
(33, 'Lungi', 6, 29, NULL, NULL, NULL, NULL, UUID()),
(34, 'Lunsar', 6, 30, NULL, NULL, NULL, NULL, UUID()),
(35, 'Southern', 2, 1, NULL, NULL, NULL, NULL, UUID()),
(36, 'Bo', 4, 35, NULL, NULL, NULL, NULL, UUID()),
(37, 'Bonthe', 4, 35, NULL, NULL, NULL, NULL, UUID()),
(38, 'Kakua', 5, 36, NULL, NULL, NULL, NULL, UUID()),
(39, 'Badjia', 5, 36, NULL, NULL, NULL, NULL, UUID()),
(40, 'Sittia', 5, 37, NULL, NULL, NULL, NULL, UUID()),
(41, 'Imperri', 5, 37, NULL, NULL, NULL, NULL, UUID()),
(42, 'Bo Town', 6, 38, NULL, NULL, NULL, NULL, UUID()),
(43, 'Valunia', 6, 39, NULL, NULL, NULL, NULL, UUID()),
(44, 'Bonthe', 6, 40, NULL, NULL, NULL, NULL, UUID()),
(45, 'Mattru Jong', 6, 41, NULL, NULL, NULL, NULL, UUID()),
(46, 'Eastern', 2, 1, NULL, NULL, NULL, NULL, UUID()),
(47, 'Kenema', 4, 46, NULL, NULL, NULL, NULL, UUID()),
(48, 'Kono', 4, 46, NULL, NULL, NULL, NULL, UUID()),
(49, 'Langurama', 5, 47, NULL, NULL, NULL, NULL, UUID()),
(50, 'Niawa', 5, 47, NULL, NULL, NULL, NULL, UUID()),
(51, 'Nimiyama', 5, 48, NULL, NULL, NULL, NULL, UUID()),
(52, 'Tankoro', 5, 48, NULL, NULL, NULL, NULL, UUID()),
(53, 'Kenema', 6, 49, NULL, NULL, NULL, NULL, UUID()),
(54, 'Panguma', 6, 50, NULL, NULL, NULL, NULL, UUID()),
(55, 'Koidu', 6, 51, NULL, NULL, NULL, NULL, UUID()),
(56, 'Yengema', 6, 52, NULL, NULL, NULL, NULL, UUID());

UNLOCK TABLES;

/* Adress Hierarchy Address To Entry Map */;

DROP TABLE IF EXISTS `address_hierarchy_address_to_entry_map`;
CREATE TABLE `address_hierarchy_address_to_entry_map` (
  `address_to_entry_map_id` int NOT NULL AUTO_INCREMENT,
  `address_id` int NOT NULL,
  `entry_id` int NOT NULL,
  `uuid` char(38) NOT NULL,
  PRIMARY KEY (`address_to_entry_map_id`),
  KEY `address_id_to_person_address_table` (`address_id`),
  KEY `entry_id_to_address_hierarchy_table` (`entry_id`),
  CONSTRAINT `address_id_to_person_address_table` FOREIGN KEY (`address_id`) REFERENCES `person_address` (`person_address_id`),
  CONSTRAINT `entry_id_to_address_hierarchy_table` FOREIGN KEY (`entry_id`) REFERENCES `address_hierarchy_entry` (`address_hierarchy_entry_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

