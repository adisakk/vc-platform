angular.module('platformWebApp')
    .config(['$stateProvider', '$httpProvider', function ($stateProvider, $httpProvider) {

        $stateProvider.state('welcomeDialog',
            {
                url: '/welcome',
                templateUrl: '$(Platform)/Scripts/app/security/gfmarket/welcome.tpl.html',
                controller: [
                    '$scope', 'platformWebApp.authService', 'platformWebApp.externalSignInService', function ($scope, authService, externalSignInService) {
                        externalSignInService.getProviders().then(
                            function (response) {
                                $scope.externalLoginProviders = response.data;
                            });

                        $scope.user = {};
                        $scope.authError = null;
                        $scope.authReason = false;
                        $scope.loginProgress = false;
                        $scope.ok = function () {
                            // Clear any previous security errors
                            $scope.authError = null;
                            $scope.loginProgress = true;
                            // Try to login
                            authService.login($scope.user.email, $scope.user.password, $scope.user.remember).then(
                                function (loggedIn) {
                                    $scope.loginProgress = false;
                                    if (!loggedIn) {
                                        $scope.authError = 'invalidCredentials';
                                    }
                                },
                                function (x) {
                                    $scope.loginProgress = false;
                                    if (angular.isDefined(x.status)) {
                                        if (x.status == 401) {
                                            $scope.authError = 'The login or password is incorrect.';
                                        } else {
                                            $scope.authError = 'Authentication error (code: ' + x.status + ').';
                                        }
                                    } else {
                                        $scope.authError = 'Authentication error ' + x;
                                    }
                                });
                        };
                    }
                ]
            });

        $stateProvider.state('loginDialog',
            {
                url: '/login',
                templateUrl: '$(Platform)/Scripts/app/security/gfmarket/dialogs/loginDialog.tpl.html',
                controller: [
                    '$scope', 'platformWebApp.authService', 'platformWebApp.externalSignInService', function ($scope, authService, externalSignInService) {
                        externalSignInService.getProviders().then(
                            function (response) {
                                $scope.externalLoginProviders = response.data;
                            });

                        $scope.user = {};
                        $scope.authError = null;
                        $scope.authReason = false;
                        $scope.loginProgress = false;
                        $scope.ok = function () {
                            // Clear any previous security errors
                            $scope.authError = null;
                            $scope.loginProgress = true;
                            // Try to login
                            authService.login($scope.user.email, $scope.user.password, $scope.user.remember).then(
                                function (loggedIn) {
                                    $scope.loginProgress = false;
                                    if (!loggedIn) {
                                        $scope.authError = 'invalidCredentials';
                                    }
                                },
                                function (x) {
                                    $scope.loginProgress = false;
                                    if (angular.isDefined(x.status)) {
                                        if (x.status == 401) {
                                            $scope.authError = 'The login or password is incorrect.';
                                        } else {
                                            $scope.authError = 'Authentication error (code: ' + x.status + ').';
                                        }
                                    } else {
                                        $scope.authError = 'Authentication error ' + x;
                                    }
                                });
                        };
                    }
                ]
            });

        $stateProvider.state('verifyDialog',
            {
                url: '/verify',
                templateUrl: '$(Platform)/Scripts/app/security/gfmarket/dialogs/verifyDialog.tpl.html',
                controller: [
                    '$rootScope', '$scope', 'platformWebApp.accounts', function ($rootScope, $scope, accounts) {

                        $scope.user = {};
                        $scope.otpSent = false;
                        $scope.isCountingDown = false;
                        $scope.otpCountdownObj = null;
                        $scope.errorInvalidOtp = false;
                        $scope.verifyOtpSuccess = false;
                        $scope.errorPasswordNotMatched = false;
                        $scope.verifyProgress = false;
                        $scope.verifyPasswordSuccess = false;
                        $scope.isUsernameAlreadyTaken = false;

                        $scope.setOtpCountdown = function () {
                            $scope.isCountingDown = true;
                            // Set the date we're counting down to
                            var countDownDate = new Date().getTime() + 180000; // 3 minutes

                            // Update the count down every 1 second
                            $scope.otpCountdownObj = setInterval(function () {
                                
                                // Get today's date and time
                                var now = new Date().getTime();

                                // Find the distance between now and the count down date
                                var distance = countDownDate - now;

                                var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                                var seconds = Math.floor((distance % (1000 * 60)) / 1000);

                                var display = document.getElementById("otpCountdown");
                                if (display != undefined && (minutes != -1 || seconds != -1)) {
                                    display.innerHTML = minutes + "m " + seconds + "s ";
                                } else {
                                    clearInterval($scope.otpCountdownObj);
                                }
                                
                                // If the count down is over, write some text 
                                if (distance < 0) {
                                    clearInterval($scope.otpCountdownObj);
                                    $scope.isCountingDown = false;
                                    if (!verifyOtpSuccess) {
                                        $scope.otpSent = false;
                                    }
                                }
                            }, 1000);
                        }

                        $scope.sendOtp = function () {
                            $scope.isUsernameAlreadyTaken = false;
                            $scope.verifyProgress = true;
                            $scope.errorInvalidOtp = false;
                            accounts.checkUsernameAvailable({ userName: $scope.user.phone }).$promise.then(
                                function (checkResult) {
                                    console.log(checkResult);
                                    if (checkResult.succeeded) {
                                        accounts.sendSmsOnetimepassword({ phone: $scope.user.phone });
                                        $scope.otpSent = true;
                                        $scope.setOtpCountdown();
                                    } else {
                                        $scope.otpSent = false;
                                        $scope.isUsernameAlreadyTaken = true;
                                    }
                                    $scope.verifyProgress = false;
                                },
                                function (checkError) {
                                    $scope.verifyProgress = false;
                                    console.log(checkError);
                                }
                            );
                        };

                        $scope.verify = function () {
                            $scope.verifyProgress = true;
                            //validate OTP
                            accounts.validateSmsOnetimePassword({ phone: $scope.user.phone, otp: $scope.user.otp.trim() })
                                .$promise.then(
                                    function (response) {
                                        console.log(response);
                                        if (response.succeeded) {
                                            $scope.verifyOtpSuccess = true;
                                        } else if ($scope.verifyOtpSuccess) {

                                        }else {
                                            $scope.errorInvalidOtp = true;
                                        }

                                        //check pasword is matched
                                        if ($scope.user.password == $scope.user.newPassword2) {
                                            $scope.verifyPasswordSuccess = true;

                                        } else {
                                            $scope.errorPasswordNotMatched = true;
                                        }

                                        $scope.verifyProgress = false;
                                        if ($scope.verifyOtpSuccess && $scope.verifyPasswordSuccess) {
                                            clearInterval($scope.otpCountdownObj);
                                            $rootScope.user = $scope.user;
                                            //go to member dialog
                                            $rootScope.openMemberDialog();
                                        }
                                },

                                function (response) {
                                    console.log("Unable to perform get request");
                                    console.log(response);
                                }
                            );
                        };
                    }
                ]
            });

        $stateProvider.state('memberDialog',
            {
                url: '/member',
                templateUrl: '$(Platform)/Scripts/app/security/gfmarket/dialogs/memberDialog.tpl.html',
                controller: [
                    '$rootScope', '$scope', 'platformWebApp.accounts', function ($rootScope, $scope, accounts) {

                        $scope.user = $rootScope.user;
                        propulateDateDropdownOptions($scope);
                        
                        $scope.memberProgress = false;

                        $scope.titles = ['Mr.', 'Ms.', 'Mrs.', 'Miss'];

                        $scope.member = function () {
                            $scope.memberProgress = true;
                            $rootScope.user = $scope.user;
                            $rootScope.openVendorDialog();
                        }
                    }
                ]
            });

        $stateProvider.state('vendorDialog',
            {
                url: '/vendor',
                templateUrl: '$(Platform)/Scripts/app/security/gfmarket/dialogs/vendorDialog.tpl.html',
                controller: [
                    '$rootScope', '$scope', 'platformWebApp.accounts', function ($rootScope, $scope, accounts) {

                        $scope.user = $rootScope.user;
                        propulateDateDropdownOptions($scope);
                        console.log($scope.user);

                        $scope.vendorProgress = false;
                        
                        $scope.vendor = function () {
                            $scope.vendorProgress = true;
                            $scope.user;

                            console.log($scope.user);

                            // Create member profile
                            var objectType = 'VirtoCommerce.Domain.Customer.Model.Contact';
                            var member = {};
                            member.firstName = $scope.user.firstname;
                            member.lastName = $scope.user.lastname;
                            member.fullName = $scope.user.firstname +' '+ $scope.user.lastname;
                            member.emails = [$scope.user.email];
                            member.memberType = 'Contact';

                            var address = {};
                            //address.email = $scope.user.businessEmail;
                            address.line1 = $scope.user.address;
                            address.line2 = $scope.user.address2;
                            address.city = $scope.user.city;
                            address.countryCode = 'THA';
                            address.countryName = 'Thailand';
                            address.postalCode = $scope.user.postalCode;
                            address.addressType = 3; //BillingAndShipping
                            member.addresses = [address];
                            member.createdBy = 'GF.BP.Registrant';
                            member.dynamicProperties = [];
                            
                            // Set birthdate into dynamic properties
                            var birthdate = {};
                            //birthdate.id = 'd9c5d9cf82a44b2ea80363b77f5de4c8';
                            birthdate.name = 'Birthday';
                            var bdValue = $scope.user.birth_day + '/' + $scope.user.birth_month + '/' + $scope.user.birth_year;
                            setDynamicValue(bdValue, 'ShortText', objectType, birthdate, member);

                            // Set title into dynamic properties
                            var title = {};
                            //title.id = 'abbd526fff39409cb9a8b76f08029dca';
                            title.name = 'Title';
                            setDynamicValue($scope.user.title, 'ShortText', objectType, title, member);

                            // Set id number into dynamic properties
                            var idnumber = {};
                            //idnumber.id = '0eb27082906b42009476abc7c9309920';
                            idnumber.name = 'IdNumber';
                            setDynamicValue($scope.user.idcardnumber+'', 'ShortText', objectType, idnumber, member);

                            // Set id card expiry date into dynamic properties
                            var idcardexpiry = {};
                            //idcardexpiry.id = 'd87b2e3623434f7aa7e277fdfe84030e';
                            idcardexpiry.name = 'IdCardExpiryDate';
                            var expiryDate = $scope.user.idcard_expiry_day + '/' + $scope.user.idcard_expiry_month + '/' + $scope.user.idcard_expiry_year;
                            setDynamicValue(expiryDate, 'ShortText', objectType, idcardexpiry, member);

                            // Set vendor name into dynamic properties
                            var vendorName = {};
                            //vendorName.id = '24e13d3243c6446ab1196b0137bee70b';
                            vendorName.name = 'VendorName';
                            setDynamicValue($scope.user.vendorName, 'ShortText', objectType, vendorName, member);

                            // Set company name into dynamic properties
                            var companyName = {};
                            //companyName.id = 'fdfed84db75b4b1e803cabf4ebe8fd68';
                            companyName.name = 'CompanyName';
                            setDynamicValue($scope.user.companyName, 'ShortText', objectType, companyName, member);

                            // Set company registration number into dynamic properties
                            var registrationNumber = {};
                            //registrationNumber.id = '03b4256b32f241cea271b014fd10a555';
                            registrationNumber.name = 'CompanyRegistrationNumber';
                            var regDate = $scope.user.registration_day + '/' + $scope.user.registration_month + '/' + $scope.user.registration_year;
                            setDynamicValue($scope.user.registrationNumber+'', 'ShortText', objectType, registrationNumber, member);


                            // Set company registration date into dynamic properties
                            var registrationDate = {};
                            //registrationDate.id = '946cba9e685747399f425efcf73b50f1';
                            registrationDate.name = 'CompanyRegistrationDate';
                            var regDate = $scope.user.registration_day + '/' + $scope.user.registration_month + '/' + $scope.user.registration_year;
                            setDynamicValue(regDate, 'ShortText', objectType, registrationDate, member);

                            // Set company registration date into dynamic properties
                            var isBusinessPartner = {};
                            //isBusinessPartner.id = '6934a048eaa14133a511f8c53dc4d956';
                            isBusinessPartner.name = 'IsBusinessPartner';
                            setDynamicValue(true, 'Boolean', objectType, isBusinessPartner, member);

                            console.log(member);
                            accounts.createMemberContact(member).$promise.then(
                                function (memberResult) {
                                    console.log(memberResult);

                                    // Create user login
                                    var user = {};
                                    user.memberId = memberResult.id;
                                    user.userName = $scope.user.phone;
                                    user.phoneNumber = $scope.user.phone;
                                    user.phoneNumberConfirmed = true;
                                    //user.storeId
                                    user.password = $scope.user.password;
                                    accounts.register(user).$promise.then(

                                        function (userResult) {
                                            console.log(userResult);
                                            $rootScope.openSucceededDialog();
                                        },

                                        function (userError) {
                                            console.log(userError);
                                            $scope.vendorProgress = false;
                                            $scope.regisError = userError.data.errors[0];
                                        }
                                    );
                                },

                                function (memberError) {
                                    console.log(memberError);
                                    $scope.vendorProgress = false;
                                }
                            );
                            
                        }
                    }
                ]
            });

        $stateProvider.state('profileDialog',
            {
                url: '/profile',
                templateUrl: '$(Platform)/Scripts/app/security/gfmarket/dialogs/profileDialog.tpl.html',
                controller: [
                    '$rootScope', '$scope', 'platformWebApp.accounts', function ($rootScope, $scope, accounts) {
                        
                        accounts.getMemberContact({ id: $rootScope.businessPartnerMemberId }).$promise.then(
                            function (response) {
                                console.log(response);
                                $rootScope.user = {};
                                $rootScope.user.contact = response;
                            },
                            function (error) {
                                console.log(error);
                            }
                        );
                    }
                ]
            });

        $stateProvider.state('uploadDialog',
            {
                url: '/upload',
                templateUrl: '$(Platform)/Scripts/app/security/gfmarket/dialogs/uploadDialog.tpl.html',
                controller: [
                    '$rootScope', '$scope', 'platformWebApp.accounts', 'FileUploader', function ($rootScope, $scope, accounts, FileUploader) {

                        $scope.uploadProgress = false;
                        $scope.uploadSuccessful = false;
                        $scope.uploadFailed = false;

                        $scope.$watch(
                            function () { return $rootScope.user; },
                            function (user) {
                                $scope.user = angular.copy(user);

                                if ($scope.user != undefined) {
                                    $scope.user.changeData = {};
                                    $scope.user.changeData.idPhoto = $scope.user.contact.dynamicProperties.find(function (element) {
                                        return element.name == 'IdPhoto';
                                    });
                                    $scope.user.changeData.certificatePhoto = $scope.user.contact.dynamicProperties.find(function (element) {
                                        return element.name == 'CertificatePhoto';
                                    });
                                    $scope.user.changeData.bankbookPhoto = $scope.user.contact.dynamicProperties.find(function (element) {
                                        return element.name == 'BankbookPhoto';
                                    });
                                    $scope.user.changeData.additional1Photo = $scope.user.contact.dynamicProperties.find(function (element) {
                                        return element.name == 'AdditionalDocument1';
                                    });
                                    $scope.user.changeData.additional2Photo = $scope.user.contact.dynamicProperties.find(function (element) {
                                        return element.name == 'AdditionalDocument2';
                                    });
                                    $scope.user.changeData.additional3Photo = $scope.user.contact.dynamicProperties.find(function (element) {
                                        return element.name == 'AdditionalDocument3';
                                    });
                                }
                            }
                        );

                        $scope.isIdPhotoUploading = false;
                        $scope.isCertificatePhotoUploading = false;
                        $scope.isBankbookPhotoUploading = false;
                        $scope.isAdditional1PhotoUploading = false;
                        $scope.isAdditional2PhotoUploading = false;
                        $scope.isAdditional3PhotoUploading = false;

                        var folderUrl = '/documents/' + $rootScope.businessPartnerId;
                        function initializeUploader() {
                            if (!$scope.uploader) {
                                // Create the uploader
                                var uploader = $scope.uploader = new FileUploader({
                                    scope: $scope,
                                    url: 'api/platform/assets?folderUrl=' + folderUrl,
                                    method: 'POST',
                                    autoUpload: true,
                                    removeAfterUpload: true
                                });

                                uploader.onSuccessItem = function (fileItem, images) {
                                    
                                    if ($scope.isIdPhotoUploading) {
                                        setPropertyImageValue($scope.user.changeData.idPhoto, images);
                                        $scope.isIdPhotoUploading = false;
                                    }

                                    if ($scope.isCertificatePhotoUploading) {
                                        setPropertyImageValue($scope.user.changeData.certificatePhoto, images);
                                        $scope.isCertificatePhotoUploading = false;
                                    }

                                    if ($scope.isBankbookPhotoUploading) {
                                        setPropertyImageValue($scope.user.changeData.bankbookPhoto, images);
                                        $scope.isBankbookPhotoUploading = false;
                                    }

                                    if ($scope.isAdditional1PhotoUploading) {
                                        setPropertyImageValue($scope.user.changeData.additional1Photo, images);
                                        $scope.isAdditional1PhotoUploading = false;
                                    }

                                    if ($scope.isAdditional2PhotoUploading) {
                                        setPropertyImageValue($scope.user.changeData.additional2Photo, images);
                                        $scope.isAdditional2PhotoUploading = false;
                                    }

                                    if ($scope.isAdditional3PhotoUploading) {
                                        setPropertyImageValue($scope.user.changeData.additional3Photo, images);
                                        $scope.isAdditional3PhotoUploading = false;
                                    }
                                    
                                };
                            }
                        }

                        function setPropertyImageValue(prop, images) {
                            var value = {};
                            value.objectId = prop.objectId;
                            value.objectType = prop.objectType;
                            value.value = images[0].url;
                            value.valueType = prop.valueType;
                            prop.values[0] = value;
                        }

                        initializeUploader();
                        
                        $scope.openUrl = function (url) {
                            window.open(url, '_blank');
                        }

                        $scope.saveDocuments = function () {
                            $scope.uploadProgress = true;
                            accounts.updateMemberContact($scope.user.contact).$promise.then(
                                function (response) {
                                    console.log(response);
                                    $scope.uploadSuccessful = true;
                                    $scope.uploadProgress = false;
                                },
                                function (error) {
                                    console.log(error);
                                    $scope.uploadFailed = true;
                                    $scope.uploadProgress = false;
                                }
                            );
                        }
                    }
                ]
            });

        function setDynamicValue(value, valueType, objectType, property, member) {
            property.objectType = objectType;
            property.valueType = valueType;
            var valueObj = {};
            valueObj.objectId = property.objectId;
            valueObj.objectType = objectType;
            valueObj.valueType = valueType;
            valueObj.value = value;
            property.values = [valueObj];
            member.dynamicProperties.push(property);
        }

        function propulateDateDropdownOptions($scope) {
            // Populate dropdown options: days, months, years
            if ($scope.days == undefined) {
                $scope.days = [];
                for (i = 1; i <= 31; i++) {
                    var day = '0' + i;
                    if ($scope.days.length >= 9) {
                        day = '' + i;
                    }
                    $scope.days.push(day);
                }
            }

            if ($scope.months == undefined) {
                $scope.months = [];
                for (i = 1; i <= 12; i++) {
                    var month = '0' + i;
                    if ($scope.months.length >= 9) {
                        month = '' + i;
                    }
                    $scope.months.push(month);
                }
            }

            if ($scope.years == undefined) {
                $scope.years = [];
                var d = new Date();
                var n = d.getFullYear() + 543;
                if (n > 2500) {
                    n -= 543;
                }
                //n -= 100; // age range 1-99 years
                for (i = 0; i <= 100; i++) {
                    var year = '' + (n - i);
                    $scope.years.push(year);
                }
            }

            if ($scope.expiryYears == undefined) {
                $scope.expiryYears = [];
                var d = new Date();
                var n = d.getFullYear() + 543;
                if (n > 2500) {
                    n -= 543;
                }

                for (i = 0; i <= 10; i++) {
                    var year = '' + (n + i);
                    $scope.expiryYears.push(year);
                }
            }
        }

        $stateProvider.state('succeededDialog',
            {
                url: '/succeeded',
                templateUrl: '$(Platform)/Scripts/app/security/gfmarket/dialogs/succeededDialog.tpl.html',
                controller: [
                    '$rootScope', '$scope', function ($rootScope, $scope) {
                        
                    }
                ]
            });

        $stateProvider.state('forgotpasswordDialog',
            {
                url: '/forgotpassword',
                templateUrl: '$(Platform)/Scripts/app/security/dialogs/forgotPasswordDialog.tpl.html',
                controller: [
                    '$scope', 'platformWebApp.authService', '$state', function ($scope, authService, $state) {
                        $scope.viewModel = {};
                        $scope.ok = function () {
                            $scope.isLoading = true;
                            $scope.errorMessage = null;
                            authService.requestpasswordreset($scope.viewModel).then(function (retVal) {
                                $scope.isLoading = false;
                                angular.extend($scope, retVal);
                            });
                        };
                        $scope.close = function () {
                            $state.go('loginDialog');
                        };
                    }
                ]
            });

        $stateProvider.state('resetpasswordDialog', {
            url: '/resetpassword/:userId/{code:.*}',
            templateUrl: '$(Platform)/Scripts/app/security/dialogs/resetPasswordDialog.tpl.html',
            controller: ['$rootScope', '$scope', '$stateParams', 'platformWebApp.authService', function ($rootScope, $scope, $stateParams, authService) {
                $scope.viewModel = $stateParams;
                $scope.isValidToken = true;
                $scope.isLoading = true;
                authService.validatepasswordresettoken($scope.viewModel).then(function (retVal) {
                    $scope.isValidToken = retVal;
                    $scope.isLoading = false;
                }, function (response) {
                    $scope.isLoading = false;
                    $scope.errors = response.data.errors;
                });
                $scope.ok = function () {
                    $scope.errorMessage = null;
                    $scope.isLoading = true;
                    authService.resetpassword($scope.viewModel).then(function(retVal) {
                        $scope.isLoading = false;
                        $rootScope.preventLoginDialog = false;
                        angular.extend($scope, retVal);
                    }, function (response) {
                        $scope.viewModel.newPassword = $scope.viewModel.newPassword2 = undefined;
                        $scope.errors = response.data.errors;
                        $scope.isLoading = false;
                    });
                };
            }]
        })

            .state('workspace.securityModule', {
                url: '/security',
                templateUrl: '$(Platform)/Scripts/common/templates/home.tpl.html',
                controller: ['$scope', 'platformWebApp.bladeNavigationService', function ($scope, bladeNavigationService) {
                    var blade = {
                        id: 'security',
                        title: 'platform.blades.security-main.title',
                        subtitle: 'platform.blades.security-main.subtitle',
                        controller: 'platformWebApp.securityMainController',
                        template: '$(Platform)/Scripts/app/security/blades/security-main.tpl.html',
                        isClosingDisabled: true
                    };
                    bladeNavigationService.showBlade(blade);
                }
                ]
            });

        $stateProvider.state('changePasswordDialog',
            {
                url: '/changepassword',
                templateUrl: '$(Platform)/Scripts/app/security/dialogs/changePasswordDialog.tpl.html',
                params: {
                    onClose: null
                },
                controller: ['$q', '$scope', '$stateParams', 'platformWebApp.accounts', 'platformWebApp.authService', 'platformWebApp.passwordValidationService', function ($q, $scope, $stateParams, accounts, authService, passwordValidationService) {
                    $scope.userName = authService.userName;

                    accounts.get({ id: $stateParams.userName }, function (user) {
                        if (!user || !user.passwordExpired) {
                            $stateParams.onClose();
                        }
                    });

                    $scope.validatePasswordAsync = function(value) {
                        return passwordValidationService.validatePasswordAsync(value);
                    }

                    $scope.postpone = function () {
                        $stateParams.onClose();
                    }

                    $scope.ok = function () {
                        var postData = {
                            NewPassword: $scope.password
                        };
                        accounts.resetCurrentUserPassword(postData, function (data) {
                            $stateParams.onClose();
                        }, function (response) {
                            $scope.errors = response.data.errors;
                        });
                    }
                }]
            });

        $stateProvider.state('changeApiSecretKey',
            {
                url: '/changeapisecretkey',
                templateUrl: '$(Platform)/Scripts/app/security/dialogs/changeApiSecretKeyDialog.tpl.html',
                params: {
                    userName: null,
                    onClose: null
                },
                controller: ['$scope', '$stateParams', 'platformWebApp.accounts', '$state', function ($scope, $stateParams, accounts, $state) {

                    accounts.get({ id: $stateParams.userName }, function (user) {
                        if (user && user.apiAccounts) {
                            var expiredApiAccount = _.find(user.apiAccounts, function (x) { return x.secretKeyExpired; });
                            if (expiredApiAccount) {
                                $scope.user = user;
                                $scope.apiAccount = expiredApiAccount;
                                //Generate new secret key on loading
                                $scope.generate();
                            }
                            else {
                                $stateParams.onClose();
                            }
                        }
                        else {
                            $stateParams.onClose();
                        }
                    });
                    
                    $scope.generate = function () {
                        accounts.generateNewApiKey({}, $scope.apiAccount, function (data) {
                            $scope.apiAccount.secretKey = data.secretKey;
                        });
                    }                  

                    $scope.postpone = function () {
                        $stateParams.onClose();
                    }
                    $scope.save = function () {
                        accounts.update({ }, $scope.user, function() {
                            $stateParams.onClose();
                        }, function(response) {
                            $scope.errors = response.data.errors;
                        });
                    };
                }]
            });
    }])
    .run(['$rootScope', 'platformWebApp.mainMenuService', 'platformWebApp.metaFormsService', 'platformWebApp.widgetService', '$state', 'platformWebApp.authService', 'platformWebApp.setupWizard',
        function ($rootScope, mainMenuService, metaFormsService, widgetService, $state, authService, setupWizard) {
            //Register module in main menu
            var menuItem = {
                path: 'configuration/security',
                icon: 'fa fa-key',
                title: 'platform.menu.security',
                priority: 5,
                action: function () { $state.go('workspace.securityModule'); },
                permission: 'platform:security:access'
            };
            mainMenuService.addMenuItem(menuItem);

            metaFormsService.registerMetaFields("accountDetails",
                [
                    {
                        name: "isAdministrator",
                        title: "platform.blades.account-detail.labels.is-administrator",
                        valueType: "Boolean",
                        priority: 0
                    },
                    {
                        name: "userName",
                        templateUrl: "accountUserName.html",
                        priority: 1,
                        isRequired: true
                    },
                    {
                        name: "email",
                        templateUrl: "accountEmail.html",
                        priority: 2
                    },
                    {
                        name: "accountType",
                        templateUrl: "accountTypeSelector.html",
                        priority: 3
                    },
                    {
                        name: "accountInfo",
                        templateUrl: "accountInfo.html",
                        priority: 4
                    }
                ]);

            //Register widgets
            widgetService.registerWidget({
                controller: 'platformWebApp.accountRolesWidgetController',
                template: '$(Platform)/Scripts/app/security/widgets/accountRolesWidget.tpl.html',
            }, 'accountDetail');
            widgetService.registerWidget({
                controller: 'platformWebApp.accountApiWidgetController',
                template: '$(Platform)/Scripts/app/security/widgets/accountApiWidget.tpl.html',
            }, 'accountDetail');
            widgetService.registerWidget({
                controller: 'platformWebApp.changeLog.operationsWidgetController',
                template: '$(Platform)/Scripts/app/changeLog/widgets/operations-widget.tpl.html'
            }, 'accountDetail');
            widgetService.registerWidget({
                controller: 'platformWebApp.accountAssetsWidgetController',
                template: '$(Platform)/Scripts/app/security/widgets/accountAssetsWidget.tpl.html'
            }, 'accountDetail');

            //register setup wizard step - change admin password
            setupWizard.registerStep({
                state: "changePasswordDialog",
                onClose: function () {
                    var step = setupWizard.findStepByState($state.current.name);
                    setupWizard.showStep(step.nextStep);                    
                },
                priority: 20
            });

            //register setup wizard step - change frontend user  API secret key
            setupWizard.registerStep({
                state: "changeApiSecretKey",
                userName: "frontend",
                onClose: function () {
                    var step = setupWizard.findStepByState($state.current.name);
                    setupWizard.showStep(step.nextStep);
                },
                priority: 30
            });
        }]);
