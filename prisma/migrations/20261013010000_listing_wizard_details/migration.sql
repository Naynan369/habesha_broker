CREATE TYPE "ResidentialPropertyType" AS ENUM (
  'APARTMENT',
  'DETACHED_HOUSE',
  'VILLA',
  'CONDOMINIUM',
  'TOWNHOUSE',
  'LAND',
  'OTHER'
);

CREATE TYPE "FurnishingStatus" AS ENUM (
  'FURNISHED',
  'SEMI_FURNISHED',
  'UNFURNISHED'
);

CREATE TYPE "VehicleFuelType" AS ENUM (
  'PETROL',
  'DIESEL',
  'HYBRID',
  'ELECTRIC',
  'LPG',
  'OTHER'
);

CREATE TYPE "VehicleBodyType" AS ENUM (
  'SEDAN',
  'SUV',
  'HATCHBACK',
  'PICKUP',
  'VAN',
  'MINIBUS',
  'COUPE',
  'WAGON',
  'TRUCK',
  'OTHER'
);

CREATE TYPE "VehicleDriveType" AS ENUM (
  'FWD',
  'RWD',
  'AWD',
  'FOUR_WD',
  'OTHER'
);

ALTER TABLE "House"
  ADD COLUMN "propertyType" "ResidentialPropertyType",
  ADD COLUMN "priceFrequency" "PriceFrequency",
  ADD COLUMN "bedrooms" INTEGER,
  ADD COLUMN "bathrooms" INTEGER,
  ADD COLUMN "floor" INTEGER,
  ADD COLUMN "totalFloors" INTEGER,
  ADD COLUMN "furnishing" "FurnishingStatus",
  ADD COLUMN "subcity" TEXT,
  ADD COLUMN "woreda" TEXT,
  ADD COLUMN "neighborhood" TEXT,
  ADD COLUMN "landmark" TEXT,
  ADD COLUMN "features" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "Car"
  ADD COLUMN "fuelType" "VehicleFuelType",
  ADD COLUMN "bodyType" "VehicleBodyType",
  ADD COLUMN "driveType" "VehicleDriveType",
  ADD COLUMN "mileage" INTEGER,
  ADD COLUMN "seats" INTEGER,
  ADD COLUMN "doors" INTEGER,
  ADD COLUMN "region" TEXT,
  ADD COLUMN "city" TEXT,
  ADD COLUMN "subcity" TEXT,
  ADD COLUMN "neighborhood" TEXT,
  ADD COLUMN "landmark" TEXT,
  ADD COLUMN "features" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
