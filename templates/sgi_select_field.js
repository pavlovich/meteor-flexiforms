/**
 * Created by pavlovich on 6/9/14.
 */
Package.templating.Template['sgiSelectField'].helpers({
    selectOptionsSpec: function(options){
        var specString = "opt." + options.label;
        if(options.group){
            specString = specString + " group by opt." + options.group;
        }
        specString = specString + " for opt in options";

        if(options.embedded){
            specString = specString + " track by opt." + options.value;
        }else{
            specString = "opt." + options.value + " " + specString;
        }
        return specString;
    },
    getOptions: function(){
        return this.options;
    }
});
