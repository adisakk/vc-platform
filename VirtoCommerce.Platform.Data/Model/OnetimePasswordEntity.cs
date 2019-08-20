using System;
using System.ComponentModel.DataAnnotations;
using VirtoCommerce.Platform.Core.Common;
using VirtoCommerce.Platform.Core.Security;

namespace VirtoCommerce.Platform.Data.Model
{
    public class OnetimePasswordEntity : AuditableEntity
    {
        [StringLength(128)]
        [Required]
        public string Recipient { get; set; }

        [StringLength(18)]
        public string Password { get; set; }

        public int AttemptCount { get; set; }

        public int MaxAttemptCount { get; set; }

        public virtual OnetimePasswordEntity FromModel(OnetimePassword otp, PrimaryKeyResolvingMap pkMap)
        {
            if (otp == null)
            {
                throw new ArgumentNullException(nameof(otp));
            }

            pkMap.AddPair(otp, this);

            Id = otp.Id;
            CreatedDate = otp.CreatedDate;
            CreatedBy = otp.CreatedBy;
            ModifiedDate = otp.ModifiedDate;
            ModifiedBy = otp.ModifiedBy;

            Recipient = otp.Recipient;
            Password = otp.Password;
            AttemptCount = otp.AttemptCount;
            MaxAttemptCount = otp.MaxAttemptCount;

            return this;
        }
    }
}
