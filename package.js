Package.describe({
	summary: "Internationalizable, meta-data-driven, angular-based forms for meteor."
});

Package.on_use(function (api) {
    api.use('blaze', 'client');
    api.use('templating', 'client');
    api.use('stylus', 'client');
    api.use('underscore-string-latest', 'client');
    api.use('ng-meteor', ['client']);
    api.use('meteor-fleximodel', ['client', 'server']);
    api.use('meteor-ng-datepicker', 'client');

    // Files to load in Client only.
    api.add_files([
        'lib/extensions/string.js',
        'lib/collections/flexispec.js',
        'lib/angular/modules.js',
        'styles/styles.styl',
        'templates/mff_form.html',
        'templates/mff_field.html',
        'templates/mff_collection_field.html',
        'templates/mff_text_field.html',
        'templates/mff_field_group.html',
        'templates/mff_radio_field.html',
        'templates/mff_radio_button_field.html',
        'templates/mff_checkbox_field.html',
        'templates/mff_select_field.html',
        'templates/mff_select_field.js',
        'templates/mff_autoform.html',
        'templates/mff_autoform_field.html',
        'templates/mff_autoform_field_group.html',
        'templates/mff_form_buttons.html',
        'templates/mff_autoform.js',
        'templates/mff_autoform_field_group.js',
        'templates/mff_text_field.js',
        'templates/mff_field_group.js',
        'templates/mff_field_validations.html',
        'templates/mff_field_validations.js',
        'meteor-flexiforms.js'
	], 'client');

    // Exports the ngMeteor package scope
    api.export('ngMeteorForms', 'client');
    api.export('FlexiSpecs', ['client', 'server']);
    api.export('FlexiModel', ['client', 'server']);
    api.export('FlexiModels', ['client', 'server']);
    api.export('ngMeteorFleximodel', 'client');
    api.export('FastRender', ['client', 'server']);
    api.export('ngMeteor', 'client');
    api.export('sprintf', ['client', 'server']);

});
