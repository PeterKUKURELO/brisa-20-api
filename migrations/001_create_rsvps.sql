CREATE TABLE IF NOT EXISTS brisa_rsvps (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  attendance ENUM('yes', 'no') NOT NULL,
  dni CHAR(8) NOT NULL,
  song VARCHAR(180) NULL,
  message VARCHAR(600) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_brisa_rsvps_dni (dni),
  KEY idx_brisa_rsvps_attendance (attendance),
  KEY idx_brisa_rsvps_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
