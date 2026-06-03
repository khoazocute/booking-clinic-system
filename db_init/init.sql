-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               8.4.3 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             12.8.0.6908
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for booking_clinic_db
CREATE DATABASE IF NOT EXISTS `booking_clinic_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `booking_clinic_db`;

-- Dumping structure for table booking_clinic_db.ai_documents
CREATE TABLE IF NOT EXISTS `ai_documents` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `content` text NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `embedding` text NOT NULL,
  `source_id` bigint NOT NULL,
  `source_type` varchar(30) NOT NULL,
  `title` varchar(150) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table booking_clinic_db.ai_documents: ~10 rows (approximately)
INSERT INTO `ai_documents` (`id`, `content`, `created_at`, `embedding`, `source_id`, `source_type`, `title`, `updated_at`) VALUES
	(27, 'Chuyen khoa Ung Thư. Mo ta: Chuyên khám, tư vấn và theo dõi các bệnh lý ung thư, u bướu, khối u bất thường, sụt cân không rõ nguyên nhân, đau kéo dài, hạch to, tầm soát ung thư và hỗ trợ điều trị sau chẩn đoán.', '2026-05-21 17:41:39.495683', '0.0,1.0,2.0,0.0,1.0,0.0,1.0,0.0,0.0,7.0,1.0', 1, 'SPECIALTY', 'Ung Thư', '2026-05-21 17:41:39.495683'),
	(28, 'Chuyen khoa Phụ sản. Mo ta: Chuyên khám các vấn đề phụ khoa và sản khoa như rối loạn kinh nguyệt, đau bụng kinh, viêm nhiễm phụ khoa, khí hư bất thường, tư vấn thai kỳ, khám thai, chăm sóc sức khỏe sinh sản và kế hoạch hóa gia đình.', '2026-05-21 17:41:39.502562', '0.0,1.0,1.0,0.0,1.0,0.0,2.0,0.0,7.0,0.0,1.0', 2, 'SPECIALTY', 'Phụ sản', '2026-05-21 17:41:39.502562'),
	(29, 'Chuyen khoa Tim mạch. Mo ta: Chuyên khám và tư vấn các vấn đề về tim, đau ngực, khó thở, tim đập nhanh, hồi hộp, huyết áp cao, huyết áp thấp, rối loạn nhịp tim.', '2026-05-21 17:41:39.504562', '6.0,1.0,1.0,0.0,1.0,1.0,1.0,0.0,0.0,0.0,1.0', 3, 'SPECIALTY', 'Tim mạch', '2026-05-21 17:41:39.504562'),
	(30, 'Chuyen khoa Da liễu. Mo ta: Chuyên khám các bệnh về da như nổi mẩn, ngứa da, mụn, viêm da, dị ứng da, phát ban, nấm da.', '2026-05-21 17:41:39.506564', '0.0,8.0,1.0,0.0,1.0,0.0,1.0,0.0,0.0,0.0,1.0', 4, 'SPECIALTY', 'Da liễu', '2026-05-21 17:41:39.506564'),
	(31, 'Chuyen khoa Tai mũi họng. Mo ta: Chuyên khám các triệu chứng ho, đau họng, viêm họng, nghẹt mũi, sổ mũi, ù tai, đau tai, viêm xoang.', '2026-05-21 17:41:39.508644', '0.0,1.0,10.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,1.0', 5, 'SPECIALTY', 'Tai mũi họng', '2026-05-21 17:41:39.508644'),
	(32, 'Chuyen khoa Thần kinh. Mo ta: Chuyên khám các vấn đề đau đầu, chóng mặt, mất ngủ, tê tay chân, co giật, đau nửa đầu, rối loạn thần kinh.', '2026-05-21 17:41:39.511644', '0.0,1.0,2.0,6.0,0.0,0.0,1.0,0.0,0.0,0.0,1.0', 6, 'SPECIALTY', 'Thần kinh', '2026-05-21 17:41:39.511644'),
	(33, 'Chuyen khoa Nhi khoa. Mo ta: Chuyên khám cho trẻ em, em bé, trẻ sơ sinh với các triệu chứng sốt, ho, đau bụng, tiêu chảy, biếng ăn, phát ban.', '2026-05-21 17:41:39.513562', '0.0,2.0,1.0,0.0,6.0,0.0,3.0,0.0,0.0,0.0,1.0', 7, 'SPECIALTY', 'Nhi khoa', '2026-05-21 17:41:39.513562'),
	(34, 'Chuyen khoa Hô hấp. Mo ta: Chuyên khám các bệnh về đường hô hấp như ho kéo dài, khó thở, đau tức ngực, viêm phổi, hen suyễn, viêm phế quản.', '2026-05-21 17:41:39.515637', '1.0,1.0,1.0,0.0,1.0,6.0,1.0,0.0,0.0,0.0,1.0', 8, 'SPECIALTY', 'Hô hấp', '2026-05-21 17:41:39.515637'),
	(35, 'Chuyen khoa Tiêu hóa. Mo ta: Chuyên khám các vấn đề đau bụng, buồn nôn, nôn ói, tiêu chảy, táo bón, đau dạ dày, trào ngược dạ dày, rối loạn tiêu hóa.', '2026-05-21 17:41:39.519568', '0.0,1.0,1.0,0.0,0.0,0.0,9.0,0.0,0.0,0.0,1.0', 9, 'SPECIALTY', 'Tiêu hóa', '2026-05-21 17:41:39.519568'),
	(36, 'Chuyen khoa Cơ xương khớp. Mo ta: Chuyên khám đau lưng, đau vai gáy, đau khớp, tê bì tay chân, viêm khớp, thoái hóa khớp, chấn thương xương khớp.', '2026-05-21 17:41:39.521562', '0.0,1.0,1.0,0.0,0.0,0.0,0.0,7.0,0.0,0.0,1.0', 10, 'SPECIALTY', 'Cơ xương khớp', '2026-05-21 17:41:39.521562');

-- Dumping structure for table booking_clinic_db.appointments
CREATE TABLE IF NOT EXISTS `appointments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `appointment_date` date NOT NULL,
  `cancel_reason` mediumtext,
  `created_at` datetime(6) DEFAULT NULL,
  `reason` text,
  `status` enum('CANCELLED','COMPLETED','CONFIRMED','IN_PROGRESS','PENDING','REQUESTED','SCHEDULED') NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `doctor_id` bigint NOT NULL,
  `patient_id` bigint NOT NULL,
  `schedule_id` bigint DEFAULT NULL,
  `payment_deadline` datetime(6) DEFAULT NULL,
  `version` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKmujeo4tymoo98cmf7uj3vsv76` (`doctor_id`),
  KEY `FK8exap5wmg8kmb1g1rx3by21yt` (`patient_id`),
  KEY `FKa414dbdx50axobch6e5am3dmu` (`schedule_id`),
  CONSTRAINT `FK8exap5wmg8kmb1g1rx3by21yt` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`),
  CONSTRAINT `FKa414dbdx50axobch6e5am3dmu` FOREIGN KEY (`schedule_id`) REFERENCES `doctor_schedules` (`id`),
  CONSTRAINT `FKmujeo4tymoo98cmf7uj3vsv76` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table booking_clinic_db.appointments: ~23 rows (approximately)
INSERT INTO `appointments` (`id`, `appointment_date`, `cancel_reason`, `created_at`, `reason`, `status`, `updated_at`, `doctor_id`, `patient_id`, `schedule_id`, `payment_deadline`, `version`) VALUES
	(1, '2026-04-30', 'Cancelled by doctor from dashboard.', '2026-04-30 16:23:44.353898', 'đau họng', 'COMPLETED', '2026-05-06 18:41:27.546796', 1, 1, 1, NULL, NULL),
	(2, '2026-04-30', NULL, '2026-05-01 16:25:45.301586', 'Viêm họng', 'COMPLETED', '2026-05-01 16:29:23.155633', 1, 1, 2, NULL, NULL),
	(3, '2026-05-07', NULL, '2026-05-06 18:03:31.697612', 'Viêm họng', 'COMPLETED', '2026-05-06 18:20:32.027218', 1, 1, 3, NULL, NULL),
	(4, '2026-05-10', NULL, '2026-05-12 17:36:19.177370', 'Đau đâu', 'CANCELLED', '2026-05-15 16:15:30.449448', 1, 1, 5, NULL, NULL),
	(5, '2026-05-11', NULL, '2026-05-12 17:36:46.111214', 'Tiêu chảy', 'COMPLETED', '2026-05-15 16:09:36.353781', 1, 1, 4, NULL, NULL),
	(6, '2026-05-13', NULL, '2026-05-12 17:37:14.345322', 'Ho sốt cao', 'COMPLETED', '2026-05-12 17:43:21.372308', 1, 1, 8, NULL, NULL),
	(7, '2026-05-13', NULL, '2026-05-12 18:17:20.062002', 'ho', 'COMPLETED', '2026-05-15 16:11:13.209257', 1, 1, 6, NULL, NULL),
	(8, '2026-05-14', NULL, '2026-05-12 18:41:10.573345', 'Dương tính maithuy', 'CONFIRMED', '2026-05-21 18:42:20.701055', 1, 3, 10, NULL, NULL),
	(9, '2026-05-12', NULL, '2026-05-13 07:56:21.493173', 'Ải chỉa', 'PENDING', '2026-05-13 07:56:21.493173', 1, 4, 7, NULL, NULL),
	(10, '2026-05-14', 'Cancelled by doctor from dashboard.', '2026-05-13 17:21:57.900697', 'khó thở', 'CANCELLED', '2026-05-13 17:27:13.503728', 1, 1, 9, NULL, NULL),
	(11, '2026-05-14', NULL, '2026-05-13 17:37:54.588263', 'Đau bụng', 'PENDING', '2026-05-13 17:37:54.588263', 1, 6, 9, NULL, NULL),
	(12, '2026-05-16', NULL, '2026-05-13 18:08:32.765023', 'Kiểm tra định kỳ', 'PENDING', '2026-05-13 18:08:32.765023', 1, 6, 12, NULL, NULL),
	(13, '2026-05-15', NULL, '2026-05-15 12:30:52.335863', 'Ho', 'PENDING', '2026-05-15 12:30:52.335863', 1, 1, 11, NULL, NULL),
	(14, '2026-05-16', NULL, '2026-05-16 16:10:48.984262', 'buồn nonio', 'COMPLETED', '2026-05-16 16:14:42.848706', 1, 1, 13, '2026-05-16 16:20:48.984262', NULL),
	(15, '2026-05-19', NULL, '2026-05-18 13:51:24.483488', 'ho', 'COMPLETED', '2026-05-18 13:53:40.770053', 1, 1, 14, '2026-05-18 14:01:24.483488', NULL),
	(16, '2026-04-30', NULL, '2026-05-18 16:13:15.002258', 'đau bụng', 'COMPLETED', '2026-05-18 16:15:49.924852', 1, 1, 1, '2026-05-18 16:23:15.002258', NULL),
	(17, '2026-05-10', 'Cancelled by doctor from dashboard.', '2026-05-18 16:18:15.291114', 'ho', 'CANCELLED', '2026-05-18 16:18:57.068751', 1, 1, 5, '2026-05-18 16:28:15.291114', NULL),
	(18, '2026-05-10', 'Benh nhan tu huy', '2026-05-18 16:19:10.782257', 'ho', 'CANCELLED', '2026-05-18 16:19:18.546348', 1, 1, 5, '2026-05-18 16:29:10.781258', NULL),
	(19, '2026-05-22', NULL, '2026-05-21 15:10:01.283867', 'viêm mũi dị ứng', 'COMPLETED', '2026-05-21 15:13:43.167032', 2, 7, 16, '2026-05-21 15:20:01.282216', NULL),
	(20, '2026-05-25', 'Benh nhan tu huy', '2026-05-24 16:22:26.685459', 'ho', 'CANCELLED', '2026-05-24 16:25:27.911457', 1, 6, 17, '2026-05-24 16:32:26.685459', NULL),
	(21, '2026-05-22', 'Benh nhan tu huy', '2026-05-24 18:28:19.473512', NULL, 'CANCELLED', '2026-05-24 18:28:31.239073', 2, 7, 15, '2026-05-24 18:38:19.473512', NULL),
	(22, '2026-05-22', 'Benh nhan tu huy', '2026-05-27 08:28:38.802978', 'đau bụng', 'CANCELLED', '2026-05-27 08:29:31.325746', 2, 7, 15, '2026-05-27 08:38:38.799031', 1),
	(23, '2026-05-22', 'Benh nhan tu huy', '2026-05-27 08:29:34.511030', 'ho', 'CANCELLED', '2026-05-27 08:29:44.058208', 2, 1, 15, '2026-05-27 08:39:34.511030', 1);

-- Dumping structure for table booking_clinic_db.doctors
CREATE TABLE IF NOT EXISTS `doctors` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `average_rating` decimal(3,2) DEFAULT NULL,
  `biography` text,
  `clinic_room` varchar(50) DEFAULT NULL,
  `consultation_fee` decimal(12,2) NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `experience_years` int DEFAULT NULL,
  `qualification` varchar(255) DEFAULT NULL,
  `license_number` varchar(50) DEFAULT NULL,
  `license_expiry_date` date DEFAULT NULL,
  `license_status` varchar(20) DEFAULT 'ACTIVE',
  `status` varchar(20) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `specialty_id` bigint DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_doctors_license_number` (`license_number`),
  UNIQUE KEY `UKt1f6cueqyjwx5ghew9ar1exe3` (`user_id`),
  KEY `FKb4ymcpidvwfn4kybv4adfvxcm` (`specialty_id`),
  CONSTRAINT `FKb4ymcpidvwfn4kybv4adfvxcm` FOREIGN KEY (`specialty_id`) REFERENCES `specialties` (`id`),
  CONSTRAINT `FKe9pf5qtxxkdyrwibaevo9frtk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table booking_clinic_db.doctors: ~7 rows (approximately)
INSERT INTO `doctors` (`id`, `average_rating`, `biography`, `clinic_room`, `consultation_fee`, `created_at`, `experience_years`, `qualification`, `status`, `updated_at`, `specialty_id`, `user_id`) VALUES
	(1, 4.50, 'Chuyen kham noi tong quat', 'P201', 300.00, '2026-04-30 16:08:13.206263', 5, 'Bac si chuyen khoa phụ sản', 'ACTIVE', '2026-05-01 16:35:59.341006', 2, 4),
	(2, 5.00, 'Chuyên khám tai mũi họng', 'P303', 250.00, '2026-05-21 14:58:19.690306', 6, 'Tai Mui Hong Cert', 'ACTIVE', '2026-05-21 15:22:17.798695', 5, 10),
	(3, 0.00, 'Tốt nghiệp loại xuất sắc chuyên ngành thần kinh', 'P504', 400.00, '2026-05-27 08:07:09.672435', 8, 'Tốt nghiệp Đại học Y Dược TPHCM', 'ACTIVE', '2026-05-27 08:07:09.672435', 6, 12),
	(4, 0.00, 'Tốt nghiệp loại xuất sắc chuyên ngành Cơ Xương Khớp', 'P601', 500.00, '2026-05-27 08:08:35.638232', 10, 'Tốt nghiệp Đại Học Y Dược TPHCM', 'ACTIVE', '2026-05-27 08:08:35.638232', 10, 13),
	(5, 0.00, 'Sinh viên loại xuất sắc chuyên ngành Hô Hấp', 'P701', 350.00, '2026-05-27 08:09:55.443010', 8, 'Tốt nghiệp Đại Học Phạm Ngọc Thạch', 'ACTIVE', '2026-05-27 08:09:55.443010', 8, 14),
	(6, 0.00, 'Tốt nghiệp loại xuất sắc chuyên ngành Nhi Khoa', 'P801', 450.00, '2026-05-27 08:11:24.829926', 5, 'Tốt nghiệp Khoa Y ĐHQG TPHCM', 'ACTIVE', '2026-05-27 08:11:24.829926', 7, 15),
	(7, 0.00, 'Tốt nghiệm loại xuất sắc chuyên ngành Da Liễu', 'P901', 800.00, '2026-05-27 08:12:44.223447', 10, 'Bác sĩ nội trú Đại Học Y Dược Hà Nội', 'ACTIVE', '2026-05-27 08:12:44.223447', 4, 16);

-- Dumping structure for table booking_clinic_db.doctor_schedules
CREATE TABLE IF NOT EXISTS `doctor_schedules` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `end_time` time NOT NULL,
  `start_time` time NOT NULL,
  `status` varchar(20) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `work_date` date NOT NULL,
  `doctor_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKqptts4sun4tpv6elafrnrfeup` (`doctor_id`),
  CONSTRAINT `FKqptts4sun4tpv6elafrnrfeup` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table booking_clinic_db.doctor_schedules: ~18 rows (approximately)
INSERT INTO `doctor_schedules` (`id`, `created_at`, `end_time`, `start_time`, `status`, `updated_at`, `work_date`, `doctor_id`) VALUES
	(1, '2026-04-30 16:09:35.373975', '04:00:00', '02:00:00', 'BOOKED', '2026-05-09 18:34:39.524860', '2026-04-30', 1),
	(2, '2026-04-30 16:09:50.054068', '05:00:00', '04:00:00', 'BOOKED', '2026-05-01 16:25:45.318586', '2026-04-30', 1),
	(3, '2026-05-06 16:28:20.211448', '15:27:00', '14:27:00', 'BOOKED', '2026-05-06 18:03:31.716977', '2026-05-07', 1),
	(4, '2026-05-09 18:33:15.405044', '00:33:00', '00:00:00', 'BOOKED', '2026-05-12 17:36:46.128041', '2026-05-11', 1),
	(5, '2026-05-09 18:34:16.057679', '02:30:00', '02:00:00', 'AVAILABLE', '2026-05-18 16:19:18.546348', '2026-05-10', 1),
	(6, '2026-05-09 18:36:59.760972', '09:30:00', '09:00:00', 'BOOKED', '2026-05-12 18:17:20.082863', '2026-05-13', 1),
	(7, '2026-05-09 18:56:21.939848', '01:31:00', '01:00:00', 'BOOKED', '2026-05-13 07:56:21.525167', '2026-05-12', 1),
	(8, '2026-05-09 18:56:55.963204', '03:30:00', '03:00:00', 'BOOKED', '2026-05-12 17:37:14.362639', '2026-05-13', 1),
	(9, '2026-05-12 18:02:57.784470', '13:30:00', '13:00:00', 'BOOKED', '2026-05-13 17:37:54.641682', '2026-05-14', 1),
	(10, '2026-05-12 18:03:54.945723', '08:00:00', '07:30:00', 'BOOKED', '2026-05-12 18:41:10.596462', '2026-05-14', 1),
	(11, '2026-05-13 18:05:54.702194', '08:00:00', '07:30:00', 'BOOKED', '2026-05-15 12:30:52.361415', '2026-05-15', 1),
	(12, '2026-05-13 18:07:07.339645', '08:00:00', '07:30:00', 'BOOKED', '2026-05-13 18:08:32.776996', '2026-05-16', 1),
	(13, '2026-05-15 16:07:28.126767', '12:30:00', '12:00:00', 'BOOKED', '2026-05-15 16:07:28.126767', '2026-05-16', 1),
	(14, '2026-05-18 13:50:35.217181', '09:00:00', '08:00:00', 'BOOKED', '2026-05-18 13:50:35.217181', '2026-05-19', 1),
	(15, '2026-05-21 15:00:35.192278', '10:30:00', '10:00:00', 'AVAILABLE', '2026-05-27 08:29:44.058208', '2026-05-22', 2),
	(16, '2026-05-21 15:00:55.867248', '11:00:00', '10:30:00', 'BOOKED', '2026-05-21 15:00:55.867248', '2026-05-22', 2),
	(17, '2026-05-24 16:19:54.834691', '14:50:00', '14:20:00', 'AVAILABLE', '2026-05-24 16:25:27.911457', '2026-05-25', 1),
	(18, '2026-05-27 09:01:51.394651', '15:30:00', '15:00:00', 'AVAILABLE', '2026-05-27 09:01:51.394651', '2026-05-28', 1);

-- Dumping structure for table booking_clinic_db.medical_records
CREATE TABLE IF NOT EXISTS `medical_records` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `diagnosis` text NOT NULL,
  `follow_up_date` date DEFAULT NULL,
  `notes` text,
  `symptoms` text NOT NULL,
  `treatment_plan` text NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `appointment_id` bigint NOT NULL,
  `doctor_id` bigint NOT NULL,
  `patient_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK2nyonrbplqq716buy7u4ghmt8` (`appointment_id`),
  KEY `FKtny13k9v4o58styd47st3s2l5` (`doctor_id`),
  KEY `FKrav12h9aiw7pegjt62p8owwn3` (`patient_id`),
  CONSTRAINT `FKifeec8p5v06rt258odelw8s7j` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`),
  CONSTRAINT `FKrav12h9aiw7pegjt62p8owwn3` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`),
  CONSTRAINT `FKtny13k9v4o58styd47st3s2l5` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table booking_clinic_db.medical_records: ~10 rows (approximately)
INSERT INTO `medical_records` (`id`, `created_at`, `diagnosis`, `follow_up_date`, `notes`, `symptoms`, `treatment_plan`, `updated_at`, `appointment_id`, `doctor_id`, `patient_id`) VALUES
	(1, '2026-04-30 16:27:52.924962', 'Viem hong cap', '2026-05-05', 'Tai kham neu khong do', 'Sot, dau hong', 'Dung thuoc va nghi ngoi', '2026-04-30 16:27:52.924962', 1, 1, 1),
	(2, '2026-05-01 16:29:23.125724', 'Viem hong cap', '2026-05-05', 'Tai kham neu khong do', 'đau họng, viêm họng', 'Dung thuoc va nghi ngoi', '2026-05-01 16:29:23.125724', 2, 1, 1),
	(3, '2026-05-06 18:20:32.005874', 'viêm họng cấp', '2026-05-14', 'Tái khám nếu chưa khỏi ', 'viêm họng', 'uống thuốc và nghỉ ngơi ', '2026-05-06 18:20:32.005874', 3, 1, 1),
	(4, '2026-05-12 17:43:21.343866', 'sốt xuất huyết', '2026-05-20', 'ăn uống nghỉ ngơi đầy đủ', 'nổi ban đỏ', 'nhập viện tái khám ', '2026-05-12 17:43:21.343866', 6, 1, 1),
	(5, '2026-05-15 16:09:36.341490', 'ưew', '2026-05-15', 'ưew', 'ưedfwe', 'ưew', '2026-05-15 16:09:36.341490', 5, 1, 1),
	(6, '2026-05-15 16:11:13.200402', 'aad', '2026-05-15', 'ada', 'qfqfaef', 'adad', '2026-05-15 16:11:13.200402', 7, 1, 1),
	(7, '2026-05-16 16:14:42.836263', 'viêm dạ dày', '2026-05-23', 'uống thuốc nghỉ ngơi ', 'buồn nôn', 'theo dõi 7 ngày', '2026-05-16 16:14:42.836263', 14, 1, 1),
	(8, '2026-05-18 13:53:40.750282', 'ho nhiều, đau họng ', '2026-05-25', 'tái khám nếu k khỏi', 'đau họng ', 'uống thuốc 1 tuần', '2026-05-18 13:53:40.750282', 15, 1, 1),
	(9, '2026-05-18 16:15:49.918770', 'đau bụng ', '2026-05-25', 'tái khám nếu không đỡ, nghỉ ngơi đầy đủ', 'đau bụng ', 'uống thuốc 1 tuần', '2026-05-18 16:15:49.918770', 16, 1, 1),
	(10, '2026-05-21 15:13:43.154079', 'Viêm Xoang ', '2026-05-28', 'gọi là anh iu đi', 'Viêm xoang ', 'uống thuốc 7 ngày ', '2026-05-21 15:13:43.154079', 19, 2, 7);

-- Dumping structure for table booking_clinic_db.medicines
CREATE TABLE IF NOT EXISTS `medicines` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') DEFAULT NULL,
  `unit` varchar(30) DEFAULT NULL,
  `unit_price` decimal(12,2) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `stock_quantity` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table booking_clinic_db.medicines: ~3 rows (approximately)
INSERT INTO `medicines` (`id`, `name`, `status`, `unit`, `unit_price`, `created_at`, `stock_quantity`) VALUES
	(1, 'Paracetamol 500mg', 'INACTIVE', 'vien', 5500.00, NULL, 10),
	(2, 'Panadol', 'ACTIVE', 'vien', 5000.00, NULL, 3),
	(3, 'Amociline', 'ACTIVE', 'vien', 5000.00, NULL, 10);

-- Dumping structure for table booking_clinic_db.notifications
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_read` bit(1) NOT NULL,
  `message` text NOT NULL,
  `reference_id` bigint DEFAULT NULL,
  `reference_type` varchar(50) DEFAULT NULL,
  `title` varchar(150) NOT NULL,
  `type` varchar(50) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK9y21adhxn0ayjhfocscqox7bh` (`user_id`),
  CONSTRAINT `FK9y21adhxn0ayjhfocscqox7bh` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=99 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table booking_clinic_db.notifications: ~98 rows (approximately)
INSERT INTO `notifications` (`id`, `created_at`, `is_read`, `message`, `reference_id`, `reference_type`, `title`, `type`, `updated_at`, `user_id`) VALUES
	(1, '2026-05-06 18:03:31.711808', b'1', 'Ban da dat lich kham thanh cong voi bac si Võ Đăng Khoa', 3, 'APPOINTMENT', 'Dat lich thanh cong', 'APPOINTMENT_CREATED', '2026-05-15 12:28:16.087354', 2),
	(2, '2026-05-06 18:08:07.634072', b'1', 'Lich kham cua ban da duoc bac si xac nhan', 3, 'APPOINTMENT', 'Lich kham da duoc xac nhan', 'APPOINTMENT_CONFIRMED', '2026-05-15 12:28:16.087354', 2),
	(3, '2026-05-06 18:22:31.565007', b'1', 'Bac si da tao don thuoc cho lich kham cua ban', 3, 'PRESCRIPTION', 'Don thuoc da duoc tao', 'PRESCRIPTION_CREATED', '2026-05-15 12:28:16.087354', 2),
	(4, '2026-05-06 18:37:40.637543', b'1', 'Lich kham cua ban da duoc bac si xac nhan', 1, 'APPOINTMENT', 'Lich kham da duoc xac nhan', 'APPOINTMENT_CONFIRMED', '2026-05-15 12:28:16.087354', 2),
	(5, '2026-05-06 18:37:41.792303', b'1', 'Lich kham cua ban da duoc bac si xac nhan', 1, 'APPOINTMENT', 'Lich kham da duoc xac nhan', 'APPOINTMENT_CONFIRMED', '2026-05-15 12:28:16.086359', 2),
	(6, '2026-05-06 18:37:42.387915', b'1', 'Lich kham cua ban da duoc bac si xac nhan', 1, 'APPOINTMENT', 'Lich kham da duoc xac nhan', 'APPOINTMENT_CONFIRMED', '2026-05-15 12:28:16.086359', 2),
	(7, '2026-05-06 18:37:42.975669', b'1', 'Lich kham cua ban da duoc bac si xac nhan', 1, 'APPOINTMENT', 'Lich kham da duoc xac nhan', 'APPOINTMENT_CONFIRMED', '2026-05-15 12:28:16.086359', 2),
	(8, '2026-05-06 18:37:50.473876', b'1', 'Lich kham cua ban da duoc bac si xac nhan', 1, 'APPOINTMENT', 'Lich kham da duoc xac nhan', 'APPOINTMENT_CONFIRMED', '2026-05-15 12:28:16.086359', 2),
	(9, '2026-05-06 18:37:51.061205', b'1', 'Lich kham cua ban da duoc bac si xac nhan', 1, 'APPOINTMENT', 'Lich kham da duoc xac nhan', 'APPOINTMENT_CONFIRMED', '2026-05-15 12:28:16.085356', 2),
	(10, '2026-05-06 18:37:52.555538', b'1', 'Lich kham cua ban da duoc bac si xac nhan', 1, 'APPOINTMENT', 'Lich kham da duoc xac nhan', 'APPOINTMENT_CONFIRMED', '2026-05-15 12:28:16.085356', 2),
	(11, '2026-05-06 18:38:17.356981', b'1', 'Lich kham cua ban da bi huy', 1, 'APPOINTMENT', 'Lich kham da bi huy', 'APPOINTMENT_CANCELLED', '2026-05-15 12:28:16.085356', 2),
	(12, '2026-05-06 18:38:42.782235', b'1', 'Lich kham cua ban da duoc bac si xac nhan', 1, 'APPOINTMENT', 'Lich kham da duoc xac nhan', 'APPOINTMENT_CONFIRMED', '2026-05-15 12:28:16.085356', 2),
	(13, '2026-05-06 18:38:44.031409', b'1', 'Lich kham cua ban da duoc bac si xac nhan', 1, 'APPOINTMENT', 'Lich kham da duoc xac nhan', 'APPOINTMENT_CONFIRMED', '2026-05-15 12:28:16.085356', 2),
	(14, '2026-05-06 18:39:27.683848', b'1', 'Lich kham cua ban da bi huy', 1, 'APPOINTMENT', 'Lich kham da bi huy', 'APPOINTMENT_CANCELLED', '2026-05-15 12:28:16.085356', 2),
	(15, '2026-05-06 18:41:27.536790', b'1', 'Lich kham cua ban da duoc bac si xac nhan', 1, 'APPOINTMENT', 'Lich kham da duoc xac nhan', 'APPOINTMENT_CONFIRMED', '2026-05-15 12:28:16.085356', 2),
	(16, '2026-05-12 17:36:19.193510', b'1', 'Ban da dat lich kham thanh cong voi bac si Võ Đăng Khoa', 4, 'APPOINTMENT', 'Dat lich thanh cong', 'APPOINTMENT_CREATED', '2026-05-15 12:28:16.085356', 2),
	(17, '2026-05-12 17:36:46.121221', b'1', 'Ban da dat lich kham thanh cong voi bac si Võ Đăng Khoa', 5, 'APPOINTMENT', 'Dat lich thanh cong', 'APPOINTMENT_CREATED', '2026-05-15 12:28:16.085356', 2),
	(18, '2026-05-12 17:37:14.356803', b'1', 'Ban da dat lich kham thanh cong voi bac si Võ Đăng Khoa', 6, 'APPOINTMENT', 'Dat lich thanh cong', 'APPOINTMENT_CREATED', '2026-05-15 12:28:16.084355', 2),
	(19, '2026-05-12 17:41:56.008446', b'1', 'Lich kham cua ban da duoc bac si xac nhan', 6, 'APPOINTMENT', 'Lich kham da duoc xac nhan', 'APPOINTMENT_CONFIRMED', '2026-05-15 12:28:16.084355', 2),
	(20, '2026-05-12 17:46:03.759201', b'1', 'Lich kham cua ban da duoc bac si xac nhan', 4, 'APPOINTMENT', 'Lich kham da duoc xac nhan', 'APPOINTMENT_CONFIRMED', '2026-05-15 12:28:16.084355', 2),
	(21, '2026-05-12 17:56:46.012430', b'1', 'Bac si da tao don thuoc cho lich kham cua ban', 4, 'PRESCRIPTION', 'Don thuoc da duoc tao', 'PRESCRIPTION_CREATED', '2026-05-15 12:28:16.084355', 2),
	(22, '2026-05-12 18:17:20.080355', b'1', 'Ban da dat lich kham thanh cong voi bac si Võ Đăng Khoa', 7, 'APPOINTMENT', 'Dat lich thanh cong', 'APPOINTMENT_CREATED', '2026-05-15 12:28:16.084355', 2),
	(23, '2026-05-12 18:41:10.590288', b'0', 'Ban da dat lich kham thanh cong voi bac si Võ Đăng Khoa', 8, 'APPOINTMENT', 'Dat lich thanh cong', 'APPOINTMENT_CREATED', '2026-05-12 18:41:10.590288', 7),
	(24, '2026-05-13 07:56:21.517173', b'0', 'Ban da dat lich kham thanh cong voi bac si Võ Đăng Khoa', 9, 'APPOINTMENT', 'Dat lich thanh cong', 'APPOINTMENT_CREATED', '2026-05-13 07:56:21.517173', 8),
	(25, '2026-05-13 17:21:57.914688', b'1', 'Ban da dat lich kham thanh cong voi bac si Võ Đăng Khoa', 10, 'APPOINTMENT', 'Dat lich thanh cong', 'APPOINTMENT_CREATED', '2026-05-13 17:22:13.797904', 2),
	(26, '2026-05-13 17:21:57.920689', b'1', 'Benh nhan Võ Đăng Khoa vua dat lich kham moi', 10, 'APPOINTMENT', 'Co lich kham moi', 'APPOINTMENT_CREATED', '2026-05-13 17:24:51.536869', 4),
	(27, '2026-05-13 17:24:25.472134', b'1', 'Lich kham cua ban da duoc bac si xac nhan', 10, 'APPOINTMENT', 'Lich kham da duoc xac nhan', 'APPOINTMENT_CONFIRMED', '2026-05-15 12:28:16.084355', 2),
	(28, '2026-05-13 17:27:13.497218', b'1', 'Lich kham cua ban da bi huy', 10, 'APPOINTMENT', 'Lich kham da bi huy', 'APPOINTMENT_CANCELLED', '2026-05-15 12:28:16.081352', 2),
	(29, '2026-05-13 17:37:54.618355', b'0', 'Ban da dat lich kham thanh cong voi bac si Võ Đăng Khoa', 11, 'APPOINTMENT', 'Dat lich thanh cong', 'APPOINTMENT_CREATED', '2026-05-13 17:37:54.618355', 6),
	(30, '2026-05-13 17:37:54.633438', b'1', 'Benh nhan Đăng Khoa vua dat lich kham moi', 11, 'APPOINTMENT', 'Co lich kham moi', 'APPOINTMENT_CREATED', '2026-05-13 17:58:25.671701', 4),
	(31, '2026-05-13 18:08:32.770997', b'0', 'Ban da dat lich kham thanh cong voi bac si Võ Đăng Khoa', 12, 'APPOINTMENT', 'Dat lich thanh cong', 'APPOINTMENT_CREATED', '2026-05-13 18:08:32.770997', 6),
	(32, '2026-05-13 18:08:32.775002', b'1', 'Benh nhan Đăng Khoa vua dat lich kham moi', 12, 'APPOINTMENT', 'Co lich kham moi', 'APPOINTMENT_CREATED', '2026-05-13 18:09:14.565252', 4),
	(33, '2026-05-15 12:30:52.351815', b'1', 'Ban da dat lich kham thanh cong voi bac si Võ Đăng Khoa', 13, 'APPOINTMENT', 'Dat lich thanh cong', 'APPOINTMENT_CREATED', '2026-05-15 12:55:31.842753', 2),
	(34, '2026-05-15 12:30:52.357345', b'1', 'Benh nhan Võ Đăng Khoa vua dat lich kham moi', 13, 'APPOINTMENT', 'Co lich kham moi', 'APPOINTMENT_CREATED', '2026-05-16 16:16:18.465508', 4),
	(35, '2026-05-15 16:09:25.128638', b'1', 'Lich kham cua ban da duoc bac si xac nhan', 5, 'APPOINTMENT', 'Lich kham da duoc xac nhan', 'APPOINTMENT_CONFIRMED', '2026-05-16 16:10:35.539141', 2),
	(36, '2026-05-15 16:10:40.187783', b'1', 'Lich kham cua ban da duoc bac si xac nhan', 7, 'APPOINTMENT', 'Lich kham da duoc xac nhan', 'APPOINTMENT_CONFIRMED', '2026-05-16 16:10:35.539141', 2),
	(37, '2026-05-15 16:13:08.754338', b'1', 'Bac si da tao don thuoc cho lich kham cua ban', 5, 'PRESCRIPTION', 'Don thuoc da duoc tao', 'PRESCRIPTION_CREATED', '2026-05-16 16:10:35.536096', 2),
	(38, '2026-05-15 16:15:30.443931', b'1', 'Benh nhan Võ Đăng Khoa da huy lich kham', 4, 'APPOINTMENT', 'Benh nhan da huy lich', 'APPOINTMENT_CANCELLED', '2026-05-16 16:16:18.465508', 4),
	(39, '2026-05-16 16:10:48.998718', b'1', 'Ban da dat lich kham thanh cong voi bac si Võ Đăng Khoa', 14, 'APPOINTMENT', 'Dat lich thanh cong', 'APPOINTMENT_CREATED', '2026-05-16 16:12:24.545483', 2),
	(40, '2026-05-16 16:10:49.003514', b'1', 'Benh nhan Võ Đăng Khoa vua dat lich kham moi', 14, 'APPOINTMENT', 'Co lich kham moi', 'APPOINTMENT_CREATED', '2026-05-16 16:14:06.344727', 4),
	(41, '2026-05-16 16:14:11.798369', b'1', 'Lich kham cua ban da duoc bac si xac nhan', 14, 'APPOINTMENT', 'Lich kham da duoc xac nhan', 'APPOINTMENT_CONFIRMED', '2026-05-18 16:06:04.591141', 2),
	(42, '2026-05-16 16:16:01.982125', b'1', 'Bac si da tao don thuoc cho lich kham cua ban', 6, 'PRESCRIPTION', 'Don thuoc da duoc tao', 'PRESCRIPTION_CREATED', '2026-05-18 16:06:04.591141', 2),
	(43, '2026-05-18 13:51:24.506133', b'1', 'Ban da dat lich kham thanh cong voi bac si Võ Đăng Khoa', 15, 'APPOINTMENT', 'Dat lich thanh cong', 'APPOINTMENT_CREATED', '2026-05-18 13:51:54.506322', 2),
	(44, '2026-05-18 13:51:24.516452', b'1', 'Benh nhan Võ Đăng Khoa vua dat lich kham moi', 15, 'APPOINTMENT', 'Co lich kham moi', 'APPOINTMENT_CREATED', '2026-05-18 13:52:53.209705', 4),
	(45, '2026-05-18 13:52:55.292200', b'1', 'Lich kham cua ban da duoc bac si xac nhan', 15, 'APPOINTMENT', 'Lich kham da duoc xac nhan', 'APPOINTMENT_CONFIRMED', '2026-05-18 16:06:04.591141', 2),
	(46, '2026-05-18 13:54:41.269689', b'1', 'Bac si da tao don thuoc cho lich kham cua ban', 7, 'PRESCRIPTION', 'Don thuoc da duoc tao', 'PRESCRIPTION_CREATED', '2026-05-18 14:00:30.908372', 2),
	(47, '2026-05-18 16:05:05.588213', b'1', 'Khoan thanh toan don thuoc cua ban da duoc xac nhan', 3, 'PAYMENT', 'Thanh toan don thuoc thanh cong', 'PAYMENT_COMPLETED', '2026-05-18 16:06:03.391798', 2),
	(48, '2026-05-18 16:13:15.029936', b'1', 'Ban da dat lich kham thanh cong voi bac si Võ Đăng Khoa', 16, 'APPOINTMENT', 'Dat lich thanh cong', 'APPOINTMENT_CREATED', '2026-05-18 16:34:08.106102', 2),
	(49, '2026-05-18 16:13:15.035218', b'1', 'Benh nhan Võ Đăng Khoa vua dat lich kham moi', 16, 'APPOINTMENT', 'Co lich kham moi', 'APPOINTMENT_CREATED', '2026-05-18 16:14:46.180137', 4),
	(50, '2026-05-18 16:13:46.186858', b'1', 'Lich kham cua ban da duoc xac nhan. Phuong thuc thanh toan: BANK_TRANSFER', 16, 'APPOINTMENT', 'Dat lich thanh cong', 'APPOINTMENT_CONFIRMED', '2026-05-18 16:34:08.106102', 2),
	(51, '2026-05-18 16:15:00.455839', b'1', 'Khoan thanh toan dat lich cua ban da duoc xac nhan', 4, 'PAYMENT', 'Thanh toan thanh cong', 'PAYMENT_COMPLETED', '2026-05-18 16:15:09.184083', 2),
	(52, '2026-05-18 16:16:36.885979', b'1', 'Bac si da tao don thuoc cho lich kham cua ban', 8, 'PRESCRIPTION', 'Don thuoc da duoc tao', 'PRESCRIPTION_CREATED', '2026-05-18 16:34:08.106102', 2),
	(53, '2026-05-18 16:17:32.818764', b'1', 'Khoan thanh toan don thuoc cua ban da duoc xac nhan', 5, 'PAYMENT', 'Thanh toan don thuoc thanh cong', 'PAYMENT_COMPLETED', '2026-05-18 16:34:08.106102', 2),
	(54, '2026-05-18 16:18:15.296134', b'1', 'Ban da dat lich kham thanh cong voi bac si Võ Đăng Khoa', 17, 'APPOINTMENT', 'Dat lich thanh cong', 'APPOINTMENT_CREATED', '2026-05-18 16:34:08.106102', 2),
	(55, '2026-05-18 16:18:15.298108', b'1', 'Benh nhan Võ Đăng Khoa vua dat lich kham moi', 17, 'APPOINTMENT', 'Co lich kham moi', 'APPOINTMENT_CREATED', '2026-05-18 16:18:55.276340', 4),
	(56, '2026-05-18 16:18:57.068751', b'1', 'Lich kham cua ban da bi huy', 17, 'APPOINTMENT', 'Lich kham da bi huy', 'APPOINTMENT_CANCELLED', '2026-05-18 16:34:08.106102', 2),
	(57, '2026-05-18 16:19:10.789747', b'1', 'Ban da dat lich kham thanh cong voi bac si Võ Đăng Khoa', 18, 'APPOINTMENT', 'Dat lich thanh cong', 'APPOINTMENT_CREATED', '2026-05-18 16:34:08.106102', 2),
	(58, '2026-05-18 16:19:10.793902', b'1', 'Benh nhan Võ Đăng Khoa vua dat lich kham moi', 18, 'APPOINTMENT', 'Co lich kham moi', 'APPOINTMENT_CREATED', '2026-05-18 16:32:46.085759', 4),
	(59, '2026-05-18 16:19:18.544342', b'1', 'Benh nhan Võ Đăng Khoa da huy lich kham', 18, 'APPOINTMENT', 'Benh nhan da huy lich', 'APPOINTMENT_CANCELLED', '2026-05-18 16:32:46.085759', 4),
	(60, '2026-05-21 15:10:01.297028', b'1', 'Ban da dat lich kham thanh cong voi bac si Pha Vo', 19, 'APPOINTMENT', 'Dat lich thanh cong', 'APPOINTMENT_CREATED', '2026-05-21 15:50:53.578087', 11),
	(61, '2026-05-21 15:10:01.300936', b'1', 'Benh nhan HieuThuHai vua dat lich kham moi', 19, 'APPOINTMENT', 'Co lich kham moi', 'APPOINTMENT_CREATED', '2026-05-21 15:12:20.969856', 10),
	(62, '2026-05-21 15:10:32.383672', b'1', 'Lich kham cua ban da duoc xac nhan. Phuong thuc thanh toan: CASH', 19, 'APPOINTMENT', 'Dat lich thanh cong', 'APPOINTMENT_CONFIRMED', '2026-05-21 15:50:53.578087', 11),
	(63, '2026-05-21 15:12:30.964292', b'1', 'Khoan thanh toan dat lich cua ban da duoc xac nhan', 6, 'PAYMENT', 'Thanh toan thanh cong', 'PAYMENT_COMPLETED', '2026-05-21 15:50:53.577085', 11),
	(64, '2026-05-21 15:12:30.983170', b'0', 'Hoa don #6 cua benh nhan HieuThuHai da thanh toan thanh cong. So tien: 250.00 VND', 6, 'PAYMENT', 'Thanh toan thanh cong', 'PAYMENT_COMPLETED', '2026-05-21 15:12:30.983170', 1),
	(65, '2026-05-21 15:12:30.999048', b'1', 'Hoa don #6 cua benh nhan HieuThuHai da thanh toan thanh cong. So tien: 250.00 VND', 6, 'PAYMENT', 'Thanh toan thanh cong', 'PAYMENT_COMPLETED', '2026-05-21 15:12:52.150963', 3),
	(66, '2026-05-21 15:17:05.217041', b'1', 'Bac si da tao don thuoc cho lich kham cua ban', 9, 'PRESCRIPTION', 'Don thuoc da duoc tao', 'PRESCRIPTION_CREATED', '2026-05-21 15:50:53.576083', 11),
	(67, '2026-05-21 15:19:35.221469', b'0', 'Thuoc "Panadol" con lai 3 vien. Can nhap them hang.', 2, 'MEDICINE', 'Canh bao ton kho thap', 'LOW_STOCK', '2026-05-21 15:19:35.221469', 1),
	(68, '2026-05-21 15:19:35.224460', b'1', 'Thuoc "Panadol" con lai 3 vien. Can nhap them hang.', 2, 'MEDICINE', 'Canh bao ton kho thap', 'LOW_STOCK', '2026-05-21 15:25:02.306891', 3),
	(69, '2026-05-21 15:19:35.235116', b'0', 'Hoa don #7 cua benh nhan HieuThuHai da thanh toan thanh cong. So tien: 35000.00 VND', 7, 'PAYMENT', 'Thanh toan thanh cong', 'PAYMENT_COMPLETED', '2026-05-21 15:19:35.235116', 1),
	(70, '2026-05-21 15:19:35.239899', b'1', 'Hoa don #7 cua benh nhan HieuThuHai da thanh toan thanh cong. So tien: 35000.00 VND', 7, 'PAYMENT', 'Thanh toan thanh cong', 'PAYMENT_COMPLETED', '2026-05-21 15:25:02.306891', 3),
	(71, '2026-05-21 15:19:35.242830', b'1', 'Khoan thanh toan don thuoc cua ban da duoc xac nhan', 7, 'PAYMENT', 'Thanh toan don thuoc thanh cong', 'PAYMENT_COMPLETED', '2026-05-21 15:20:00.014916', 11),
	(72, '2026-05-21 18:42:20.603920', b'0', 'Lich kham cua ban da duoc bac si xac nhan', 8, 'APPOINTMENT', 'Lich kham da duoc xac nhan', 'APPOINTMENT_CONFIRMED', '2026-05-21 18:42:20.603920', 7),
	(73, '2026-05-21 18:42:20.679442', b'0', 'Lich kham #8 cua benh nhan Miu Lê da duoc xac nhan boi bac si Võ Đăng Khoa', 8, 'APPOINTMENT', 'Lich kham da xac nhan', 'APPOINTMENT_CONFIRMED', '2026-05-21 18:42:20.679442', 1),
	(74, '2026-05-21 18:42:20.685220', b'0', 'Lich kham #8 cua benh nhan Miu Lê da duoc xac nhan boi bac si Võ Đăng Khoa', 8, 'APPOINTMENT', 'Lich kham da xac nhan', 'APPOINTMENT_CONFIRMED', '2026-05-21 18:42:20.685220', 3),
	(75, '2026-05-24 16:22:26.704849', b'0', 'Ban da dat lich kham thanh cong voi bac si Võ Đăng Khoa', 20, 'APPOINTMENT', 'Dat lich thanh cong', 'APPOINTMENT_CREATED', '2026-05-24 16:22:26.704849', 6),
	(76, '2026-05-24 16:22:26.726839', b'1', 'Benh nhan Đăng Khoa vua dat lich kham moi', 20, 'APPOINTMENT', 'Co lich kham moi', 'APPOINTMENT_CREATED', '2026-05-24 16:23:42.827095', 4),
	(77, '2026-05-24 16:23:28.692834', b'0', 'Lich kham cua ban da duoc xac nhan. Phuong thuc thanh toan: BANK_TRANSFER', 20, 'APPOINTMENT', 'Dat lich thanh cong', 'APPOINTMENT_CONFIRMED', '2026-05-24 16:23:28.692834', 6),
	(78, '2026-05-24 16:25:27.853958', b'1', 'Benh nhan Đăng Khoa da huy lich kham', 20, 'APPOINTMENT', 'Benh nhan da huy lich', 'APPOINTMENT_CANCELLED', '2026-05-24 16:25:33.463083', 4),
	(79, '2026-05-24 16:25:27.902002', b'0', 'Benh nhan Đăng Khoa da tu huy lich kham #20', 20, 'APPOINTMENT', 'Benh nhan huy lich', 'APPOINTMENT_CANCELLED', '2026-05-24 16:25:27.902002', 1),
	(80, '2026-05-24 16:25:27.908009', b'0', 'Benh nhan Đăng Khoa da tu huy lich kham #20', 20, 'APPOINTMENT', 'Benh nhan huy lich', 'APPOINTMENT_CANCELLED', '2026-05-24 16:25:27.908009', 3),
	(81, '2026-05-24 18:28:19.481458', b'1', 'Ban da dat lich kham thanh cong voi bac si Pha Vo', 21, 'APPOINTMENT', 'Dat lich thanh cong', 'APPOINTMENT_CREATED', '2026-05-25 11:39:31.325174', 11),
	(82, '2026-05-24 18:28:19.487377', b'0', 'Benh nhan HieuThuHai vua dat lich kham moi', 21, 'APPOINTMENT', 'Co lich kham moi', 'APPOINTMENT_CREATED', '2026-05-24 18:28:19.487377', 10),
	(83, '2026-05-24 18:28:31.226986', b'0', 'Benh nhan HieuThuHai da huy lich kham', 21, 'APPOINTMENT', 'Benh nhan da huy lich', 'APPOINTMENT_CANCELLED', '2026-05-24 18:28:31.226986', 10),
	(84, '2026-05-24 18:28:31.233986', b'0', 'Benh nhan HieuThuHai da tu huy lich kham #21', 21, 'APPOINTMENT', 'Benh nhan huy lich', 'APPOINTMENT_CANCELLED', '2026-05-24 18:28:31.233986', 1),
	(85, '2026-05-24 18:28:31.235980', b'0', 'Benh nhan HieuThuHai da tu huy lich kham #21', 21, 'APPOINTMENT', 'Benh nhan huy lich', 'APPOINTMENT_CANCELLED', '2026-05-24 18:28:31.235980', 3),
	(86, '2026-05-24 18:46:24.528420', b'0', 'Khoan thanh toan dat lich cua ban da duoc xac nhan', 8, 'PAYMENT', 'Thanh toan thanh cong', 'PAYMENT_COMPLETED', '2026-05-24 18:46:24.528420', 6),
	(87, '2026-05-24 18:46:24.553443', b'0', 'Hoa don #8 cua benh nhan Đăng Khoa da thanh toan thanh cong. So tien: 300.00 VND', 8, 'PAYMENT', 'Thanh toan thanh cong', 'PAYMENT_COMPLETED', '2026-05-24 18:46:24.553443', 1),
	(88, '2026-05-24 18:46:24.557446', b'0', 'Hoa don #8 cua benh nhan Đăng Khoa da thanh toan thanh cong. So tien: 300.00 VND', 8, 'PAYMENT', 'Thanh toan thanh cong', 'PAYMENT_COMPLETED', '2026-05-24 18:46:24.557446', 3),
	(89, '2026-05-27 08:28:38.813766', b'0', 'Ban da dat lich kham thanh cong voi bac si Pha Vo', 22, 'APPOINTMENT', 'Dat lich thanh cong', 'APPOINTMENT_CREATED', '2026-05-27 08:28:38.813766', 11),
	(90, '2026-05-27 08:28:38.821853', b'0', 'Benh nhan HieuThuHai vua dat lich kham moi', 22, 'APPOINTMENT', 'Co lich kham moi', 'APPOINTMENT_CREATED', '2026-05-27 08:28:38.821853', 10),
	(91, '2026-05-27 08:29:31.298860', b'0', 'Benh nhan HieuThuHai da huy lich kham', 22, 'APPOINTMENT', 'Benh nhan da huy lich', 'APPOINTMENT_CANCELLED', '2026-05-27 08:29:31.298860', 10),
	(92, '2026-05-27 08:29:31.316748', b'0', 'Benh nhan HieuThuHai da tu huy lich kham #22', 22, 'APPOINTMENT', 'Benh nhan huy lich', 'APPOINTMENT_CANCELLED', '2026-05-27 08:29:31.316748', 1),
	(93, '2026-05-27 08:29:31.318830', b'0', 'Benh nhan HieuThuHai da tu huy lich kham #22', 22, 'APPOINTMENT', 'Benh nhan huy lich', 'APPOINTMENT_CANCELLED', '2026-05-27 08:29:31.318830', 3),
	(94, '2026-05-27 08:29:34.517510', b'0', 'Ban da dat lich kham thanh cong voi bac si Pha Vo', 23, 'APPOINTMENT', 'Dat lich thanh cong', 'APPOINTMENT_CREATED', '2026-05-27 08:29:34.517510', 2),
	(95, '2026-05-27 08:29:34.520521', b'0', 'Benh nhan Võ Đăng Khoa vua dat lich kham moi', 23, 'APPOINTMENT', 'Co lich kham moi', 'APPOINTMENT_CREATED', '2026-05-27 08:29:34.520521', 10),
	(96, '2026-05-27 08:29:44.044325', b'0', 'Benh nhan Võ Đăng Khoa da huy lich kham', 23, 'APPOINTMENT', 'Benh nhan da huy lich', 'APPOINTMENT_CANCELLED', '2026-05-27 08:29:44.044325', 10),
	(97, '2026-05-27 08:29:44.051086', b'0', 'Benh nhan Võ Đăng Khoa da tu huy lich kham #23', 23, 'APPOINTMENT', 'Benh nhan huy lich', 'APPOINTMENT_CANCELLED', '2026-05-27 08:29:44.051086', 1),
	(98, '2026-05-27 08:29:44.055082', b'0', 'Benh nhan Võ Đăng Khoa da tu huy lich kham #23', 23, 'APPOINTMENT', 'Benh nhan huy lich', 'APPOINTMENT_CANCELLED', '2026-05-27 08:29:44.055082', 3);

-- Dumping structure for table booking_clinic_db.patients
CREATE TABLE IF NOT EXISTS `patients` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `address` varchar(255) DEFAULT NULL,
  `blood_type` varchar(10) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `emergency_contact_phone` varchar(20) DEFAULT NULL,
  `gender` varchar(10) DEFAULT NULL,
  `identity_number` varchar(30) DEFAULT NULL,
  `insurance_number` varchar(50) DEFAULT NULL,
  `medical_history_note` text,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK9tbsl3fmey0eofbm2xj69v4qs` (`user_id`),
  CONSTRAINT `FKuwca24wcd1tg6pjex8lmc0y7` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table booking_clinic_db.patients: ~7 rows (approximately)
INSERT INTO `patients` (`id`, `address`, `blood_type`, `date_of_birth`, `emergency_contact_phone`, `gender`, `identity_number`, `insurance_number`, `medical_history_note`, `user_id`) VALUES
	(1, 'TP HCM', 'A', '2003-05-10', '0909000999', 'MALE', '079123456789', 'BHYT123456', 'Khong co', 2),
	(2, 'TP HCM', 'O+', '2003-05-10', '0909000999', 'MALE', '079123456789', 'BHYT123456', 'Khong co', 5),
	(3, '123abc', 'B+', '2008-02-13', '0123455657', 'FEMALE', '022482748070523', 'HS2132432424', 'Dương tính maithuy', 7),
	(4, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 8),
	(5, '123abc', 'B', '2010-02-13', '07835035370', 'male', '0123758350322', 'HS21324324232', 'Bệnh ý nền', 9),
	(6, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 6),
	(7, 'KTX Khu B', 'B', '2010-01-21', '0909000999', 'male', '0989429424584', 'BHYT123457', 'Không có ', 11);

-- Dumping structure for table booking_clinic_db.payments
CREATE TABLE IF NOT EXISTS `payments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `amount` decimal(12,2) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `payment_method` varchar(30) DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `appointment_id` bigint DEFAULT NULL,
  `patient_id` bigint DEFAULT NULL,
  `payment_type` varchar(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_appointment_payment_type` (`appointment_id`,`payment_type`),
  KEY `FKlvfcgbin5vh2ivae1l87bmawb` (`patient_id`),
  CONSTRAINT `FK9a0odew03qao7nlbdsesrux5u` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`),
  CONSTRAINT `FKlvfcgbin5vh2ivae1l87bmawb` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table booking_clinic_db.payments: ~8 rows (approximately)
INSERT INTO `payments` (`id`, `amount`, `created_at`, `payment_method`, `status`, `updated_at`, `appointment_id`, `patient_id`, `payment_type`) VALUES
	(1, 135300.00, '2026-04-30 16:49:20.280283', 'CASH', 'PAID', '2026-04-30 16:56:16.943261', 1, 1, ''),
	(2, 135300.00, '2026-05-01 16:34:32.082836', 'CASH', 'PAID', '2026-05-18 16:05:07.157567', 2, 1, ''),
	(3, 5000.00, '2026-05-18 16:04:22.431978', 'BANK_TRANSFER', 'PAID', '2026-05-18 16:05:05.592219', 15, 1, 'PRESCRIPTION'),
	(4, 300.00, '2026-05-18 16:13:46.167904', 'BANK_TRANSFER', 'PAID', '2026-05-18 16:15:00.459842', 16, 1, 'BOOKING'),
	(5, 5000.00, '2026-05-18 16:17:07.748648', 'BANK_TRANSFER', 'PAID', '2026-05-18 16:17:32.818764', 16, 1, 'PRESCRIPTION'),
	(6, 250.00, '2026-05-21 15:10:32.383672', 'CASH', 'PAID', '2026-05-21 15:12:30.999048', 19, 7, 'BOOKING'),
	(7, 35000.00, '2026-05-21 15:19:26.315239', 'BANK_TRANSFER', 'PAID', '2026-05-21 15:19:35.245908', 19, 7, 'PRESCRIPTION'),
	(8, 300.00, '2026-05-24 16:23:28.676584', 'BANK_TRANSFER', 'PAID', '2026-05-24 18:46:24.564453', 20, 6, 'BOOKING');

-- Dumping structure for table booking_clinic_db.prescriptions
CREATE TABLE IF NOT EXISTS `prescriptions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `general_note` text,
  `status` varchar(255) DEFAULT NULL,
  `total_price` decimal(12,2) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `doctor_id` bigint DEFAULT NULL,
  `medical_record_id` bigint DEFAULT NULL,
  `patient_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK3ufvab73b86ot4b8q31ygd7uy` (`medical_record_id`),
  KEY `FK24chc88e4so7cd6melh11rv6` (`doctor_id`),
  KEY `FKqydyol76jn1o37k1bdbkjgq74` (`patient_id`),
  CONSTRAINT `FK24chc88e4so7cd6melh11rv6` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`),
  CONSTRAINT `FKpchnmvlttcajjovopclelmdjh` FOREIGN KEY (`medical_record_id`) REFERENCES `medical_records` (`id`),
  CONSTRAINT `FKqydyol76jn1o37k1bdbkjgq74` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table booking_clinic_db.prescriptions: ~9 rows (approximately)
INSERT INTO `prescriptions` (`id`, `created_at`, `general_note`, `status`, `total_price`, `updated_at`, `doctor_id`, `medical_record_id`, `patient_id`) VALUES
	(1, '2026-04-30 16:37:46.421615', 'Uong sau an, tai kham neu khong do', 'ACTIVE', 135000.00, '2026-04-30 16:37:46.421615', 1, 1, 1),
	(2, '2026-05-01 16:32:00.895588', 'Uong sau an, tai kham neu khong do', 'ACTIVE', 135000.00, '2026-05-01 16:32:00.895588', 1, 2, 1),
	(3, '2026-05-06 18:22:31.523215', 'ưefwe', 'ACTIVE', 5000.00, '2026-05-06 18:22:31.523215', 1, 3, 1),
	(4, '2026-05-12 17:56:45.913908', 'sốt cao', 'ACTIVE', 5000.00, '2026-05-12 17:56:45.913908', 1, 4, 1),
	(5, '2026-05-15 16:13:08.727747', 'ê', 'ACTIVE', 5000.00, '2026-05-15 16:13:08.727747', 1, 6, 1),
	(6, '2026-05-16 16:16:01.951621', 'Uống thuốc 1 tuần', 'ACTIVE', 60000.00, '2026-05-16 16:16:01.951621', 1, 7, 1),
	(7, '2026-05-18 13:54:41.252586', 'Uống thuốc 7 ngày ', 'ACTIVE', 5000.00, '2026-05-18 13:54:41.252586', 1, 8, 1),
	(8, '2026-05-18 16:16:36.869480', 'uống thuốc đúng quy định ', 'ACTIVE', 5000.00, '2026-05-18 16:16:36.869480', 1, 9, 1),
	(9, '2026-05-21 15:17:05.175480', 'uống thuốc 7 ngày', 'ACTIVE', 35000.00, '2026-05-21 15:17:05.175480', 2, 10, 7);

-- Dumping structure for table booking_clinic_db.prescription_items
CREATE TABLE IF NOT EXISTS `prescription_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `dosage_text` varchar(255) DEFAULT NULL,
  `dose_per_time` int DEFAULT NULL,
  `duration_days` int DEFAULT NULL,
  `instruction` text,
  `line_total` decimal(12,2) DEFAULT NULL,
  `note` text,
  `quantity` int DEFAULT NULL,
  `times_per_day` int DEFAULT NULL,
  `unit_price` decimal(12,2) DEFAULT NULL,
  `medicine_id` bigint DEFAULT NULL,
  `prescription_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKacx7kmy9ksr443xpn5dccidro` (`medicine_id`),
  KEY `FK6uh7tdy2lv6sx34u1365acqsf` (`prescription_id`),
  CONSTRAINT `FK6uh7tdy2lv6sx34u1365acqsf` FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions` (`id`),
  CONSTRAINT `FKacx7kmy9ksr443xpn5dccidro` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table booking_clinic_db.prescription_items: ~11 rows (approximately)
INSERT INTO `prescription_items` (`id`, `dosage_text`, `dose_per_time`, `duration_days`, `instruction`, `line_total`, `note`, `quantity`, `times_per_day`, `unit_price`, `medicine_id`, `prescription_id`) VALUES
	(1, '1 vien/lần', 1, 5, 'Uong sau an', 75000.00, 'Khong bo lieu', 15, 3, 5000.00, 1, 1),
	(2, '2 vien/lần', 2, 3, 'Uong truoc an', 60000.00, 'Uong nhieu nuoc', 12, 2, 5000.00, 2, 1),
	(3, '1 vien/lần', 1, 5, 'Uong sau an', 75000.00, 'Khong bo lieu', 15, 3, 5000.00, 2, 2),
	(4, '2 vien/lần', 2, 3, 'Uong truoc an', 60000.00, 'Uong nhieu nuoc', 12, 2, 5000.00, 3, 2),
	(5, 'ưe', 1, 1, 'ew', 5000.00, 'ưe', 1, 1, 5000.00, 2, 3),
	(6, '1 viên/lần', 1, 1, 'Uống sau khi ăn', 5000.00, 'không bỏ liều', 1, 1, 5000.00, 2, 4),
	(7, 'ưew', 1, 1, 'ưew', 5000.00, 'ưe', 1, 1, 5000.00, 2, 5),
	(8, '1 viên', 3, 2, 'uống sau khi ăn', 60000.00, 'Uống thuốc đúng giờ', 12, 2, 5000.00, 2, 6),
	(9, 'viên', 1, 1, '', 5000.00, 'tái khám nếu không khỏi bệnh ', 1, 1, 5000.00, 3, 7),
	(10, 'viên', 1, 1, 'sau khi ăn', 5000.00, 'uống thuốc đúng quy định ', 1, 1, 5000.00, 2, 8),
	(11, 'viên', 7, 1, 'uống sau khi ăn', 35000.00, 'uống thuốc đúng giờ', 7, 1, 5000.00, 2, 9);

-- Dumping structure for table booking_clinic_db.refresh_tokens
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `expired_at` datetime(6) NOT NULL,
  `refresh_token` varchar(500) NOT NULL,
  `revoked` bit(1) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK1yihy5j142kjit22kgccjixro` (`refresh_token`),
  KEY `FK1lih5y2npsf8u5o3vhdb9y0os` (`user_id`),
  CONSTRAINT `FK1lih5y2npsf8u5o3vhdb9y0os` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=175 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table booking_clinic_db.refresh_tokens: ~149 rows (approximately)
INSERT INTO `refresh_tokens` (`id`, `created_at`, `expired_at`, `refresh_token`, `revoked`, `updated_at`, `user_id`) VALUES
	(1, '2026-04-30 16:05:16.035871', '2026-05-07 16:05:16.033870', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbkBnbWFpbC5jb20iLCJpYXQiOjE3Nzc1NjUxMTYsImV4cCI6MTc3ODE2OTkxNn0.bniCeW2ULwWcPOMacmlxTmmZvdzJAPHDN5S6sI8cUWc', b'0', '2026-04-30 16:05:16.035871', 3),
	(3, '2026-04-30 16:25:03.622458', '2026-05-07 16:25:03.621461', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc3NTY2MzAzLCJleHAiOjE3NzgxNzExMDN9.1SiTbrVwnuy-EFS-uuf_QnuVjk06EmsMCi2Nb894xQE', b'0', '2026-04-30 16:25:03.622458', 4),
	(4, '2026-04-30 16:41:38.953190', '2026-05-07 16:41:38.953190', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc3NTY3Mjk4LCJleHAiOjE3NzgxNzIwOTh9.oCMqH6bMSpn7p15Mmf2-SxtqGGqhPbYoJDmGP-GTsyk', b'0', '2026-04-30 16:41:38.953190', 4),
	(6, '2026-04-30 16:54:11.237091', '2026-05-07 16:54:11.236091', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbkBnbWFpbC5jb20iLCJpYXQiOjE3Nzc1NjgwNTEsImV4cCI6MTc3ODE3Mjg1MX0.pDGUBfRO9dCtbabiu4HQ-BriINYi3gAEXj9cmjd13GU', b'0', '2026-04-30 16:54:11.237091', 3),
	(7, '2026-05-01 15:31:54.791673', '2026-05-08 15:31:54.785721', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbkBnbWFpbC5jb20iLCJpYXQiOjE3Nzc2NDk1MTQsImV4cCI6MTc3ODI1NDMxNH0.uN2NXfEPNwSrpc69prCHd5nteFAiVGM6UkhNqq0s5Rk', b'0', '2026-05-01 15:31:54.791673', 3),
	(9, '2026-05-01 16:26:33.378618', '2026-05-08 16:26:33.377617', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc3NjUyNzkzLCJleHAiOjE3NzgyNTc1OTN9.HryvXlevaJwgx-939cS6wAHoYQ8KJPZlNiItpXIfZPI', b'0', '2026-05-01 16:26:33.378618', 4),
	(11, '2026-05-01 16:37:29.133197', '2026-05-08 16:37:29.133197', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwYXRpZW50MkBnbWFpbC5jb20iLCJpYXQiOjE3Nzc2NTM0NDksImV4cCI6MTc3ODI1ODI0OX0.fQDJQgZEkXrBWEJXNkop4vxbBDo8Jw7hfvw-m8jKr68', b'0', '2026-05-01 16:37:29.133197', 5),
	(21, '2026-05-06 16:07:05.476421', '2026-05-13 16:07:05.470420', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc4MDgzNjI1LCJleHAiOjE3Nzg2ODg0MjV9.HV6zXLmqJqlzKH0h5JbGuWHPSlwaQak62xt-Z9IVBVg', b'0', '2026-05-06 16:07:05.476421', 4),
	(23, '2026-05-06 16:16:19.473981', '2026-05-13 16:16:19.472982', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc4MDg0MTc5LCJleHAiOjE3Nzg2ODg5Nzl9.3cTustUje7zXLm5t4NVBARokdgJ8ZxwqSA14M7O8Wvo', b'0', '2026-05-06 16:16:19.473981', 4),
	(24, '2026-05-06 16:19:18.274667', '2026-05-13 16:19:18.274667', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc4MDg0MzU4LCJleHAiOjE3Nzg2ODkxNTh9.hAQsh3PamI0IjtVq1T4YxXredZZuw_VhlfbFFe9OB8o', b'0', '2026-05-06 16:19:18.274667', 4),
	(25, '2026-05-06 16:41:16.361128', '2026-05-13 16:41:16.361128', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc4MDg1Njc2LCJleHAiOjE3Nzg2OTA0NzZ9.fFl0n0XPJ-Z0sVlFWKFrOW73qjywbcyNlNQhxjX06yk', b'0', '2026-05-06 16:41:16.361128', 4),
	(26, '2026-05-06 17:25:18.178096', '2026-05-13 17:25:18.173536', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc4MDg4MzE4LCJleHAiOjE3Nzg2OTMxMTh9.WEwXeAzLfUJ1ArYSAEUEWzQcFbmb-lGOe0fJT2Iq33E', b'0', '2026-05-06 17:25:18.178096', 4),
	(27, '2026-05-06 17:32:42.905405', '2026-05-13 17:32:42.904404', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc4MDg4NzYyLCJleHAiOjE3Nzg2OTM1NjJ9.RB6eJhZfNE-8W5IuszzicNuMrlqVmGbjlKezgB6ZQjg', b'0', '2026-05-06 17:32:42.905405', 4),
	(28, '2026-05-06 17:44:33.189948', '2026-05-13 17:44:33.188946', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc4MDg5NDczLCJleHAiOjE3Nzg2OTQyNzN9.Jx53NvZ-2jYCqHrDSArfs_wseOYQfR_yrutYDACfuSE', b'0', '2026-05-06 17:44:33.189948', 4),
	(29, '2026-05-06 17:56:03.098931', '2026-05-13 17:56:03.097933', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc4MDkwMTYzLCJleHAiOjE3Nzg2OTQ5NjN9.9t6Pk6MuwC5dg2YM0eIUguPnwOQNrLN0dLPC6skhQ8c', b'0', '2026-05-06 17:56:03.098931', 4),
	(31, '2026-05-06 18:19:16.350110', '2026-05-13 18:19:16.350110', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc4MDkxNTU2LCJleHAiOjE3Nzg2OTYzNTZ9.SW6Jad_VdUzKEb-sLUKmAo0H8cDRAMVzrqlQWbGDx1c', b'0', '2026-05-06 18:19:16.350110', 4),
	(32, '2026-05-06 18:37:30.255916', '2026-05-13 18:37:30.255916', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc4MDkyNjUwLCJleHAiOjE3Nzg2OTc0NTB9.JVSNzAA665QbjMKqBZ8Hrf8HQ8LL7hU0mvZANnGE_DM', b'0', '2026-05-06 18:37:30.255916', 4),
	(33, '2026-05-09 15:53:30.543689', '2026-05-16 15:53:30.541070', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc4MzQyMDEwLCJleHAiOjE3Nzg5NDY4MTB9.kgXtmOkqq4n0UK5WYiiIBjDEIqElmf17CHwylJEn_gc', b'0', '2026-05-09 15:53:30.543689', 4),
	(34, '2026-05-09 16:09:41.277519', '2026-05-16 16:09:41.274513', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc4MzQyOTgxLCJleHAiOjE3Nzg5NDc3ODF9.kuJzg8JxxWkyMfaT7_odt1ceJEo0ZKuCGXsysHdVXbE', b'0', '2026-05-09 16:09:41.277519', 4),
	(35, '2026-05-09 16:41:08.796490', '2026-05-16 16:41:08.794979', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc4MzQ0ODY4LCJleHAiOjE3Nzg5NDk2Njh9.XYqXsq6o-KI4WDe0Ns0eTG9gXcz-4ypCxCPhHoaJjk4', b'0', '2026-05-09 16:41:08.796490', 4),
	(36, '2026-05-09 16:47:22.550292', '2026-05-16 16:47:22.550292', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc4MzQ1MjQyLCJleHAiOjE3Nzg5NTAwNDJ9.b4ncHvJCbdgcEwAI4yBUZKKSG-k75WIXgvXPWVbvIqQ', b'0', '2026-05-09 16:47:22.550292', 4),
	(37, '2026-05-09 16:56:33.719676', '2026-05-16 16:56:33.718590', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc4MzQ1NzkzLCJleHAiOjE3Nzg5NTA1OTN9.iwZ6QnITDbvqdNNTxvFpeOlpT9fXpAyZMTVmQDgNM_E', b'0', '2026-05-09 16:56:33.719676', 4),
	(38, '2026-05-09 16:58:17.854821', '2026-05-16 16:58:17.853790', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc4MzQ1ODk3LCJleHAiOjE3Nzg5NTA2OTd9.u37hTpDRvz9iIOLFEjFVcXu6e0Q1oTJ_o8f9MMpymQI', b'0', '2026-05-09 16:58:17.854821', 4),
	(39, '2026-05-09 17:35:47.303240', '2026-05-16 17:35:47.303240', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc4MzQ4MTQ3LCJleHAiOjE3Nzg5NTI5NDd9.8wAV1VwLoh46fYJcGmAjRT8Q8-WZjjgjBMlJibCCGCQ', b'0', '2026-05-09 17:35:47.303240', 4),
	(40, '2026-05-09 17:57:16.673041', '2026-05-16 17:57:16.673041', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc4MzQ5NDM2LCJleHAiOjE3Nzg5NTQyMzZ9.YvfLyW5xsyg0j9CuY3oNPcx5ZoG1emdtGd1WfUBapHg', b'0', '2026-05-09 17:57:16.673041', 4),
	(41, '2026-05-09 18:14:04.885738', '2026-05-16 18:14:04.884296', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc4MzUwNDQ0LCJleHAiOjE3Nzg5NTUyNDR9.EIpjzfcPIP2nY8-WKEkI3ZUHT7SHptIUy5ryukVyQhs', b'0', '2026-05-09 18:14:04.885738', 4),
	(43, '2026-05-09 19:08:03.084724', '2026-05-16 19:08:03.084724', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc4MzUzNjgzLCJleHAiOjE3Nzg5NTg0ODN9.FASIl-huEigp3Z4Wz3700RH8m0_SE7-EJ-PVJYsTJe4', b'0', '2026-05-09 19:08:03.084724', 4),
	(44, '2026-05-12 17:12:34.025862', '2026-05-19 17:12:34.010945', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc4NjA1OTU0LCJleHAiOjE3NzkyMTA3NTR9.5CFS4ASUAeJuUE-zKAX4nRxclmF0VYq2Mh3a547MtNU', b'0', '2026-05-12 17:12:34.025862', 4),
	(46, '2026-05-12 17:37:59.723125', '2026-05-19 17:37:59.722203', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc4NjA3NDc5LCJleHAiOjE3NzkyMTIyNzl9.Q1jCM5viYkmz9mHd8SyDwjcKTZrbQLIibAl44hjUiZo', b'0', '2026-05-12 17:37:59.723125', 4),
	(48, '2026-05-12 18:09:15.475129', '2026-05-19 18:09:15.475129', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc4NjA5MzU1LCJleHAiOjE3NzkyMTQxNTV9.SdAI-a_atJnc-dQPWsqyx5BUTEr60jafOIR4a7A6J9c', b'0', '2026-05-12 18:09:15.475129', 4),
	(50, '2026-05-12 18:25:31.574237', '2026-05-19 18:25:31.574237', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc4NjEwMzMxLCJleHAiOjE3NzkyMTUxMzF9.RfHgYnZjhv9EQjOwwBbgFyWG7YgmxD6e4C6WVpX8QQU', b'0', '2026-05-12 18:25:31.574237', 4),
	(52, '2026-05-12 18:26:42.628388', '2026-05-19 18:26:42.628388', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc4NjEwNDAyLCJleHAiOjE3NzkyMTUyMDJ9.iBKATCq2UW2ZfNXyF_YasO6mo_r6_1TsP1F2cGh1eUE', b'0', '2026-05-12 18:26:42.628388', 4),
	(53, '2026-05-12 18:31:06.990445', '2026-05-19 18:31:06.990445', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0aG9tYXNtaXVsZUBnbWFpbC5jb20iLCJpYXQiOjE3Nzg2MTA2NjYsImV4cCI6MTc3OTIxNTQ2Nn0.gOpApQxbibyNbpF9hp8MAqoJpOkzUswlRwXGW_Pca84', b'0', '2026-05-12 18:31:06.990445', 7),
	(54, '2026-05-12 18:36:22.867057', '2026-05-19 18:36:22.856323', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc4NjEwOTgyLCJleHAiOjE3NzkyMTU3ODJ9.sVbMvM4xyAOGZXjqoPVi_J0lfc4xliKQPYcpQDQ8fkk', b'0', '2026-05-12 18:36:22.867057', 4),
	(55, '2026-05-12 18:38:53.749442', '2026-05-19 18:38:53.745329', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0aG9tYXNtaXVsZUBnbWFpbC5jb20iLCJpYXQiOjE3Nzg2MTExMzMsImV4cCI6MTc3OTIxNTkzM30.CDB2pOO6pGk_aFpHO3FoR-R8gabNGpMbKf8hv2jEe7o', b'0', '2026-05-12 18:38:53.749442', 7),
	(56, '2026-05-12 18:43:31.007340', '2026-05-19 18:43:31.006353', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc4NjExNDExLCJleHAiOjE3NzkyMTYyMTF9.jSNu2mjhn5mNNsj4imW6IqoySC_6MQPuMYiTFyv0AU4', b'0', '2026-05-12 18:43:31.007340', 4),
	(59, '2026-05-13 06:53:14.596115', '2026-05-20 06:53:14.596115', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc4NjU1MTk0LCJleHAiOjE3NzkyNTk5OTR9.6V7mAvv2SJuCFpGlxeY-D1niphVPgnINJvnOaiPfNnc', b'0', '2026-05-13 06:53:14.596115', 4),
	(61, '2026-05-13 07:14:53.633467', '2026-05-20 07:14:53.633467', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc4NjU2NDkzLCJleHAiOjE3NzkyNjEyOTN9.cPC8hNoOpKG5HN_QzjryOJjy2CbdmiAPRinuZESqjEg', b'0', '2026-05-13 07:14:53.633467', 4),
	(62, '2026-05-13 07:49:49.590114', '2026-05-20 07:49:49.572711', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJsZW9tZXNzaTAxMDEyMDA1QGdtYWlsLmNvbSIsImlhdCI6MTc3ODY1ODU4OSwiZXhwIjoxNzc5MjYzMzg5fQ.lBMbTACFfpM1PyNCF966qNUm6W_UJXTiG31QRW3VnIQ', b'0', '2026-05-13 07:49:49.590114', 8),
	(63, '2026-05-13 07:58:53.222304', '2026-05-20 07:58:53.222304', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ2b2RhbmdraG9hQGdtYWlsLmNvbSIsImlhdCI6MTc3ODY1OTEzMywiZXhwIjoxNzc5MjYzOTMzfQ.3BcFi2B866h4n1CVxgMiUHwzFwU698TPZWq1ir_ES7w', b'0', '2026-05-13 07:58:53.222304', 9),
	(64, '2026-05-13 17:04:31.775964', '2026-05-20 17:04:31.772966', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc4NjkxODcxLCJleHAiOjE3NzkyOTY2NzF9.sRUEw6y8DaACzSaF6AHKOp9q1carLGOV7mIfLH3kyLM', b'0', '2026-05-13 17:04:31.775964', 4),
	(65, '2026-05-13 17:17:45.515415', '2026-05-20 17:17:45.512418', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc4NjkyNjY1LCJleHAiOjE3NzkyOTc0NjV9.gLE3xcPeEdVbwodZ1j9NdMVdtDd4RWwnPOlXictf0RE', b'0', '2026-05-13 17:17:45.515415', 4),
	(67, '2026-05-13 17:23:59.447577', '2026-05-20 17:23:59.447577', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc4NjkzMDM5LCJleHAiOjE3NzkyOTc4Mzl9.NgDD4dwybgQ20Ek1RHm67qxEstfl9ix0RTNuCO6siaM', b'0', '2026-05-13 17:23:59.447577', 4),
	(69, '2026-05-13 17:34:21.871173', '2026-05-20 17:34:21.871173', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ2b2RhbmdraG9hMDUyNEBnbWFpbC5jb20iLCJpYXQiOjE3Nzg2OTM2NjEsImV4cCI6MTc3OTI5ODQ2MX0.rEyaP0D8U4EOGVT4pT7JqcVKR84aPhsmooSn3Xy6KqY', b'0', '2026-05-13 17:34:21.871173', 6),
	(70, '2026-05-13 17:37:34.380258', '2026-05-20 17:37:34.379068', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ2b2RhbmdraG9hMDUyNEBnbWFpbC5jb20iLCJpYXQiOjE3Nzg2OTM4NTQsImV4cCI6MTc3OTI5ODY1NH0.gMnIiySKNePiWUjVpUctJnkdM0GdUGfznYtLc404mbk', b'0', '2026-05-13 17:37:34.380258', 6),
	(71, '2026-05-13 17:38:23.724794', '2026-05-20 17:38:23.724794', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc4NjkzOTAzLCJleHAiOjE3NzkyOTg3MDN9.8USD0l8y0YqiQi_pfV7b-WSek1QVilH9c3fdp_XMaV4', b'0', '2026-05-13 17:38:23.724794', 4),
	(72, '2026-05-13 18:08:15.086552', '2026-05-20 18:08:15.085551', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ2b2RhbmdraG9hMDUyNEBnbWFpbC5jb20iLCJpYXQiOjE3Nzg2OTU2OTUsImV4cCI6MTc3OTMwMDQ5NX0.MbObvoV_gZP65EbvY7fWLZn4e5OCz65gU0fxhOhW934', b'0', '2026-05-13 18:08:15.086552', 6),
	(73, '2026-05-13 18:08:49.643771', '2026-05-20 18:08:49.643771', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc4Njk1NzI5LCJleHAiOjE3NzkzMDA1Mjl9.-ctBwxWdj2FGUZWFJDiHCEZ0RDh8cQYcptlJ2qsIMkA', b'0', '2026-05-13 18:08:49.643771', 4),
	(74, '2026-05-13 18:17:25.540583', '2026-05-20 18:17:25.540583', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc4Njk2MjQ1LCJleHAiOjE3NzkzMDEwNDV9.b9dQvxJeCFU7wF5XQJG_lRYea-QasFdwQv8ks3Csbh0', b'0', '2026-05-13 18:17:25.540583', 4),
	(75, '2026-05-14 07:36:34.961823', '2026-05-21 07:36:34.946837', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwYXRpZW50QGdtYWlsLmNvbSIsImlhdCI6MTc3ODc0NDE5NCwiZXhwIjoxNzc5MzQ4OTk0fQ.omz__Qw_Bl3oyn1Ai5fIOmCHSTfNGHOCnlf-99X7L4w', b'0', '2026-05-14 07:36:34.961823', 2),
	(76, '2026-05-14 09:05:34.132631', '2026-05-21 09:05:34.128012', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwYXRpZW50QGdtYWlsLmNvbSIsImlhdCI6MTc3ODc0OTUzNCwiZXhwIjoxNzc5MzU0MzM0fQ.8C3s6lMxoD3x0giItPTKqrsonjWU6TwiQRO4OWm8058', b'0', '2026-05-14 09:05:34.132631', 2),
	(77, '2026-05-15 12:27:51.769938', '2026-05-22 12:27:51.763934', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwYXRpZW50QGdtYWlsLmNvbSIsImlhdCI6MTc3ODg0ODA3MSwiZXhwIjoxNzc5NDUyODcxfQ.WbC-Ta_TCEBoLz_0M_cmvaEA3u_fpPTdkwwQrdoDo00', b'0', '2026-05-15 12:27:51.769938', 2),
	(78, '2026-05-15 13:26:45.930050', '2026-05-22 13:26:45.930050', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwYXRpZW50QGdtYWlsLmNvbSIsImlhdCI6MTc3ODg1MTYwNSwiZXhwIjoxNzc5NDU2NDA1fQ.UDTJwUt9zbyeAxCeOx50sf6wF7zSYqDbXa2PJA6iPTQ', b'0', '2026-05-15 13:26:45.930050', 2),
	(79, '2026-05-15 14:54:19.439741', '2026-05-22 14:54:19.433227', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc4ODU2ODU5LCJleHAiOjE3Nzk0NjE2NTl9.Hdyjg5f0qwUX9T6MQg3bpB-HvY3a3d7QB-A2e5GFick', b'0', '2026-05-15 14:54:19.439741', 4),
	(80, '2026-05-15 15:05:47.628795', '2026-05-22 15:05:47.628795', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwYXRpZW50QGdtYWlsLmNvbSIsImlhdCI6MTc3ODg1NzU0NywiZXhwIjoxNzc5NDYyMzQ3fQ.mBW4g40oGE3Qua30_swBG6MWuhcGgfxTGkobw2inNzk', b'0', '2026-05-15 15:05:47.628795', 2),
	(81, '2026-05-15 15:57:42.166772', '2026-05-22 15:57:42.165772', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc4ODYwNjYyLCJleHAiOjE3Nzk0NjU0NjJ9.2k8QbEMSYHmZo6gCI3G_P_-ifHOtUj4byAea8Stg99Q', b'0', '2026-05-15 15:57:42.166772', 4),
	(82, '2026-05-15 16:01:03.862758', '2026-05-22 16:01:03.862758', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwYXRpZW50QGdtYWlsLmNvbSIsImlhdCI6MTc3ODg2MDg2MywiZXhwIjoxNzc5NDY1NjYzfQ.XY6_xpROO581XbO4NKIkQvILFRqIe6AmJs-slYw5X9U', b'0', '2026-05-15 16:01:03.862758', 2),
	(83, '2026-05-15 16:03:17.759278', '2026-05-22 16:03:17.758764', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ2b2RhbmdraG9hMDUyNEBnbWFpbC5jb20iLCJpYXQiOjE3Nzg4NjA5OTcsImV4cCI6MTc3OTQ2NTc5N30.2yVi97gfvtE1wIFMsCMzMZCe5eT_udGeMVqydeuPbTY', b'0', '2026-05-15 16:03:17.759278', 6),
	(84, '2026-05-15 16:05:56.144276', '2026-05-22 16:05:56.144276', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc4ODYxMTU2LCJleHAiOjE3Nzk0NjU5NTZ9.XBWVz0QYQ_filvQbmUVMMcE_SXNdj23yuU-XJ-8Bmnk', b'0', '2026-05-15 16:05:56.144276', 4),
	(85, '2026-05-15 16:14:24.538684', '2026-05-22 16:14:24.538684', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwYXRpZW50QGdtYWlsLmNvbSIsImlhdCI6MTc3ODg2MTY2NCwiZXhwIjoxNzc5NDY2NDY0fQ.LAY03jajtUmBb0VHztGJdYGCgcHC1lI2--CxFJUEQ0A', b'0', '2026-05-15 16:14:24.538684', 2),
	(86, '2026-05-16 16:06:28.290656', '2026-05-23 16:06:28.281548', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwYXRpZW50QGdtYWlsLmNvbSIsImlhdCI6MTc3ODk0NzU4OCwiZXhwIjoxNzc5NTUyMzg4fQ.ZEJaCOz1YYh5C8Iy_h_qK1VnlTkLc38IGWiFQjIboZM', b'0', '2026-05-16 16:06:28.290656', 2),
	(87, '2026-05-16 16:08:30.066450', '2026-05-23 16:08:30.066450', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc4OTQ3NzEwLCJleHAiOjE3Nzk1NTI1MTB9._zMin9Rd5vYk7Cz0dD2Or_Y-vVmOwknOeG4i4YQbqu4', b'0', '2026-05-16 16:08:30.066450', 4),
	(88, '2026-05-16 16:10:27.298896', '2026-05-23 16:10:27.298896', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwYXRpZW50QGdtYWlsLmNvbSIsImlhdCI6MTc3ODk0NzgyNywiZXhwIjoxNzc5NTUyNjI3fQ.vCdgx_eq8rVT9TzNgSs-dzY2hTu7VS95YL9ssYKRFdg', b'0', '2026-05-16 16:10:27.298896', 2),
	(89, '2026-05-16 16:13:51.782433', '2026-05-23 16:13:51.782433', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc4OTQ4MDMxLCJleHAiOjE3Nzk1NTI4MzF9.om5v52B5PkZY2grB08v1vRGT0YkDWMtOnr7wtSda5ls', b'0', '2026-05-16 16:13:51.782433', 4),
	(90, '2026-05-16 16:16:58.831982', '2026-05-23 16:16:58.831982', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwYXRpZW50QGdtYWlsLmNvbSIsImlhdCI6MTc3ODk0ODIxOCwiZXhwIjoxNzc5NTUzMDE4fQ.R1mImWXU2XYtrXg7sj_2aEYHQScIk0V2jekKFtBkUnc', b'0', '2026-05-16 16:16:58.831982', 2),
	(91, '2026-05-16 16:23:14.900984', '2026-05-23 16:23:14.900984', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbkBnbWFpbC5jb20iLCJpYXQiOjE3Nzg5NDg1OTQsImV4cCI6MTc3OTU1MzM5NH0.fQ7Pu2k7Mfh3MQexQulID6db9BHR4ATIlaChy-bIYDs', b'0', '2026-05-16 16:23:14.900984', 3),
	(92, '2026-05-16 16:24:43.189651', '2026-05-23 16:24:43.189651', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbkBnbWFpbC5jb20iLCJpYXQiOjE3Nzg5NDg2ODMsImV4cCI6MTc3OTU1MzQ4M30.URrcGJzL1R-0rFYPvfxOU4MV7kh_6WdyWk2ot9R-QhY', b'0', '2026-05-16 16:24:43.189651', 3),
	(93, '2026-05-16 16:32:49.282488', '2026-05-23 16:32:49.282488', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwYXRpZW50QGdtYWlsLmNvbSIsImlhdCI6MTc3ODk0OTE2OSwiZXhwIjoxNzc5NTUzOTY5fQ.ZqKbgM1xyf5aBZ5uF9iOBLLTvS9NFfs-5UpF5h_8tO4', b'0', '2026-05-16 16:32:49.282488', 2),
	(94, '2026-05-18 13:45:34.352698', '2026-05-25 13:45:34.344997', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwYXRpZW50QGdtYWlsLmNvbSIsImlhdCI6MTc3OTExMTkzNCwiZXhwIjoxNzc5NzE2NzM0fQ.ZJD_4Yq3P6lLNTfRt4eYGv4HQjsCUd0qeneI_d99C4c', b'0', '2026-05-18 13:45:34.352698', 2),
	(95, '2026-05-18 13:46:09.437000', '2026-05-25 13:46:09.437000', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc5MTExOTY5LCJleHAiOjE3Nzk3MTY3Njl9.Qxji3bYrBPhJ0BtHBY-RNEo5XD-u5jnOI4BdQWpVdYw', b'0', '2026-05-18 13:46:09.437000', 4),
	(96, '2026-05-18 13:46:50.995961', '2026-05-25 13:46:50.995961', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwYXRpZW50QGdtYWlsLmNvbSIsImlhdCI6MTc3OTExMjAxMCwiZXhwIjoxNzc5NzE2ODEwfQ.vjLNPGA8SffL98LfB0l70vZjh7RImjmSDKeBKvGEQes', b'0', '2026-05-18 13:46:50.995961', 2),
	(97, '2026-05-18 13:48:37.326786', '2026-05-25 13:48:37.326786', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc5MTEyMTE3LCJleHAiOjE3Nzk3MTY5MTd9.LUZYpaww8kT9UtUKnIiJEc_BKPf69r416D7lgqZK708', b'0', '2026-05-18 13:48:37.326786', 4),
	(98, '2026-05-18 13:51:13.699666', '2026-05-25 13:51:13.699666', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwYXRpZW50QGdtYWlsLmNvbSIsImlhdCI6MTc3OTExMjI3MywiZXhwIjoxNzc5NzE3MDczfQ.tGrGQN1fT5zdYmAxlHbFy-0ObPYQ3VEEmWWOljG4tbg', b'0', '2026-05-18 13:51:13.699666', 2),
	(99, '2026-05-18 13:52:51.234365', '2026-05-25 13:52:51.234365', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc5MTEyMzcxLCJleHAiOjE3Nzk3MTcxNzF9.woZyUevvl9WcIvh9D_ouO8E-v7xLZLniDZDWVSHRrjA', b'0', '2026-05-18 13:52:51.234365', 4),
	(100, '2026-05-18 13:55:19.634933', '2026-05-25 13:55:19.634933', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwYXRpZW50QGdtYWlsLmNvbSIsImlhdCI6MTc3OTExMjUxOSwiZXhwIjoxNzc5NzE3MzE5fQ.IrIZGn1583uaz1pmUsMbpMzv1Vj9D0g3gQt0WBgKnKo', b'0', '2026-05-18 13:55:19.634933', 2),
	(101, '2026-05-18 14:00:48.250542', '2026-05-25 14:00:48.250542', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc5MTEyODQ4LCJleHAiOjE3Nzk3MTc2NDh9.GLY-kWJhpNhCMRWHC2j4bKIRJZslSxFm3Y3xkOq2TvQ', b'0', '2026-05-18 14:00:48.250542', 4),
	(102, '2026-05-18 14:01:05.323050', '2026-05-25 14:01:05.323050', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwYXRpZW50QGdtYWlsLmNvbSIsImlhdCI6MTc3OTExMjg2NSwiZXhwIjoxNzc5NzE3NjY1fQ.yY-29Gg0YXo5eAh4plO03jp6fNYAQ_jUmjakQ91dVh0', b'0', '2026-05-18 14:01:05.323050', 2),
	(103, '2026-05-18 14:13:49.471474', '2026-05-25 14:13:49.471474', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbkBnbWFpbC5jb20iLCJpYXQiOjE3NzkxMTM2MjksImV4cCI6MTc3OTcxODQyOX0.3gTTubxGXVNPqMUvFC5yzfxLli-_U1b9XDUWhn8vVsc', b'0', '2026-05-18 14:13:49.471474', 3),
	(104, '2026-05-18 15:13:19.856642', '2026-05-25 15:13:19.847602', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbkBnbWFpbC5jb20iLCJpYXQiOjE3NzkxMTcxOTksImV4cCI6MTc3OTcyMTk5OX0.ZhmFEQeizAer3k3j08w9IF7kqoJVlRol56K5j9MEROk', b'0', '2026-05-18 15:13:19.856642', 3),
	(105, '2026-05-18 16:04:14.627763', '2026-05-25 16:04:14.625691', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwYXRpZW50QGdtYWlsLmNvbSIsImlhdCI6MTc3OTEyMDI1NCwiZXhwIjoxNzc5NzI1MDU0fQ.iis16JzniveNOoZb-SorCOAxyaCRLof68XrxjLVyzq8', b'0', '2026-05-18 16:04:14.627763', 2),
	(106, '2026-05-18 16:04:42.402518', '2026-05-25 16:04:42.402518', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbkBnbWFpbC5jb20iLCJpYXQiOjE3NzkxMjAyODIsImV4cCI6MTc3OTcyNTA4Mn0.WK9HVwk16ZjQMKteeOHhjLtnmJVhiNknxfVSCxxN3J0', b'0', '2026-05-18 16:04:42.402518', 3),
	(107, '2026-05-18 16:05:52.985614', '2026-05-25 16:05:52.985614', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwYXRpZW50QGdtYWlsLmNvbSIsImlhdCI6MTc3OTEyMDM1MiwiZXhwIjoxNzc5NzI1MTUyfQ.bf7aIVO5qVTvmnYaeqATFZRoreJ0SOjY8eyaeTOAmFI', b'0', '2026-05-18 16:05:52.985614', 2),
	(108, '2026-05-18 16:07:10.922658', '2026-05-25 16:07:10.922658', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbkBnbWFpbC5jb20iLCJpYXQiOjE3NzkxMjA0MzAsImV4cCI6MTc3OTcyNTIzMH0.ABI-eMetFecSNmvtUR0OfQ36OqutVYH7zoUKXD6e5Dk', b'0', '2026-05-18 16:07:10.922658', 3),
	(109, '2026-05-18 16:14:36.203563', '2026-05-25 16:14:36.203563', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc5MTIwODc2LCJleHAiOjE3Nzk3MjU2NzZ9.P1JYdDMCrNiT8DXhDYQqyY-oi9tOAxJLrNMfo1UDWpE', b'0', '2026-05-18 16:14:36.203563', 4),
	(110, '2026-05-18 16:32:41.985822', '2026-05-25 16:32:41.985822', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc5MTIxOTYxLCJleHAiOjE3Nzk3MjY3NjF9.oI5E0l5UQd-Va0bGftT_SuyLj9Md21LTx5fyvkND3lI', b'0', '2026-05-18 16:32:41.985822', 4),
	(111, '2026-05-18 18:03:48.476682', '2026-05-25 18:03:48.458174', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbkBnbWFpbC5jb20iLCJpYXQiOjE3NzkxMjc0MjgsImV4cCI6MTc3OTczMjIyOH0.PZus_Rcb654Bary9OZyAlRvBzPgQrUakrz0Kv360EjM', b'0', '2026-05-18 18:03:48.476682', 3),
	(112, '2026-05-18 18:06:36.630009', '2026-05-25 18:06:36.630009', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwYXRpZW50QGdtYWlsLmNvbSIsImlhdCI6MTc3OTEyNzU5NiwiZXhwIjoxNzc5NzMyMzk2fQ._-ppOaDU6fQt3Im7P0Bydc0vb5NqmDsqh6Kr4i1n6LA', b'0', '2026-05-18 18:06:36.630009', 2),
	(113, '2026-05-18 18:12:14.086608', '2026-05-25 18:12:14.086608', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbkBnbWFpbC5jb20iLCJpYXQiOjE3NzkxMjc5MzQsImV4cCI6MTc3OTczMjczNH0.ghp_JmDvuctzQMGZoeaXGezVeNaQkqX4etsnBf6ZAQ4', b'0', '2026-05-18 18:12:14.086608', 3),
	(114, '2026-05-18 18:17:27.307609', '2026-05-25 18:17:27.307609', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbkBnbWFpbC5jb20iLCJpYXQiOjE3NzkxMjgyNDcsImV4cCI6MTc3OTczMzA0N30.sZzIx00TDNdIxc7HEEIRmQMrAe287AoY4HS8brfEH0w', b'0', '2026-05-18 18:17:27.307609', 3),
	(115, '2026-05-18 18:20:18.661400', '2026-05-25 18:20:18.660340', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwYXRpZW50QGdtYWlsLmNvbSIsImlhdCI6MTc3OTEyODQxOCwiZXhwIjoxNzc5NzMzMjE4fQ.qlEhfjUwYkryhnMxMMRFSQ4RuEnPefWk0HtbtjZMiss', b'0', '2026-05-18 18:20:18.661400', 2),
	(116, '2026-05-18 18:37:38.524125', '2026-05-25 18:37:38.524125', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwYXRpZW50QGdtYWlsLmNvbSIsImlhdCI6MTc3OTEyOTQ1OCwiZXhwIjoxNzc5NzM0MjU4fQ.xBYo68wYefs5OKYQeTGTU7nGlmwJ4tUVrYpfXb0Vm-g', b'0', '2026-05-18 18:37:38.524125', 2),
	(117, '2026-05-21 14:40:47.255469', '2026-05-28 14:40:47.247402', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbkBnbWFpbC5jb20iLCJpYXQiOjE3NzkzNzQ0NDcsImV4cCI6MTc3OTk3OTI0N30.I7L584lua2n1QoRrH1TaeYMgvhhxMG6lmsX-tvkEEGk', b'0', '2026-05-21 14:40:47.255469', 3),
	(118, '2026-05-21 14:45:25.561125', '2026-05-28 14:45:25.560124', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwYXRpZW50QGdtYWlsLmNvbSIsImlhdCI6MTc3OTM3NDcyNSwiZXhwIjoxNzc5OTc5NTI1fQ.xrsbZjyKIk6o0B_o8QjQTDRna720aCxbeU-L-xRld1U', b'0', '2026-05-21 14:45:25.561125', 2),
	(119, '2026-05-21 14:47:17.920373', '2026-05-28 14:47:17.920373', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwYXRpZW50QGdtYWlsLmNvbSIsImlhdCI6MTc3OTM3NDgzNywiZXhwIjoxNzc5OTc5NjM3fQ.ja4aNKJv9hsWdGj7HoKeHg66qaCj77ymwKxh__xiaBM', b'0', '2026-05-21 14:47:17.920373', 2),
	(120, '2026-05-21 14:56:06.499390', '2026-05-28 14:56:06.499390', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwaGF2b0BnbWFpbC5jb20iLCJpYXQiOjE3NzkzNzUzNjYsImV4cCI6MTc3OTk4MDE2Nn0.Ydg8Nl2l-KODKbE-_yARotdah8AH_WOXoaeyKQpUQ3c', b'0', '2026-05-21 14:56:06.499390', 10),
	(121, '2026-05-21 14:59:23.305203', '2026-05-28 14:59:23.305203', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc5Mzc1NTYzLCJleHAiOjE3Nzk5ODAzNjN9.SfEShyvTbec-5-lGwkjBLHHo1kRTn9nQCcCLaXzdQaI', b'0', '2026-05-21 14:59:23.305203', 4),
	(122, '2026-05-21 15:00:08.234501', '2026-05-28 15:00:08.234501', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwaGF2b0BnbWFpbC5jb20iLCJpYXQiOjE3NzkzNzU2MDgsImV4cCI6MTc3OTk4MDQwOH0.biqD-UPdeayG4Bpn94Doc41Gy_l-IKlDkmLGh8KTAMU', b'0', '2026-05-21 15:00:08.234501', 10),
	(123, '2026-05-21 15:08:19.450357', '2026-05-28 15:08:19.450357', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJodDJAZ21haWwuY29tIiwiaWF0IjoxNzc5Mzc2MDk5LCJleHAiOjE3Nzk5ODA4OTl9.nothmeSIf-xrcFn-3GFnlD-voz9B2vP7vy65CXV2kQc', b'0', '2026-05-21 15:08:19.450357', 11),
	(124, '2026-05-21 15:11:27.832970', '2026-05-28 15:11:27.829840', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwaGF2b0BnbWFpbC5jb20iLCJpYXQiOjE3NzkzNzYyODcsImV4cCI6MTc3OTk4MTA4N30.IK4C1WxWCD5E8zG-eMYYSQtJubXoEgwh7ti43emwPiE', b'0', '2026-05-21 15:11:27.832970', 10),
	(125, '2026-05-21 15:18:12.186801', '2026-05-28 15:18:12.186801', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJodDJAZ21haWwuY29tIiwiaWF0IjoxNzc5Mzc2NjkyLCJleHAiOjE3Nzk5ODE0OTJ9.HHkw829UOSdR7pUAANNe8dHDzREpHq3iDvBoKQMRFuE', b'0', '2026-05-21 15:18:12.186801', 11),
	(126, '2026-05-21 15:20:31.081333', '2026-05-28 15:20:31.081333', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwaGF2b0BnbWFpbC5jb20iLCJpYXQiOjE3NzkzNzY4MzEsImV4cCI6MTc3OTk4MTYzMX0.CtLO9qMzh5C4b0lcstOSTnqagJqSWOshmFukIOu41hI', b'0', '2026-05-21 15:20:31.081333', 10),
	(127, '2026-05-21 15:22:01.595157', '2026-05-28 15:22:01.595157', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJodDJAZ21haWwuY29tIiwiaWF0IjoxNzc5Mzc2OTIxLCJleHAiOjE3Nzk5ODE3MjF9.6P06EJzJuwvbaca3rErVTWVP5Jqdd2paUOPQNcrD5AA', b'0', '2026-05-21 15:22:01.595157', 11),
	(128, '2026-05-21 15:23:36.715058', '2026-05-28 15:23:36.715058', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwaGF2b0BnbWFpbC5jb20iLCJpYXQiOjE3NzkzNzcwMTYsImV4cCI6MTc3OTk4MTgxNn0.vnvATEnkVSQ9Y-rS57Jj6RuEe2srEweERqTznRvQZWI', b'0', '2026-05-21 15:23:36.715058', 10),
	(129, '2026-05-21 15:38:16.851954', '2026-05-28 15:38:16.844879', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbkBnbWFpbC5jb20iLCJpYXQiOjE3NzkzNzc4OTYsImV4cCI6MTc3OTk4MjY5Nn0.zUOc-6oUOCV7xRQGLzdUBKw1MhiLNt90bik69ukKilM', b'0', '2026-05-21 15:38:16.851954', 3),
	(130, '2026-05-21 15:50:49.017390', '2026-05-28 15:50:49.014316', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJodDJAZ21haWwuY29tIiwiaWF0IjoxNzc5Mzc4NjQ5LCJleHAiOjE3Nzk5ODM0NDl9.ucNdoQsKm7ix8Z39HiKzRtZ_s52eo3WJ1KeWjX0qTH8', b'0', '2026-05-21 15:50:49.017390', 11),
	(131, '2026-05-21 17:07:49.620446', '2026-05-28 17:07:49.616795', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwaGF2b0BnbWFpbC5jb20iLCJpYXQiOjE3NzkzODMyNjksImV4cCI6MTc3OTk4ODA2OX0.uaI4_pnh3xo1FHwg5wdEC0QI97d6MPq8JyrU8wPdXis', b'0', '2026-05-21 17:07:49.620446', 10),
	(132, '2026-05-21 17:08:07.615277', '2026-05-28 17:08:07.614798', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJodDJAZ21haWwuY29tIiwiaWF0IjoxNzc5MzgzMjg3LCJleHAiOjE3Nzk5ODgwODd9.a_x4MW2yXsaLpjnjNMvWaohkzCNawDTJB53KNei-lZw', b'0', '2026-05-21 17:08:07.615277', 11),
	(133, '2026-05-21 17:14:02.458948', '2026-05-28 17:14:02.457941', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbkBnbWFpbC5jb20iLCJpYXQiOjE3NzkzODM2NDIsImV4cCI6MTc3OTk4ODQ0Mn0.vDvhG6iCmvSJfpXAhOOo5klkLG6i7wuPBDjkWQt533g', b'0', '2026-05-21 17:14:02.458948', 3),
	(134, '2026-05-21 17:41:11.751691', '2026-05-28 17:41:11.749765', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJodDJAZ21haWwuY29tIiwiaWF0IjoxNzc5Mzg1MjcxLCJleHAiOjE3Nzk5OTAwNzF9.GyawVF2i88B1QA7LUZ9LQoqkzQCzlv0iP2Zb7apwgyw', b'0', '2026-05-21 17:41:11.751691', 11),
	(135, '2026-05-21 17:41:28.359214', '2026-05-28 17:41:28.359214', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbkBnbWFpbC5jb20iLCJpYXQiOjE3NzkzODUyODgsImV4cCI6MTc3OTk5MDA4OH0.fgJktn0mUoEDh6WuXJKoV1unFE1MDtUT0nD-ujHz_yg', b'0', '2026-05-21 17:41:28.359214', 3),
	(136, '2026-05-21 18:06:52.252003', '2026-05-28 18:06:52.250078', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJodDJAZ21haWwuY29tIiwiaWF0IjoxNzc5Mzg2ODEyLCJleHAiOjE3Nzk5OTE2MTJ9.1UnjBw6w8s23atLXanX4u1aidXECm1NlQi_My6scc7w', b'0', '2026-05-21 18:06:52.252003', 11),
	(137, '2026-05-21 18:25:36.095279', '2026-05-28 18:25:36.094286', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc5Mzg3OTM2LCJleHAiOjE3Nzk5OTI3MzZ9.TZRBqqrkuJZure9Q--ICPhCDJTHS-ZFkY32axhoSKuc', b'0', '2026-05-21 18:25:36.095279', 4),
	(138, '2026-05-21 18:28:24.650935', '2026-05-28 18:28:24.650935', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc5Mzg4MTA0LCJleHAiOjE3Nzk5OTI5MDR9.V0V8Z4dPbhphTltkg4Pd7_Rva7rUz-YHL3mPqpz3DcY', b'0', '2026-05-21 18:28:24.650935', 4),
	(139, '2026-05-21 18:50:25.834202', '2026-05-28 18:50:25.833214', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwYXRpZW50QGdtYWlsLmNvbSIsImlhdCI6MTc3OTM4OTQyNSwiZXhwIjoxNzc5OTk0MjI1fQ.eh6bBjthz98AVgHK09FN22nf7dUwwtAq4vF1ma7BH4E', b'0', '2026-05-21 18:50:25.834202', 2),
	(140, '2026-05-21 19:03:49.365547', '2026-05-28 19:03:49.365547', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc5MzkwMjI5LCJleHAiOjE3Nzk5OTUwMjl9.pvP_jgmqKxM1tC7fsemc9Kp2WoY0_482B4WrHUnU9CY', b'0', '2026-05-21 19:03:49.365547', 4),
	(141, '2026-05-21 19:05:16.823326', '2026-05-28 19:05:16.823326', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJodDJAZ21haWwuY29tIiwiaWF0IjoxNzc5MzkwMzE2LCJleHAiOjE3Nzk5OTUxMTZ9.0gmVR2SkEoRyd3qWuPuX_3FIshjNb3VbC6obKrOGc-s', b'0', '2026-05-21 19:05:16.823326', 11),
	(142, '2026-05-22 19:42:30.225272', '2026-05-29 19:42:30.209326', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc5NDc4OTUwLCJleHAiOjE3ODAwODM3NTB9.qFXRiHFs-aq9foZAPDLMKoTLSgMaLP4dpAFRULc_Z84', b'0', '2026-05-22 19:42:30.225272', 4),
	(143, '2026-05-22 19:56:10.781212', '2026-05-29 19:56:10.781212', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJodDJAZ21haWwuY29tIiwiaWF0IjoxNzc5NDc5NzcwLCJleHAiOjE3ODAwODQ1NzB9.lpStbk2QQ8QsaccIdskxTb3Ltdk-LI_OvODrf7bns4Q', b'0', '2026-05-22 19:56:10.781212', 11),
	(144, '2026-05-22 20:08:08.513770', '2026-05-29 20:08:08.513770', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbkBnbWFpbC5jb20iLCJpYXQiOjE3Nzk0ODA0ODgsImV4cCI6MTc4MDA4NTI4OH0.aFJkqwq9AFY9VTWW94c7e_txdHW21V7KfcHiwl1_Dn4', b'0', '2026-05-22 20:08:08.513770', 3),
	(145, '2026-05-23 09:44:02.665503', '2026-05-30 09:44:02.647785', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJodDJAZ21haWwuY29tIiwiaWF0IjoxNzc5NTI5NDQyLCJleHAiOjE3ODAxMzQyNDJ9.VmxLzv4x4J3CozDtMmtYkSHMLTTy_TqRFuCxWmkavVM', b'0', '2026-05-23 09:44:02.665503', 11),
	(146, '2026-05-23 09:47:38.753299', '2026-05-30 09:47:38.740791', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJodDJAZ21haWwuY29tIiwiaWF0IjoxNzc5NTI5NjU4LCJleHAiOjE3ODAxMzQ0NTh9.LjovnBhbWg4tFGhRA8_QGT5OL6SWUj4PrkcQjAndp3o', b'0', '2026-05-23 09:47:38.753299', 11),
	(147, '2026-05-23 09:53:26.607167', '2026-05-30 09:53:26.596503', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJodDJAZ21haWwuY29tIiwiaWF0IjoxNzc5NTMwMDA2LCJleHAiOjE3ODAxMzQ4MDZ9.L2XgbOxBbEkHGuvB7rknjslyhhBTxs_P0ZZSYZGv4Ss', b'0', '2026-05-23 09:53:26.607167', 11),
	(148, '2026-05-23 09:55:56.366825', '2026-05-30 09:55:56.366825', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJodDJAZ21haWwuY29tIiwiaWF0IjoxNzc5NTMwMTU2LCJleHAiOjE3ODAxMzQ5NTZ9.SpxtThMeEDOJgQNdPdUJhql4U5jCIswB0pBLSamtXlM', b'0', '2026-05-23 09:55:56.366825', 11),
	(149, '2026-05-23 09:57:29.319313', '2026-05-30 09:57:29.318337', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJodDJAZ21haWwuY29tIiwiaWF0IjoxNzc5NTMwMjQ5LCJleHAiOjE3ODAxMzUwNDl9.zOWKWbjxV03K1tp4iaYNKe0QVxfP3d99CSM2IKHKTDk', b'0', '2026-05-23 09:57:29.319313', 11),
	(150, '2026-05-23 11:00:48.189959', '2026-05-30 11:00:48.189959', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbkBnbWFpbC5jb20iLCJpYXQiOjE3Nzk1MzQwNDgsImV4cCI6MTc4MDEzODg0OH0.JTmNVHwB3caXch9SHb1NPobnQOv8hpR35CEtispkeOk', b'0', '2026-05-23 11:00:48.189959', 3),
	(151, '2026-05-23 15:57:49.982789', '2026-05-30 15:57:49.963944', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc5NTUxODY5LCJleHAiOjE3ODAxNTY2Njl9.CpqixrVSi3eolGif5Jsa1UNIAopqyBJnuK3UapF3G1Y', b'0', '2026-05-23 15:57:49.982789', 4),
	(152, '2026-05-23 16:00:17.837398', '2026-05-30 16:00:17.835974', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJodDJAZ21haWwuY29tIiwiaWF0IjoxNzc5NTUyMDE3LCJleHAiOjE3ODAxNTY4MTd9.w-hbjpB3DELbQ_Kwb4kYxXLfoFmpQ9EAOhnX_-aZn2w', b'0', '2026-05-23 16:00:17.837398', 11),
	(153, '2026-05-23 16:06:53.439872', '2026-05-30 16:06:53.439872', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJodDJAZ21haWwuY29tIiwiaWF0IjoxNzc5NTUyNDEzLCJleHAiOjE3ODAxNTcyMTN9.5lTlCvwrWyGIyA5OJDFElRxG-HG6ef2xvcS-arbuNxI', b'0', '2026-05-23 16:06:53.439872', 11),
	(154, '2026-05-23 16:12:49.414028', '2026-05-30 16:12:49.405827', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJodDJAZ21haWwuY29tIiwiaWF0IjoxNzc5NTUyNzY5LCJleHAiOjE3ODAxNTc1Njl9.ANMZrSCOQPhaV2dK5PaRuuCRVnlwJSgKbwXjsPo2kDs', b'0', '2026-05-23 16:12:49.414028', 11),
	(155, '2026-05-23 16:13:44.351458', '2026-05-30 16:13:44.350456', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc5NTUyODI0LCJleHAiOjE3ODAxNTc2MjR9.QF24S5DIMi-ONHvtgF1Bbii_Z4mswnLzlAYSTL_AWNg', b'0', '2026-05-23 16:13:44.351458', 4),
	(156, '2026-05-23 16:14:39.073955', '2026-05-30 16:14:39.072958', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbkBnbWFpbC5jb20iLCJpYXQiOjE3Nzk1NTI4NzksImV4cCI6MTc4MDE1NzY3OX0.b87wTwzuepUN4omUBh9k3yIMKj_xDX0qiAr6Cc8Oo3Y', b'0', '2026-05-23 16:14:39.073955', 3),
	(157, '2026-05-23 16:16:54.403935', '2026-05-30 16:16:54.398419', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc5NTUzMDE0LCJleHAiOjE3ODAxNTc4MTR9.843RB0Yfeg5wvikK1FpmCFIp9uxWfJSPuiSkmRk-Nh0', b'0', '2026-05-23 16:16:54.403935', 4),
	(158, '2026-05-23 16:17:21.808762', '2026-05-30 16:17:21.807234', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJodDJAZ21haWwuY29tIiwiaWF0IjoxNzc5NTUzMDQxLCJleHAiOjE3ODAxNTc4NDF9.yv0ZGM2DvhdPYDizie8a5fZsTWKMsGE7FKKV0ydGSRs', b'0', '2026-05-23 16:17:21.808762', 11),
	(159, '2026-05-23 16:20:12.000485', '2026-05-30 16:20:12.000485', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc5NTUzMjEyLCJleHAiOjE3ODAxNTgwMTJ9.2Wixq8CHH31j4KU4CzUSzJHKbwbuTcGPDx4_FuNLdYg', b'0', '2026-05-23 16:20:12.000485', 4),
	(160, '2026-05-24 09:41:36.909623', '2026-05-31 09:41:36.899625', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJodDJAZ21haWwuY29tIiwiaWF0IjoxNzc5NjE1Njk2LCJleHAiOjE3ODAyMjA0OTZ9.4_IZW57GpcmZ5snDa8MzI30XfNGPV4kvMp7dfC0dmkc', b'0', '2026-05-24 09:41:36.909623', 11),
	(161, '2026-05-24 16:17:26.437708', '2026-05-31 16:17:26.414266', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbkBnbWFpbC5jb20iLCJpYXQiOjE3Nzk2Mzk0NDYsImV4cCI6MTc4MDI0NDI0Nn0.OyQ1eSZmxZLVD7uadUreiBpKLTPfAhSFX6DD4U_vePk', b'0', '2026-05-24 16:17:26.437708', 3),
	(162, '2026-05-24 16:18:15.167295', '2026-05-31 16:18:15.167295', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc5NjM5NDk1LCJleHAiOjE3ODAyNDQyOTV9.IrwBOFdHCHDFq42UNpk_wIDX01mFkRaxl04P39mY5-E', b'0', '2026-05-24 16:18:15.167295', 4),
	(163, '2026-05-24 16:20:33.473749', '2026-05-31 16:20:33.472747', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ2b2RhbmdraG9hMDUyNEBnbWFpbC5jb20iLCJpYXQiOjE3Nzk2Mzk2MzMsImV4cCI6MTc4MDI0NDQzM30.-HPkMbSvBd9r8NYrx-ke3B-fKAEWl7YGBenZMWokR-8', b'0', '2026-05-24 16:20:33.473749', 6),
	(164, '2026-05-24 16:21:20.780911', '2026-05-31 16:21:20.779856', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ2b2RhbmdraG9hMDUyNEBnbWFpbC5jb20iLCJpYXQiOjE3Nzk2Mzk2ODAsImV4cCI6MTc4MDI0NDQ4MH0.GapTSpcpVz-kwHKHAPZP90YUtaHOiTM9QomG0W7_nhc', b'0', '2026-05-24 16:21:20.780911', 6),
	(165, '2026-05-24 17:34:59.594409', '2026-05-31 17:34:59.594409', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJodDJAZ21haWwuY29tIiwiaWF0IjoxNzc5NjQ0MDk5LCJleHAiOjE3ODAyNDg4OTl9.B16XlB3ZE05-imgGEGzG4Gc8HxFBBcF4W4HguPSFYNY', b'0', '2026-05-24 17:34:59.594409', 11),
	(166, '2026-05-24 18:42:07.004550', '2026-05-31 18:42:07.004550', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbkBnbWFpbC5jb20iLCJpYXQiOjE3Nzk2NDgxMjcsImV4cCI6MTc4MDI1MjkyN30.YfINtrFs2fxhdZ8l3y8JSwHLmt5SnEgd5fQHkvQublk', b'0', '2026-05-24 18:42:07.004550', 3),
	(167, '2026-05-25 11:38:27.697184', '2026-06-01 11:38:27.681951', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJodDJAZ21haWwuY29tIiwiaWF0IjoxNzc5NzA5MTA3LCJleHAiOjE3ODAzMTM5MDd9.ovEr7EnRWYVehljafa-HZiy16bI5aub3gaGoxQs0Pfw', b'0', '2026-05-25 11:38:27.697184', 11),
	(168, '2026-05-27 07:51:27.979384', '2026-06-03 07:51:27.975185', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJodDJAZ21haWwuY29tIiwiaWF0IjoxNzc5ODY4Mjg3LCJleHAiOjE3ODA0NzMwODd9.wQL0toryzI6bsgdGqgVVrnx_eMBZHNuG0fmMkSFMmCs', b'0', '2026-05-27 07:51:27.979384', 11),
	(169, '2026-05-27 07:57:46.461945', '2026-06-03 07:57:46.461945', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc5ODY4NjY2LCJleHAiOjE3ODA0NzM0NjZ9.yQchTtfdOSozhleJkADpWyACQ-XhidmnN6lfvWKPCf4', b'0', '2026-05-27 07:57:46.461945', 4),
	(170, '2026-05-27 08:04:15.972935', '2026-06-03 08:04:15.972935', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbkBnbWFpbC5jb20iLCJpYXQiOjE3Nzk4NjkwNTUsImV4cCI6MTc4MDQ3Mzg1NX0.O4EjVMa_LaGE80OT8pqNEbZtCPTxlY87sOCBURoqmbg', b'0', '2026-05-27 08:04:15.972935', 3),
	(171, '2026-05-27 08:28:08.472412', '2026-06-03 08:28:08.472412', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwYXRpZW50QGdtYWlsLmNvbSIsImlhdCI6MTc3OTg3MDQ4OCwiZXhwIjoxNzgwNDc1Mjg4fQ.xJ8lOJEniX8bKn6sU4hZxJVXlU8yCWZtfm6dJAMG0qk', b'0', '2026-05-27 08:28:08.472412', 2),
	(172, '2026-05-27 08:47:14.513763', '2026-06-03 08:47:14.505747', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJodDJAZ21haWwuY29tIiwiaWF0IjoxNzc5ODcxNjM0LCJleHAiOjE3ODA0NzY0MzR9.oI-56UJ7wpe0YZ_NtYyQv3QIWiPIJNWFqAKTzUmpVEQ', b'0', '2026-05-27 08:47:14.513763', 11),
	(173, '2026-05-27 08:48:10.422477', '2026-06-03 08:48:10.421494', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JAZ21haWwuY29tIiwiaWF0IjoxNzc5ODcxNjkwLCJleHAiOjE3ODA0NzY0OTB9.1JalXLCIQW3JOhtqVN6mqWheeLi374UAz-vFLRX01K4', b'0', '2026-05-27 08:48:10.422477', 4),
	(174, '2026-05-27 09:36:27.187948', '2026-06-03 09:36:27.181412', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwYXRpZW50QGdtYWlsLmNvbSIsImlhdCI6MTc3OTg3NDU4NywiZXhwIjoxNzgwNDc5Mzg3fQ.OBzLDj5zsosZwS8Ieko3xx8f-wfD_yglLWDuM52DAs4', b'0', '2026-05-27 09:36:27.187948', 2);

-- Dumping structure for table booking_clinic_db.reviews
CREATE TABLE IF NOT EXISTS `reviews` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `comment` text,
  `created_at` datetime(6) DEFAULT NULL,
  `rating` int NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `appointment_id` bigint NOT NULL,
  `doctor_id` bigint NOT NULL,
  `patient_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKvroos1rdslok15k6q2go3p15` (`appointment_id`),
  KEY `FKf940sak3s3i21v956bej9y0ii` (`doctor_id`),
  KEY `FKkg4mbcdlujuf6rsml463et0bh` (`patient_id`),
  CONSTRAINT `FKf940sak3s3i21v956bej9y0ii` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`),
  CONSTRAINT `FKfhaj6kqx2pjpn6eambt0pa1nm` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`),
  CONSTRAINT `FKkg4mbcdlujuf6rsml463et0bh` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table booking_clinic_db.reviews: ~3 rows (approximately)
INSERT INTO `reviews` (`id`, `comment`, `created_at`, `rating`, `updated_at`, `appointment_id`, `doctor_id`, `patient_id`) VALUES
	(1, 'Dich vu tot', '2026-05-01 16:19:39.496597', 4, '2026-05-01 16:24:30.246806', 1, 1, 1),
	(2, 'Bac si tu van rat ky', '2026-05-01 16:35:59.305055', 5, '2026-05-01 16:35:59.305055', 2, 1, 1),
	(3, 'bác sĩ tư vấn rất kỹ', '2026-05-21 15:22:17.787106', 5, '2026-05-21 15:22:17.787106', 19, 2, 7);

-- Dumping structure for table booking_clinic_db.roles
CREATE TABLE IF NOT EXISTS `roles` (
  `id` bigint NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `name` varchar(30) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKofx66keruapi6vyqpv6f2or37` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table booking_clinic_db.roles: ~3 rows (approximately)
INSERT INTO `roles` (`id`, `created_at`, `name`, `updated_at`) VALUES
	(1, '2026-04-30 16:00:33.466785', 'ADMIN', '2026-04-30 16:00:33.466785'),
	(2, '2026-04-30 16:00:33.476252', 'DOCTOR', '2026-04-30 16:00:33.476252'),
	(3, '2026-04-30 16:00:33.477259', 'PATIENT', '2026-04-30 16:00:33.477259');

-- Dumping structure for table booking_clinic_db.specialties
CREATE TABLE IF NOT EXISTS `specialties` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `description` text,
  `name` varchar(100) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKbhb8s9o5hv30lkbidtod9cixc` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table booking_clinic_db.specialties: ~10 rows (approximately)
INSERT INTO `specialties` (`id`, `created_at`, `description`, `name`, `updated_at`) VALUES
	(1, '2026-04-30 16:07:23.880836', 'Chuyên khám, tư vấn và theo dõi các bệnh lý ung thư, u bướu, khối u bất thường, sụt cân không rõ nguyên nhân, đau kéo dài, hạch to, tầm soát ung thư và hỗ trợ điều trị sau chẩn đoán.', 'Ung Thư', '2026-05-18 18:18:15.245193'),
	(2, '2026-04-30 16:07:39.894022', 'Chuyên khám về các vấn đề phụ khoa và sản khoa như rối loạn kinh nguyệt, đau bụng kinh, viêm nhiễm phụ khoa, khí hư bất thường, tư vấn thai kỳ, khám thai, chăm sóc sức khỏe sinh sản và kế hoạch hóa gia đình.', 'Phụ sản', '2026-05-23 11:01:33.818060'),
	(3, '2026-05-18 18:13:30.368432', 'Chuyên khám và tư vấn các vấn đề về tim, đau ngực, khó thở, tim đập nhanh, hồi hộp, huyết áp cao, huyết áp thấp, rối loạn nhịp tim.', 'Tim mạch', '2026-05-18 18:13:30.368432'),
	(4, '2026-05-18 18:13:59.408405', 'Chuyên khám các bệnh về da như nổi mẩn, ngứa da, mụn, viêm da, dị ứng da, phát ban, nấm da.', 'Da liễu', '2026-05-18 18:13:59.408405'),
	(5, '2026-05-18 18:14:21.088371', 'Chuyên khám các triệu chứng ho, đau họng, viêm họng, nghẹt mũi, sổ mũi, ù tai, đau tai, viêm xoang.', 'Tai mũi họng', '2026-05-18 18:14:21.088371'),
	(6, '2026-05-18 18:14:56.971433', 'Chuyên khám các vấn đề đau đầu, chóng mặt, mất ngủ, tê tay chân, co giật, đau nửa đầu, rối loạn thần kinh.', 'Thần kinh', '2026-05-18 18:14:56.971433'),
	(7, '2026-05-18 18:15:29.223103', 'Chuyên khám cho trẻ em, em bé, trẻ sơ sinh với các triệu chứng sốt, ho, đau bụng, tiêu chảy, biếng ăn, phát ban.', 'Nhi khoa', '2026-05-18 18:15:29.223103'),
	(8, '2026-05-18 18:15:36.226540', 'Chuyên khám các bệnh về đường hô hấp như ho kéo dài, khó thở, đau tức ngực, viêm phổi, hen suyễn, viêm phế quản.', 'Hô hấp', '2026-05-18 18:15:36.226540'),
	(9, '2026-05-18 18:15:42.827548', 'Chuyên khám các vấn đề đau bụng, buồn nôn, nôn ói, tiêu chảy, táo bón, đau dạ dày, trào ngược dạ dày, rối loạn tiêu hóa.', 'Tiêu hóa', '2026-05-18 18:15:42.827548'),
	(10, '2026-05-18 18:15:49.434071', 'Chuyên khám đau lưng, đau vai gáy, đau khớp, tê bì tay chân, viêm khớp, thoái hóa khớp, chấn thương xương khớp.', 'Cơ xương khớp', '2026-05-18 18:15:49.434071');

-- Dumping structure for table booking_clinic_db.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `avatar_url` varchar(255) NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `last_otp_request_time` datetime(6) DEFAULT NULL,
  `otp_expiration_time` datetime(6) DEFAULT NULL,
  `otp_failed_attempts` int DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `reset_password_otp` varchar(6) DEFAULT NULL,
  `status` varchar(20) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `role_id` bigint NOT NULL,
  `auth_provider` varchar(20) DEFAULT NULL,
  `facebook_id` varchar(100) DEFAULT NULL,
  `google_id` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK6dotkott2kjsp8vw4d0m25fb7` (`email`),
  KEY `FKp56c1712k691lhsyewcssf40f` (`role_id`),
  CONSTRAINT `FKp56c1712k691lhsyewcssf40f` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table booking_clinic_db.users: ~16 rows (approximately)
INSERT INTO `users` (`id`, `avatar_url`, `created_at`, `email`, `full_name`, `last_otp_request_time`, `otp_expiration_time`, `otp_failed_attempts`, `password`, `phone`, `reset_password_otp`, `status`, `updated_at`, `role_id`, `auth_provider`, `facebook_id`, `google_id`) VALUES
	(1, '', '2026-04-30 16:00:33.633276', 'admin@bookingclinic.local', 'System Admin', NULL, NULL, 0, '$2a$10$Y6tJ.Px0lyzcy4IsMOVTp.YXv6.enc4xgYfqF0YkrtOPUeHw1IMaC', '0900000000', NULL, 'ACTIVE', '2026-04-30 16:00:33.633276', 1, NULL, NULL, NULL),
	(2, 'default-avatar.png', '2026-04-30 16:02:53.595926', 'patient@gmail.com', 'Võ Đăng Khoa', NULL, NULL, 0, '$2a$10$2sctw9mxy/s6BLY1NmFUUuiIZFtf2LdQiGvbqtWoayrZUehr695em', '0901234567', NULL, 'ACTIVE', '2026-05-13 17:32:59.449134', 3, NULL, NULL, NULL),
	(3, 'default-avatar.png', '2026-04-30 16:03:14.607827', 'admin@gmail.com', 'Võ Đăng Khoa', NULL, NULL, 0, '$2a$10$PaLeHrgHq0tXlQTzpysPL.yJ5Iy9oLA4.kOKHWR14JhOge/rLlDEC', '0901234567', NULL, 'ACTIVE', '2026-04-30 16:03:14.607827', 1, NULL, NULL, NULL),
	(4, 'default-avatar.png', '2026-04-30 16:04:11.370953', 'doctor@gmail.com', 'Võ Đăng Khoa', NULL, NULL, 0, '$2a$10$wkkMFuyNI52Glph.1QizjuBsj8ystxTNOTk2nTfKNtXmgQ4UrUZP.', '0901234567', NULL, 'ACTIVE', '2026-04-30 16:08:13.216288', 2, NULL, NULL, NULL),
	(5, 'default-avatar.png', '2026-05-01 16:37:22.851139', 'patient2@gmail.com', 'Võ Đăng Khoa', NULL, NULL, 0, '$2a$10$wvxOGdd.EWx8vtIPDryJcOw49XkeLGlv6P79vn4iJ.JX6aDcxkF7m', '0901234567', NULL, 'ACTIVE', '2026-05-01 16:37:22.851139', 3, NULL, NULL, NULL),
	(6, 'https://lh3.googleusercontent.com/a/ACg8ocIasuwMpaK-niNaEW0bNo2eR8PF7d-OySpCc1asNmv-gkSLkZQo=s96-c', '2026-05-02 15:17:31.823081', 'vodangkhoa0524@gmail.com', 'Đăng Khoa', NULL, NULL, 0, '$2a$10$bIbcb/O5acotqnA0l41nnONjD/dsIWPaisqZ0VmlvLWopY3l8DMi6', '0342637682', NULL, 'ACTIVE', '2026-05-15 16:03:17.763389', 3, NULL, NULL, '101597573936286718210'),
	(7, 'default-avatar.png', '2026-05-12 18:30:57.408620', 'thomasmiule@gmail.com', 'Miu Lê', NULL, NULL, 0, '$2a$10$XQjbGk/V4.XJCPSXGiccF.eBLEq15i8wSAdNYpT5yrhdaCZ4W30kS', '0342637682', NULL, 'ACTIVE', '2026-05-12 18:30:57.408620', 3, NULL, NULL, NULL),
	(8, 'https://lh3.googleusercontent.com/a/ACg8ocJawCqA_bZt8hG-W_ryajcz5iPxt3Vl_9RASRCwmvaBezuYRD8=s96-c', '2026-05-13 07:49:47.323567', 'leomessi01012005@gmail.com', 'Messi Leo', NULL, NULL, 0, '$2a$10$VNVbJwmJu3ZGF/18olyjIelAKi2nJs1fUe5Kr6id04apP9lAbEKgW', '', NULL, 'ACTIVE', '2026-05-13 07:49:47.323567', 3, 'GOOGLE', NULL, '109256498661743328552'),
	(9, 'default-avatar.png', '2026-05-13 07:58:47.960678', 'vodangkhoa@gmail.com', 'Đăng Khoa', NULL, NULL, 0, '$2a$10$xGVhqWItqTc.6O0Y.0AXcufqqqGikqWNtrRmHWL.F7/y5HJA5SE0C', '0342637682', NULL, 'ACTIVE', '2026-05-13 07:58:47.960678', 3, 'LOCAL', NULL, NULL),
	(10, 'default-avatar.png', '2026-05-21 14:56:02.037412', 'phavo@gmail.com', 'Pha Vo', NULL, NULL, 0, '$2a$10$NzdfoMs78a99uwDTosC9iuaiCcEtv4LjsWQPyrQrWptWHgnikxhBG', '0987654321', NULL, 'ACTIVE', '2026-05-21 14:58:19.693306', 2, 'LOCAL', NULL, NULL),
	(11, 'default-avatar.png', '2026-05-21 15:08:14.466690', 'ht2@gmail.com', 'HieuThuHai', NULL, NULL, 0, '$2a$10$SRrW5m.yPK/Vy4jl5Ec6c.xfULiY80/M7tZ45Tik20HgIb7JV3/Ka', '0123412345', NULL, 'ACTIVE', '2026-05-21 15:08:14.466690', 3, 'LOCAL', NULL, NULL),
	(12, 'default-avatar.png', '2026-05-27 08:05:29.370643', 'doctor1@gmail.com', 'Nguyễn Văn A', NULL, NULL, 0, '$2a$10$.1HYKclT/XkdwKQTTmOv0.ESOfy9KGeAipzv5fH6ICrFlwbGpdI9a', '0901234567', NULL, 'ACTIVE', '2026-05-27 08:07:09.689132', 2, 'LOCAL', NULL, NULL),
	(13, 'default-avatar.png', '2026-05-27 08:05:40.447441', 'doctor2@gmail.com', 'Nguyễn Văn B', NULL, NULL, 0, '$2a$10$IA9vNicUH6kJWGr9c0rvq.jfHaQgKIaExQ3LbcEgst60T3PZ3TKr.', '0901234567', NULL, 'ACTIVE', '2026-05-27 08:08:35.638232', 2, 'LOCAL', NULL, NULL),
	(14, 'default-avatar.png', '2026-05-27 08:05:47.134899', 'doctor3@gmail.com', 'Nguyễn Văn C', NULL, NULL, 0, '$2a$10$PMMjRpFP2nggIkE1vIfREuP/g7gz0DAuIwo23RUZMah925vWwaQqW', '0901234567', NULL, 'ACTIVE', '2026-05-27 08:09:55.443010', 2, 'LOCAL', NULL, NULL),
	(15, 'default-avatar.png', '2026-05-27 08:05:54.082122', 'doctor4@gmail.com', 'Nguyễn Văn D', NULL, NULL, 0, '$2a$10$vNhbcbUf1M4Ju0GEAcGDsuMkN2/kbeOzvWTkA4Bbit2INbo9crFEW', '0901234567', NULL, 'ACTIVE', '2026-05-27 08:11:24.829926', 2, 'LOCAL', NULL, NULL),
	(16, 'default-avatar.png', '2026-05-27 08:06:03.951385', 'doctor5@gmail.com', 'Nguyễn Văn F', NULL, NULL, 0, '$2a$10$nCg4pWnVpuxtigJScxxr0ucrj4qtqE8ELfhUNkRTWOx/AV1ujGaFC', '0901234567', NULL, 'ACTIVE', '2026-05-27 08:12:44.225448', 2, 'LOCAL', NULL, NULL);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
