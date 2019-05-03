CREATE TABLE `docs` (
  `id` INT NOT NULL AUTO_INCREMENT, 
  `filename` VARCHAR(64) NOT NULL UNIQUE,
  `sha` CHAR(40) NOT NULL,
  `title` VARCHAR(256) NOT NULL,
  `subtitle` VARCHAR(256) DEFAULT NULL,
  `prolog` TEXT  DEFAULT NULL,
  `epilog` TEXT  DEFAULT NULL,
  `kind` VARCHAR(10) DEFAULT NULL,
  `body` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE `lemmas` (
  `id` INT NOT NULL AUTO_INCREMENT, 
  `source` VARCHAR(256) NOT NULL,
  `target` VARCHAR(512) NOT NULL,
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
  INDEX `word_index` (`word`),
  FOREIGN KEY (`lemma_id`) REFERENCES `lemmas` (`id`) ON DELETE CASCADE
);