Package.describe({
	summary: "Internationalizable, meta-data-driven, angular-based forms for meteor."
});

Package.on_use(function (api) {

    api.use('templating', 'client');
    api.use('underscore-string-latest', 'client');
    api.use('ngMeteor', ['client']);
    api.use('fleximodel', ['client', 'server']);
    api.use('meteor-ng-datepicker', 'client');

    // Files to load in Client only.
    api.add_files([
        'templates/flexiforms_div.html',
        'templates/flexiforms_form.html',
        'templates/flexiforms_field.html',
        'templates/flexiforms_text_field.html',
        'templates/flexiforms_field_group.html',
        'templates/flexiforms_radio_field.html',
        'templates/flexiforms_radio_button_field.html',
        'templates/flexiforms_checkbox_field.html',
        'templates/flexiforms_select_field.html',
        'templates/flexiforms_autoform.html',
        'templates/flexiforms_autoform_field.html',
        'templates/flexiforms_autoform_field_group.html',
        'templates/flexiforms_form_buttons.html',
        'templates/flexiforms_autoform.js',
        'templates/flexiforms_autoform_field_group.js',
        'templates/flexiforms_text_field.js',
        'templates/flexiforms_field_group.js',
        'flexiforms.js'
	], 'client');

    // Exports the ngMeteor package scope
    api.export('ngFlexiforms', 'client');
    api.export('FlexiSpecs', ['client', 'server']);
    api.export('FlexiModel', ['client', 'server']);
    api.export('FlexiModels', ['client', 'server']);
});
