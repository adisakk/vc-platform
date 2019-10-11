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

                        $scope.timerRunning = false;
                        $scope.startTimer = function () {
                            $scope.$broadcast('timer-start');
                            $scope.timerRunning = true;
                        };

                        $scope.stopTimer = function () {
                            $scope.$broadcast('timer-stop');
                            $scope.timerRunning = false;
                        };

                        $scope.$on('timer-stopped', function (event, data) {
                            console.log('Timer Stopped - data = ', data);
                            $scope.timerRunning = false;
                        });

                        $scope.user = {};
                        $scope.otpSent = false;
                        $scope.otpCountdownEndtime = new Date().getTime();

                        $scope.errorInvalidOtp = false;
                        $scope.verifyOtpSuccess = false;
                        $scope.errorPasswordNotMatched = false;
                        $scope.verifyProgress = false;
                        $scope.verifyPasswordSuccess = false;
                        $scope.isUsernameAlreadyTaken = false;
                        
                        
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
                                        $scope.otpCountdownEndtime = new Date().getTime() + 300000; // 5 minutes
                                        $scope.startTimer();
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
                                            $scope.stopTimer();
                                        } else if ($scope.verifyOtpSuccess) {
                                            // skip
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
                                            $rootScope.openMemberDialog('create');
                                        }
                                },

                                function (response) {
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

                        // edit
                        if ($rootScope.editMemberDetail) {
                            $scope.$watch(
                                function () { return $rootScope.user; },
                                function (user) {
                                    $scope.user = angular.copy(user);

                                    // put member contact detail into form for editing
                                    $scope.user.email = $scope.user.contact.emails != undefined ? $scope.user.contact.emails[0] : null;
                                    $scope.user.title = getDynamicValue('Title', $scope.user.contact);
                                    $scope.user.firstname = $scope.user.contact.firstName;
                                    $scope.user.lastname = $scope.user.contact.lastName;
                                    var bdate = getSeparatedDate(getDynamicValue('Birthday', $scope.user.contact));
                                    $scope.user.birth_day = bdate[0];
                                    $scope.user.birth_month = bdate[1];
                                    $scope.user.birth_year = bdate[2];
                                    $scope.user.idcardnumber = getDynamicValue('IdNumber', $scope.user.contact);
                                    var exdate = getSeparatedDate(getDynamicValue('IdCardExpiryDate', $scope.user.contact));;
                                    $scope.user.idcard_expiry_day = exdate[0];
                                    $scope.user.idcard_expiry_month = exdate[1];
                                    $scope.user.idcard_expiry_year = exdate[2];
                                }
                             );
                        } else {
                            // create
                            $scope.user = $rootScope.user;
                        }
                        
                        propulateDropdownOptions($scope);
                        
                        $scope.memberProgress = false;
                        
                        $scope.member = function () {
                            $scope.memberProgress = true;
                            if ($rootScope.editMemberDetail) {

                                setMemberDetail($scope.user, $scope.user.contact);

                                accounts.updateMemberContact($scope.user.contact).$promise.then(
                                    function (response) {
                                        console.log(response);
                                        $scope.updateSuccessful = true;
                                        $scope.memberProgress = false;
                                    },
                                    function (error) {
                                        console.log(error);
                                        $scope.updateFailed = true;
                                        $scope.memberProgress = false;
                                    }
                                );
                            } else {
                                $rootScope.user = $scope.user;
                                $rootScope.openVendorDialog('create');
                            }
                            
                        }

                        function setMemberDetail(changeData, memberContact) {
                            memberContact.firstName = changeData.firstname;
                            memberContact.lastName = changeData.lastname;
                            memberContact.fullName = changeData.firstname + ' ' + changeData.lastname;
                            memberContact.emails = [];
                            memberContact.emails[0] = changeData.email;
                            setDynamicValue(changeData.idcardnumber, 'IdNumber', memberContact);
                            var bdValue = getCombinedDate(changeData.birth_day, changeData.birth_month, changeData.birth_year);
                            setDynamicValue(bdValue, 'Birthday', memberContact);
                            setDynamicValue(changeData.title, 'Title', memberContact);
                            var idExpiryDate = getCombinedDate(changeData.idcard_expiry_day, changeData.idcard_expiry_month, changeData.idcard_expiry_year);
                            setDynamicValue(idExpiryDate, 'IdCardExpiryDate', memberContact);
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

                        // Edit
                        if ($rootScope.editVendorDetail) {
                            $scope.$watch(
                                function () { return $rootScope.user; },
                                function (user) {
                                    $scope.user = angular.copy(user);

                                    // Set vendor details into form for editing
                                    $scope.user.vendorName = getDynamicValue('VendorName', $scope.user.contact);
                                    $scope.user.companyName = getDynamicValue('CompanyName', $scope.user.contact);
                                    $scope.user.registrationNumber = getDynamicValue('CompanyRegistrationNumber', $scope.user.contact);
                                    var regdate = getSeparatedDate(getDynamicValue('CompanyRegistrationDate', $scope.user.contact));
                                    $scope.user.registration_day = regdate[0];
                                    $scope.user.registration_month = regdate[1];
                                    $scope.user.registration_year = regdate[2];
                                    
                                    if ($scope.user.contact.addresses != undefined && $scope.user.contact.addresses[0] != undefined) {
                                        $scope.user.address = $scope.user.contact.addresses[0].line1;
                                        $scope.user.city = $scope.user.contact.addresses[0].city;
                                        $scope.user.postalCode = $scope.user.contact.addresses[0].postalCode;
                                    }
                                }
                            );
                        } else {
                            // Create
                            $scope.user = $rootScope.user;
                        }

                        propulateDropdownOptions($scope);

                        $scope.vendorProgress = false;
                        
                        $scope.vendor = function () {
                            $scope.vendorProgress = true;
                            
                            // Update
                            if ($rootScope.editVendorDetail) {

                                setVendorDetail($scope.user, $scope.user.contact);
                                console.log($scope.user.contact);
                                accounts.updateMemberContact($scope.user.contact).$promise.then(
                                    function (response) {
                                        console.log(response);
                                        $scope.updateSuccessful = true;
                                        $scope.vendorProgress = false;
                                    },
                                    function (error) {
                                        console.log(error);
                                        $scope.updateFailed = true;
                                        $scope.vendorProgress = false;
                                    }
                                );

                            } else {
                                // Create member contact
                                var objectType = 'VirtoCommerce.Domain.Customer.Model.Contact';
                                var member = {};
                                member.memberType = 'Contact';
                                member.firstName = $scope.user.firstname;
                                member.lastName = $scope.user.lastname;
                                member.fullName = $scope.user.firstname + ' ' + $scope.user.lastname;
                                member.emails = [$scope.user.email];


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
                                var bdValue = getCombinedDate($scope.user.birth_day, $scope.user.birth_month, $scope.user.birth_year);
                                member.dynamicProperties.push(createDynamicObject('Birthday', bdValue, 'ShortText', objectType));

                                // Set title into dynamic properties
                                member.dynamicProperties.push(createDynamicObject('Title', $scope.user.title, 'ShortText', objectType));

                                // Set id card number into dynamic properties
                                member.dynamicProperties.push(createDynamicObject('IdNumber', $scope.user.idcardnumber + '', 'ShortText', objectType));

                                // Set id card expiry date into dynamic properties
                                var expiryDate = getCombinedDate($scope.user.idcard_expiry_day, $scope.user.idcard_expiry_month, $scope.user.idcard_expiry_year);
                                member.dynamicProperties.push(createDynamicObject('IdCardExpiryDate', expiryDate, 'ShortText', objectType));

                                // Set vendor name into dynamic properties
                                member.dynamicProperties.push(createDynamicObject('VendorName', $scope.user.vendorName, 'ShortText', objectType));

                                // Set company name into dynamic properties
                                member.dynamicProperties.push(createDynamicObject('CompanyName', $scope.user.companyName, 'ShortText', objectType));

                                // Set company registration number into dynamic properties
                                member.dynamicProperties.push(createDynamicObject('CompanyRegistrationNumber', $scope.user.registrationNumber + '', 'ShortText', objectType));

                                // Set company registration date into dynamic properties
                                var regDate = getCombinedDate($scope.user.registration_day, $scope.user.registration_month, $scope.user.registration_year);
                                member.dynamicProperties.push(createDynamicObject('CompanyRegistrationDate', regDate, 'ShortText', objectType));

                                // Set company registration date into dynamic properties
                                member.dynamicProperties.push(createDynamicObject('IsBusinessPartner', true, 'Boolean', objectType));

                                accounts.createMemberContact(member).$promise.then(
                                    function (memberResult) {

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
                                                //console.log(userResult);
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

                        function setVendorDetail(changeData, memberContact) {
                            setDynamicValue(changeData.vendorName, 'VendorName', memberContact);
                            setDynamicValue(changeData.companyName, 'CompanyName', memberContact);
                            setDynamicValue(changeData.registrationNumber, 'CompanyRegistrationNumber', memberContact);

                            var regValue = getCombinedDate(changeData.registration_day, changeData.registration_month, changeData.registration_year);
                            setDynamicValue(regValue, 'CompanyRegistrationDate', memberContact);
                            
                            $scope.user.contact.addresses[0].line1 = changeData.address;
                            $scope.user.contact.addresses[0].city = changeData.city;
                            $scope.user.contact.addresses[0].postalCode = changeData.postalCode;
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

                        $scope.isDocumentChanged = false;
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

                                    $scope.isDocumentChanged = true;
                                    
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
                            $scope.isDocumentChanged = false;
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

        function getSeparatedDate(date) {
            if (date != undefined) {
                return date.split('/');
            } else {
                return ['', '', ''];
            }
        }

        function getCombinedDate(day, month, year) {
            if (day == undefined) {
                day = '00';
            }
            if (month == undefined) {
                month = '00';
            }
            if (year == undefined) {
                year = '0000';
            }
            return day + '/' + month + '/' + year;
        }

        function getDynamicValue(name, memberContact) {
            
            var prop = getDynamicObject(name, memberContact)

            if (prop != undefined && prop.values != undefined && prop.values[0]) {
                return prop.values[0].value;
            } else {
                return null;
            }
        }

        function getDynamicObject(name, memberContact) {
            return memberContact.dynamicProperties.find(function (element) {
                return element.name == name;
            });
        }

        function setDynamicValue(value, name, memberContact) {
            //console.log(value + ',' + name);
            //console.log(memberContact);
            var property = getDynamicObject(name, memberContact);
            if (property.values[0] != undefined) {
                property.values[0].value = value;
            } else {
                property.values[0] = createDynamicObject(name, value, property.valueType, property.objectType);
            }
            
        }

        function createDynamicObject(name, value, valueType, objectType) {
            //console.log(name + "," + value + "," + valueType + "," + objectType);
            var property = {};
            property.name = name;
            property.objectType = objectType;
            property.valueType = valueType;
            var valueObj = {};
            //valueObj.objectId = property.objectId;
            valueObj.objectType = objectType;
            valueObj.valueType = valueType;
            valueObj.value = value;
            property.values = [valueObj];
            return property;
        }

        function propulateDropdownOptions($scope) {

            // Title
            $scope.titles = ['Mr.', 'Ms.', 'Mrs.', 'Miss'];

            // days, months, years
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
