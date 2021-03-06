var $ = require("jquery"),
    config = require("core/config"),
    noop = require("core/utils/common").noop,
    domUtils = require("core/utils/dom"),
    angular = require("angular"),
    registerComponent = require("core/component_registrator"),
    DOMComponent = require("core/dom_component"),
    Widget = require("ui/widget/ui.widget"),
    NgTemplate = require("integration/angular/template"),
    CollectionWidget = require("ui/collection/ui.collection_widget.edit");

require("integration/angular");

require("ui/list");
require("ui/button");

var FIXTURE_ELEMENT = function() { return $("#qunit-fixture"); };

var ignoreAngularBrowserDeferTimer = function(args) {
    return args.timerType === "timeouts" && (args.callback.toString().indexOf("delete pendingDeferIds[timeoutId];") > -1 || args.callback.toString().indexOf("delete F[c];e(a)}") > -1);
};

QUnit.module("simple component tests", {
    beforeEach: function() {
        var componentRendered = $.Callbacks();
        var TestComponent = DOMComponent.inherit({
            _render: function() {
                componentRendered.fire();
                return this.callBase.apply(this, arguments);
            },
            _optionChanged: function() {
                this._invalidate();
            },
            _getDefaultOptions: function() {
                return { text: "", array: [], obj: null };
            }
        });

        this.componentRendered = componentRendered;
        this.testApp = angular.module("testApp", ["dx"]);
        this.$container = $("<div/>").appendTo(FIXTURE_ELEMENT());
        this.$controller = $("<div></div>")
            .attr("ng-controller", "my-controller")
            .appendTo(this.$container);

        registerComponent("dxTest", TestComponent);

        QUnit.timerIgnoringCheckers.register(ignoreAngularBrowserDeferTimer);
    },
    afterEach: function() {
        QUnit.timerIgnoringCheckers.unregister(ignoreAngularBrowserDeferTimer);
    }
});

QUnit.test("simple component init", function(assert) {
    var $markup = $("<div></div>")
        .attr("dx-test", "{ text: 'my text' }")
        .appendTo(this.$controller);

    this.testApp.controller("my-controller", function() { });

    angular.bootstrap(this.$container, ["testApp"]);

    var instance = $markup.dxTest("instance"),
        scope = $markup.scope();

    assert.equal(instance.option("text"), "my text");

    assert.strictEqual($markup.scope(), scope);

    assert.ok(!scope.$$watchers);
});

QUnit.test("component options from scope", function(assert) {
    var $markup = $("<div></div>")
            .attr("dx-test", "options")
            .appendTo(this.$controller);

    this.testApp.controller("my-controller", function($scope) {
        $scope.options = {
            text: "my text"
        };
    });

    angular.bootstrap(this.$container, ["testApp"]);

    var instance = $markup.dxTest("instance"),
        scope = $markup.scope();

    assert.equal(instance.option("text"), "my text");

    scope.$apply(function() {
        scope.options.text = "change1";
    });
    assert.equal(instance.option("text"), "my text");

    instance.option("text", "change2");
    assert.equal(scope.options.text, "change1");

    assert.strictEqual($markup.scope(), scope);

    assert.ok(!scope.$$watchers);
});

QUnit.test("component option fields from scope", function(assert) {
    var $markup = $("<div></div>")
            .attr("dx-test", "{ text: vm.text }")
            .appendTo(this.$controller);

    this.testApp.controller("my-controller", function($scope) {
        $scope.vm = {
            text: "my text"
        };
    });

    angular.bootstrap(this.$container, ["testApp"]);

    var instance = $markup.dxTest("instance"),
        scope = $markup.scope();

    assert.equal(instance.option("text"), "my text");

    scope.$apply(function() {
        scope.vm.text = "change1";
    });
    assert.equal(instance.option("text"), "my text");

    instance.option("text", "change2");
    assert.equal(scope.vm.text, "change1");

    assert.strictEqual($markup.scope(), scope);

    assert.ok(!scope.$$watchers);
});

QUnit.test("component with bindingOptions", function(assert) {
    var $markup = $("<div></div>")
            .attr("dx-test", "{ bindingOptions: { text: 'vm.text' } }")
            .appendTo(this.$controller);

    this.testApp.controller("my-controller", function($scope) {
        $scope.vm = {
            text: "my text"
        };
    });

    angular.bootstrap(this.$container, ["testApp"]);

    var instance = $markup.dxTest("instance"),
        scope = $markup.scope();

    assert.equal(instance.option("text"), "my text");

    scope.$apply(function() {
        scope.vm.text = "change1";
    });
    assert.equal(instance.option("text"), "change1");

    instance.option("text", "change2");
    assert.equal(scope.vm.text, "change2");

    assert.strictEqual($markup.scope(), scope);

    assert.equal(scope.$$watchers.length, 1);

    $markup.remove();
    assert.equal(scope.$$watchers.length, 0);
});

QUnit.test("component with bindingOptions and computed binding", function(assert) {
    var $markup = $("<div></div>")
            .attr("dx-test", "{ bindingOptions: { text: 'vm[field]' } }")
            .appendTo(this.$controller);

    this.testApp.controller("my-controller", function($scope) {
        $scope.vm = {
            text: "my text"
        };
        $scope.field = "text";
    });

    angular.bootstrap(this.$container, ["testApp"]);

    var instance = $markup.dxTest("instance"),
        scope = $markup.scope();

    assert.equal(instance.option("text"), "my text");

    scope.$apply(function() {
        scope.vm.text = "change1";
    });
    assert.equal(instance.option("text"), "change1");

    instance.option("text", "change2");
    assert.equal(scope.vm.text, "change2");
});

QUnit.test("component with bindingOptions for nested option", function(assert) {
    var $markup = $("<div></div>")
            .attr("dx-test", "{ obj: { }, bindingOptions: { 'obj.text': 'vm.caption' } }")
            .appendTo(this.$controller);

    this.testApp.controller("my-controller", function($scope) {
        $scope.vm = {
            caption: "my text"
        };
    });

    angular.bootstrap(this.$container, ["testApp"]);

    var instance = $markup.dxTest("instance"),
        scope = $markup.scope();

    assert.equal(instance.option("obj.text"), "my text");

    scope.$apply(function() {
        scope.vm.caption = "change1";
    });
    assert.equal(instance.option("obj.text"), "change1");

    instance.option("obj.text", "change2");
    assert.equal(scope.vm.caption, "change2");
});

QUnit.test("component with bindingOptions from scope", function(assert) {
    var $markup = $("<div></div>")
            .attr("dx-test", "{ bindingOptions: defs }")
            .appendTo(this.$controller);

    this.testApp.controller("my-controller", function($scope) {
        $scope.vm = {
            text: "my text"
        };

        $scope.defs = {
            text: "vm.text"
        };
    });

    angular.bootstrap(this.$container, ["testApp"]);

    var instance = $markup.dxTest("instance"),
        scope = $markup.scope();

    assert.equal(instance.option("text"), "my text");

    scope.$apply(function() {
        scope.vm.text = "change1";
    });
    assert.equal(instance.option("text"), "change1");

    instance.option("text", "change2");
    assert.equal(scope.vm.text, "change2");

    assert.strictEqual($markup.scope(), scope);

    assert.equal(scope.$$watchers.length, 1);

    $markup.remove();
    assert.equal(scope.$$watchers.length, 0);
});

QUnit.test("component with bindingOptions from scope inside sync action (T302197)", function(assert) {
    var $markup = $("<div></div>")
            .attr("dx-test", "{ onInitialized: inited, bindingOptions: defs }")
            .appendTo(this.$controller);

    this.testApp.controller("my-controller", function($scope) {
        $scope.vm = {
            text: "my text"
        };
        $scope.inited = function() {
            $scope.vm.text = "new text";
        };

        $scope.defs = {
            text: "vm.text"
        };
    });

    angular.bootstrap(this.$container, ["testApp"]);

    var instance = $markup.dxTest("instance");

    assert.equal(instance.option("text"), "new text");
});

QUnit.test("component with bindingOptions from scope when invalid value for widget was set (T403775)", function(assert) {
    var TestComponent = DOMComponent.inherit({
        _optionChanged: function(args) {
            this._invalidate();
            if(args.name === "width" && args.value < 0) {
                this.option("width", 0);
            }
        }
    });

    registerComponent("dxTestWithValidatedOption", TestComponent);

    var $markup = $("<div></div>")
            .attr("dx-test-with-validated-option", "{ bindingOptions: { width: 'width' }}")
            .appendTo(this.$controller);

    this.testApp.controller("my-controller", function($scope) {
        $scope.width = 10;
    });

    angular.bootstrap(this.$container, ["testApp"]);

    var instance = $markup.dxTestWithValidatedOption("instance"),
        scope = $markup.scope();

    assert.equal(scope.width, 10);
    assert.equal(instance.option("width"), 10);

    scope.$apply(function() {
        scope.width = -1;
    });

    assert.equal(scope.width, 0);
    assert.equal(instance.option("width"), 0);
});

QUnit.test("bindingOptions can be inherited inside options object (T426046)", function(assert) {
    var $markup = $("<div></div>")
            .attr("dx-test", "config")
            .appendTo(this.$controller);

    this.testApp.controller("my-controller", function($scope) {
        function baseOption() { }

        baseOption.prototype.bindingOptions = {
            text: 'text'
        };

        $scope.config = new baseOption();
        $scope.text = "my text";
    });

    angular.bootstrap(this.$container, ["testApp"]);

    var instance = $markup.dxTest("instance"),
        scope = $markup.scope();

    assert.equal(instance.option("text"), "my text");

    instance.option("text", "change text");
    assert.equal(scope.text, "change text");
});

QUnit.test("bindingOptions fields can be inherited", function(assert) {
    var $markup = $("<div></div>")
            .attr("dx-test", "config")
            .appendTo(this.$controller);

    this.testApp.controller("my-controller", function($scope) {
        function baseOption() { }

        baseOption.prototype.text = 'text';

        $scope.config = {};
        $scope.config.bindingOptions = new baseOption();

        $scope.text = "my text";
    });

    angular.bootstrap(this.$container, ["testApp"]);

    var instance = $markup.dxTest("instance"),
        scope = $markup.scope();

    assert.equal(instance.option("text"), "my text");

    instance.option("text", "change text");
    assert.equal(scope.text, "change text");
});

QUnit.test("repeat binding", function(assert) {
    var $markup = $("<div/>").appendTo(this.$controller),
        scope;

    $markup.append($(
        "<div ng-repeat='item in vm.items'>" +
        "   <div dx-test=\"{ bindingOptions: { text: 'item.text' } }\"></div>" +
        "</div>"
    ));

    this.testApp.controller("my-controller", function($scope) {
        scope = $scope;

        $scope.vm = {
            items: [
                { text: "0" },
                { text: "1" }
            ]
        };
    });

    angular.bootstrap(this.$container, ["testApp"]);

    assert.equal($markup.children().eq(1).children().dxTest("option", "text"), "1");

    scope.$apply(function() {
        scope.vm.items.push({ text: "2" });
    });
    assert.equal($markup.children().eq(2).children().dxTest("option", "text"), "2");

    scope.$apply(function() {
        scope.vm.items.splice(1, 1);
    });
    assert.equal($markup.children().length, 2);

    var $firstElement = $markup.children().eq(1).children(),
        $secondElement = $markup.children().eq(1).children(),
        firstScope = $firstElement.scope(),
        secondScope = $secondElement.scope();

    scope.$apply(function() {
        $markup.remove();
    });

    // NOTE: We can not check if scope.$$watchers.length equals 0 because of known issue with memory leaks with ng-repeat in Angular.

    assert.equal(firstScope.$$watchers.length, 0);
    assert.equal(secondScope.$$watchers.length, 0);
});

QUnit.test("DOMComponent does not control descendant bindings", function(assert) {
    var $markup = $("<div/>").appendTo(this.$controller);

    $markup.append($(
        "<div dx-test>" +
        "   <ul>" +
        "       <li ng-repeat='item in vm.items' ng-bind='item'></li>" +
        "   </ul>" +
        "</div>"
    ));

    this.testApp.controller("my-controller", function($scope) {
        $scope.vm = {
            items: [1, 2, 3]
        };
    });

    angular.bootstrap(this.$container, ["testApp"]);

    var listItems = $markup.find("ul").children();
    assert.equal(listItems.length, 3);
    assert.equal(listItems.text(), "123");
});

QUnit.test("changing a field of bound object changes component option", function(assert) {
    var $markup = $("<div></div>")
            .attr("dx-test", "{ bindingOptions: { obj: 'obj' } }")
            .appendTo(this.$controller),
        optionChanged = false;

    this.testApp.controller("my-controller", function($scope) {
        $scope.obj = {
            a: 42
        };
    });

    angular.bootstrap(this.$container, ["testApp"]);

    var instance = $markup.dxTest("instance"),
        scope = $markup.scope();

    assert.ok(!optionChanged);

    instance.on("optionChanged", function() {
        optionChanged = true;
    });
    scope.$apply(function() {
        scope.obj.a = 43;
    });

    assert.ok(optionChanged);
});

QUnit.test("binding options with deep=true for array option", function(assert) {
    var $markup = $("<div></div>")
            .attr("dx-test", "{ bindingOptions: { items: { deep: true, dataPath: 'dataItems' } } }")
            .appendTo(this.$controller),
        optionChanged = false;

    this.testApp.controller("my-controller", function($scope) {
        $scope.dataItems = [
            { value: 1 },
            { value: 2 },
            { value: 3 }
        ];
    });

    angular.bootstrap(this.$container, ["testApp"]);

    var instance = $markup.dxTest("instance"),
        scope = $markup.scope();

    assert.ok(!optionChanged);

    instance.on("optionChanged", function() {
        optionChanged = true;
    });

    scope.$apply(function() {
        scope.dataItems[0].value = 42;
    });

    assert.ok(optionChanged);
    assert.equal(instance.option('items')[0].value, 42);
});

QUnit.test("binding options with deep=false for array option", function(assert) {
    var $markup = $("<div></div>")
            .attr("dx-test", "{ bindingOptions: { items: { deep: false, dataPath: 'dataItems' } } }")
            .appendTo(this.$controller),
        optionChanged = false;

    this.testApp.controller("my-controller", function($scope) {
        $scope.dataItems = [
            { value: 1 },
            { value: 2 },
            { value: 3 }
        ];
    });

    angular.bootstrap(this.$container, ["testApp"]);

    var instance = $markup.dxTest("instance"),
        scope = $markup.scope();

    assert.ok(!optionChanged);

    instance.on("optionChanged", function() {
        optionChanged = true;
    });

    scope.$apply(function() {
        scope.dataItems[0].value = 42;
    });

    assert.ok(!optionChanged);
    assert.equal(instance.option('items')[0].value, 42);
});

QUnit.test("binding options with deep=true for not array option", function(assert) {
    var $markup = $("<div></div>")
            .attr("dx-test", "{ bindingOptions: { option: { deep: true, dataPath: 'dataValue' } } }")
            .appendTo(this.$controller),
        optionChanged = false;

    this.testApp.controller("my-controller", function($scope) {
        $scope.dataValue = { value: 1 };
    });

    angular.bootstrap(this.$container, ["testApp"]);

    var instance = $markup.dxTest("instance"),
        scope = $markup.scope();

    assert.ok(!optionChanged);

    instance.on("optionChanged", function() {
        optionChanged = true;
    });

    scope.$apply(function() {
        scope.dataValue.value = 42;
    });

    assert.ok(optionChanged);
    assert.equal(instance.option('option').value, 42);
});

QUnit.test("binding options with deep=false for not array option", function(assert) {
    var $markup = $("<div></div>")
            .attr("dx-test", "{ bindingOptions: { text: { deep: false, dataPath: 'dataValue' } } }")
            .appendTo(this.$controller),
        optionChanged = false;

    this.testApp.controller("my-controller", function($scope) {
        $scope.dataValue = { value: 1 };
    });

    angular.bootstrap(this.$container, ["testApp"]);

    var instance = $markup.dxTest("instance"),
        scope = $markup.scope();

    instance.on("optionChanged", function() {
        optionChanged = true;
    });

    scope.$apply(function() {
        scope.dataValue.value = 42;
    });

    assert.ok(!optionChanged);
});

QUnit.test("binding should fired once when option is a plain object", function(assert) {
    if(angular.version.minor < 3) {
        assert.expect(0);
        return;
    }

    var $markup = $("<div></div>")
            .attr("dx-test", "{ bindingOptions: { testOption: 'dataValue' }, onOptionChanged: optionChangedHandler }")
            .appendTo(this.$controller);

    var spy = sinon.spy();

    this.testApp.controller("my-controller", function($scope) {
        $scope.optionChangedHandler = spy;
        $scope.dataValue = { value: 1 };
    });

    angular.bootstrap(this.$container, ["testApp"]);

    var instance = $markup.dxTest("instance");

    spy.reset();
    instance.option("testOption", { value: 2 });

    assert.equal(spy.callCount, 1, "optionChanged action fired once");
});

QUnit.test("dependence options changed when option is a plain object", function(assert) {
    if(angular.version.minor < 3) {
        assert.expect(0);
        return;
    }

    var $widget = $("<div>")
            .attr("dx-test", "{testOption: testOption, bindingOptions: {'testOption.value': 'testOption.value', 'testOption.dependenceValue': 'testOption.dependenceValue' }}")
            .appendTo(this.$controller);

    this.testApp.controller("my-controller", function($scope) {
        $scope.testOption = {
            value: { value: 1 },
            dependenceValue: 0
        };

        $scope.$watch("testOption.value", function() {
            $scope.testOption.dependenceValue++;
        });
    });

    angular.bootstrap(this.$container, ["testApp"]);

    var widget = $widget.dxTest("instance");
    widget.option("testOption.value", { value: 2 });

    assert.equal(widget.option("testOption.dependenceValue"), 2, "dependence option was changed");
});

QUnit.test("option changed fired after value was set in the same value(plain object) then value was updated using angular", function(assert) {
    if(angular.version.minor < 3) {
        assert.expect(0);
        return;
    }

    var $markup = $("<div></div>")
            .attr("dx-test", "{ bindingOptions: { testOption: 'dataValue' }, onOptionChanged: optionChangedHandler }")
            .appendTo(this.$controller);
    var spy = sinon.spy();
    var value = { value: 1 };
    this.testApp.controller("my-controller", function($scope) {
        $scope.optionChangedHandler = spy;
        $scope.dataValue = value;
    });

    angular.bootstrap(this.$container, ["testApp"]);

    var scope = $markup.scope();
    var instance = $markup.dxTest("instance");

    instance.option("testOption", value);

    spy.reset();
    scope.$apply(function() {
        scope.dataValue.value = 3;
    });

    assert.equal(spy.callCount, 1, "optionChanged action fired once");
});

QUnit.test("Variable from scope not re-assign after change the corresponding widget options (T373260)", function(assert) {
    var $markup = $("<div></div>")
            .attr("dx-test", "{ bindingOptions: { option1_widget: 'option1_scope', option2_widget: 'option2_scope' } }")
            .appendTo(this.$controller);

    this.testApp.controller('my-controller', function($scope) {

        Object.defineProperty($scope, "option1_scope", {
            get: function() {
                return $scope.option1;
            },
            set: function(value) {
                $scope.option1 = value;
                $scope.option2 = false;
            }
        });
        Object.defineProperty($scope, "option2_scope", {
            get: function() {
                return $scope.option2;
            },
            set: function(value) {
                assert.ok(false, "this method should not be called");
            }
        });

        $scope.option1 = 1;
        $scope.option2 = true;

    });

    angular.bootstrap(this.$container, ["testApp"]);

    var scope = $markup.scope();
    var instance = $markup.dxTest("instance");

    instance.option("option1_widget", 2);

    assert.equal(scope.option2_scope, false, "binding worked");
    assert.equal(instance.option("option2_widget"), false, "binding worked");
});

QUnit.test("Lockers works correctly when widget options changed using action (T381596)", function(assert) {
    var MyComponent = DOMComponent.inherit({
        _getDefaultOptions: function() {
            return $.extend(this.callBase(), {
                onClick: function(e) {
                    e.component.option("testOption", false);
                }
            });
        },
        emulateAction: function() {
            this._createActionByOption("onClick")();
        }
    });
    registerComponent("dxMyComponent", MyComponent);

    var $markup = $("<div></div>")
            .attr("dx-my-component", "{ bindingOptions: { testOption: 'testOption' } }")
            .appendTo(this.$controller);

    this.testApp.controller("my-controller", function($scope) {
        $scope.testOption = true;

        $scope.changeScopeValue = function() {
            scope.$apply(function() {
                $scope.testOption = true;
            });
        };
    });

    angular.bootstrap(this.$container, ["testApp"]);

    var scope = $markup.scope();
    var instance = $markup.dxMyComponent("instance");

    assert.equal(instance.option("testOption"), true, "binding worked");

    instance.emulateAction();
    assert.equal(instance.option("testOption"), false, "binding worked");

    scope.changeScopeValue();
    assert.equal(instance.option("testOption"), true, "binding worked");
});

// Note: Needed for dxFilterBuilder
QUnit.test("The component should not be rendered more times than it needed", function(assert) {
    var rendered = sinon.stub();
    var MyComponent = DOMComponent.inherit({
        _getDefaultOptions: function() {
            return $.extend(this.callBase(), {
                onClick: function(e) {
                    e.component.skipInvalidation = true;
                    e.component.option("testOption", [ 3, 2, 1 ]);
                }
            });
        },
        _optionChanged: function() {
            if(this.skipInvalidation) {
                this.skipInvalidation = false;
            } else {
                rendered();
                return this.callBase.apply(this, arguments);
            }
        },
        emulateAction: function() {
            this._createActionByOption("onClick")();
        }
    });

    registerComponent("dxMyComponent", MyComponent);

    var $markup = $("<div></div>")
            .attr("dx-my-component", "{ bindingOptions: { testOption: 'testOption' } }")
            .appendTo(this.$controller);

    this.testApp.controller("my-controller", function($scope) {
        $scope.testOption = [ 1, 2, 3 ];
    });

    angular.bootstrap(this.$container, ["testApp"]);

    var instance = $markup.dxMyComponent("instance");

    assert.equal(rendered.callCount, 1);

    instance.emulateAction();
    assert.equal(rendered.callCount, 1);
});

QUnit.test("WrappedAction should return function result (T388034)", function(assert) {
    var MyComponent = DOMComponent.inherit({
        _getDefaultOptions: function() {
            return $.extend(this.callBase(), {
                onTestAction: function(value) {
                    return value.text;
                }
            });
        },
        emulateAction: function() {
            var testAction = this._createActionByOption("onTestAction");
            return testAction({ text: "testText" });
        }
    });
    registerComponent("dxMyComponent", MyComponent);

    var $markup = $("<div></div>")
            .attr("dx-my-component", "{ }")
            .appendTo(this.$controller);

    this.testApp.controller("my-controller", function() { });

    angular.bootstrap(this.$container, ["testApp"]);

    var instance = $markup.dxMyComponent("instance");

    var result = instance.emulateAction();
    assert.equal(result, "testText", "action return function result");
});

QUnit.test("Empty action doesn't call scope.$apply if config.wrapActionsBeforeExecute == true (T514528)", function(assert) {
    var originFlag = config().wrapActionsBeforeExecute;
    config({ wrapActionsBeforeExecute: true });

    var TestDOMComponent = DOMComponent.inherit();
    registerComponent("dxMyComponent", TestDOMComponent);

    var $markup = $("<div></div>")
            .attr("dx-my-component", "{ }")
            .appendTo(this.$controller);

    var applyCount = 0;

    this.testApp.controller("my-controller", function() { });

    angular.bootstrap(this.$container, ["testApp"]);

    var scope = $markup.scope();
    var originApply = scope.$apply;

    scope.$apply = function(fn) {
        applyCount++;
        originApply.bind(fn, scope);
    };

    var instance = $markup.dxMyComponent("instance");
    instance._createActionByOption("onTestAction")();
    assert.equal(applyCount, 0);

    config({ wrapActionsBeforeExecute: false });

    instance._createActionByOption("onTestAction2")();
    assert.equal(applyCount, 1);

    scope.$apply = originApply;
    config({ wrapActionsBeforeExecute: originFlag });
});

QUnit.test("The option should be changed if changes occur before scope.$apply calling", function(assert) {
    var $markup = $("<div></div>")
            .attr("dx-test", "{ bindingOptions: { text: 'text' } }")
            .appendTo(this.$controller);

    this.testApp.controller("my-controller", function($scope) {
        $scope.text = "initial text";
    });

    angular.bootstrap(this.$container, ["testApp"]);

    var instance = $markup.dxTest("instance");
    var scope = $markup.scope();

    assert.equal(instance.option("text"), "initial text");
    assert.equal(scope.text, "initial text");

    scope.text = "change1";
    scope.$apply();
    assert.equal(instance.option("text"), "change1");
    assert.equal(scope.text, "change1");

    instance.option("text", "change2");
    scope.$apply();
    assert.equal(instance.option("text"), "change2");
    assert.equal(scope.text, "change2");

    scope.text = "change3";
    scope.text = "change4";
    scope.$apply();
    assert.equal(instance.option("text"), "change4");
    assert.equal(scope.text, "change4");

    instance.option("text", "change5");
    instance.option("text", "change6");
    scope.$apply();
    assert.equal(instance.option("text"), "change6");
    assert.equal(scope.text, "change6");
});

QUnit.test("The 'release' method shouldn't be called for an unlocked Lock object (T400093)", function(assert) {
    var MyComponent = DOMComponent.inherit({
        _getDefaultOptions: function() {
            return $.extend(this.callBase(), {
                onTestAction: function(args) {
                    args.instance.option("text", "second");
                    args.instance.option("text", "third");
                    args.instance.option("obj.text", "second");
                    args.instance.option("obj.text", "third");
                }
            });
        },
        emulateAction: function() {
            var testAction = this._createActionByOption("onTestAction");
            testAction({ instance: this });
        }
    });
    registerComponent("dxMyComponentWithWrappedAction", MyComponent);

    var $markup = $("<div></div>")
            .attr("dx-my-component-with-wrapped-action", "{ bindingOptions: { text: 'text', obj: 'obj' } }")
            .appendTo(this.$controller);

    this.testApp.controller("my-controller", function($scope) {
        $scope.text = "first";
        $scope.obj = { text: "first" };
    });

    angular.bootstrap(this.$container, ["testApp"]);

    var instance = $markup.dxMyComponentWithWrappedAction("instance"),
        scope = $markup.scope();

    try {
        instance.emulateAction();
        assert.ok(true, "the error is not thrown");
    } catch(e) {
        assert.ok(false, "the error is thrown (The 'release' method was called for an unlocked Lock object)");
    }
    assert.equal(instance.option("text"), "third");
    assert.equal(scope.text, "third");
    assert.equal(instance.option("obj").text, "third");
    assert.equal(scope.obj.text, "third");
});

QUnit.test("Lockers works correctly when method _optionChangedCallbacks occur in external apply phase (T386467)", function(assert) {
    var $markup = $("<div></div>")
        .attr("dx-test", "{ bindingOptions: {text: 'myText'} }")
        .appendTo(this.$controller);

    this.testApp.controller("my-controller", function($scope) {
        $scope.myText = "";
    });

    angular.bootstrap(this.$container, ["testApp"]);

    var instance = $markup.dxTest("instance"),
        scope = $markup.scope();

    scope.$apply(function() {
        try {
            instance.option("text", "testText");
            assert.ok(true, "the error is not thrown");
        } catch(e) {
            assert.ok(false, "the error is thrown");
        }
    });
});

QUnit.test("Lockers works correctly for composite option (T382985)", function(assert) {
    var $markup = $("<div></div>")
            .attr("dx-test", "{ testOption: testOption, bindingOptions: { 'testOption.text': 'testOption.text' } }")
            .appendTo(this.$controller);

    this.testApp.controller('my-controller', function($scope) {
        $scope.testOption = {};
    });

    angular.bootstrap(this.$container, ["testApp"]);

    var scope = $markup.scope();
    var instance = $markup.dxTest("instance");

    scope.$apply(function() {
        scope.testOption.text = "testText";
    });

    assert.equal(instance.option("testOption").text, "testText", "binding worked");

    scope.$apply(function() {
        scope.testOption.text = "";
    });

    assert.equal(instance.option("testOption").text, "", "binding worked");
});

QUnit.test("Lockers works correctly for defineProperty (T396622)", function(assert) {
    var $markup = $("<div></div>")
            .attr("dx-test", "{ bindingOptions: { text: 'publicText' } }")
            .appendTo(this.$controller);

    this.testApp.controller('my-controller', function($scope) {
        $scope.privateText = "test";

        Object.defineProperty($scope, "publicText", {
            get: function() {
                return $scope.privateText;
            },
            set: function(value) {
                $scope.privateText = "calculatedText";
            }
        });
    });

    angular.bootstrap(this.$container, ["testApp"]);

    var scope = $markup.scope();
    var instance = $markup.dxTest("instance");

    assert.equal(instance.option("text"), "test", "binding worked");
    assert.equal(scope.publicText, "test", "binding worked");

    instance.option("text", "test2");

    assert.equal(instance.option("text"), "calculatedText", "binding worked");
    assert.equal(scope.publicText, "calculatedText", "binding worked");
});

QUnit.test("Binding works if options config object added to $scope after bootstrap (T314032)", function(assert) {
    var $markup = $("<div></div>")
        .attr("dx-test", "testSettings")
        .appendTo(this.$controller);

    this.testApp.controller("my-controller", function($scope) {
        $scope.myText = "testText";
    });

    angular.bootstrap(this.$container, ["testApp"]);

    var instance = $markup.dxTest("instance"),
        scope = $markup.scope();

    scope.$apply(function() {
        scope.testSettings = {
            bindingOptions: { text: "myText" }
        };
    });

    assert.equal(instance.option("text"), "testText");

    instance.option("text", "testText2");

    assert.equal(scope.myText, "testText2");
});

QUnit.test("changing several options causes single render", function(assert) {
    var $markup = $("<div></div>")
            .attr("dx-test", "testSettings")
            .appendTo(this.$controller),
        renderedCount = 0;

    this.testApp.controller("my-controller", function($scope) {
        $scope.myText = "testText";
        $scope.myObj = { a: 1 };
        $scope.testSettings = {
            bindingOptions: { text: "myText", obj: "myObj" }
        };
    });

    angular.bootstrap(this.$container, ["testApp"]);

    var scope = $markup.scope();

    this.componentRendered.add(function() {
        renderedCount++;
    });

    scope.$apply(function() {
        scope.myText = "testText 2";
        scope.myObj = { b: 2 };
    });

    assert.equal(renderedCount, 1);
});

QUnit.test("beginUpdate and endUpdate must be called in pairs (T373299)", function(assert) {
    var beginWithoutEnd = 0,
        endWithoutBegin = 0;

    var myComponent = DOMComponent.inherit({
        beginUpdate: function() {
            beginWithoutEnd++;
            this.callBase();
        },
        endUpdate: function() {
            if(beginWithoutEnd === 0) {
                endWithoutBegin++;
            } else {
                beginWithoutEnd--;
            }
            this.callBase();
        }
    });

    registerComponent("dxMytest", myComponent);

    var $markup = $("<div dx-mytest='settings'></div>");
    $markup.appendTo(this.$controller);

    this.testApp.controller("my-controller", function($scope) {
        $scope.myText = "testText";
    });

    angular.bootstrap(this.$container, ["testApp"]);

    var scope = $markup.scope();
    scope.$apply(function() {
        scope.settings = {
            bindingOptions: {
                text: 'myText'
            }
        };
    });

    assert.equal(beginWithoutEnd, 0, "endUpdate was not called without beginUpdate");
    assert.equal(endWithoutBegin, 0, "beginUpdate was not called without endUpdate");
});

QUnit.test("beginUpdate and endUpdate shouldn't fire only once for each apply", function(assert) {
    var beginUpdate = 0,
        endUpdate = 0;

    var myComponent = DOMComponent.inherit({
        beginUpdate: function() {
            beginUpdate++;
            this.callBase();
        },
        endUpdate: function() {
            endUpdate++;
            this.callBase();
        }
    });

    registerComponent("dxMytest", myComponent);

    var $markup = $("<div ng-repeat='item in items'><div dx-mytest='settings' ></div></div>");
    $markup.appendTo(this.$controller);

    var scope;
    this.testApp.controller("my-controller", function($scope) {
        scope = $scope;
        $scope.items = [1];
    });

    angular.bootstrap(this.$container, ["testApp"]);

    var expectedUpdate = 2 * beginUpdate + 1;

    scope.$apply(function() {
        scope.items.push(2);
    });

    assert.equal(beginUpdate, expectedUpdate, "endUpdate was not called without beginUpdate");
    assert.equal(endUpdate, expectedUpdate, "beginUpdate was not called without endUpdate");
});

QUnit.test("Angular component should have 'templatesRenderAsynchronously' option (T351071)", function(assert) {
    var $markup = $("<div></div>")
            .attr("dx-test", "options")
            .appendTo(this.$controller);

    this.testApp.controller("my-controller", function($scope) {
        $scope.options = {};
    });

    angular.bootstrap(this.$container, ["testApp"]);

    var instance = $markup.dxTest("instance");

    assert.ok(instance.option("templatesRenderAsynchronously"), "option should exist");
});

QUnit.test("Angular component should not fire 'triggerResizeEvent' on 'contentReady' event (T351071)", function(assert) {
    this.clock = sinon.useFakeTimers();

    var resizeEventSpy = sinon.spy(domUtils, "triggerResizeEvent");

    var $markup = $("<div></div>")
            .attr("dx-test", "options")
            .appendTo(this.$controller);

    this.testApp.controller("my-controller", function($scope) {
        $scope.options = {};
    });

    angular.bootstrap(this.$container, ["testApp"]);

    var instance = $markup.dxTest("instance");
    instance.fireEvent("contentReady", {});

    this.clock.tick();

    assert.ok(!resizeEventSpy.called);

    this.clock.restore();
});

QUnit.test("options with undefined value should be passed correctly", function(assert) {
    var $markup = $("<div></div>")
        .attr("dx-test", "options")
        .appendTo(this.$controller);

    this.testApp.controller("my-controller", function($scope) {
        $scope.options = {
            text: undefined
        };
    });

    angular.bootstrap(this.$container, ["testApp"]);

    var instance = $markup.dxTest("instance");
    assert.equal(instance.option("text"), undefined, "option is passed correctly");
});

QUnit.test("Binding with several nested options with same parent should work correctly", function(assert) {
    var TestComponentWithDeprecated = DOMComponent.inherit({
        _setDeprecatedOptions: function() {
            this.callBase();

            this._deprecatedOptions['root.deprecated'] = { alias: 'root.child1' };
        }
    });
    registerComponent("dxTestWithDeprecated", TestComponentWithDeprecated);

    var $markup = $("<div>")
        .attr("dx-test-with-deprecated", "{ root: { }, bindingOptions: { 'root.child1': 'prop', 'root.child2': 'prop' } }")
        .appendTo(this.$controller);

    this.testApp.controller("my-controller", function($scope) {
        $scope.prop = true;
    });

    angular.bootstrap(this.$container, ["testApp"]);

    var instance = $markup.dxTestWithDeprecated("instance"),
        scope = $markup.scope();

    scope.$apply(function() {
        scope.prop = false;
    });

    assert.equal(instance.option("root.child1"), false);
    assert.equal(instance.option("root.child2"), false);
});

QUnit.test("Components should not affect on eachother lock engines", function(assert) {
    var needUpdating;
    var TestComponentWithEndUpdateAction = DOMComponent.inherit({
        endUpdate: function() {
            if(needUpdating) {
                needUpdating = false;
                this._createActionByOption("onUpdate")();
            }
            this.callBase.apply(this, arguments);
        }
    });

    registerComponent("dxTestWithAction", TestComponentWithEndUpdateAction);

    var $testElement = $("<div>").attr("dx-test", "{ bindingOptions: { text: 'prop' } }"),
        $badNeighbor = $("<div>").attr("dx-test-with-action", "{ onUpdate: onUpdate }");

    this.$controller.append($badNeighbor).append($testElement);

    this.testApp.controller("my-controller", function($scope) {
        $scope.prop = "value 1";
        $scope.onUpdate = function() {};
    });

    angular.bootstrap(this.$container, ["testApp"]);

    var scope = this.$controller.scope(),
        instance = $testElement.dxTest("instance");

    scope.$apply(function() {
        instance.option("text", "value 2");
        needUpdating = true;
    });

    instance.option("text", "value 3");

    assert.equal(scope.prop, "value 3");
});

QUnit.module("nested Widget with templates enabled", {
    beforeEach: function() {
        var TestContainer = Widget.inherit({

            _getDefaultOptions: function() {
                return $.extend(this.callBase(), {
                    text: ""
                });
            },

            _render: function() {
                var content = $("<div />")
                        .addClass("dx-content")
                        .appendTo(this.$element());

                this.option("integrationOptions.templates")["template"].render({
                    container: content
                });

                var text = this.option("text");
                if(text) {
                    content.append($("<span />").addClass("text-by-option").text(text));
                }
            },

            _renderContentImpl: noop,

            _clean: function() {
                this.$element().empty();
            },

            _optionChanged: function() {
                this._invalidate();
            }

        });

        var TestWidget = Widget.inherit({

            _getDefaultOptions: function() {
                return $.extend(this.callBase(), {
                    text: ""
                });
            },

            _render: function() {
                this.$element().append($("<span />").text(this.option("text")));
            },

            _renderContentImpl: noop,

            _clean: function() {
                this.$element().empty();
            },

            _optionChanged: function() {
                this._invalidate();
            }
        });

        this.testApp = angular.module("testApp", ["dx"]);

        this.$container = $("<div/>").appendTo(FIXTURE_ELEMENT());
        this.$controller = $("<div></div>")
                .attr("ng-controller", "my-controller")
                .appendTo(this.$container);

        registerComponent("dxTestContainer", TestContainer);
        registerComponent("dxTestWidget", TestWidget);

        QUnit.timerIgnoringCheckers.register(ignoreAngularBrowserDeferTimer);
    },
    afterEach: function() {
        QUnit.timerIgnoringCheckers.unregister(ignoreAngularBrowserDeferTimer);
    }
});

QUnit.test("two nested containers", function(assert) {
    var $markup = $(
        "<div class='outerWidget' dx-test-container>" +
            "   <div data-options='dxTemplate: { name: \"template\" }' class='outer-template'>" +
            "       <span ng-bind='vm.outerText'></span>" +
            "       <div class='innerWidget' dx-test-container>" +
            "           <div data-options='dxTemplate: { name: \"template\" }' >" +
            "               <span ng-bind='vm.innerText'></span>" +
            "           </div>" +
            "       </div>" +
            "   </div>" +
            "</div>"
    ).appendTo(this.$controller);

    this.testApp.controller("my-controller", function($scope) {
        $scope.vm = {
            outerText: "outer",
            innerText: "inner"
        };
    });

    angular.bootstrap(this.$container, ["testApp"]);

    var outerWidget = $markup;
    assert.equal(outerWidget.length, 1);

    var outerContent = outerWidget.children().children().children();
    assert.equal(outerContent.length, 2);
    assert.equal(outerContent.filter("span").text(), "outer");

    var innerWidget = outerContent.filter(".innerWidget");
    assert.equal(innerWidget.length, 1);
    assert.equal(innerWidget.find("span").text(), "inner");
});

QUnit.test("Dispose nested containers", function(assert) {
    var $markup = $(
        "<div class='container'>" +
                "<div class='outer' dx-test-container>" +
                    "<div data-options='dxTemplate: { name: \"template\" }'>" +
                        "<div class='inner' dx-test-container>123</div>" +
                    "</div>" +
                "</div>" +
            "</div>"
        ).appendTo(this.$controller);

    this.testApp.controller("my-controller", function($scope) { });

    angular.bootstrap(this.$container, ["testApp"]);

    var outer = $markup.find(".outer").dxTestContainer("instance"),
        inner = $markup.find(".inner").dxTestContainer("instance");

    var outerDisposed = false,
        innerDisposed = false;

    outer.on("disposing", function() {
        outerDisposed = true;
    });

    inner.on("disposing", function() {
        innerDisposed = true;
    });

    outer.$element().remove();
    assert.ok(outerDisposed);
    assert.ok(innerDisposed);
});


QUnit.test("widget inside two nested containers", function(assert) {
    var $markup = $(
        "<div dx-test-container='{ bindingOptions: { text: \"vm.outerText\" } }'>" +
            "   <div class='middle' dx-test-container='{ bindingOptions: { text: \"vm.middleText\" } }'>" +
            "       <div class='inner' dx-test-widget='{ bindingOptions: { text: \"vm.innerText\" } }'></div>" +
            "   </div>" +
            "</div>"
        ).appendTo(this.$controller);

    this.testApp.controller("my-controller", function($scope) {
        $scope.vm = {
            outerText: "outerText",
            middleText: "middleText",
            innerText: "innerText"
        };
    });

    angular.bootstrap(this.$container, ["testApp"]);

    var scope = $markup.scope();

    scope.$apply(function() {
        scope.vm.outerText = "new outerText";
        scope.vm.middleText = "new middleText";
        scope.vm.innerText = "new innerText";
    });

    var outer = $markup;
    assert.equal($.trim(outer.find(".dx-content:first > span").text()), "new outerText");

    var middle = $markup.find(".middle");
    assert.equal($.trim(middle.find(".dx-content:first > span").text()), "new middleText");

    var inner = $markup.find(".inner");
    assert.equal($.trim(inner.find("span").text()), "new innerText");
});

QUnit.test("angular integration don't breaks defaultOptions", function(assert) {
    var TestDOMComponent = DOMComponent.inherit();

    registerComponent("dxTestDOMComponent", TestDOMComponent);

    TestDOMComponent.defaultOptions({
        options: {
            test: "customValue"
        }
    });

    assert.equal(new TestDOMComponent($("<div/>")).option("test"), "customValue", "default option sets correctly");
});

QUnit.test("dynamic templates should be supported by angular", function(assert) {
    var TestContainer = Widget.inherit({
        _renderContentImpl: function(template) {
            this._getTemplateByOption("template").render({
                container: this.$element()
            });
        }
    });

    registerComponent("dxTestContainerEmpty", TestContainer);

    var $markup = $("<div dx-test-container-empty='{ bindingOptions: { template: \"vm.template\" } }'></div>").appendTo(this.$controller);

    this.testApp.controller("my-controller", function($scope) {
        $scope.text = "Test";
        $scope.vm = {
            template: function() {
                return $("<script type=\"text/html\" id=\"scriptTemplate\"><div>{{text}}</div><\/script>");
            }
        };
    });

    angular.bootstrap(this.$container, ["testApp"]);
    assert.equal($.trim($markup.text()), "Test");
});

if(angular.version.minor > 2) {
    QUnit.test("Transclude inside dxComponent template (T318690). Since angularjs 1.3", function(assert) {
        assert.expect(1);
        this.testApp.directive('testDirective', function() {
            return {
                restrict: 'E',
                transclude: true,
                template: "<div dx-test-container>" +
                        "<div data-options='dxTemplate: { name: \"template\" }'>" +
                            "<div ng-transclude></div>" +
                        "</div>" +
                    "</div>"
            };
        });

        var $container = $("<div/>").appendTo(FIXTURE_ELEMENT()),
            $markup = $("<test-directive><div class='transcluded-content'></div></test-directive>").appendTo($container);

        angular.bootstrap($container, ["testApp"]);

        assert.equal($markup.children('[dx-test-container]').find(".transcluded-content").length, 1);
    });
}

QUnit.module("Widget & CollectionWidget with templates enabled", {
    beforeEach: function() {
        this.testApp = angular.module("testApp", ["dx"]);

        QUnit.timerIgnoringCheckers.register(ignoreAngularBrowserDeferTimer);
    },
    afterEach: function() {
        QUnit.timerIgnoringCheckers.unregister(ignoreAngularBrowserDeferTimer);
    }
});

QUnit.test("default NG template is not retrieved for widgets created with angular", function(assert) {
    var TestContainer = Widget.inherit({
        _renderContentImpl: function(template) {
            template = template || this.option("integrationOptions.templates").template;
            if(template) {
                template.render({
                    container: this.$element()
                });
            }
        }
    });

    registerComponent("dxTestContainerEmpty", TestContainer);

    var $markup,
        instance,
        template,
        $container = $("<div/>").appendTo(FIXTURE_ELEMENT());

    // angular scenario
    $markup = $("<div dx-test-container-empty></div>").appendTo($container);
    angular.bootstrap($container, ["testApp"]);

    instance = $markup.dxTestContainerEmpty("instance");
    template = instance._getTemplate("test");
    assert.ok((template instanceof NgTemplate), "default NG template is not retrieved");

    // jquery scenario
    $markup = $("<div></div>")
        .appendTo($container)
        .dxTestContainerEmpty({});
    instance = $markup.dxTestContainerEmpty("instance");
    template = instance._getTemplate("test");
    assert.ok(!(template instanceof NgTemplate), "default NG template not retrieved");
});

QUnit.test("retrieving default NG template for collection widgets created with angular", function(assert) {
    var TestContainer = CollectionWidget.inherit({
        _renderContentImpl: function(template) {
            template = template || this.option("integrationOptions.templates").template;
            if(template) {
                template.render({
                    container: this.$element()
                });
            }
        }
    });

    registerComponent("dxTestContainerEmpty", TestContainer);

    var $markup,
        instance,
        template,
        $container = $("<div/>").appendTo(FIXTURE_ELEMENT());

    // angular scenario
    $markup = $("<div dx-test-container-empty></div>").appendTo($container);
    angular.bootstrap($container, ["testApp"]);

    instance = $markup.dxTestContainerEmpty("instance");
    template = instance._getTemplate("test");
    assert.ok((template instanceof NgTemplate), "default NG template is not retrieved");

    // jquery scenario
    $markup = $("<div></div>")
        .appendTo($container)
        .dxTestContainerEmpty({});
    instance = $markup.dxTestContainerEmpty("instance");
    template = instance._getTemplate("test");
    assert.ok(!(template instanceof NgTemplate), "default NG template not retrieved");
});

QUnit.test("creates anonymous template from its contents", function(assert) {
    var TestContainer = Widget.inherit({
        _getDefaultOptions: function() {
            return $.extend(this.callBase(), {
                items: null
            });
        },

        _render: function() {
            this.option("integrationOptions.templates")["template"].render({
                container: this.$element()
            });
        },

        _renderContentImpl: noop,

        _clean: function() {
            this.$element().empty();
        }
    });

    registerComponent("dxTestContainerAnonymousTemplate", TestContainer);

    var $container = $("<div/>").appendTo(FIXTURE_ELEMENT()),
        $controller = $("<div/>")
            .attr("ng-controller", "my-controller")
            .appendTo($container),
        $markup = $(
            "<div dx-test-container-anonymous-template='{ bindingOptions: { items: \"vm.items\" } }'>" +
            "   <ul>" +
            "       <li ng-repeat='item in vm.items' ng-bind='item'></li>" +
            "   </ul>" +
            "</div>"
        ).appendTo($controller);

    this.testApp.controller("my-controller", function($scope) {
        $scope.vm = {
            items: [1, 2, 3]
        };
    });

    angular.bootstrap($container, ["testApp"]);

    var instance = $markup.dxTestContainerAnonymousTemplate("instance");

    assert.ok(instance.option("integrationOptions.templates"));
    assert.ok(instance.option("integrationOptions.templates")["template"]);

    var list = $markup.find("ul");
    assert.equal(list.length, 1);

    var listItems = list.children();
    assert.equal(listItems.length, 3);
    assert.equal(listItems.text(), "123");
});


QUnit.test("correct scope as model for template", function(assert) {
    var TestContainer = Widget.inherit({
        _getDefaultOptions: function() {
            return $.extend(this.callBase(), {
                items: null
            });
        },

        _render: function() {
            this.option("integrationOptions.templates")["template"].render({
                container: this.$element()
            });
        },

        _renderContentImpl: noop,

        _clean: function() {
            this.$element().empty();
        }
    });

    registerComponent("dxTestContainerDataTemplate", TestContainer);

    var $container = $("<div/>").appendTo(FIXTURE_ELEMENT()),
        $controller = $("<div/>")
            .attr("ng-controller", "my-controller")
            .appendTo($container),
        $markup = $(
            "<div dx-test-container-data-template>" +
            "   <div>{{vm.text}}</div>" +
            "</div>"
        ).appendTo($controller);

    this.testApp.controller("my-controller", function($scope) {
        $scope.vm = {
            text: "My text"
        };
    });

    angular.bootstrap($container, ["testApp"]);

    assert.equal($.trim($markup.text()), "My text");

    var parentScope = $markup.scope(),
        childScope = $markup.children().scope();

    parentScope.$apply(function() {
        parentScope.vm.text = "New text";
    });

    assert.equal(childScope.vm.text, "New text");
    assert.equal($.trim($markup.text()), "New text");

    childScope.$apply(function() {
        childScope.vm.text = "New text 2";
    });

    assert.equal(parentScope.vm.text, "New text 2");
});

QUnit.test("two-way binding works correct for inner component (T577900)", function(assert) {
    var MyComponent = DOMComponent.inherit({
        emulateAction: function() {
            this._createActionByOption("onClick")();
        }
    });
    registerComponent("dxComponentWithInnerComponent", MyComponent);

    var $container = $("<div/>").appendTo(FIXTURE_ELEMENT()),
        $controller = $("<div/>")
            .attr("ng-controller", "my-controller as $ctrl")
            .appendTo($container);
    $("<inner-component></inner-component>").appendTo($controller);

    this.testApp.controller("my-controller", function() {});

    angular.module('testApp').component('innerComponent', {
        controller: function() {
            this.widgetSettings = {
                onClick: function(args) {
                    var prevText = args.component.option("text");
                    args.component.option("text", prevText + "1");
                },
                bindingOptions: {
                    text: '$ctrl.text'
                }
            };
        },
        template:
            "<div id='test'>{{$ctrl.text}}</div>" +
            "<div id='widget' dx-component-with-inner-component='$ctrl.widgetSettings'></div>"
    });

    angular.bootstrap($container, ["testApp"]);

    var testField = $("#test"),
        instance = $("#widget").dxComponentWithInnerComponent("instance");

    assert.equal(testField.text(), "");
    assert.equal(instance.option("text"), undefined);

    instance.emulateAction();

    assert.equal(testField.text(), "undefined1");
    assert.equal(instance.option("text"), "undefined1");

    instance.emulateAction();

    assert.equal(testField.text(), "undefined11");
    assert.equal(instance.option("text"), "undefined11");
});

QUnit.test("Directive is in DOM on linking (T306481)", function(assert) {
    assert.expect(1);
    var TestContainer = Widget.inherit({
        _render: function() {
            this.option("integrationOptions.templates")["template"].render({
                container: this.$element()
            });
        },
        _renderContentImpl: noop,
        _clean: function() {
            this.$element().empty();
        }
    });

    registerComponent("dxTestContainerWidget", TestContainer);

    this.testApp.directive('customDirective', function() {
        return {
            restrict: 'E',
            replace: true,
            template: '<div>InnerContent</div>',
            link: function(scope, element) {
                assert.equal($(element).parent().length, 1, "T306481");
            }
        };
    });

    var $container = $("<div/>").appendTo(FIXTURE_ELEMENT());

    $(
        "<div dx-test-container-widget='{}'>" +
        "   <custom-directive/>" +
        "</div>"
    ).appendTo($container);

    angular.bootstrap($container, ["testApp"]);
});

QUnit.test("Widget options does not override scope properties", function(assert) {
    var TestContainer = Widget.inherit({
        _renderContentImpl: function(template) {
            template = template || this.option("integrationOptions.templates").template;
            if(template) {
                template.render({
                    model: { text: "Widget model" },
                    container: this.$element()
                });
            }
        }
    });

    registerComponent("dxTestContainer1", TestContainer);


    var $container = $("<div/>").appendTo(FIXTURE_ELEMENT()),
        $controller = $("<div/>")
            .attr("ng-controller", "my-controller")
            .appendTo($container),
        $markup = $(
            "<div dx-test-container1='{ }'>" +
            "   <div>{{text}}</div>" +
            "</div>"
        ).appendTo($controller);

    this.testApp.controller("my-controller", function($scope) {
        $scope.text = "Controller model";
    });

    angular.bootstrap($container, ["testApp"]);

    assert.equal($.trim($markup.text()), "Controller model");
});

QUnit.module("ui.collectionWidget", {
    beforeEach: function() {
        QUnit.timerIgnoringCheckers.register(ignoreAngularBrowserDeferTimer);
    },
    afterEach: function() {
        QUnit.timerIgnoringCheckers.unregister(ignoreAngularBrowserDeferTimer);
    }
});

var initMarkup = function($markup, controller) {
    var TestCollectionContainer = CollectionWidget.inherit({
        _itemClass: function() {
            return "dx-test-item";
        },

        _itemDataKey: function() {
            return "dxTestItemData";
        }
    });

    var TestWidget = Widget.inherit({
        _getDefaultOptions: function() {
            return $.extend(this.callBase(), {
                text: ""
            });
        },

        _render: function() {
            this.$element().append($("<span />").text(this.option("text")));
        },

        _clean: function() {
            this.$element().empty();
        }
    });

    registerComponent("dxTestCollectionContainer", TestCollectionContainer);
    registerComponent("dxTestWidget", TestWidget);

    var $container = $("<div/>").appendTo(FIXTURE_ELEMENT());

    $("<div/>")
        .attr("ng-controller", "my-controller")
        .appendTo($container)
        .append($markup);

    angular.module("testApp", ["dx"]).controller("my-controller", controller);

    angular.bootstrap($container, ["testApp"]);

    return $markup;
};

QUnit.test("collection container item value escalates to scope", function(assert) {
    var controller = function($scope) {
            $scope.collection = [
            { widgetText: "my text" }
            ];
        },
        $markup = initMarkup($(
            "<div dx-test-collection-container=\"{ bindingOptions: { items: 'collection' } }\" dx-item-alias=\"item\">" +
            "   <div data-options='dxTemplate: { name: \"item\" }' dx-test-widget='{ bindingOptions: { text: \"item.widgetText\" } }'>" +
            "   </div>" +
            "</div>"
        ), controller),
        scope = $markup.scope();

    var $item = $markup.children().children().eq(0);
    assert.equal($item.dxTestWidget("instance").option("text"), "my text");

    scope.$apply(function() {
        scope.collection[0].widgetText = "new text";
    });
    assert.equal($item.dxTestWidget("instance").option("text"), "new text");

    $item.dxTestWidget("instance").option("text", "own text");

    assert.equal(scope.collection[0].widgetText, "own text");
});

QUnit.test("collection container primitive item value escalates to scope", function(assert) {
    var controller = function($scope) {
            $scope.collection = ["my text"];
        },
        $markup = initMarkup($(
            "<div dx-test-collection-container=\"{ bindingOptions: { items: 'collection' } }\" dx-item-alias=\"item\">" +
            "   <div data-options='dxTemplate: { name: \"item\" }' dx-test-widget='{ bindingOptions: { text: \"item\" } }'>" +
            "   </div>" +
            "</div>"
        ), controller),
        scope = $markup.scope();

    var $item = $markup.children().children().eq(0);
    assert.equal($item.dxTestWidget("instance").option("text"), "my text");

    scope.$apply(function() {
        scope.collection[0] = "new text";
    });
    $item = $markup.children().children().eq(0);
    assert.equal($item.dxTestWidget("instance").option("text"), "new text");

    $item.dxTestWidget("instance").option("text", "own text");

    assert.equal(scope.collection[0], "own text");
});

QUnit.test("collection container item value escalates to scope: complex paths", function(assert) {
    var controller = function($scope) {
            $scope.vm = {
                collection: [
                { data: { widgetText: "my text" } }
                ]
            };
        },
        $markup = initMarkup($(
            "<div dx-test-collection-container=\"{ bindingOptions: { items: 'vm.collection' } }\" dx-item-alias=\"item\">" +
            "   <div data-options='dxTemplate: { name: \"item\" }' dx-test-widget='{ bindingOptions: { text: \"item.data.widgetText\" } }'>" +
            "   </div>" +
            "</div>"
        ), controller),
        scope = $markup.scope();

    var $item = $markup.children().children().eq(0);
    assert.equal($item.dxTestWidget("instance").option("text"), "my text");

    scope.$apply(function() {
        scope.vm.collection[0].data.widgetText = "new text";
    });
    assert.equal($item.dxTestWidget("instance").option("text"), "new text");

    $item.dxTestWidget("instance").option("text", "own text");

    assert.equal(scope.vm.collection[0].data.widgetText, "own text");
});

QUnit.test("Bootstrap should not fail if container component changes element markup on init (Problem after updating Angular to 1.2.16)", function(assert) {
    var controller = function($scope) {
        $scope.vm = {
            items: [
                { text: "0" },
                { text: "1" }
            ]
        };

        $scope.listOptions = {
            data: "vm",
            bindingOptions: {
                items: "items"
            }
        };
    };

    initMarkup($(
        "<div dx-list='listOptions'>" +
            "<div data-options=\"dxTemplate: { name: 'item' } \" dx-button=\"{ bindingOptions: { text: text } }\">" +
            "</div>" +
        "</div>"
    ), controller);

    assert.ok(true, "no fails on bootstrap");
});

QUnit.test("Global scope properties are accessible from item template", function(assert) {
    this.clock = sinon.useFakeTimers();

    var controller = function($scope) {
            $scope.collection = [
            { itemText: "Item text" }
            ];

            $scope.globalText = "Global text";
        },
        $markup = initMarkup($(
            "<div dx-test-collection-container=\"{ bindingOptions: { items: 'collection' } }\" dx-item-alias=\"item\">" +
            "   <div data-options='dxTemplate: { name: \"item\" }'>" +
            "       <div ng-bind='item.itemText' class='item-text'>" +
            "       </div>" +
            "       <div ng-bind='globalText' class='global-text'>" +
            "       </div>" +
            "   </div>" +
            "</div>"
        ), controller);

    this.clock.tick();

    assert.equal($(".item-text", $markup).text(), "Item text");
    assert.equal($(".global-text", $markup).text(), "Global text");

    this.clock.restore();
});

QUnit.test("binding to circular data (T144697)", function(assert) {
    var controller = function($scope) {
            $scope.collection = [];
            $scope.collection.push({
                text: "Item text",
                parent: $scope.collection
            });
        },
        $markup = initMarkup($(
            "<div dx-test-collection-container=\"{ bindingOptions: { items: 'collection' } }\"></div>"
        ), controller),
        scope = $markup.scope();

    assert.equal($.trim($markup.text()), "Item text");

    scope.$apply(function() {
        scope.collection[0].text = "New text";
    });

    assert.equal($.trim($markup.text()), "New text");
});

QUnit.test("watcher type changed (T145604)", function(assert) {
    var data = [],
        controller = function($scope) {
            $scope.collection = undefined;// Important!!!
        },
        $markup = initMarkup($(
            "<div dx-test-collection-container=\"{ bindingOptions: { items: 'collection' } }\"></div>"
        ), controller),
        scope = $markup.scope();


    for(var i = 0; i < 100; i++) {
        data.push({
            text: "Item text " + i
        });
    }

    // render items can take some time
    scope.$apply(function() {
        scope.collection = data;
    });

    // change item's property shouldn't recompare the whole collection
    var $watchOld = scope["$watch"],
        watchLog = [];

    scope["$watch"] = function() {
        watchLog.push(arguments);
        return $watchOld.apply(arguments, this);
    };
    scope.$apply(function() {
        scope.collection[0].text = "New text";
    });
    assert.equal(watchLog.length, 0, "$watch shouldn't be used");

});

QUnit.test("Defining item data alias by 'itemAlias' with custom template for all items", function(assert) {
    var controller = function($scope) {
            $scope.collection = [1, 2, 3];
        },
        $markup = initMarkup($(
            "<div dx-test-collection-container=\"{ bindingOptions: { items: 'collection' } }\" dx-item-alias=\"item\">" +
            "   <div data-options='dxTemplate: { name: \"item\" }'>" +
            "       <div dx-test-widget=\"{ bindingOptions: { text: 'item' } }\" class=\"test-widget\"></div>" +
            "   </div>" +
            "</div>"
        ), controller),
        scope = $markup.scope();

    var $item = $markup.find(".test-widget").eq(0);
    assert.equal($item.dxTestWidget("option", "text"), "1");

    scope.$apply(function() {
        scope.collection[0] = "new text";
    });

    $item = $markup.find(".test-widget").eq(0);
    assert.equal($item.dxTestWidget("option", "text"), "new text");

    $item.dxTestWidget("option", "text", "widget text");
    assert.equal(scope.collection[0], "widget text");
});

QUnit.test("Defining item data alias by 'itemAlias' with custom template for some items", function(assert) {
    this.clock = sinon.useFakeTimers();
    var controller = function($scope) {
            $scope.collection = [{ name: "0", template: "customWidget" }, { name: "1", template: "custom" }, { text: "2" }, "3"];
        },
        $markup = initMarkup($(
            "<div dx-test-collection-container=\"{ bindingOptions: { items: 'collection' } }\" dx-item-alias=\"user\">" +
            "   <div data-options='dxTemplate: { name: \"customWidget\" }'>" +
            "       <div dx-test-widget=\"{ bindingOptions: { text: 'user.name' } }\" class=\"test-widget\"></div>" +
            "   </div>" +
            "   <div data-options='dxTemplate: { name: \"custom\" }'>" +
            "       {{user.name}}" +
            "   </div>" +
            "</div>"
        ), controller),
        scope = $markup.scope();

    this.clock.tick();

    var $items = $markup.children();
    assert.equal($items.eq(0).find(".test-widget").dxTestWidget("option", "text"), "0");
    assert.equal($.trim($items.eq(1).text()), "1");
    assert.equal($.trim($items.eq(2).text()), "2");
    assert.equal($.trim($items.eq(3).text()), "3");

    scope.$apply(function() {
        scope.collection[0].name = "new text 0";
        scope.collection[1].name = "new text 1";
        scope.collection[2].text = "new text 2";
        scope.collection[3] = "new text 3";
    });

    this.clock.tick();

    $items = $markup.children();
    assert.equal($items.eq(0).find(".test-widget").dxTestWidget("option", "text"), "new text 0");
    assert.equal($.trim($items.eq(1).text()), "new text 1");
    assert.equal($.trim($items.eq(2).text()), "new text 2");
    assert.equal($.trim($items.eq(3).text()), "new text 3");

    $items.eq(0).find(".test-widget").dxTestWidget("option", "text", "widget text");
    assert.equal(scope.collection[0].name, "widget text");

    this.clock.restore();
});

QUnit.test("$index is available in markup (T542335)", function(assert) {
    var controller = function($scope) {
            $scope.items = [
                { text: "text1" },
                { text: "text2" }
            ];
        },
        $markup = initMarkup($(
            "<div dx-test-collection-container=\"{ bindingOptions: { items: 'items' } }\" dx-item-alias=\"item\">" +
            "   <div data-options='dxTemplate: { name: \"item\" }'>" +
            "       <div dx-test-widget=\"{ bindingOptions: { text: '$index' } }\" class=\"test-widget\"></div>" +
            "   </div>" +
            "</div>"
        ), controller);

    var $items = $markup.find(".test-widget");

    assert.equal($items.eq(0).dxTestWidget("option", "text"), "0");
    assert.equal($items.eq(1).dxTestWidget("option", "text"), "1");
});

QUnit.test("$id in item model not caused exception", function(assert) {
    var controller = function($scope) {
            $scope.collection = [
                { text: "my text", $id: 1 }
            ];
        },
        $markup = initMarkup($(
            "<div dx-test-collection-container=\"{ items: collection }\">" +
            "</div>"
        ), controller);

    assert.equal($markup.text(), "my text");
});

QUnit.module("misc and regressions", {
    beforeEach: function() {
        this.testApp = angular.module("testApp", ["dx"]);
        QUnit.timerIgnoringCheckers.register(ignoreAngularBrowserDeferTimer);
    },
    afterEach: function() {
        QUnit.timerIgnoringCheckers.unregister(ignoreAngularBrowserDeferTimer);
    }
});

QUnit.test("template.render() - data parameter is Scope", function(assert) {
    var TestContainer = Widget.inherit({

        _getDefaultOptions: function() {
            return $.extend(this.callBase(), {
                text: "default"
            });
        },

        _init: function() {
            this.callBase.apply(this, arguments);

            var element = this.$element().get(0);
            this.scope = angular.element(element).scope().$new();
            this.scope.text = this.option("text");
        },

        _render: function() {
            var content = $("<div />")
                    .addClass("dx-content")
                    .appendTo(this.$element());

            this.option("integrationOptions.templates")["template"].render({
                model: this.scope,
                container: content
            });
        },

        _renderContentImpl: noop,

        _optionChanged: function(args) {
            if(args.name === "text") {
                var that = this;

                that.scope.$apply(function() {
                    that.scope.text = args.value;
                });
            } else {
                this.callBase(args);
            }
        }

    });

    registerComponent("dxTestContainerScope", TestContainer);

    var $container = $("<div/>").appendTo(FIXTURE_ELEMENT()),
        $markup = $(
            "<div dx-test-container-scope='{ text: \"my text\" }'>" +
            "   <div class='text' ng-bind='text'></div>" +
            "</div>"
        ).appendTo($container);


    angular.bootstrap($container, ["testApp"]);

    assert.equal($markup.find(".text").text(), "my text");
    var instance = $markup.dxTestContainerScope("instance");

    instance.option("text", "new text");
    assert.equal($markup.find(".text").text(), "new text");
});

QUnit.test("binding for item of array option", function(assert) {
    var TestCollectionContainer = CollectionWidget.inherit({
        _itemClass: function() {
            return "dx-test-item";
        },

        _itemDataKey: function() {
            return "dxTestItemData";
        }
    });

    registerComponent("dxTestCollectionContainer", TestCollectionContainer);

    var $container = $("<div/>").appendTo(FIXTURE_ELEMENT()),
        $controller = $("<div/>")
                    .attr("ng-controller", "my-controller")
                    .appendTo($container),
        $markup = $(
            "<div dx-test-collection-container=\"{ items: [ { text: 'value 1'}, { }, { } ], bindingOptions: { 'items[1].text': 'item2', 'items[2].text': 'vm.item3' } }\">" +
                    "</div>"
            ).appendTo($controller),
        scope;

    this.testApp.controller("my-controller", function($scope) {
        scope = $scope;

        $scope.item2 = "value 2";
        $scope.vm = {
            item3: "value 3"
        };
    });

    angular.bootstrap($container, ["testApp"]);

    assert.equal($markup.children().eq(1).text(), "value 2");

    scope.$apply(function() {
        scope.item2 = "new value 2";
        scope.vm.item3 = "new value 3";
    });
    assert.equal($markup.children().eq(1).text(), "new value 2");
    assert.equal($markup.children().eq(2).text(), "new value 3");

    var instance = $markup.dxTestCollectionContainer("instance");
    instance.option("items", [{ text: 'value 4' }, { text: 'value 5' }, { text: 'value 6' }]);

    assert.equal(scope.item2, "value 5");
    assert.equal(scope.vm.item3, "value 6");
});

QUnit.test("all values should be correct displayed in collection widget (T425426)", function(assert) {
    registerComponent("dxTestCollection", CollectionWidget);

    var $container = $("<div/>").appendTo(FIXTURE_ELEMENT()),
        $controller = $("<div/>")
                .attr("ng-controller", "my-controller")
                .appendTo($container),
        $markup = $("<div dx-test-collection=\"{ items: [ 0, 1, null, '', undefined, {} ] }\"></div>").appendTo($controller);

    this.testApp.controller("my-controller", function() { });

    angular.bootstrap($container, ["testApp"]);

    assert.equal($markup.children().eq(0).text(), "0");
    assert.equal($markup.children().eq(1).text(), "1");
    assert.equal($markup.children().eq(2).text(), "null");
    assert.equal($markup.children().eq(3).text(), "");
    assert.equal($markup.children().eq(4).text(), "undefined");
    assert.equal($markup.children().eq(5).text(), "");
});

QUnit.test("child collection widget should be rendered correctly when template provider is specified", function(assert) {
    var ChildWidget = Widget.inherit({
        _render: function() {
            this.callBase();
            this.$element().addClass("child-widget");
        }
    });

    registerComponent("dxChildWidget", ChildWidget);

    var ParentWidget = Widget.inherit({
        _render: function() {
            this.callBase();
            var $childWidget = $("<div>").appendTo(this.$element());
            this._createComponent($childWidget, "dxChildWidget");
        }
    });

    registerComponent("dxParentWidget", ParentWidget);

    var $container = $("<div>").appendTo(FIXTURE_ELEMENT());
    var $markup = $("<div dx-parent-widget='{}'></div>")
        .appendTo($container);

    angular.bootstrap($container, ["testApp"]);

    assert.equal($markup.dxParentWidget("option", "templatesRenderAsynchronously"), FIXTURE_ELEMENT().find(".child-widget").dxChildWidget("option", "templatesRenderAsynchronously"), "templatesRenderAsynchronously provided");
});


QUnit.test("memory leaks in CollectionWidget", function(assert) {
    var TestCollectionContainer = CollectionWidget.inherit({
        _itemClass: function() {
            return "dx-test-item";
        },

        _itemDataKey: function() {
            return "dxTestItemData";
        }
    });

    registerComponent("dxLeakTestCollectionContainer", TestCollectionContainer);

    var $container = $("<div/>").appendTo(FIXTURE_ELEMENT()),
        $controller = $("<div/>")
            .attr("ng-controller", "my-controller")
            .appendTo($container),
        scope;

    $("<div dx-leak-test-collection-container=\"{ bindingOptions: { items: 'items' } }\" dx-item-alias=\"item\"><span></span></div>")
        .appendTo($controller);

    this.testApp.controller("my-controller", function($scope) {
        scope = $scope;

        $scope.items = [
            { text: "my text 1" },
            { text: "my text 2" }
        ];
    });

    angular.bootstrap($container, ["testApp"]);

    var calcSiblings = function(sibling) {
        var result = 0;

        while(sibling) {
            result++;
            sibling = sibling.$$nextSibling;
        }

        return result;
    };

    assert.equal(calcSiblings(scope.$$childHead), 2);

    scope.$apply(function() {
        scope.items.pop();
    });

    assert.equal(calcSiblings(scope.$$childHead), 1);
});

QUnit.test("binding inside ng-repeat (T137200)", function(assert) {
    var TestComponent = DOMComponent.inherit({
        _getDefaultOptions: function() {
            return { text: "", array: [], obj: null };
        }
    });

    registerComponent("dxRepeatTest", TestComponent);

    var $container = $("<div/>").appendTo(FIXTURE_ELEMENT()),
        $controller = $("<div></div>")
            .attr("ng-controller", "my-controller")
            .appendTo($container),
        scope;

    $("<div ng-repeat=\"vm in items\">"
        + "    <div dx-repeat-test=\"{ bindingOptions: { text: 'vm.text' } }\"></div>"
        + "</div>")
        .appendTo($controller);

    this.testApp.controller("my-controller", function($scope) {
        scope = $scope;

        $scope.items = [
            { text: "my text 1" },
            { text: "my text 2" },
            { text: "my text 3" }
        ];
    });

    angular.bootstrap($container, ["testApp"]);

    scope.$apply(function() {
        scope.items[0].text = "new text";
    });

    var $elements = $("[dx-repeat-test]", $container);

    assert.equal($elements.first().dxRepeatTest("option", "text"), "new text");
    assert.equal($elements.last().dxRepeatTest("option", "text"), "my text 3");
});

QUnit.test("component should notify view model if option changed on ctor after initialization (T219862)", function(assert) {
    var ComponentClass = DOMComponent.inherit({
        _render: function() {
            this.callBase();
            this.option("a", 2);
        }
    });

    registerComponent("test", ComponentClass);

    var $container = $("<div/>").appendTo(FIXTURE_ELEMENT()),
        $controller = $("<div></div>")
            .attr("ng-controller", "my-controller")
            .appendTo($container),
        scope;

    $("<div test=\"{ bindingOptions: { a: 'a'} }\"></div>").appendTo($controller);

    this.testApp.controller("my-controller", function($scope) {
        scope = $scope;
        $scope.a = 1;
    });

    angular.bootstrap($container, ["testApp"]);

    assert.equal(scope.a, 2);
});

QUnit.test("Watchers executed after component initialization (T334273)", function(assert) {
    var exceptionFired = false,
        app = angular.module('app', ["ng", 'dx']).factory('$exceptionHandler', function() {
            return function(exception, cause) {
                exceptionFired = true;
            };
        });

    var TestComponent = DOMComponent.inherit({});

    registerComponent("dxTest", TestComponent);

    app.directive('customDirective', [
        function() {
            return {
                restrict: 'A',
                template: '<div>' +
                                '<div dx-test="{ bindingOptions: { width: \'w\' }, height: \'0\' }"></div>' +
                            '</div>',
                replace: true,
                compile: function(tElem, tAttrs) {
                    return {
                        "pre": function(scope, iElem, iAttrs, controller) {
                            scope.w = 0;
                        }
                    };
                }
            };
        }]);

    var element = $('<div custom-directive></div>').appendTo(FIXTURE_ELEMENT());


    angular.injector(['app']).invoke(function($rootScope, $compile) {
        $compile(element)($rootScope);
    });

    assert.ok(!exceptionFired, "There is no any exceptions");
});

QUnit.module("component action context", {
    beforeEach: function() {
        var TestComponent = DOMComponent.inherit({
            _getDefaultOptions: function() {
                return $.extend(this.callBase(), {
                    onHandler: noop,
                    value: null
                });
            },

            trigger: function(e) {
                this._createAction(this.option("onHandler"))(e);
            },
            triggerByOption: function(e) {
                this._createActionByOption("onHandler")(e);
            },
            triggerByOptionCategoryRendering: function(e) {
                this._createActionByOption("onHandler", { category: "rendering" })(e);
            }
        });

        this.testApp = angular.module("testApp", ["dx"]);
        this.$container = $("<div/>").appendTo(FIXTURE_ELEMENT());
        this.$controller = $("<div></div>")
            .attr("ng-controller", "my-controller")
            .appendTo(this.$container);

        registerComponent("dxActionTest", TestComponent);

        QUnit.timerIgnoringCheckers.register(ignoreAngularBrowserDeferTimer);
    },
    afterEach: function() {
        QUnit.timerIgnoringCheckers.unregister(ignoreAngularBrowserDeferTimer);
    }
});

QUnit.test("component action created by option calls scope.$apply", function(assert) {
    var $markup = $("<div dx-action-test='{ onHandler: vm.handler }'></div>")
            .appendTo(this.$controller),
        valueChanged = false;

    this.testApp.controller("my-controller", function($scope) {
        $scope.vm = {
            handler: function(e) {
                $scope.vm.value = "new value";
            },
            value: "old value"
        };

        $scope.$watch("vm.value", function(newValue, oldValue) {
            if(newValue !== oldValue) {
                valueChanged = true;
            }
        });
    });

    angular.bootstrap(this.$container, ["testApp"]);

    $markup.dxActionTest("instance").triggerByOption();

    assert.ok(valueChanged);
});

QUnit.test("component internal action does not calls scope.$apply", function(assert) {
    var $markup = $("<div dx-action-test='{ onHandler: vm.handler }'></div>")
            .appendTo(this.$controller),
        valueChanged = false;

    this.testApp.controller("my-controller", function($scope) {
        $scope.vm = {
            handler: function(e) {
                $scope.vm.value = "new value";
            },
            value: "old value"
        };

        $scope.$watch("vm.value", function(newValue, oldValue) {
            if(newValue !== oldValue) {
                valueChanged = true;
            }
        });
    });

    angular.bootstrap(this.$container, ["testApp"]);

    $markup.dxActionTest("instance").trigger();

    assert.ok(!valueChanged);
});

QUnit.test("component created by option with category 'rendering' does not calls scope.$apply", function(assert) {
    var $markup = $("<div dx-action-test='{ onHandler: vm.handler }'></div>")
            .appendTo(this.$controller),
        valueChanged = false;

    this.testApp.controller("my-controller", function($scope) {
        $scope.vm = {
            handler: function(e) {
                $scope.vm.value = "new value";
            },
            value: "old value"
        };

        $scope.$watch("vm.value", function(newValue, oldValue) {
            if(newValue !== oldValue) {
                valueChanged = true;
            }
        });
    });

    angular.bootstrap(this.$container, ["testApp"]);

    $markup.dxActionTest("instance").triggerByOptionCategoryRendering();

    assert.ok(!valueChanged);
});

// related with Q566857
QUnit.test("change option in component action handler (phase $apply) ", function(assert) {
    var $markup = $("<div dx-action-test=\"{ onHandler: vm.handler,  bindingOptions: { value: 'vm.value' }}\"></div>")
            .appendTo(this.$controller),
        scope;


    this.testApp.controller("my-controller", function($scope) {
        scope = $scope;
        $scope.vm = {
            handler: function(e) {
                $markup.dxActionTest("option", "value", "new value");
            },
            value: "old value"
        };
    });

    angular.bootstrap(this.$container, ["testApp"]);

    $markup.dxActionTest("instance").triggerByOption();

    assert.equal(scope.vm.value, "new value");
});

QUnit.test("component action context is component", function(assert) {
    var context;
    var handler = function(e) {
        context = this;
    };

    var $markup = $("<div></div>").appendTo(this.$container);
    $markup.dxActionTest({ onHandler: handler });

    var component = $markup.dxActionTest("instance");
    component.triggerByOption();

    assert.equal(context, component);
});

QUnit.test("Using ng-expressions in dx syntax", function(assert) {
    var $markup = $("<div/>")
            .attr("dx-action-test", "{ onHandler: 'vm.value = \"new value\"' }")
            .appendTo(this.$controller),
        scope;

    this.testApp.controller("my-controller", function($scope) {
        scope = $scope;
        $scope.vm = {
            value: "old value"
        };
    });

    angular.bootstrap(this.$container, ["testApp"]);

    $markup.dxActionTest("instance").triggerByOption();

    assert.equal(scope.vm.value, "new value");
});

QUnit.module("dxComponent as a template", {
    beforeEach: function() {
        var TemplateComponent = Widget.inherit({});

        this.testApp = angular.module("testApp", ["dx"]);
        this.$container = $("<div/>").appendTo(FIXTURE_ELEMENT());

        registerComponent("dxTemplateComponent", TemplateComponent);

        QUnit.timerIgnoringCheckers.register(ignoreAngularBrowserDeferTimer);
    },
    afterEach: function() {
        QUnit.timerIgnoringCheckers.unregister(ignoreAngularBrowserDeferTimer);
    }
});

QUnit.test("Parent directive scope value goes to template component option object", function(assert) {
    var initialWatchersCount;

    $("<custom-directive/>").appendTo(this.$container);

    this.testApp.directive('customDirective', function() {
        return {
            restrict: 'E',
            replace: true,
            template: '<div dx-template-component="config"></div>',
            link: function(scope) {
                // NOTE: One uncleared watcher created for dxDigestCallbacks service
                initialWatchersCount = scope.$$watchers.length;

                scope.boundOption = 'default value';
                scope.config = {
                    text: "my text",
                    bindingOptions: {
                        boundOption: 'boundOption'
                    }
                };
            }
        };
    });

    angular.bootstrap(this.$container, ["testApp"]);

    var $markup = this.$container.children(),
        instance = $markup.dxTemplateComponent("instance"),
        scope = $markup.scope();

    assert.equal(instance.option("text"), "my text");

    scope.$apply(function() {
        scope.boundOption = "new value";
    });

    assert.equal(instance.option("boundOption"), "new value");
    assert.equal(scope.$$watchers.length, initialWatchersCount);
});

QUnit.test("No watchers on disposing", function(assert) {
    $("<custom-directive/>").appendTo(this.$container);

    this.testApp.directive('customDirective', function() {

        return {
            restrict: 'E',
            replace: true,
            template: '<div dx-template-component="config"></div>',
            link: function(scope) { }
        };
    });

    angular.bootstrap(this.$container, ["testApp"]);

    var $markup = this.$container.children(),
        instance = $markup.dxTemplateComponent("instance"),
        scope = $markup.scope();

    $markup.remove();

    assert.equal(scope.$$watchers.length, 1);// NOTE: One uncleared watcher created for dxDigestCallbacks service
    assert.ok(!!instance);
});


QUnit.test("Component shouldn't watch digest callback after dispose", function(assert) {
    var beginCounter = 0,
        endCounter = 0;

    var TestComponent = DOMComponent.inherit({
        beginUpdate: function(args) {
            beginCounter++;
            this.callBase.apply(this, arguments);
        },
        endUpdate: function() {
            endCounter++;
            this.callBase.apply(this, arguments);
        }
    });

    registerComponent("dxTestWidget", TestComponent);

    var $markup = $("<div></div>")
            .attr("dx-test-widget", "{}")
            .appendTo(this.$container);

    angular.bootstrap(this.$container, ["testApp"]);

    var scope = $markup.scope();
    $markup.remove();

    beginCounter = 0;
    endCounter = 0;
    scope.$apply(function() {});

    assert.equal(beginCounter, 0);
    assert.equal(endCounter, 0);
});
