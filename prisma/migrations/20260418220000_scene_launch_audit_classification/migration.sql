-- Machine Guarded Launch Unification: queryable launch classification on audit rows.
ALTER TABLE "SceneLaunchAuditLog" ADD COLUMN "launchClass" TEXT;
ALTER TABLE "SceneLaunchAuditLog" ADD COLUMN "launchSource" TEXT;
ALTER TABLE "SceneLaunchAuditLog" ADD COLUMN "policyMode" TEXT;
ALTER TABLE "SceneLaunchAuditLog" ADD COLUMN "confirmationMode" TEXT;
