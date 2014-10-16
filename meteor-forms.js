/**
 * Created by pavlovich on 4/14/14.
 */

////////////////////////////////////////////////////////////////////
/**
 * Configure Mongo Collections
 */
////////////////////////////////////////////////////////////////////

/**
 * Register a transformation callback on the mongo collection named FlexiSpecs which, when applied,
 * updates the <doc> (expected to be an instance of a flexispec) by adding the 'getTemplate' instance function to each
 * of its the objects in its fields attribute (supposedly containing a collection of field objects).
 * Returns the modified <doc> flexispec object.
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
        var flexiSpec = ngMeteorForms.meteorFindOne(FlexiSpecs, {name: this.type.toString()});
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
        type = ngMeteorForms.meteorFindOne(FlexiSpecs, {name: typeName});
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

    var theElement = element[0];
    var theParent = theElement.parentNode;

    if(theParent) {
        Blaze.renderWithData(template, context, theParent, theElement);
        element.remove();
    }
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
    return theField;
};

/**
 * For the given object, <obj>, follow down the supplied <path> (a dot-separated chain of attributes names). When reaching
 * the end of that chain, if <overwrite> is true, set the attribute's value to <value>. Otherwise, check to see if a
 * value already has been set there. If so, do nothing. Otherwise, set the attribute's value to <value>.
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
 * Update the provided scope with the field and other options as determined by interpreting the supplied element and attributes.
 */
var updateScope = function(scope, element, attributes){

    //TODO remove this if we really don't need it ... doesn't appear, at present, to be necessary. ::: setFormName(scope, element);

    var field = setField(scope, attributes);

    if(_.isNull(field) || _.isUndefined(field)){
        // No field associated with a non-data-oriented element (like a DIV). Do nothing to the scope.
        console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>  should not get here")
    }else {
        if(_.isArray(field.type)){
            if(ngMeteorForms.meteorFindOne(FlexiSpecs, {name: field.type[0]})){
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
        }else if (_.contains(['single', 'multi'], field.type)) {
            if (field.options && field.options.collectionName && typeof field.options.collectionName === 'string') {

                var collection = FlexiModels[field.options.collectionName];
                //First check if this is a select from a fleximodel
                if (collection && typeof collection.find === 'function') {
                    if (!(field.options && typeof field.options === 'object')) {
                        field.options = {};
                    }
                    field.options.collection = ngMeteorForms.meteorFind(collection).fetch();
                } else {
                    //Else, see if it is the name of a global collection
                    var collectionName = _.capitalize(owl.deepCopy(field.options.collectionName));
                    var meteorCollection = getGlobal(collectionName);
                    if (meteorCollection && typeof meteorCollection.find === 'function') {
                        if (!(field.options && typeof field.options === 'object')) {
                            field.options = {};
                        }
                        field.options.collection = ngMeteorForms.meteorFind(meteorCollection).fetch();
                    }
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
        if(field.unwrapped && field.type && !ngMeteorForms.meteorFindOne(FlexiSpecs, {name: field.type})){
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

var getTemplateForFieldTypeName = function(fieldTypeName){
    var template = null;
    if(fieldTypeName) {
        var sgiTemplateKey = 'sgi' + _.capitalize(fieldTypeName) + 'Field';
        template = getTemplateForKey(sgiTemplateKey);
    }

    return template ? template : getTemplateForKey('sgiTextField');
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

        var errors = [];
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
            }
            ;

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
        var formScope = angular.element($($event.currentTarget).closest('.sgi-collection-field').find('ng-form').parent().parent()).scope();
        self.setSelectedIndex(index);
        if(!self.singleMode){
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
    $scope.getDisplayString = function(myItem, internal, index, selectedIndex, element) {
        var result = "";
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
                updateScope(scope, iElement, iAttrs);
            })
        }else{
            updateScope(scope, iElement, iAttrs);
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

    var sgiFieldSgiTemplate = function(element, attrs){
        var template = null;
        var context = this.createContext(element, attrs);
        var templateName = null;
        if(context){
            templateName = context.getTemplateName();
          //  sgiTemplateKey = 'sgi' + _.capitalize(templateName) + 'Field';
          //  template = getTemplateForKey(sgiTemplateKey);
        }
        return getTemplateForFieldTypeName(templateName);
      //  return template ? template : getTemplateForKey('sgiTextField');
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
