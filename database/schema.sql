-- Student Registration Portal Database Schema
-- Database: student_portal

CREATE DATABASE IF NOT EXISTS student_portal;

USE student_portal;

CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,

    full_name VARCHAR(100) NOT NULL,
    dob DATE NOT NULL,
    gender VARCHAR(20) NOT NULL,

    profile_photo MEDIUMBLOB,

    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(15) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,

    college VARCHAR(200) NOT NULL,
    course VARCHAR(100) NOT NULL,
    branch VARCHAR(150) NOT NULL,
    semester INT NOT NULL,
    admission_year YEAR NOT NULL,

    password_hash VARCHAR(255) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
