-- DO NOT RUN if testing 'mssql/msnodesqlv8' with a trusted connection.
-- Triggers cause it to fail.
-- Retaining for testing if this ever gets fixed.
CREATE TRIGGER CustomerUpdated ON [Customer]
FOR UPDATE 
AS
DECLARE @CustomerId INT

SELECT @CustomerId = CustomerId FROM INSERTED;

IF NOT UPDATE(ModifiedOn)
    UPDATE [Customer] SET ModifiedOn = GETDATE() WHERE CustomerId = @CustomerId

PRINT 'CustomerUpdated fired'
GO