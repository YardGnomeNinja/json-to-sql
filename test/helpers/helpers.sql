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

SELECT IIF (EXISTS (SELECT 1 FROM sys.Objects WHERE object_id = object_id(N'aProcedureName') AND type IN (N'P',N'PC')), 'true', 'false') as 'object_exists'