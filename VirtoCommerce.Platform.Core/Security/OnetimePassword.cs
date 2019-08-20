using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VirtoCommerce.Platform.Core.Common;

namespace VirtoCommerce.Platform.Core.Security
{
    public class OnetimePassword : AuditableEntity
    {
        public string Recipient { get; set; }

        public string Password { get; set; }

        public int AttemptCount { get; set; }

        public int MaxAttemptCount { get; set; }
    }
}
