using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;
using System.Web.Hosting;
using System.Web.Http;
using System.Web.Http.Description;
using VirtoCommerce.Platform.Core.Assets;
using VirtoCommerce.Platform.Core.Common;
using VirtoCommerce.Platform.Core.Security;
using VirtoCommerce.Platform.Core.Web.Assets;
using VirtoCommerce.Platform.Core.Web.Security;
using VirtoCommerce.Platform.Web.Converters.Asset;
using VirtoCommerce.Platform.Web.Swagger;
using webModel = VirtoCommerce.Platform.Web.Model.Asset;

namespace VirtoCommerce.Platform.Web.Controllers.Api
{
    [RoutePrefix("api/platform/assets")]
    public class AssetsController : ApiController
    {
        private readonly string _uploadsUrl = Startup.VirtualRoot + "/App_Data/Uploads/";
        private readonly IBlobStorageProvider _blobProvider;
        private readonly IBlobUrlResolver _urlResolver;

        public AssetsController(IBlobStorageProvider blobProvider, IBlobUrlResolver urlResolver)
        {
            _blobProvider = blobProvider;
            _urlResolver = urlResolver;
        }

        /// <summary>
        /// This method used to upload files on local disk storage in special uploads folder
        /// </summary>
        /// <returns></returns>
        [HttpPost]
        [Route("localstorage")]
        [ResponseType(typeof(BlobInfo[]))]
        [CheckPermission(Permission = PredefinedPermissions.AssetCreate)]
        public async Task<IHttpActionResult> UploadAssetToLocalFileSystem()
        {
            var retVal = new List<BlobInfo>();

            if (!Request.Content.IsMimeMultipartContent())
            {
                throw new HttpResponseException(Request.CreateResponse(HttpStatusCode.NotAcceptable, "This request is not properly formatted"));
            }

            var uploadsPath = HostingEnvironment.MapPath(_uploadsUrl);
            var streamProvider = new CustomMultipartFormDataStreamProvider(uploadsPath);

            await Request.Content.ReadAsMultipartAsync(streamProvider).ContinueWith(t =>
            {
                if (t.IsFaulted || t.IsCanceled)
                    throw new HttpResponseException(HttpStatusCode.InternalServerError);
            });

            foreach (var fileData in streamProvider.FileData)
            {
                var fileName = fileData.Headers.ContentDisposition.FileName.Replace("\"", string.Empty);

                var blobInfo = AbstractTypeFactory<BlobInfo>.TryCreateInstance();
                blobInfo.FileName = fileName;
                blobInfo.Url = VirtualPathUtility.ToAbsolute(_uploadsUrl + fileName);
                blobInfo.ContentType = MimeTypeResolver.ResolveContentType(fileName);
                retVal.Add(blobInfo);
            }

            return Ok(retVal.ToArray());
        }

        /// <summary>
        /// Upload assets to the folder
        /// </summary>
        /// <remarks>
        /// Request body can contain multiple files.
        /// </remarks>
        /// <param name="folderUrl">Parent folder url (relative or absolute).</param>
        /// <param name="url">Url for uploaded remote resource (optional)</param>
        /// <param name="name">File name</param>
        /// <returns></returns>
        [HttpPost]
        [Route("")]
        [ResponseType(typeof(BlobInfo[]))]
        [CheckPermission(Permission = PredefinedPermissions.AssetCreate)]
        [UploadFile]
        public async Task<IHttpActionResult> UploadAsset([FromUri] string folderUrl, [FromUri]string url = null, [FromUri]string name = null)
        {
            if (url == null && !Request.Content.IsMimeMultipartContent())
            {
                throw new HttpResponseException(HttpStatusCode.UnsupportedMediaType);
            }

            var retVal = new List<BlobInfo>();
            if (url != null)
            {
                var fileName = name ?? HttpUtility.UrlDecode(Path.GetFileName(url));
                var fileUrl = folderUrl + "/" + fileName;
                using (var client = new WebClient())
                using (var blobStream = _blobProvider.OpenWrite(fileUrl))
                using (var remoteStream = client.OpenRead(url))
                {
                    remoteStream.CopyTo(blobStream);
                    var blobInfo = AbstractTypeFactory<BlobInfo>.TryCreateInstance();
                    blobInfo.FileName = fileName;
                    blobInfo.RelativeUrl = fileUrl;
                    blobInfo.Url = _urlResolver.GetAbsoluteUrl(fileUrl);
                    retVal.Add(blobInfo);
                }
            }
            else
            {
                var blobMultipartProvider = new BlobStorageMultipartProvider(_blobProvider, _urlResolver, folderUrl);
                
                await Request.Content.ReadAsMultipartAsync(blobMultipartProvider);

                foreach (var blobInfo in blobMultipartProvider.BlobInfos)
                {
                    blobInfo.RelativeUrl = blobInfo.Key;
                    blobInfo.Url = _urlResolver.GetAbsoluteUrl(blobInfo.Key);
                    retVal.Add(blobInfo);
                }
            }

            return Ok(retVal.ToArray());
        }

        /// <summary>
        /// Delete blobs by urls
        /// </summary>
        /// <param name="urls"></param>
        /// <returns></returns>
        [HttpDelete]
        [ResponseType(typeof(void))]
        [Route("")]
        [CheckPermission(Permission = PredefinedPermissions.AssetDelete)]
        public IHttpActionResult DeleteBlobs([FromUri] string[] urls)
        {
            _blobProvider.Remove(urls);

            return StatusCode(HttpStatusCode.NoContent);
        }

        /// <summary>
        /// Search asset folders and blobs
        /// </summary>
        /// <param name="folderUrl"></param>
        /// <param name="keyword"></param>
        /// <returns></returns>
        [HttpGet]
        [ResponseType(typeof(webModel.AssetListItem[]))]
        [Route("")]
        [CheckPermission(Permission = PredefinedPermissions.AssetRead)]
        public IHttpActionResult SearchAssetItems(string folderUrl = null, string keyword = null)
        {
            var result = _blobProvider.Search(folderUrl, keyword);
            return Ok(result.ToWebModel());
        }

        /// <summary>
        /// Create new blob folder
        /// </summary>
        /// <param name="folder"></param>
        /// <returns></returns>
        [HttpPost]
        [ResponseType(typeof(void))]
        [Route("folder")]
        [CheckPermission(Permission = PredefinedPermissions.AssetCreate)]
        public IHttpActionResult CreateBlobFolder(BlobFolder folder)
        {
            _blobProvider.CreateFolder(folder);
            return StatusCode(HttpStatusCode.NoContent);
        }
    }
}
