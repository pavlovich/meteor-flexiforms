/**
 * Created by pavlovich on 4/14/14.
 */

ngMeteorFleximodel =
    angular.module('ngMeteorFleximodel', ['ngMeteor'])
        .run(['$collection', '$rootScope', function($collection, $rootScope){
            $collection('FlexiSpecs', $rootScope);
        }]);


Package.ui.UI.registerHelper("sgiAutoformElementTemplate", function (a, b, c, d) {
    var templateName = '_sgiAutoformField';
    if(this && this.type){
        var flexiSpec = FlexiSpecs.findOne({name: this.type.toString()});
        if(flexiSpec){
            templateName = '_sgiAutoformFieldGroup';
        }
    }
    return Package.templating.Template[templateName];
});

Package.ui.UI.registerHelper("sgiInline", function () {
    if(this.inline){
        return " inline";
    }else{
        return "";
    }
});

ngMeteorForms = angular.module('ngMeteorForms', ['ngMeteorFleximodel']);

ngMeteorForms.templateMapping = {
    'date': 'datepicker',
    'daterange': 'daterange',
    'date': 'date',
    'datesingle': 'datesingle',
    'text': 'text',
    'boolean': 'checkbox',
    'email': 'email',
    'phone': 'phone',
    'time': 'time',
    'datetime': 'dateTimeLocal',
    'url': 'url',
    'number': 'number',
    'integer': 'number',
    'float': 'number',
    'single': function(){
        var field = this;
        var result = 'checkbox';
        if(field.options && field.options.collection &&  _.isArray(field.options.collection)){
            if(field.options.collection.length > 1){
                result = "radio";
            }
            if(field.options.collection.length > 5){
                result = "select";
            }
        }
        return result;
    },
    'multi': function(field){
        var result = 'checkbox';
        if(field.options && _.isArray(field.options)){
            if(field.options.length > 5){
                result = "select";
            }
        }
        return result;
    }
};

var fieldGetTemplate = function () {
    if (this.template) {
        if (typeof this.template == 'string') {
            return this.template;
        } else {
            if (typeof this.template == 'function') {
                return this.template.call(this);
            }
            if (this.template.name) {
                return this.template.name;
            }
        }
    }
    if (this.type && ngMeteorForms.templateMapping && this.type in ngMeteorForms.templateMapping) {
        var result = ngMeteorForms.templateMapping[this.type];
        if (result) {
            if (typeof result == 'function') {
                return result.call(this);
            } else {
                return result;
            }
        }
    }
    return this.type ? this.type : null;
};

FlexiSpecs._transform = function(doc){
    if (doc.fields && _.isArray(doc.fields)) {
        _.each(doc.fields, function(field){
            field.getTemplateName = fieldGetTemplate;
        });
    }
    return doc;
};

ngMeteorForms.templateRegistry = {};

String.prototype.toCamel = function(){
    return this.replace(/(\-[a-z])/g, function($1){return $1.toUpperCase().replace('-','');});
};

var getModelId = function(dataId) {
    var res = 'model';
    var tempId = dataId.split('.');
    _.each(_.rest(tempId), function(ele){
        res = res + '.' + ele;
    });
    return res;
};

var getTemplateForKey = function(key){
    var templateKey = ngMeteorForms.templateRegistry[key] ? ngMeteorForms.templateRegistry[key] : key;
    var result = Package.templating.Template[templateKey];
    // TODO ::  console.log("Couldn't find a template with name: '" + templateKey + "' which you indicated should override the framework template named '" + key + "'. Using the framework template as a fallback");
    return result ? result : Package.templating.Template[key];
};

var getField = function (fieldId) {
    var typeMap = {};
    $(FlexiSpecs)
        .map(function() {
            typeMap[this.name] = this;
        });
    var attributeMap = fieldId.split('.');
    var typeName = attributeMap[0];
    var type = {};
    type.fields = {};
    (type.fields)[typeName] = {type: typeName};
    var counter = attributeMap.length - 1;
    for (var i = 0; i < counter; i++) {
        var attributeName = attributeMap[i];
        typeName = (type.fields)[attributeName].type;
        type = FlexiSpecs.findOne({name: typeName});
        if(!type){return null};
    }
    var field = (type.fields)[attributeMap[attributeMap.length - 1]];
    field.getTemplateName = fieldGetTemplate;

    return field;
};

var getSgiElementTemplate = function(element, attrs){
    var templateName = element[0].localName.toCamel();
    var template = getTemplateForKey(templateName);
    template = (template.sgiTemplate && typeof template.sgiTemplate == 'function') ? template.sgiTemplate(element, attrs) : template;
    return template;
};

var expandElement = function(element, attrs) {
    var template = getSgiElementTemplate(element, attrs);
    var context = template.createContext(element, attrs);
    var result = ngMeteor.renderTemplateInContext(template, context);
    element.replaceWith(result);
};

var setFormName = function(receiver, element){
    var formName = null;
  //  try {
        form = $(element).closest('form').get(0);
        formName = form.name;
  //  }catch(e){}
    receiver.formName = formName;
};

var setField = function(scope, attributes){
    scope.field = getField(attributes.id);
};

var updateScope = function(scope, element, attributes){
    setFormName(scope, element);
    setField(scope, attributes);
    if(scope.field && scope.field.options){
        scope.options = scope.field.options.collection;
    }
};

var getGlobal = function(globalName){
    var self = this;
    if(Meteor.isClient){
        self = window;
    }
    var result = self[globalName];
    return result ? result : undefined;
}

var createBasicContext = function(element, attrs){
    var context = _.clone(attrs);
    context.contents = element[0].innerHTML;
    return context;
};

var getBasicContextObject = function(element, attrs){

    var field = getField(attrs.id);
    if(field) {
        field = _.clone(field);
        setFormName(field, element);
        field.modelId = getModelId(attrs.id);
        field.id = attrs.id;
        field.inline = attrs.inline;
        field.showLabel = field.inline ? false : true;

        var attributeString = "";

        if (field.type) {
            if (field.type._name) {
                var collectionName = _.capitalize(_.clone(field.type._name));
                var meteorCollection = getGlobal(collectionName);
                if (typeof meteorCollection != 'undefined') {
                    // this is a 'choose from a collection' field or similar.
                    // type will be either select, select (single or multi), radio button set (single), checkboxes (multi) or avail/selected.
                }

            }
            if (field.type.name) {
                // This is a type of Integer, String, Number, Boolean, Object (other than collection)
            }
        }
    }else{
        console.log("unable to find field with id: " + attrs.id);
    }

    return field;
};

ngMeteorForms.errorTypes = {
    'max': ['date', 'time', 'datetime', 'integer', 'float'],
    'min': ['date', 'time', 'datetime', 'integer', 'float'],
    'required': ['text', 'textarea', 'date', 'time', 'datetime', 'integer', 'float'],
    'minlength': ['text', 'textarea', 'integer', 'float', 'url', 'email'],
    'maxlength': ['text', 'textarea', 'integer', 'float', 'url', 'email'],
    'pattern': ['text', 'textarea', 'integer', 'float', 'url', 'email'],


}

ngMeteorForms
    .directive('sgiField', ['$compile', '$rootScope', '$window', function ($compile, $rootScope, $window) {
        return {
            restrict: 'E',
            scope: true,
            controller: ['$scope', function($scope){
                $scope.radioFocus = function($event){
                    var widget = $event.target;
                    $(widget).closest(".radio-group").addClass("focus");
                };
                $scope.radioBlur = function($event){
                    var widget = $event.target;
                    $(widget).closest(".radio-group").removeClass("focus");
                };
                $scope.showErrorMessageFor = function(errorType){
                    try{
                        return $scope.field.validation[errorType].value !== null
                    }catch(e){
                        return false;
                    }
                };
            }],
            compile: function compile(element, attrs) {
                expandElement(element, attrs);
                return {
                    pre: function preLink(scope, iElement, iAttrs, controller) {
                        scope.xid = iAttrs.id;
                        Deps.autorun(function(){
                            if(!scope.$$phase) {
                                scope.$apply(function () {
                                    updateScope(scope, iElement, iAttrs);
                                })
                            }else{
                                updateScope(scope, iElement, iAttrs);
                            }
                        })
                    }
                }
            }
        };
    }])
    .directive('sgiAutoform', ['$compile', '$rootScope', '$window', function ($compile, $rootScope, $window) {
        return {
            restrict: 'E',
            scope: true,
            controller: ['$scope', function($scope){

            }],
            compile: function compile(element, attrs){
                var currentElement = 'hello';
                expandElement(element, attrs);
                return {
                    pre: function preLink(scope, iElement, iAttrs, controller){
                        Deps.autorun(function(){

                        })
                    }
                }
            }
        }
    }]);

Package.meteor.Meteor.startup(function(){

    var fieldTemplateNames = [];
    var otherSgiTemplateNames = [];

    for(key in Package.templating.Template){
        if(Package.templating.Template.hasOwnProperty(key)){
            if(key.match('^(sgi).+')) {
                if (key.match('^(sgi).*(Field)$')) {
                    fieldTemplateNames.push(key);
                } else {
                    otherSgiTemplateNames.push(key);
                }
            }
        }
    };

    _.each(otherSgiTemplateNames, function(directiveName){
        var directiveDefinition = {
            restrict: 'E',
            scope: true,
            compile: function compile(element, attrs){
                expandElement(element, attrs);
            }
        };

        ngMeteorForms.directive(directiveName, function(){return directiveDefinition});

        var template = getTemplateForKey(directiveName);
        template.createContext = createBasicContext;
        template.sgiTemplate = function(element, attrs){return this};
    });

    _.each(fieldTemplateNames, function(templateName){

        var sgiFieldTemplate = getTemplateForKey(templateName);

        sgiFieldTemplate.createContext = function(element, attrs){
            return getBasicContextObject(element, attrs);
        }

        sgiFieldTemplate.sgiTemplate = function(element, attrs){
            var template = null;
            var context = this.createContext(element, attrs);
            if(context){  // && context.template){
//                var templateName = null;
//                if(typeof context.template == "string"){
//                    templateName = context.template;
//                }else{
//                    templateName = context.template.name;
//                }
                var templateName = context.getTemplateName();
                sgiTemplateKey = 'sgi' + _.capitalize(templateName) + 'Field';
                template = getTemplateForKey(sgiTemplateKey);
            }
            return template ? template : getTemplateForKey('sgiTextField');
        }

    });

    var radioField = getTemplateForKey('sgiRadioField');

    radioField.createContext = function(element, attrs){
        var context = getBasicContextObject(element, attrs);
        context.orientation = ('vertical' in attrs) ? 'vertical' : '';
        if(context && context.options && context.options.collection){
            _.each(context.options.collection, function(option){
                option.modelId = context.modelId;
                option.name = context.name;
            })
            return context;
        }
    }

    var radioButton = getTemplateForKey('sgiRadioButton');

    radioButton.createContext = function(element, attrs){
        return _.clone(attrs);
    }

    var sgiAutoform = getTemplateForKey('sgiAutoform');

    sgiAutoform.createContext = function(element, attrs){
        var context = createBasicContext(element, attrs);
        context.formTitle = "New User Information";
        return context;
    }


});

ngMeteor.addFlexistrap('div.meteor-form', 'ngMeteorForms', '*', true);
