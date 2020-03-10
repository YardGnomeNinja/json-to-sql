-- RESET
-- delete from [orderLineItem]
-- DBCC CHECKIDENT ('[orderLineItem]', RESEED, 0)
-- delete from [order]
-- DBCC CHECKIDENT ('[order]', RESEED, 0)
-- delete from [customer]
-- DBCC CHECKIDENT ('[customer]', RESEED, 0)
-- delete from [product]
-- DBCC CHECKIDENT ('[product]', RESEED, 0)

-- SELECT
-- select * from [customer]
-- select * from [product]
-- select * from [order]
-- select * from [orderLineItem]

-- TABLE EXISTS
-- SELECT IIF (EXISTS (SELECT 1 FROM sys.Objects WHERE object_id = object_id(N'<table>') AND type = N'U'), 'true', 'false') as object_exists

-- STORED PROCEDURE EXISTS
-- SELECT IIF (EXISTS (SELECT 1 FROM sys.Objects WHERE object_id = object_id(N'<storedProcedure>') AND type IN (N'P',N'PC')), 'true', 'false') as object_exists
