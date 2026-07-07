CREATE TABLE "PushSubscription" (
    "id"        SERIAL PRIMARY KEY,
    "storeId"   INTEGER NOT NULL,
    "role"      "RoleType" NOT NULL,
    "endpoint"  TEXT NOT NULL UNIQUE,
    "p256dh"    TEXT NOT NULL,
    "auth"      TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PushSubscription_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "SentPushNotification" (
    "id"     SERIAL PRIMARY KEY,
    "taskId" INTEGER NOT NULL,
    "date"   TEXT NOT NULL,
    "type"   TEXT NOT NULL
);

CREATE UNIQUE INDEX "SentPushNotification_taskId_date_type_key" ON "SentPushNotification"("taskId", "date", "type");
