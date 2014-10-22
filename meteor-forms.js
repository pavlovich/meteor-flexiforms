/**
 * Created by pavlovich on 4/14/14.
 */


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

////////////////////////////////////////////////////////////////////
/**
 * Register global template helpers
 */
////////////////////////////////////////////////////////////////////

/**
 * Register a helper function which returns the template to render for the element currently being processed.
 * Specifically, return a field group template if the current element represents a nested model. This is indicated by
 * the current element having a 'type' attribute value which matches the name of an existing FlexiType document.
 * Otherwise, return a generic field element template.
 */
Package.ui.UI.registerHelper("sgiAutoformElementTemplate", function () {
    var templateName = '_sgiAutoformField';
    if(!_.isArray(this.type)){
        var flexiSpec = ngMeteorForms.meteorFindOne(FlexiSpecs, {name: this.type.toString()});
        if(flexiSpec){
            templateName = '_sgiAutoformFieldGroup';
        }
    }
    return getTemplateForKey(templateName);
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
    var result = null;
    if (!_.isArray(this.type)) {
        result = ngMeteorForms.templateMapping[this.type];
        if (result) {
            if (typeof result == 'function') {
                return result.call(this);
            } else {
                return result;
            }
        }
    }else{
        if(_.isArray(this.type)){
            result = ngMeteorForms.templateMapping['collection'];
            if (result) {
                if (typeof result == 'function') {
                    return result.call(this);
                } else {
                    return result;
                }
            }
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
    var typeName = _.first(attributeMap);
    var type = {fields: {}};
    (type.fields)[typeName] = {type: typeName};

    _.each(_.initial(attributeMap), function(attributeName){
        typeName = (type.fields)[attributeName].type;
        type = ngMeteorForms.meteorFindOne(FlexiSpecs, {name: typeName});
        if(!type){return null};
    });

    var field = (type.fields)[_.last(attributeMap)];
    field.getTemplateName = fieldGetTemplate;

    return field;
};

/**
 * Return a template suitable to use in replacing the supplied <element> and accompanying <attributes>.
 *
 * In more detail, we take the supplied element and, since it is a jQuery-wrapped element, we extract the
 * 'real' element using 'element.context'. Next, we get the element's local name (which is just the name of the element
 * as it appears right after the '<' in the HTML notation for that element). We then convert that element name to
 * camel case (since it is most likely in x-y-z format). This name is assumed to be the name of the default,
 * package-provided template associated with the given element name. We then check to see if the package user has
 * registered their own custom replacement template to use in place of our 'stock' template. This is done using the
 * 'getTemplateForKey' function which checks the internal registry which maps standard element names to the name of the
 * template to use when replacing those elements. Next we grab the template associated with whatever template name we
 * have arrived at thus far. We then check to see if that template defines a method named 'sgiTemplate'. If so, it is
 * assumed that this function will act as an 'override' function and we will call that function, passing the same
 * arguments that we received as parameters to our own calling. We expect this override function to return the final
 * template for use to use in replacing the current element. If no override function is defined for the arrived at
 * template, we just return the template we had arrived at prior to this last check.
 *
 * Note that users of the framework can define the same 'override' function on their own templates which they register
 * as 'overrides' to their own 'stock' templates. Their override functions will be called at this point just as they are called
 * with the package-supplied templates. This feature is used to allow users of the package to dynamically replace the 'stock'
 * field template with a template of the package consumer's choice.
 */
var getSgiElementTemplate = function(element, attributes){
    var templateName = element.context.localName.toCamel();
    var template = getTemplateForKey(templateName);
    template = (template.sgiTemplate && typeof template.sgiTemplate == 'function') ? template.sgiTemplate(element, attributes) : template;
    return template;
};

/**
 * Replace the supplied <element> in the DOM with the result of fully rendering the template which has been registered as
 * the replacement for that supplied <element>, qualified, where appropriate, by the values of its <attributes>.
 *
 * In detail, we first obtain the appropriate (meteor/spacebars) template, then create an appropriate object to act as
 * our context for the rendering of that template and then render that template in the context of that object.
 * Then we replace the <element> in the DOM with the result of that rendering.
 *
 * Note that we say 'fully rendering' here because we don't simply render the template in the 'meteor way'.
 * We do that, but then the result of that initial meteor rendering is then evaluated by Angular which applies any
 * appropriate directives or filters. Of course, applying those directives could result in additional DOM changes which call for
 * some of the new elements to be, in turn, replaced by further meteor template rendering the results of each of which
 * themselves will be processed by angular themselves possibly resulting in yet another round. And so on. Once all possible
 * renderings by both meteor/spacebars as well as Angular have completed recursively, we add that final result into the
 * DOM after the original <element> and then remove the original <element> from the DOM.
 */
var expandElement = function(element, attributes) {

    var template = getSgiElementTemplate(element, attributes);
    var context = template.createContext(element, attributes);

    var theElement = element[0];
    var theParent = theElement.parentNode;

    if(theParent) {
        Blaze.renderWithData(template, context, theParent, theElement);
        element.remove();
    }
};

/**
 * Set the value of the 'formName' attribute of the supplied 'receiver' (typically, a field definition) to be
 * the name of the 'closest' form element (ancestor-wise) to the supplied element.
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
 * Set the 'field' attribute of <scope> to hold a representation of the field object obtained by traversing the appropriate
 * path through the graph of defined Flexispecs as specified by the value of the supplied 'id' attribute which may be
 * held in either the 'modelId' attribute (in the case of this being our top-level field definition for the form)
 * or the 'id' attribute (in all other cases). In the case where we are dealing with a field specifiying a collection-type
 * value, as indicated by <attributes> having an 'unwrapped' value set to true, we then hold a deep copy as the
 * field object will serve as we need to modify the type attribute to not be an array but, rather, whatever single element
 * the original array contained (e.g. 'email' as opposed to ['email']) and we don't want to make that change in the original.
 */
var setField = function(scope, attributes){
    var modelId = (attributes.id == 'model') ? attributes.modelId : attributes.id;
    var theField = getField(modelId);
    if(_.isArray(theField.type) && attributes.unwrapped){
        theField = owl.deepCopy(theField);
        theField.type = theField.type[0];
    }
    scope.field = theField;
    return theField;
};

/**
 * Operating on the supplied object, <obj>, (typically a model object being edited in a given form), return the value
 * of the attribute specified by the given <path> after, optionally, setting the value of that attribute to a supplied value.
 *
 * In detail, For the supplied object, <obj>, follow down the supplied <path> (a dot-separated chain of attributes names).
 * When reaching the end of that chain, if <overwrite> is true, set the attribute's value to <value>. Otherwise,
 * check to see if a value already has been set there. If so, do not change it. Finally, return the then current value
 * of the specified attribute (after setting it to the new value if so called for).
 * @param obj The base object on which to set an attribute's value
 * @param path The path or chain of attribute names as a dot-separated list which leads to the attribute whose value you wish to set.
 * @param value The value to set for the attribute.
 * @param overwrite If true, set the value for the attribute regardless of whether a value has already been set. If false, only set a value if one has not been already set.
 * @returns The resulting value stored in the attribute in question (could be the previously set value or the newly provided one depending on options. Could be null.
 */
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
 * We are going to process an angular directive against a dynamically generated template. Prepare the <scope> appropriately.
 *
 * In detail, set a field attribute to hold the field object as specified by the 'id' in the supplied <attributes>.
 * If that field represents a collection of things we can edit in-line, we set the scope's 'collection' attribute to
 * point to the current collection of objects held by the model being edited (or an empty array, if not yet initialized).
 * Also, set the 'myIndex' attribute to null (indicating that we are currently not actually editing any of the objects
 * in that nested collection attribute). Also, in this case, we must decide if the collection of 'things' we are editing
 * is composed of primitive values (strings, dates, numbers, etc) or other complex model objects of a particular type.
 * If the type for the field is specified as an array of something which is the name of an existing Flexispec, then we
 * know we have a collection of complex model objects not of primitive objects.
 *
 * If field type is not an array, but is either 'single' or 'multi', then the field represents either a single or
 * multiple selection from a collection of pre-defined 'things'. That being the case, we then determine if the collection
 * of "things" we will be picking one or more items from is from a hard-coded collection specified literally in the
 * relevant Flexispec (as indicated by the 'collectionName' attribute holding the value 'string'), from a specific
 * collection of Fleximodel instances (indicated by the field's collectionName attribute being set to the name of an
 * existing Flexispec) or from a collection defined in the Global name space (as indicated by the collectionName being
 * set to the name of a defined global value. In any case, once the collection is found, set the scope's 'options'
 * attribute to point to that collection.
 */
var updateScope = function(scope, attributes){

    var field = setField(scope, attributes);

    /**
     * Check if the <collection> has a 'find' function. If so, we can assume the collection is a Meteor collection. If
     * so, set the field's 'options.collection' attribute to the meteor collection by fetching its contents. Answer true
     * if the <collection> had a 'find' function.
     * @param collection
     * @returns {boolean}
     */
    function initializeFieldOptions(collection) {
        if (collection && typeof collection.find === 'function') {
            if (!(field.options && typeof field.options === 'object')) {
                field.options = {};
            }
            field.options.collection = ngMeteorForms.meteorFind(collection).fetch();
            return true;
        }
        return false;
    }

    if(_.isNull(field) || _.isUndefined(field)){
        // No field associated with a non-data-oriented element (like a DIV). Do nothing to the scope.
        console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>  should not get here")
    }else {
        if(_.isArray(field.type)){
            scope.collection = _setValueOfPath(scope, getModelId(attributes.id), [], false);
            scope.myIndex = null;
            //TODO singleMode should be renamed to something like 'editItemInCollectionMode' (which is an accurate description when this is true vs. 'editWholeCollectionMode' which is accurate when the current variable is false.
            if(ngMeteorForms.meteorFindOne(FlexiSpecs, {name: field.type[0]})){
                scope.singleMode = false;
            }else{
                scope.singleMode = true;
            }
        }else if (_.contains(['single', 'multi'], field.type)) {
            if (field.options && field.options.collectionName && typeof field.options.collectionName === 'string') {

                var collection = FlexiModels[field.options.collectionName];
                //First check if this is a select from a Fleximodel
                if(!initializeFieldOptions(collection)){
                    //Else, see if it is the name of a global collection
                    var collectionName = _.capitalize(owl.deepCopy(field.options.collectionName)); // TODO I don't think we need to do a deep copy of this.
                    var meteorCollection = getGlobal(collectionName);
                    initializeFieldOptions(meteorCollection);
                }
            }
        }

        if (field.options) {
            scope.options = field.options.collection;
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
};

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
 * Construct a context object based on a field definition for use in rendering field replacement templates.
 *
 * In detail, we retrieve an appropriate field object and clone it to act as our model. We then augment its attributes
 * with some additional data based on the attributes of the element we are replacing and then return the updated,
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
        if(field.unwrapped && !ngMeteorForms.meteorFindOne(FlexiSpecs, {name: field.type})){
            field.modelId = "model[myIndex]"
        }else{
            field.modelId = getModelId(attrs.id);
        }
        field.id = modelId;
        field.fieldId = attrs.id.replace(/\./g,'');
        field.inline = attrs.inline;
        field.showLabel = (field.inline || field.unwrapped) ? false : true;
    }else{
        console.log("unable to find field with id: " + modelId);
    }
    if(field.options && field.options.collection){
        field.options.label = field.options.label ? field.options.label : 'label';
        field.options.value = field.options.value ? field.options.value : 'value';
    }
    return field;
};

/**
 * Define compile pre-link and controller functions for sgiField directive
 */
var sgiFieldController = function($scope){

    var self = $scope;

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

        var errors = {};
        var myType = self.field.type[0];
        if(!myType){
            return true;
        }
        var doc = this.collection && this.collection[index] ? this.collection[index] : null;

        var mySpec = ngMeteorForms.meteorFindOne(FlexiSpecs, {name: myType});
        if(mySpec) {
            var spec = (myType) ? mySpec : null;

            if (!doc || !spec) {
                return true;
            };

            FlexiSpecs.verifyRules(doc, spec, null, errors);

        }else{
            mySpec = FlexiSpecs.typeMapping[myType];
            if(mySpec && doc){
                if(_.isFunction(mySpec.flexiValidate)) {
                    mySpec.flexiValidate(doc, self.field, 'test', errors);
                }else{
                    // no validation defined.
                    // TODO we need to validate regex!
                }
            }else{
                return true;
            }
        }
        return !_.isEmpty(errors);
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
            return self.field.validation[errorType].value !== null
        }catch(e){
            return false;
        }
    };
    $scope.setSelectedIndex = function(index){
        // self.$apply(function(){
        self.myIndex = index;
        // });
    };
    $scope.switchModel = function(index, $event){
        self.setSelectedIndex(index);
        if(!self.singleMode){
            var formScope = angular.element($($event.currentTarget).closest('.sgi-collection-field').find('ng-form').parent().parent()).scope();
            formScope.model = self.collection[index];
        }
        setFocusToNewCollectionModelFirstEntryField($event);
    };
    $scope.removeModel = function(index){
        self.collection.splice(index, 1);
        self.setSelectedIndex(null);
    };
    $scope.addModel = function(collectionx, $event){
        var formScope = angular.element($($event.currentTarget).closest('.sgi-collection-field').find('ng-form').parent().parent()).scope();
        var newSpec = self.field.type;
        if(_.isArray(newSpec)){
            newSpec = newSpec[0];
        };

        var newObj = FlexiSpecs.create(newSpec);

        if(!self.singleMode) {
            self.collection.push(newObj);
            self.setSelectedIndex(self.collection.length - 1);
            formScope.model = newObj;
        }else{
            if(self.collection != formScope.model){
                formScope.model = self.collection;
            }
            formScope.model.push(newObj);
            self.setSelectedIndex(formScope.model.length - 1);
        }

        setFocusToNewCollectionModelFirstEntryField($event);
    };
    $scope.getDisplayString = function(myItem, internal, index, selectedIndex, identifier, field) {

        var result = null;

        var theIdentifier = identifier;
        if (theIdentifier && ngMeteorForms.displayStringRegistry[theIdentifier] && typeof ngMeteorForms.displayStringRegistry[theIdentifier] == "function") {
            result = (ngMeteorForms.displayStringRegistry[theIdentifier])(myItem);
        } else {
            if (field && _.isArray(field.type)) {
                theIdentifier = field.type[0];
                if (theIdentifier && ngMeteorForms.displayStringRegistry[theIdentifier] && typeof ngMeteorForms.displayStringRegistry[theIdentifier] == "function") {
                    result = (ngMeteorForms.displayStringRegistry[theIdentifier])(myItem);
                }
            }
        }

        if(_.isNull(result)) {
            if (myItem && typeof myItem.toSgiDisplayString == 'function') {
                result = myItem.toSgiDisplayString();
            } else {
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
        }
        if (internal || (result && !_.isEmpty(result))) {
            return result;
        }
        if (index == selectedIndex) {
            if(myItem)
                return "Please enter some data ..."
        } else {
            return "New entry! Please select to add some data!";
        }
    };
};

var sgiFieldPreLink = function preLink(scope, iElement, iAttrs, controller) {
    scope.xid = iAttrs.id;
    scope.modelId = getModelId(iAttrs.id);
    var comp = Deps.autorun(function(){
        if(!scope.$$phase) {
            scope.$apply(function () {
                updateScope(scope, iAttrs);
            })
        }else{
            updateScope(scope, iAttrs);
        }
    });

    scope.$on('$destroy', function(){
        comp.stop();
    });
};

var sgiFieldCompile = function compile(element, attrs) {
    expandElement(element, attrs);
    return {
        pre: sgiFieldPreLink
    }
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
 * Define angular directives to handle the replacement of template elements with their expanded, re-rendered contents.
 */
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
    .directive('sgiMaxcount', function (){
        return {
            restrict: 'A',
            require: 'ngModel',
            link: ['$scope', function(scope, elem, attr, ngModel) {
                if(attr.sgiMaxcount) {

                    //For DOM -> model validation
                    ngModel.$parsers.unshift(function (value) {
                        var valid = attr.sgiMaxCount < value.length;
                        ngModel.$setValidity('sgiMaxCount', valid);
                        return valid ? value : value;
                    });

                    //For model -> DOM validation
                    ngModel.$formatters.unshift(function (value) {
                        ngModel.$setValidity('sgiMaxCount', attr.sgiMaxCount < value.length);
                        return value;
                    });
                }

            }]
        }
    });



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
        if(key.match('^(sgi).+')) {
            if (key.match('^(sgi).*(Field)$')) {
                fieldTemplateNames.push(key);
            } else {
                otherSgiTemplateNames.push(key);
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
     * Define compile pre-link and controller functions for sgiAutoform directive
     */

    var sgiAutoformController = function($scope){
        var self = $scope;

        $scope.getModel = function(){
            return this.model;
        };
        $scope.setModel = function(value){
            self.model = value;
        };

        $scope.save = function(){
            this.preSave();
            console.log("Built-in Save happening now!");
            var baseObj = this.getModel();
            var baseSpec = ngMeteorForms.meteorFindOne(FlexiSpecs, {name: this.flexiModelname});
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
        var comp = Deps.autorun(function(){
            scope.flexiModelname = iAttrs['model'];
            scope.unwrapped = iAttrs['unwrapped'];
            if(scope.unwrapped){
                if(scope.singleMode){
                    scope.model = scope.collection;
                }
            }
        });

        scope.$on('$destroy', function(){
            comp.stop();
        });
    };

    var sgiAutoformCompile = function compile(element, attrs){
        expandElement(element, attrs);
        return {
            pre: sgiAutoformPreLink
        }
    };


    /**
     * For each non-field-oriented template, define a directive for that template which simply replaces the corresponding
     * elements with the results of rendering that template in an appropriate context. Also augment each of these templates
     * providing them with a createContext and a sgiTemplate function.
     */
    _.each(otherSgiTemplateNames, function(directiveName){

        var directiveDefinition = {
            restrict: 'E',
            compile: standardCompile
        };

        /**
         * The 'sgiAutoform' directive replaces the 'sgi-autoform' element with a fully functional input/edit form based on
         * the model specified by the flexispec whose name matches the value of the 'model' attribute of this HTML element.
         */
        if(directiveName == 'sgiAutoform'){
            directiveDefinition.compile = sgiAutoformCompile;
            directiveDefinition.controller = sgiAutoformController;
            directiveDefinition.scope = true;
        }

        ngMeteorForms.directive(directiveName, function(){return directiveDefinition});

        var template = getTemplateForKey(directiveName);
        template.createContext = createNonFieldContext;
        template.sgiTemplate = standardSgiTemplate;
    });

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Define common field 'createContext' and 'sgiTemplate' functions
     */

    var sgiFieldCreateContext = function(element, attrs){
        var result = getFieldAsContextObject(element, attrs);
        var theName = getAttributeFromElement(element, 'field');
        if(theName){
            theName = _getModelFieldBaseName(theName) + 'Form';
            result.formName = theName;
        }

        return result;

    };

    var getTemplateForFieldTypeName = function(fieldTypeName){
        var template = null;
        if(fieldTypeName) {
            var sgiTemplateKey = 'sgi' + _.capitalize(fieldTypeName) + 'Field';
            template = getTemplateForKey(sgiTemplateKey);
        }

        return template ? template : getTemplateForKey('sgiTextField');
    };

    /**
     * Return the appropriate template for the provided <element>
     * @param element
     * @param attrs
     */
    var sgiFieldSgiTemplate = function(element, attrs){
        var templateName = null;
        var context = getFieldAsContextObject(element, attrs);

        if(context){
            templateName = context.getTemplateName();
        }else{
            console.log('Could not get field for element/attributes:')
            console.log(element);
            console.log(attrs);
            console.log("------");
        }
        return getTemplateForFieldTypeName(templateName);
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
        context.orientation = '';
        if(context.template && context.template.options && context.template.options.orientation){
            context.orientation = context.template.options.orientation;
        }
        var myOptions = [];
        if(context && context.options && context.options.collection) {
            if (_.isArray(context.options.collection)) {
                myOptions = context.options.collection;
            } else {
                myOptions = ngMeteorForms.meteorFind(FlexiModels[context.options.collection]).fetch();
            }
        }
        _.each(myOptions, function(option){
            option._modelId = context.modelId;
            option._name = context.name;
            option._id = context.name + "." + option[context.options.value];
            option._value = option[context.options.value];
            option._label = option[context.options.label];
        });

        context.collection = myOptions;
        return context;
    };

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * For the radio button template, customize the 'createContext' function.
     */
    var radioButton = getTemplateForKey('sgiRadioButton');

    radioButton.createContext = function(element, attrs){
        return owl.deepCopy(attrs);
    };

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
