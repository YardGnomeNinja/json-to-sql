-- Create OrderLineItem
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[OrderLineItem](
	[OrderLineItemId] [int] NOT NULL IDENTITY(1,1),
	[OrderId] [int] NOT NULL,
	[ProductId] [int] NOT NULL,
	[ProductQuantity] [int] NOT NULL,
	[ProductPriceUSD] [decimal](9, 2) NOT NULL,
    CONSTRAINT FK_Order FOREIGN KEY (OrderId) REFERENCES [dbo].[Order](OrderId),
    CONSTRAINT FK_Product FOREIGN KEY (ProductId) REFERENCES [dbo].[Product](ProductId),
PRIMARY KEY CLUSTERED
(
	[OrderLineItemId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
