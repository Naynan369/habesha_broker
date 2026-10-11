-- Pending listings created before listing fees became universal must also complete payment.
UPDATE "Item"
SET "paymentStatus" = 'DUE'
WHERE "status" = 'PENDING'
  AND "paymentStatus" = 'NOT_REQUIRED';
