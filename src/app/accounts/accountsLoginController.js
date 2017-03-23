angular
    .module('bit.accounts')

    .controller('accountsLoginController', function ($scope, $rootScope, $cookies, apiService, cryptoService, authService,
        $state, appSettings, $analytics) {
        var returnState = $state.params.returnState;
        var rememberedEmail = $cookies.get(appSettings.rememberedEmailCookieName);
        if (rememberedEmail) {
            $scope.model = {
                email: rememberedEmail,
                rememberEmail: true
            };
        }

        var email,
            masterPassword;

        $scope.login = function (model) {
            $scope.loginPromise = authService.logIn(model.email, model.masterPassword);

            $scope.loginPromise.then(function (twoFactorProviders) {
                if (model.rememberEmail) {
                    var cookieExpiration = new Date();
                    cookieExpiration.setFullYear(cookieExpiration.getFullYear() + 10);

                    $cookies.put(
                        appSettings.rememberedEmailCookieName,
                        model.email,
                        { expires: cookieExpiration });
                }
                else {
                    $cookies.remove(appSettings.rememberedEmailCookieName);
                }

                if (twoFactorProviders && twoFactorProviders.length > 0) {
                    email = model.email;
                    masterPassword = model.masterPassword;

                    $analytics.eventTrack('Logged In To Two-step');
                    $state.go('frontend.login.twoFactor', { returnState: returnState });
                }
                else {
                    $analytics.eventTrack('Logged In');
                    loggedInGo();
                }
            });
        };

        $scope.twoFactor = function (model) {
            // Only supporting Authenticator (0) provider for now
            $scope.twoFactorPromise = authService.logIn(email, masterPassword, model.code, 0);

            $scope.twoFactorPromise.then(function () {
                $analytics.eventTrack('Logged In From Two-step');
                loggedInGo();
            });
        };

        function loggedInGo() {
            if (returnState) {
                $state.go(returnState.name, returnState.params);
            }
            else {
                $state.go('backend.user.vault');
            }
        }
    });
