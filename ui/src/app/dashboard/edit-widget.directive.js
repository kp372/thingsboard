/*
 * Copyright © 2016-2017 The Thingsboard Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/* eslint-disable import/no-unresolved, import/default */

import entityAliasDialogTemplate from '../entity/alias/entity-alias-dialog.tpl.html';
import editWidgetTemplate from './edit-widget.tpl.html';

/* eslint-enable import/no-unresolved, import/default */

/*@ngInject*/
export default function EditWidgetDirective($compile, $templateCache, types, widgetService, entityService, $q, $document, $mdDialog) {

    var linker = function (scope, element) {
        var template = $templateCache.get(editWidgetTemplate);
        element.html(template);

        scope.$watch('widget', function () {
            if (scope.widget) {
                widgetService.getWidgetInfo(scope.widget.bundleAlias,
                    scope.widget.typeAlias,
                    scope.widget.isSystemType).then(
                    function(widgetInfo) {
                        scope.$applyAsync(function(scope) {
                            scope.widgetConfig = {
                                config: scope.widget.config,
                                layout: scope.widgetLayout
                            };
                            var settingsSchema = widgetInfo.typeSettingsSchema || widgetInfo.settingsSchema;
                            var dataKeySettingsSchema = widgetInfo.typeDataKeySettingsSchema || widgetInfo.dataKeySettingsSchema;
                            scope.isDataEnabled = !widgetInfo.useCustomDatasources;
                            if (!settingsSchema || settingsSchema === '') {
                                scope.settingsSchema = {};
                            } else {
                                scope.settingsSchema = angular.fromJson(settingsSchema);
                            }
                            if (!dataKeySettingsSchema || dataKeySettingsSchema === '') {
                                scope.dataKeySettingsSchema = {};
                            } else {
                                scope.dataKeySettingsSchema = angular.fromJson(dataKeySettingsSchema);
                            }

                            scope.functionsOnly = scope.dashboard ? false : true;

                            scope.theForm.$setPristine();
                        });
                    }
                );
            }
        });

        scope.$watch('widgetLayout', function () {
            if (scope.widgetLayout && scope.widgetConfig) {
                scope.widgetConfig.layout = scope.widgetLayout;
            }
        });

        scope.fetchEntityKeys = function (entityAliasId, query, type) {
            var deferred = $q.defer();
            scope.aliasController.getAliasInfo(entityAliasId).then(
                function success(aliasInfo) {
                    var entity = aliasInfo.currentEntity;
                    if (entity) {
                        entityService.getEntityKeys(entity.entityType, entity.id, query, type).then(
                            function success(keys) {
                                deferred.resolve(keys);
                            },
                            function fail() {
                                deferred.resolve([]);
                            }
                        );
                    } else {
                        deferred.resolve([]);
                    }
                },
                function fail() {
                    deferred.resolve([]);
                }
            );
            return deferred.promise;
        };

        scope.createEntityAlias = function (event, alias, allowedEntityTypes) {

            var deferred = $q.defer();
            var singleEntityAlias = {id: null, alias: alias, filter: {}};

            $mdDialog.show({
                controller: 'EntityAliasDialogController',
                controllerAs: 'vm',
                templateUrl: entityAliasDialogTemplate,
                locals: {
                    isAdd: true,
                    allowedEntityTypes: allowedEntityTypes,
                    entityAliases: scope.dashboard.configuration.entityAliases,
                    alias: singleEntityAlias
                },
                parent: angular.element($document[0].body),
                fullscreen: true,
                skipHide: true,
                targetEvent: event
            }).then(function (singleEntityAlias) {
                scope.dashboard.configuration.entityAliases[singleEntityAlias.id] = singleEntityAlias;
                scope.aliasController.updateEntityAliases(scope.dashboard.configuration.entityAliases);
                deferred.resolve(singleEntityAlias);
            }, function () {
                deferred.reject();
            });

            return deferred.promise;
        };

        $compile(element.contents())(scope);
    }

    return {
        restrict: "E",
        link: linker,
        scope: {
            dashboard: '=',
            aliasController: '=',
            widgetEditMode: '=',
            widget: '=',
            widgetLayout: '=',
            theForm: '='
        }
    };
}
