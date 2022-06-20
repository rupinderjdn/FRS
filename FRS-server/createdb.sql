/* Creating Database */
CREATE SCHEMA IF NOT EXISTS `tempdb`;
USE `tempdb`;

/* Creating Admin table */
CREATE TABLE IF NOT EXISTS`tempdb`.`admin` (
  `username` VARCHAR(20) NOT NULL,
  `password` VARCHAR(20) NOT NULL,
  PRIMARY KEY (`username`));

/* Creating user table */
CREATE TABLE IF NOT EXISTS`tempdb`.`user` (
  `user_id` INT NOT NULL AUTO_INCREMENT,
  `base_img` VARCHAR(50) NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `mob_no` VARCHAR(20) NOT NULL UNIQUE,
  `gender` VARCHAR(1) NOT NULL,
  `city` VARCHAR(45) NOT NULL,
  `department` VARCHAR(45) NOT NULL,
  `captured_count` INT NOT NULL DEFAULT 0,
  `date_created` DATE NOT NULL DEFAULT (CURRENT_DATE()),
  PRIMARY KEY (`user_id`));

/* Trigger to create base image namer */
DROP TRIGGER IF EXISTS `tempdb`.`base_image_namer`;
DELIMITER $$
USE `tempdb`$$
CREATE DEFINER = CURRENT_USER TRIGGER `tempdb`.`base_image_namer` BEFORE INSERT ON `user` FOR EACH ROW
BEGIN
SET @auto_id := (SELECT AUTO_INCREMENT FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='user'AND TABLE_SCHEMA=DATABASE()); 
SET NEW.`base_img`= CONCAT(NEW.`name`,"_",@auto_id);
END$$
DELIMITER ;

/* Trigger to create base image renamer */
DROP TRIGGER IF EXISTS `tempdb`.`base_image_renamer`;
DELIMITER $$
USE `tempdb`$$
CREATE DEFINER = CURRENT_USER TRIGGER `tempdb`.`base_image_renamer` BEFORE UPDATE ON `user` FOR EACH ROW
BEGIN
SET NEW.`base_img` = CONCAT(NEW.`name`,"_",NEW.`user_id`);
END$$
DELIMITER ;