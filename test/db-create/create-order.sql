-- Create Order
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Order](
	[OrderId] [int] NOT NULL IDENTITY(1,1),
	[CustomerId] [int] NOT NULL,
    [CreatedOn] [datetime] NOT NULL CONSTRAINT DF_CreatedOn DEFAULT GETDATE(),
	[TotalUSD] [decimal](9, 2) NOT NULL,
    CONSTRAINT FK_Customer FOREIGN KEY (CustomerId) REFERENCES [dbo].[Customer](CustomerId),
PRIMARY KEY CLUSTERED 
(
	[OrderId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
