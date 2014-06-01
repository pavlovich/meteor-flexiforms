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
        }
        return 'testController';
    }
};

/**
 * Define spacebars helpers for the Autoform template.
 */
Package.templating.Template['sgiAutoform'].helpers({
    /**
     * For the provided <modelName>, return a collection of fields to use in generating a form-based UI for that flexisepc.
     *
     * In detail, look up the flexispec corresponding to the provided <modelName>. Retrieve and clone each of
     * this flexispec's fields, augmenting each clone wih additional attributes including the base modelId (my parent's
     * id + '.' + my field name), my 'field' spec and my 'parentField'
     */
    getModelFields: function(modelName){
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
            }
            return 'testForm';
        }
    },
    hasController: function(element){
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
    },
    getControllerName: function(element){
        return _getControllerName(element);
    },
    getElement: function(){
        return this.$$element;
    }
});
