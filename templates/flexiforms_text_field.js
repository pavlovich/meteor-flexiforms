/**
 * Created by pavlovich on 5/7/14.
 */

Package.templating.Template['flexiformsTextField'].helpers({
    shouldShowLabel: function(){
        if(this.showLabel){
            return true;
        }else{
            return false;
        }
    }
})