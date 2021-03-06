-- Create Product
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Product](
	[ProductId] [int] NOT NULL IDENTITY(1,1),
	[Name] [nvarchar](50) NOT NULL,
	[Description] [nvarchar](50) NULL,
	[PriceUSD] [decimal](9, 2) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[ProductId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
