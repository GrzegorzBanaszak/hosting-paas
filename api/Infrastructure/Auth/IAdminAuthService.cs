using Api.Modules.Auth;

namespace Api.Infrastructure.Auth;

public interface IAdminAuthService
{
    AuthTokenResponse? Login(AdminLoginRequest request);
}
