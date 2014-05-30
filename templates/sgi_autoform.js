/**
 * Created by pavlovich on 5/6/14.
 */

var getAttributeFromElement = function(element, attributeName){
    if(element && element.context && element.context.getAttribute(attributeName)){
        return element.context.getAttribute(attributeName);
    }
    return null;
}

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

Package.templating.Template['sgiAutoform'].helpers({
    getModelFields: function(modelName, x){
        var type = FlexiSpecs.findOne({name: modelName});
        var fieldsObject = type.fields;
        var fields = [];
        _.each(fieldsObject, function (value, index) {
            if(fieldsObject.hasOwnProperty(index)) {
                var obj = _.clone(value);
                obj.base = modelName + "." + index;
                obj.field = value;
                obj.parentField = type;
                obj.showLabel = 'i did it here';
                fields.push(obj);
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
