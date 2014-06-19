/**
 * Created by pavlovich on 4/14/14.
 */

////////////////////////////////////////////////////////////////////
/**
 * Base type prototype additions
 */
////////////////////////////////////////////////////////////////////

String.prototype.toCamel = function(){
    return this.replace(/(\-[a-z])/g, function($1){return $1.toUpperCase().replace('-','');});
};

////////////////////////////////////////////////////////////////////
/**
 * Configure Mongo Collections
 */
////////////////////////////////////////////////////////////////////

/**
 * Register a transformation on the mongo collection named FlexiSpecs which, when applied, updates the passed flexispec
 * by adding the 'getTemplate' function to each of its fields and then returns the modified flexispec.
 */
FlexiSpecs._transform = function(doc){
    if (doc.fields && _.isArray(doc.fields)) {
        _.each(doc.fields, function(field){
            field.getTemplateName = fieldGetTemplate;
        });
    }
    return doc;
};

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
        .run(['$collection', '$rootScope', function($collection, $rootScope){
            $collection('FlexiSpecs', $rootScope);
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

/**
 * Return the size of the collection which should be used to populate the selection options for the
 * single or multi-selection control specified by the supplied <field>.
 */
var _getCollectionSize = function(field){
    var collectionSize = 0;
    if(field.options.collectionName && typeof field.options.collectionName === 'string'){
        var collection = FlexiModels[field.options.collectionName];
        if(collection && typeof collection.find === "function"){
            collectionSize = collection.find().count();
        }else{
            collection = getGlobal(field.options.collectionName);
            if(collection && typeof collection.find === 'function'){
                collectionSize = collection.find().count();
            }
        }
    }else{
        if(field.options.collection &&  _.isArray(field.options.collection)){
            collectionSize = field.options.collection.length;
        }
    }
    return collectionSize;
};

var _setValueOfPath = function(obj, path, value, overwrite){
    var result = value;
    var pathComponents = path.split('.');
    _.reduce(pathComponents,
        function(memo, key){
            if(this == key){
                if(memo[key]){
                    if(overwrite){
                        memo[key] = value;
                    }
                    result = memo[key];
                    return result;
                }
                memo[key] = value;
                return value;
            }else{
                if(memo[key]){
                    return memo[key]
                }else{
                    memo[key] = {};
                    return memo[key]
                }
            }
        }, obj, _.last(pathComponents));

    return result;
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
}

////////////////////////////////////////////////////////////////////
/**
 * Register global template helpers
 */
////////////////////////////////////////////////////////////////////

/**
 * Output a field group element if the current element has a 'type' which matches the name of a FlexiType document.
 * Otherwise, just output a field element.
 */
Package.ui.UI.registerHelper("sgiAutoformElementTemplate", function () {
    var templateName = '_sgiAutoformField';
    if(this && this.type && !_.isArray(this.type)){
        var flexiSpec = FlexiSpecs.findOne({name: this.type.toString()});
        if(flexiSpec){
            templateName = '_sgiAutoformFieldGroup';
        }
    }
    return Package.templating.Template[templateName];
});

/**
 * If the current element has 'inline' set to true, output the string 'inline' to be output as a marker attribute for the current element.
 * Otherwise, output an empty string.
 */
Package.ui.UI.registerHelper("sgiInline", function () {
    if(this.inline){
        return " inline";
    }else{
        return "";
    }
});

////////////////////////////////////////////////////////////////////
/**
 * Define 'helper' functions used by the directives defined below.
 */
////////////////////////////////////////////////////////////////////

/**
 * As we prepare the fields of a flexispec to be used by the framework, we attach this function as the value of the
 * 'getTemplate' attribute. This allows us to later call this function in order to determine which template we should
 * use to replace the generated field element with a real html input element or radio group. We assign this function
 *
 */
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
    if (this.type && !_.isArray(this.type) && ngMeteorForms.templateMapping && this.type in ngMeteorForms.templateMapping) {
        var result = ngMeteorForms.templateMapping[this.type];
        if (result) {
            if (typeof result == 'function') {
                return result.call(this);
            } else {
                return result;
            }
        }
    }else{
        if(this.type && _.isArray(this.type)){
            return ngMeteorForms.templateMapping['collection'];
        }
    }
    return this.type ? this.type : null;
};

/**
 * Given a 'dataId' representing the full 'path' to a given field definition, replace the first component of this path
 * with the string 'model'. For example, assume you have a 'person' flexispec which has an 'address' field of type 'address'.
 * Assume that you have another flexispec named 'address' which has a 'region' field of type 'region'. And then suppose
 * that you have another flexispec named 'region' which has a 'zipCode' field of type 'text'. Then, if you were looking
 * at the zipCode field for a person's address, its 'full path' would be 'person.address.region.zipCode'. In this case,
 * this function would return 'model.address.region.zipCode'.
 *
 * This allows us to assume a single, uniformly named attribute defined on our directives' scopes named 'model' exists
 * and holds our data model which is used to populate our form.
 *
 * TODO This works well for single-model-single-form scenarios. For more complex scenarios, perhaps we need to explore having a model on the scope which has top level attributes named 'person' or 'registration' etc which each hold a given document of that type. This would allow forms to 'operate' on more than one model at a time.
 */
var getModelId = function(dataId) {
    var res = 'model';
    var tempId = dataId.split('.');
    _.each(_.rest(tempId), function(ele){
        res = res + '.' + ele;
    });
    return res;
};

/**
 * Given a key representing the 'stock' name of a template (meteor/spacebars template, that is), check to see if the
 * user of the framework has registered a 'replacement' template to use in place of the 'stock' one. If so, return
 * the replacement template. Otherwise, return the corresponding stock template.
 */
var getTemplateForKey = function(key){
    var templateKey = ngMeteorForms.templateRegistry[key] ? ngMeteorForms.templateRegistry[key] : key;
    var result = Package.templating.Template[templateKey];
    // TODO :: Not sure why this is a to do? Maybe we need to externalize the error message? Dunno. :::  console.log("Couldn't find a template with name: '" + templateKey + "' which you indicated should override the framework template named '" + key + "'. Using the framework template as a fallback");
    return result ? result : Package.templating.Template[key];
};

/**
 * Given a 'fieldId', such as 'person.address.region.zipCode' (from the comment to the 'getModelId' function defined above),
 * return the actual field specification by traversing the flexispecs implied by the components of that fieldId.
 *
 * In more detail, it is assumed that the first component is the name of a top-level flexispec, in this case, 'person'.
 * Furthermore, it is assumed that the 'person' flexispec has a field named 'address'. Since 'address' is not the last
 * component in the fieldId, it is further assumed that the 'address' field has a type attribute, the value of which is
 * the name of yet another flexispec and this new flexispec has a field named 'region'. Since 'region' is not the final
 * component of the fieldId, it is then assumed that the 'region' field definition has a 'type' atribute whose value is
 * the name of yet another flexispec which, itself, has a field with name 'zipCode'. Since 'zipCode' is the last
 * component of the fieldId, it is assumed that it is a 'primitive' type ('text', 'boolean', 'single', 'multi', etc).
 */
getField = function (fieldId) {
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

/**
 * Return a template suitable to use in replacing the supplied element and attendant attributes.
 *
 * In more detail, we take the supplied element and, since it is a jQuery-wrapped element, we extract the
 * 'real' element using 'element.context'. Next, we get the element's local name (which is just the name of the element
 * as it appears right after the '<' in the HTML notation for that element. We then convert that element name to
 * camel case (since it is most likely in x-y-z format). Now this is assumedly the 'stock' name of the desired template
 * to use to replace the element under consideration. We then check to see if the framework user has registered their
 * own template name to use in place of our 'stock' template name. This is done using the 'getTemplateForKey' function.
 * Next we check to see if the template we have arrived at thus far defines its own 'override' function (currently 'sgiTemplate' although TODO this needs to change.)
 * If so, we call that function passing the same arguments that we received and expecting this override function to
 * return the final template for use to use in replacing the current element. Otherwise, we just return the template
 * we had arrived that prior to this check.
 *
 * Note that users of the framework can define the same 'override' function on their own templates which they register
 * as 'overrides' to the 'stock' templates. Their override functions will be called at this point just as they are called
 * with the 'stock' templates. This is used within the 'stock' framework templates to dynamically replace the 'stock'
 * field template with an appropriate specific template like 'radio' or 'date picker'
 */
var getSgiElementTemplate = function(element, attrs){
    var templateName = element.context.localName.toCamel();
    var template = getTemplateForKey(templateName);
    template = (template.sgiTemplate && typeof template.sgiTemplate == 'function') ? template.sgiTemplate(element, attrs) : template;
    return template;
};

/**
 * Replace the supplied element in the DOM with the result of fully rendering the template implied by the element and
 * the value of its attributes.
 *
 * In detail, we obtain the appropriate (meteor/spacebars) template, create an appropriate object to act as our context
 * and then render that template in the context of that object. Then we replace the element in the DOM with the result
 * of that rendering.
 *
 * Note that we say 'fully rendering' here because we don't simply render the template in the 'meteor way'.
 * We do that, but then the result of that initial meteor rendering is then evaluated by Angular which applies any
 * appropriate directives. Of course, applying those directives could result in additional DOM changes which call for
 * some of the new elements to be, in turn, replaced by further meteor template rendering the results of each of which
 * themselves will be processed by angular themselves possibly resulting in yet another round. And so on ...
 */
var expandElement = function(element, attrs) {
    var template = getSgiElementTemplate(element, attrs);
    var context = template.createContext(element, attrs);
    var result = ngMeteor.renderTemplateInContext(template, context);
    element.replaceWith(result);
};

/**
 * Set the value of the 'formName' attribute of the supplied 'receiver' (typcially, a field definition) to be
 * the name of the 'closest' form to the supplied element.
 */
var setFormName = function(receiver, element){
    var formName = null;
    try {
        var form = $(element).closest('ng-form').get(0);
        formName = form.getAttribute('name');
    }catch(e){
        console.log("Unable to find a form enclosing the given element: " + element);
    }
    receiver.formName = formName;
};

/**
 * Set the 'field' attribute of the supplied scope to hold the field object obtained by traversing the appropriate
 * path through the flexispecs indicated by the value of the supplied 'id' attribute.
 */
var setField = function(scope, attributes){
    var modelId = (attributes.id == 'model') ? attributes.modelId : attributes.id;
    var theField = getField(modelId);
    if(_.isArray(theField.type) && attributes.unwrapped){
        theField = owl.deepCopy(theField);
        theField.type = theField.type[0];
    }
    scope.field = theField;
};

/**
 * Update the provided scope with the field and other options as determined by interpreting the supplied element and attributes.
 */
var updateScope = function(scope, element, attributes){
    //TODO remove this if we really don't need it ... doesn't appear, at present, to be necessary. ::: setFormName(scope, element);
    setField(scope, attributes);

    var field = scope.field;

    if(_.isNull(field) || _.isUndefined(field)){
        // No field associated with a non-data-oriented element (like a DIV). Do nothing to the scope.
    }else {

        if(field.type && _.isArray(field.type)){
            if(FlexiSpecs.findOne({name: field.type[0]})){
                scope.collection = _setValueOfPath(scope, getModelId(attributes.id), [], false);
                scope.myIndex = null;
                scope.singleMode = false;
            }else{
                //  var formScope = angular.element($(element).closest('.sgi-collection-field').find('ng-form').parent().parent()).scope();
                var theCollection = _setValueOfPath(scope, getModelId(attributes.id), [], false);
                //  formScope.model = theCollection;
                scope.collection = theCollection;
                scope.myIndex = null;
                scope.singleMode = true;
            }
        };

        if (field.type && _.contains(['single', 'multi'], field.type)) {
            if (field.options && field.options.collectionName && typeof field.options.collectionName === 'string') {

                var collection = FlexiModels[field.options.collectionName];
                //First check if this is a select from a fleximodel
                if (collection && typeof collection.find === 'function') {
                    if (!(field.options && typeof field.options === 'object')) {
                        field.options = {};
                    }
                    ;
                    field.options.collection = collection.find().fetch();
                } else {
                    //Else, see if it is the name of a global collection
                    var collectionName = _.capitalize(owl.deepCopy(field.options.collectionName));
                    var meteorCollection = getGlobal(collectionName);
                    if (meteorCollection && typeof meteorCollection.find === 'function') {
                        if (!(field.options && typeof field.options === 'object')) {
                            field.options = {};
                        }
                        ;
                        field.options.collection = collection.find().fetch();
                    }
                }
            }
        }

        if (scope.field && scope.field.options) {
            scope.options = scope.field.options.collection;
        }
    }
};

/**
 * Answer the value stored in the Global variable with the supplied name. If on the client, look for the global on the
 * 'window' object, otherwise look in the delegate (this). This function is used to 'find' or 'discover' existing
 * meteor/mongo collections/subscriptions and is used in creating context objects used when rendering meteor templates.
 */
var getGlobal = function(globalName){
    var self = this;
    if(Meteor.isClient){
        self = window;
    }
    var result = self[globalName];
    return result ? result : undefined;
}

/**
 * Return a new base context which is the starting point for all contexts used by the framework when rendering meteor
 * spacebars templates. This function creates a new context object which is populated with the attribute values
 * supplied in the 'attrs' parameter + a new attribute, 'contents', which has the value of the innerHTML of the original
 * element.
 */
var createNonFieldContext = function(element, attrs){
    var context = owl.deepCopy(attrs);
    context.contents = element.context.innerHTML;
    return context;
};

/**
 * Create construct a context object based on a field definition for use in rendering field replacement templates.
 *
 * In detail, we retrieve an appropriate field object and clone it to act as our model. We then augment its attributes
 * with some additional data based on the attributes of the element we are replacing and then return the udpated
 * cloned field object.
 */
var getFieldAsContextObject = function(element, attrs){

    var modelId = attrs.id;
    if(modelId == 'model'){
        modelId = attrs.modelId;
    }
    var field = getField(modelId);
    if(field) {
        field = owl.deepCopy(field);
        setFormName(field, element);
        if(attrs.unwrapped && _.isArray(field.type)){
            field.unwrapped = true;
            field.type = field.type[0];
        }
        if(field.unwrapped && field.type && !FlexiSpecs.findOne({name: field.type})){
            field.modelId = "model[myIndex]"
        }else{
            field.modelId = getModelId(attrs.id);
        }
        field.id = modelId;
        field.fieldId = attrs.id.replace(/\./g,'');
        field.inline = attrs.inline;
        field.showLabel = (field.inline || field.unwrapped) ? false : true;
        var attributeString = "";

    }else{
        console.log("unable to find field with id: " + modelId);
    }

    return field;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
 * Define angular directives to handle the replacement of template elements with their expanded, re-rendered contents.
 */
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var sgiFieldController = function($scope){
    var setFocusToNewCollectionModelFirstEntryField = function($event){
        var element = $($event.currentTarget).closest('.sgi-collection-field').find('.sgi-new-model').find('input:not([type=hidden]):first');
        setTimeout(function(){
            element.focus();
        }, 1);
    };

    $scope.isSelectedRow = function(index){
        return index == this.myIndex;
    };

    $scope.isInvalidRow = function(index){
        var errors = [];
        var spec = null;
        var doc = this.collection && this.collection[index] ? null : this.collection[index];
        if(!doc){
            return true;
        };

        FlexiSpecs.verifyRules(doc, spec, null, errors);

        return _.isEmpty(errors);
    };

    $scope.hasAvailableCollection = function(aCollection){
        return aCollection && !_.isEmpty(aCollection);
    };

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
    $scope.switchModel = function(index, $event){
        var formScope = angular.element($($event.currentTarget).closest('.sgi-collection-field').find('ng-form').parent().parent()).scope();
        $scope.myIndex = index;
        if(!$scope.singleMode){
            formScope.model = $scope.collection[index];
        }
        setFocusToNewCollectionModelFirstEntryField($event);
    };
    $scope.addModel = function(collectionx, $event){
        var formScope = angular.element($($event.currentTarget).closest('.sgi-collection-field').find('ng-form').parent().parent()).scope();
        var newSpec = $scope.field.type;
        if(_.isArray(newSpec)){
            newSpec = newSpec[0];
        };

        var newObj = FlexiSpecs.create(newSpec);

        if(!$scope.singleMode) {
            $scope.collection.push(newObj);
            $scope.myIndex = $scope.collection.length - 1;
            formScope.model = newObj;
        }else{
            if($scope.collection != formScope.model){
                formScope.model = $scope.collection;
            }
            formScope.model.push(newObj);
            $scope.myIndex = formScope.model.length - 1;
        }

        setFocusToNewCollectionModelFirstEntryField($event);
    };
};

var sgiFieldPreLink = function preLink(scope, iElement, iAttrs, controller) {
    scope.xid = iAttrs.id;
    scope.modelId = getModelId(iAttrs.id);
    Deps.autorun(function(){
        if(!scope.$$phase) {
            scope.$apply(function () {
                updateScope(scope, iElement, iAttrs);
            })
        }else{
            updateScope(scope, iElement, iAttrs);
        }
    })
};

var sgiFieldCompile = function compile(element, attrs) {
    expandElement(element, attrs);
    return {
        pre: sgiFieldPreLink
    }
};

var sgiAutoformController = function($scope){
    var self = $scope;

    $scope.getModel = function(){
        return this.model;
    };
    $scope.setModel = function(value){
        self.model = value;
    };
    $scope.getDisplayString = function(myItem, internal){
        var result = "";
        if(myItem && typeof myItem.toSgiDisplayString == 'function'){
            result = myItem.toSgiDisplayString();
        }else {
            result = _.reduce(myItem, function (memo, value, attribute) {
                if (value) {
                    if (!_.startsWith(attribute, '$') && !(_.startsWith(attribute, '_'))) {
                        var addOnString = "";
                        if (typeof value.toSgiDisplayString == 'function') {
                            addOnString = value.toSgiDisplayString();
                        } else {
                            if (typeof value == 'object') {
                                addOnString = this.getDisplayString(value, true);
                            } else {
                                addOnString = value;
                            }
                        }
                        if (addOnString && !_.isEmpty(addOnString)) {
                            if (memo && !_.isEmpty(memo)) {
                                return memo + ", " + addOnString;
                            }
                            return addOnString;
                        }
                    }
                }
                return memo;
            }, "", this);
        }
        if(internal || (result && !_.isEmpty(result))){
            return result;
        }
        return "New entry! Please select to edit.";
    };

    // $scope.setModel({gender: 'female', name: {firstName: 'Abbey', lastName: 'Pavlovich'}});

    $scope.save = function(){
        this.preSave();
        console.log("Built-in Save happening now!");
        var baseObj = this.getModel();
        var baseSpec = FlexiSpecs.findOne({name: this.flexiModelname});
        var converted = FlexiSpecs.convert(baseObj, baseSpec);
        //TODO have to validate yet.
        FlexiModels[this.flexiModelname].insert(converted);
        console.log("Built-in Save complete.")
        this.postSave();
    };
    $scope.preSave = function(){
        console.log('preSave from internal controller');
    };
    $scope.postSave = function(){
        console.log('postSave from internal controller');
    };

    if(!$scope.model) {
        $scope.setModel({})
    }
};

var sgiAutoformPreLink = function preLink(scope, iElement, iAttrs, controller){
    //  Deps.autorun(function(){
    scope.flexiModelname = iAttrs['model'];
    scope.unwrapped = iAttrs['unwrapped'];
    if(scope.unwrapped){
        if(scope.singleMode){
            scope.model = scope.collection;
        }
    }
    //  })
};

var sgiAutoformCompile = function compile(element, attrs){
    expandElement(element, attrs);
    return {
        pre: sgiAutoformPreLink
    }
};

ngMeteorForms
/**
 * The 'sgiField' directive replaces 'sgi-field' elements with an appropriate input-type field based on the field
 * definition specified by the value of the 'data-id' attribute of this HTML element.
 */
    .directive('sgiField', ['$compile', function ($compile) {
        return {
            restrict: 'E',
            scope: true,
            controller: ['$scope', sgiFieldController],
            compile: sgiFieldCompile
        };
    }])
/**
 * The 'sgiAutoform' directive replaces the 'sgi-autoform' element with a fully functional input/edit form based on
 * the model specified by the flexispec whose name matches the value of the 'model' attribute of this HTML element.
 */
    .directive('sgiAutoform', ['$compile', function ($compile) {
        return {
            restrict: 'E',
            scope: true,
            controller: ['$scope', sgiAutoformController],
            compile: sgiAutoformCompile
        }
    }]);
//    .directive('sgiMaxCount', ['$scope', function (scope){
//        return {
//
//            require: 'ngModel',
//            restrict: 'A',
//            link: function(scope, elem, attr, ngModel) {
//
//                if(scope && scope.field && scope.field.validation && scope.field.validation.maxCount && scope.field.validation.maxCount.value) {
//                    var max = Number.parse(scope.field.validation.maxCount.value);
//                }
//
//                //For DOM -> model validation
//                ngModel.$parsers.unshift(function(value) {
//                    var valid = blacklist.indexOf(value) === -1;
//                    ngModel.$setValidity('blacklist', valid);
//                    return valid ? value : undefined;
//                });
//
//                //For model -> DOM validation
//                ngModel.$formatters.unshift(function(value) {
//                    ngModel.$setValidity('blacklist', blacklist.indexOf(value) === -1);
//                    return value;
//                });
//            }
//        }
//    }]);



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
 * At startup, augment selected templates with additional functions and attributes which override default behaviors.
 * Also, for non-field and non-autoform templates, define directives to handle the replacement of the corresponding
 * HTML element with the result of 'fully rendering' the appropriate meteor spacebars template.
 */
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

Package.meteor.Meteor.startup(function(){

    /**
     * Populate two temporary register hashes with the names of templates: One for 'field-oriented' templates,
     * the other for 'non-field' or 'other' templates.
     */
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

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Define common, standard 'createContext' and 'sgiTemplate' functions.
     */

    var standardCompile = function compile(element, attrs){
        expandElement(element, attrs);
    };

    var standardSgiTemplate = function(element, attrs){return this};

    /**
     * For each non-field-oriented template, define a directive for that template which simply replaces the corresponding
     * elements with the results of rendering that template in an appropriate context. Also augment each of these templates
     * providing them with a createContext and a sgiTemplate function.
     */
    _.each(otherSgiTemplateNames, function(directiveName){
        var directiveDefinitionWithScope = {
            restrict: 'E',
            scope: true,
            compile: standardCompile
        };

        var directiveDefinition = {
            restrict: 'E',
            compile: standardCompile
        };

        var directiveDefinitionHolder = (directiveName == 'sgiAutoform') ? directiveDefinitionWithScope : directiveDefinition;
        ngMeteorForms.directive(directiveName, function(){return directiveDefinitionHolder});

        var template = getTemplateForKey(directiveName);
        template.createContext = createNonFieldContext;
        template.sgiTemplate = standardSgiTemplate;
    });

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Define common field 'createContext' and 'sgiTemplate' functions
     */

    var sgiFieldCreateContext = function(element, attrs){
        return getFieldAsContextObject(element, attrs);
    };

    var sgiFieldSgiTemplate = function(element, attrs){
        var template = null;
        var context = this.createContext(element, attrs);
        if(context){
            var templateName = context.getTemplateName();
            sgiTemplateKey = 'sgi' + _.capitalize(templateName) + 'Field';
            template = getTemplateForKey(sgiTemplateKey);
        }
        return template ? template : getTemplateForKey('sgiTextField');
    };

    /**
     * For each field-oriented template, simply augment the template with an appropriate 'createContext' and 'sgiTemplate'
     * function.
     */
    _.each(fieldTemplateNames, function(templateName){

        var sgiFieldTemplate = getTemplateForKey(templateName);

        sgiFieldTemplate.createContext = sgiFieldCreateContext;
        sgiFieldTemplate.sgiTemplate = sgiFieldSgiTemplate;
    });

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * For the radio field template (actually a radio button group), customize the 'createContext' function.
     */
    var radioField = getTemplateForKey('sgiRadioField');

    radioField.createContext = function(element, attrs){
        var context = getFieldAsContextObject(element, attrs);
        context.orientation = ('vertical' in attrs) ? 'vertical' : '';
        if(context && context.options && context.options.collection){
            _.each(context.options.collection, function(option){
                option.modelId = context.modelId;
                option.name = context.name;
            })
            return context;
        }
    };

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * For the radio button template, customize the 'createContext' function.
     */
    var radioButton = getTemplateForKey('sgiRadioButton');

    radioButton.createContext = function(element, attrs){
        return owl.deepCopy(attrs);
    }

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * For the sgiAutoForm template, customize the 'createContext' function.
     */
    var sgiAutoform = getTemplateForKey('sgiAutoform');

    sgiAutoform.createContext = function(element, attrs){
        var context = createNonFieldContext(element, attrs);
        var modelNameString = attrs['model'] ? (_.capitalize(attrs['model']) + " ") : "";
        context.formTitle = "New " + modelNameString + "Information";
        return context;
    };

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * For the collection field template, customize the 'createContext' function.
     */
    var collectionField = getTemplateForKey('sgiCollectionField');

    collectionField.createContext = function(element, attrs){
        var context = getFieldAsContextObject(element, attrs);
        context.myIndex = 0;
        return context;
    };
});

/**
 * Replace the default ngMeteor flexistrap configuration so that the ngMeteor module is NOT bootstrapped into the
 * main document and so that the ngMeteorForms module is bootstrapped into any div with the class 'meteor-form' for all routes.
 */
ngMeteor.addFlexistrap('div.meteor-form', 'ngMeteorForms', '*', true);
