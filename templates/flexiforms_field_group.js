/**
 * Created by pavlovich on 5/7/14.
 */

Package.templating.Template['flexiformsFieldGroup'].helpers({
    inlineFlex: function(){
        if(this.inline == "true"){
            return "flexiforms-inline-flex";
        }else{
            return "";
        }
    }
})
