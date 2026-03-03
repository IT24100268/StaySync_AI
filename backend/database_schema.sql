-- SQL Server Database Schema for Room Owner Dashboard

-- Create Database
CREATE DATABASE RoomOwnerDB;
GO

USE RoomOwnerDB;
GO

-- Auth User Table (Django default)
CREATE TABLE auth_user (
    id INT IDENTITY(1,1) PRIMARY KEY,
    password NVARCHAR(128) NOT NULL,
    last_login DATETIME2,
    is_superuser BIT NOT NULL,
    username NVARCHAR(150) NOT NULL UNIQUE,
    first_name NVARCHAR(150),
    last_name NVARCHAR(150),
    email NVARCHAR(254),
    is_staff BIT NOT NULL,
    is_active BIT NOT NULL,
    date_joined DATETIME2 NOT NULL
);

-- Owner Profile Table
CREATE TABLE owners_ownerprofile (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    full_name NVARCHAR(255) NOT NULL,
    phone NVARCHAR(20) NOT NULL,
    nic_passport NVARCHAR(50) NOT NULL UNIQUE,
    address NVARCHAR(MAX) NOT NULL,
    verification_document NVARCHAR(100),
    verification_status NVARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES auth_user(id) ON DELETE CASCADE,
    CHECK (verification_status IN ('pending', 'approved', 'rejected'))
);

-- Listing Table
CREATE TABLE listings_listing (
    id INT IDENTITY(1,1) PRIMARY KEY,
    owner_id INT NOT NULL,
    title NVARCHAR(255) NOT NULL,
    rent DECIMAL(10, 2) NOT NULL,
    deposit DECIMAL(10, 2) NOT NULL,
    room_type NVARCHAR(20) NOT NULL,
    gender_allowed NVARCHAR(20) NOT NULL,
    availability_status NVARCHAR(20) NOT NULL DEFAULT 'available',
    wifi BIT NOT NULL DEFAULT 0,
    water BIT NOT NULL DEFAULT 0,
    electricity BIT NOT NULL DEFAULT 0,
    parking BIT NOT NULL DEFAULT 0,
    attached_bathroom BIT NOT NULL DEFAULT 0,
    ac BIT NOT NULL DEFAULT 0,
    latitude DECIMAL(9, 6),
    longitude DECIMAL(9, 6),
    views_count INT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (owner_id) REFERENCES owners_ownerprofile(id) ON DELETE CASCADE,
    CHECK (room_type IN ('single', 'shared', 'hostel', 'annex')),
    CHECK (gender_allowed IN ('male', 'female', 'mixed')),
    CHECK (availability_status IN ('available', 'unavailable'))
);

-- Listing Photo Table
CREATE TABLE listings_listingphoto (
    id INT IDENTITY(1,1) PRIMARY KEY,
    listing_id INT NOT NULL,
    image NVARCHAR(100) NOT NULL,
    uploaded_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (listing_id) REFERENCES listings_listing(id) ON DELETE CASCADE
);

-- Enquiry Table
CREATE TABLE enquiries_enquiry (
    id INT IDENTITY(1,1) PRIMARY KEY,
    listing_id INT NOT NULL,
    user_name NVARCHAR(255) NOT NULL,
    email NVARCHAR(254) NOT NULL,
    phone NVARCHAR(20) NOT NULL,
    message NVARCHAR(MAX) NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (listing_id) REFERENCES listings_listing(id) ON DELETE CASCADE,
    CHECK (status IN ('pending', 'accepted', 'rejected'))
);

-- Create Indexes for Performance
CREATE INDEX idx_owner_verification ON owners_ownerprofile(verification_status);
CREATE INDEX idx_listing_owner ON listings_listing(owner_id);
CREATE INDEX idx_listing_availability ON listings_listing(availability_status);
CREATE INDEX idx_listing_created ON listings_listing(created_at);
CREATE INDEX idx_photo_listing ON listings_listingphoto(listing_id);
CREATE INDEX idx_enquiry_listing ON enquiries_enquiry(listing_id);
CREATE INDEX idx_enquiry_status ON enquiries_enquiry(status);
CREATE INDEX idx_enquiry_created ON enquiries_enquiry(created_at);
