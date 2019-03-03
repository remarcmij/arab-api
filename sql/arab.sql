CREATE TABLE `docs` (
  `id` INT NOT NULL AUTO_INCREMENT, 
  `filename` VARCHAR(64) NOT NULL UNIQUE,
  `title` VARCHAR(255) NOT NULL,
  `subtitle` VARCHAR(255),
  `prolog` TEXT,
  `epilog` TEXT,
  `kind` VARCHAR(10),
  `body` TEXT,
  PRIMARY KEY (`id`)
);

CREATE TABLE `dict` (
  `foreign` VARCHAR(64) NOT NULL,
  `alt` VARCHAR(64) DEFAULT NULL,
  `base` VARCHAR(64) NOT NULL,
  `trans` VARCHAR(64) DEFAULT NULL,
  `doc_id` INT NOT NULL,
  PRIMARY KEY (`foreign`),
  FOREIGN KEY (`doc_id`) REFERENCES `docs` (`id`) ON DELETE CASCADE
);

CREATE TABLE `words` (
  `word`: VARCHAR(64) NOT NULL,
  `lang`: CHAR(2) NOT NULL,
  `alt`: VARCHAR(64) DEFAULT NULL,
  `transcription`: VARCHAR(64) DEFAULT NULL,
  `translation`: VARCHAR(64) NO NULL,


)