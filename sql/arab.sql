CREATE TABLE `docs` (
  `id` INT NOT NULL AUTO_INCREMENT, 
  `filename` VARCHAR(64) NOT NULL UNIQUE,
  `sha` CHAR(40) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `subtitle` VARCHAR(255),
  `prolog` TEXT,
  `epilog` TEXT,
  `kind` VARCHAR(10),
  `body` TEXT,
  PRIMARY KEY (`id`)
);

CREATE TABLE `dict` (
  `id` INT NOT NULL AUTO_INCREMENT, 
  `base` VARCHAR(64) NOT NULL,
  `foreign` VARCHAR(64) NOT NULL,
  `word_class` VARCHAR(20) DEFAULT NULL,
  `notes` VARCHAR(255) DEFAULT NULL,
  `doc_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY (`base`),
  KEY (`foreign`),
  KEY (`word_class`),
  FOREIGN KEY (`doc_id`) REFERENCES `docs` (`id`) ON DELETE CASCADE
);
