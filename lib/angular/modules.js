/**
 * Created by pavlovich on 10/14/14.
 */
////////////////////////////////////////////////////////////////////
/**
 * Register angular modules and associated registries.
 */
////////////////////////////////////////////////////////////////////

/**
 * Create an angular module named 'ngMeteorFleximodel' which injects the 'ngMeteor' module as a dependency and which
 * will expose an Angular-aware collection which wraps the FlexiSpecs mongo collection.
 */
ngMeteorFleximodel =
    angular.module('ngMeteorFleximodel', ['ngMeteor'])
        .run(['$rootScope', function($rootScope){
            //  $collection('FlexiSpecs', $rootScope);
        }]);

/**
 * Create an angular module named 'ngMeteorForms' on which we will hang all of our directives
 * and from which meteor-forms users will derive their own controllers when user-defined controllers are needed.
 * Inject the angularized Fleximodel module as a dependency. I doubt this is even needed so we may just dump this prior
 * to general release of this package.
 */
ngMeteorForms = angular.module('ngMeteorForms', ['ngMeteorFleximodel']);

/**
 * Provide an initially empty hash to be used by framework users to register their own templates to be used in place
 * of the framework-provided ones. This 'substitution' of user-provided templates for 'stock' templates allows users
 * to provide their own rendering templates for any or all of the field types. To use, simply add an entry to this
 * registry hash in which the key is the 'stock' template name (meteor/spacebars template name) and the value is the
 * meteor/handlebars template name which you wish to have used in place of the stock template. Note that you can also,
 * of course, create angular directives which can manipulate the elements which you 'generate' or provide as the
 * contents of your template. The stock directives and templates act as examples for your reference.
 */
ngMeteorForms.templateRegistry = {};

ngMeteorForms.displayStringRegistry = {};

ngMeteorForms.useReactiveQueries = true;

ngMeteorForms.meteorFindOne = function(collection, query, reactive){
    var theQuery = (typeof query == 'undefined') ? {} : query;
    var isReactiveQuery = (typeof reactive == 'undefined') ? ngMeteorForms.useReactiveQueries : reactive;
    return ngMeteorForms.meteorFind(collection, theQuery, true, isReactiveQuery);
};


ngMeteorForms.meteorFind = function(collection, query, single, reactive){
    var result = null;

    var findSingle = (typeof single == 'undefined') ? false : single;
    var theQuery = (typeof query == 'undefined') ? {} : query;
    var isReactiveQuery = (typeof reactive == 'undefined') ? ngMeteorForms.useReactiveQueries : reactive;
    if(findSingle){
        result = collection.findOne(query, {reactive: isReactiveQuery});
    }else {
        result = collection.find(theQuery, {reactive: isReactiveQuery});
    }

    return result;
};

/**
 * Return the size of the collection which should be used to populate the selection options for the
 * single or multi-selection control specified by the supplied <field>.
 */
var _getCollectionSize = function(field){
    var collectionSize = 0;
    if(field.options.collectionName && typeof field.options.collectionName === 'string'){
        var collection = FlexiModels[field.options.collectionName];
        if(collection && typeof collection.find === "function"){
            collectionSize = ngMeteorForms.meteorFind(collection).count();
        }else{
            collection = getGlobal(field.options.collectionName);
            if(collection && typeof collection.find === 'function'){
                collectionSize = ngMeteorForms.meteorFind(collection).count();
            }
        }
    }else{
        if(field.options.collection &&  _.isArray(field.options.collection)){
            collectionSize = field.options.collection.length;
        }
    }
    return collectionSize;
};

/**
 * Define a registry hash which maps the 'type' of a fleximodel field to an 'input' element's 'type' attribute value.
 * This value will be used to set the value of the type attribute assigned to the 'input' element generated for the given field.
 * In the case that the 'value' is actually a function, the field spec will be passed in to the function as 'this' and
 * it is expected that the function will return a string which will then be used as the value of the 'type' attribute
 * for the generated input element.
 */
ngMeteorForms.templateMapping = {
    'collection': 'collection',
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
        var result = 'select';
        if(field.options){
            var collectionSize = _getCollectionSize(field);

            if(collectionSize > 1){
                result = "radio";
            }
            if(collectionSize > 5){
                result = "select";
            }
        }
        if(field.widgetType){
            return field.widgetType;
        }
        return result;
    },
    'multi': function(field){
        var collectionSize = _getCollectionSize(field);
        var result = 'checkbox';
        if(collectionSize > 5){
            result = "select";
        }
        return result;
    }
};

/**
 * Define a registry hash which maps the types of 'automated' error messages that can be added by angular to arrays of
 * input element types. This is used during field element replacement/generation when deciding which error message divs
 * to add for a given field definition. If the field type is lised in the value array for a given error type, then,
 * provided the field itself provides a suitable 'limit' or 'pattern' value for that restriction type, an error div
 * with an appropriate error message will be added to the dom. That div will be shown only when the given constraint
 * is violated.
 *
 * TODO ensure this actually is being honored in the generated code.
 */
ngMeteorForms.errorTypes = {
    'max': ['date', 'time', 'datetime', 'integer', 'float'],
    'min': ['date', 'time', 'datetime', 'integer', 'float'],
    'required': ['text', 'textarea', 'date', 'time', 'datetime', 'integer', 'float'],
    'minlength': ['text', 'textarea', 'integer', 'float', 'url', 'email'],
    'maxlength': ['text', 'textarea', 'integer', 'float', 'url', 'email'],
    'pattern': ['text', 'textarea', 'integer', 'float', 'url', 'email']
};