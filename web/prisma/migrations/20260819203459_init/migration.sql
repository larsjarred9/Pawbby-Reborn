-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "avatarUrl" TEXT,
    "weightUnit" TEXT NOT NULL DEFAULT 'kg',
    "webhookUrl" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "timezone" TEXT DEFAULT 'UTC',
    "enableAutomatedBackups" BOOLEAN NOT NULL DEFAULT true,
    "notifyPushVisit" BOOLEAN NOT NULL DEFAULT true,
    "notifyPushAutoClean" BOOLEAN NOT NULL DEFAULT false,
    "notifyPushManualClean" BOOLEAN NOT NULL DEFAULT false,
    "notifyPushEmpty" BOOLEAN NOT NULL DEFAULT false,
    "notifyPushFlatten" BOOLEAN NOT NULL DEFAULT false,
    "notifyPushError" BOOLEAN NOT NULL DEFAULT false,
    "notifyDashVisit" BOOLEAN NOT NULL DEFAULT true,
    "notifyDashAutoClean" BOOLEAN NOT NULL DEFAULT true,
    "notifyDashManualClean" BOOLEAN NOT NULL DEFAULT true,
    "notifyDashEmpty" BOOLEAN NOT NULL DEFAULT true,
    "notifyDashFlatten" BOOLEAN NOT NULL DEFAULT true,
    "notifyDashError" BOOLEAN NOT NULL DEFAULT true,
    "apiKey" TEXT,
    "mqttEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mqttHost" TEXT,
    "mqttPort" INTEGER DEFAULT 1883,
    "mqttUsername" TEXT,
    "mqttPassword" TEXT,
    "mqttBaseTopic" TEXT DEFAULT 'pawbby'
);

-- CreateTable
CREATE TABLE "Pet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "birthDate" TEXT,
    "weight" REAL NOT NULL,
    "imageBase64" TEXT
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'local',
    "deviceId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "localKey" TEXT,
    "tuyaClientId" TEXT,
    "tuyaClientSecret" TEXT,
    "tuyaRegion" TEXT,
    "deodorizerLastReset" DATETIME,
    "deodorizerDuration" INTEGER NOT NULL DEFAULT 30
);

-- CreateTable
CREATE TABLE "LitterEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "petId" TEXT,
    "weight" REAL,
    "duration" INTEGER,
    "type" TEXT NOT NULL,
    "rawData" TEXT,
    "deviceId" TEXT,
    CONSTRAINT "LitterEvent_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
