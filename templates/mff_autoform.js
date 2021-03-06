/**
 * Created by pavlovich on 5/6/14.
 */

/**
 * Given an <element>, return the value of the requested <attributName>.
 */
getAttributeFromElement = function(element, attributeName){
    if(element && element.context && element.context.getAttribute(attributeName)){
        return element.context.getAttribute(attributeName);
    }
    return null;
};

_getModelFieldBaseName = function(result){
    return 'field' + _.reduce(result.split("."), function(memo, q){return memo + _.capitalize(q)}, "")
}

/**
 * Return the name that should be used to identify the angular controller to be applied for the provided <element>.
 *
 * In detail, if the <element> provided has an attribute named 'meteor-flexiforms-controller', return the value of that attribute.
 * If it does not have such an attribute but does have a 'model' attribute, return the value of that attribute, in camelCase + 'Controller'.
 * If neither of these attributes are defined on the <element>, then return 'testController'.
 */
var _getControllerName = function(element){
    var result = getAttributeFromElement(element, 'meteor-flexiforms-controller');
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
    var type = FlexiSpecs.findByName(modelName);
    if(!type){
        return [];
    };
    var fields = type.getFields();
    _.each(fields, function (field) {
        field.base = modelName + "." + field.name;
        field.parentField = type;
    });
    return fields;
};

/**
 * Define spacebars helpers for the Autoform template.
 */
Package.templating.Template['mffAutoform'].helpers({
    getFieldFields: function(fieldName, unwrapped){
        var result = [];
        var origField = getField(fieldName);
        var origTypeName = origField.getTypeName();
        if(origField.isCollection()){
            result = _getModelFields(origTypeName);
            if(!FlexiSpecs.isDefined(origTypeName)){
                var parentFieldName = fieldName.split(".").slice(0, -1).join("");
                var parentField = getField(parentFieldName);
                var theField = owl.deepCopy(origField);
                if(unwrapped){
                    theField.unwrapped = true;
                    theField.holdsCollection = false;
                    theField.id = fieldName;
                }
                theField.base = 'model';
                theField.parentField = parentField;
                result = [theField]
            }
        }
        return result;
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
