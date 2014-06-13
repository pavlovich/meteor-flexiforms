/**
 * Created by pavlovich on 5/6/14.
 */

/**
 * Given an <element>, return the value of the requested <attributName>.
 */
var getAttributeFromElement = function(element, attributeName){
    if(element && element.context && element.context.getAttribute(attributeName)){
        return element.context.getAttribute(attributeName);
    }
    return null;
};

var _getModelFieldBaseName = function(result){
    return 'field' + _.reduce(result.split("."), function(memo, q){return memo + _.capitalize(q)}, "")
}

/**
 * Return the name that should be used to identify the angular controller to be applied for the provided <element>.
 *
 * In detail, if the <element> provided has an attribute named 'meteor-forms-controller', return the value of that attribute.
 * If it does not have such an attribute but does have a 'model' attribute, return the value of that attribute, in camelCase + 'Controller'.
 * If neither of these attributes are defined on the <element>, then return 'testController'.
 */
var _getControllerName = function(element){
    var result = getAttributeFromElement(element, 'meteor-forms-controller');
    if(result){
        return result;
    }else{
        result = getAttributeFromElement(element, 'model');
        if(result){
            return _.camelize(result) + "Controller";
        }else{
            result = getAttributeFromElement(element, 'field');
            if(result){
                return _getModelFieldBaseName(result) + "Controller";
            }
        }
        return 'testController';
    }
};

var hasController = function(element){
    var hasController = false;
    _.each(ngMeteorForms._invokeQueue, function(queuedAngularConstructor){
        if(queuedAngularConstructor[1] && queuedAngularConstructor[1] == "register"){
            if(queuedAngularConstructor[2]){
                if(queuedAngularConstructor[2][0]){
                    if(queuedAngularConstructor[2][0] == _getControllerName(element)){
                        hasController = true;
                    }
                }
            }
        }
    });
    result = getAttributeFromElement(element, 'meteor-forms-controller');
    if (result && !hasController){
        console.log("Expected to find angular controller with name: '" + result + "'.");
    }
    return hasController;
};

var _getModelFields = function(modelName){
    var type = FlexiSpecs.findOne({name: modelName});
    var fieldsObject = type.fields;
    var fields = [];
    _.each(fieldsObject, function (fieldSpec, fieldName) {
        if(fieldsObject.hasOwnProperty(fieldName)) {
            var fieldModel = _.clone(fieldSpec);
            fieldModel.base = modelName + "." + fieldName;
            fieldModel.field = fieldSpec;
            fieldModel.parentField = type;
            fields.push(fieldModel);
        }});
    return fields;
}

/**
 * Define spacebars helpers for the Autoform template.
 */
Package.templating.Template['sgiAutoform'].helpers({
    getFieldFields: function(fieldName, unwrapped){
        var origField = getField(fieldName);
        if(origField && origField.type && _.isArray(origField.type)){
            var origType = origField.type[0];
            var containedType = FlexiSpecs.findOne({name: origType});
            if(containedType){
                return _getModelFields(origType);
            }else{
                var parentFieldName = fieldName.split(".").slice(0, -1).join("");
                var parentField = getField(parentFieldName);
                var origField = getField(fieldName);
                var theField = _.clone(origField);
                if(unwrapped && _.isArray(theField.type)){
                    theField.type = theField.type[0];
                    theField.unwrapped = true;
                    theField.id = fieldName;
                }
                theField.base = 'model';
                theField.field = origField;
                theField.parentField = parentField;
                return [theField]
            }
        }
    },
    /**
     * For the provided <modelName>, return a collection of fields to use in generating a form-based UI for that flexisepc.
     *
     * In detail, look up the flexispec corresponding to the provided <modelName>. Retrieve and clone each of
     * this flexispec's fields, augmenting each clone wih additional attributes including the base modelId (my parent's
     * id + '.' + my field name), my 'field' spec and my 'parentField'
     */
    getModelFields: function(modelName){
        return _getModelFields(modelName);
    },
    getFormClass: function(element){
        var result = getAttributeFromElement(element, 'class');
        if(result){
            return result;
        }else{
            return 'simple-form';
        }
    },
    getFormName: function(element){
        var result = getAttributeFromElement(element, 'name');
        if(result){
            return result;
        }else{
            result = getAttributeFromElement(element, 'model');
            if(result){
                return _.camelize(result) + "Form";
            }else{
                result = getAttributeFromElement(element, 'field');
                if(result){
                    return _getModelFieldBaseName(result) + 'Form';
                }
            }
            return 'testForm';
        }
    },
    getControllerName: function(element){
        if(hasController(element)) {
            return _getControllerName(element);
        }
        return null;
    },
    getElement: function(){
        return this.$$element;
    }
});
