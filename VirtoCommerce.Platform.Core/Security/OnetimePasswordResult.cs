namespace VirtoCommerce.Platform.Core.Security
{
    public class OnetimePasswordResult
    {
        public string Password { get; set; }

        public OnetimePasswordResult(string password)
        {
            Password = password;
        }
        
    }
}
