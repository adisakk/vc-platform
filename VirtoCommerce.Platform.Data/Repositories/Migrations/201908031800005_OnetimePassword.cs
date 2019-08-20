namespace VirtoCommerce.Platform.Data.Repositories.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class OnetimePassword : DbMigration
    {
        public override void Up()
        {
            CreateTable(
                "dbo.OnetimePassword",
                c => new
                    {
                        Id = c.String(nullable: false, maxLength: 64),
                        Recipient = c.String(nullable: false, maxLength: 128),
                        Password = c.String(maxLength: 18),
                        AttemptCount = c.Int(nullable: false),
                        MaxAttemptCount = c.Int(nullable: false),
                        CreatedDate = c.DateTime(nullable: false),
                        ModifiedDate = c.DateTime(),
                        CreatedBy = c.String(maxLength: 64),
                        ModifiedBy = c.String(maxLength: 64),
                    })
                .PrimaryKey(t => t.Id);
            
        }
        
        public override void Down()
        {
            DropTable("dbo.OnetimePassword");
        }
    }
}
