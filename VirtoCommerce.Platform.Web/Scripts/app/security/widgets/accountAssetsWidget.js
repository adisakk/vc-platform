angular.module('platformWebApp')
.controller('platformWebApp.accountAssetsWidgetController', ['$scope', 'platformWebApp.bladeNavigationService', function ($scope, bladeNavigationService) {

   
    $scope.openBlade = function () {
        var newBlade = {
            id: "accountChildBlade",
            title: $scope.blade.title,
            userId: $scope.blade.currentEntity.id,
            subtitle: 'platform.widgets.accountApi.blade-subtitle',
            controller: 'platformWebApp.userProfile.assetListController',
            template: '$(Platform)/Scripts/app/userProfile/blades/asset-list.tpl.html'
        };
        bladeNavigationService.showBlade(newBlade, $scope.blade);
    };
}]);
