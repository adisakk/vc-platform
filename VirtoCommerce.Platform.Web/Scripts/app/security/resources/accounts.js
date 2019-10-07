angular.module('platformWebApp')
.factory('platformWebApp.accounts', ['$resource', function ($resource) {
    return $resource('api/platform/security/users/:id', { id: '@Id' }, {
        search: { method: 'POST' },
        generateNewApiAccount: { url: 'api/platform/security/apiaccounts/new' },
        generateNewApiKey: { url: 'api/platform/security/apiaccounts/newKey', method: 'PUT' },
        save: { url: 'api/platform/security/users/create', method: 'POST' },
        changepassword: { url: 'api/platform/security/users/:id/changepassword', method: 'POST' },
        resetPassword: { url: 'api/platform/security/users/:id/resetpassword', method: 'POST' },
        resetCurrentUserPassword: { url: 'api/platform/security/currentuser/resetpassword', method: 'POST' },
        validatePassword: { url: 'api/platform/security/validatepassword', method: 'POST' },
        update: { method: 'PUT' },
        locked: { url: 'api/platform/security/users/:id/locked', method: 'GET' },
        unlock: { url: 'api/platform/security/users/:id/unlock', method: 'POST' },
        register: { url: 'api/platform/security/users/register', method: 'POST' },
        createMemberContact: { url: 'api/members/businesspartner', method: 'POST' },
        getMemberContact: { url: 'api/members/:id', method: 'GET' },
        updateMemberContact: { url: 'api/members', method: 'PUT' },
        sendSmsOnetimepassword: { url: 'api/platform/security/onetimepassword/sms/send', method: 'GET' },
        validateSmsOnetimePassword: { url: 'api/platform/security/onetimepassword/sms/validate', method: 'GET' },
        checkUsernameAvailable: { url: 'api/platform/security/users/:userName/available', method: 'GET' }
    });
}]);
