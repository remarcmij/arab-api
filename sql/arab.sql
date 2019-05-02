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

CREATE TABLE `lemmas` (
  `id` INT NOT NULL AUTO_INCREMENT, 
  `source` VARCHAR(256) NOT NULL,
  `target` VARCHAR(256) NOT NULL,
  `roman` VARCHAR(256) DEFAULT NULL,
  `doc_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`doc_id`) REFERENCES `docs` (`id`) ON DELETE CASCADE
);

CREATE TABLE `words` (
  `id` INT NOT NULL AUTO_INCREMENT, 
  `word` VARCHAR(256) NOT NULL,
  `lang` CHAR(2) NOT NULL,
  `lemma_id` INT NOT NULL, 
  PRIMARY KEY (`id`),
  FOREIGN KEY (`lemma_id`) REFERENCES `lemmas` (`id`) ON DELETE CASCADE
);