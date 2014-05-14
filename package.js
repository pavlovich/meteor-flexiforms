Package.describe({
	summary: "Internationalizable, meta-data-driven, angular-based forms for meteor."
});

Package.on_use(function (api) {

    api.use('templating', 'client');
    api.use('underscore-string-latest', 'client');
    api.use('ngMeteor', ['client']);
    api.use('meteor-fleximodel', ['client', 'server']);
    api.use('meteor-ng-datepicker', 'client');

    // Files to load in Client only.
    api.add_files([
        'templates/sgi_div.html',
        'templates/sgi_form.html',
        'templates/sgi_field.html',
        'templates/sgi_text_field.html',
        'templates/sgi_field_group.html',
        'templates/sgi_radio_field.html',
        'templates/sgi_radio_button_field.html',
        'templates/sgi_checkbox_field.html',
        'templates/sgi_select_field.html',
        'templates/sgi_autoform.html',
        'templates/sgi_autoform_field.html',
        'templates/sgi_autoform_field_group.html',
        'templates/sgi_autoform.js',
        'templates/sgi_autoform_field_group.js',
        'templates/sgi_text_field.js',
        'templates/sgi_field_group.js',
        'meteor-forms.js'
	], 'client');

    // Exports the ngMeteor package scope
    api.export('ngMeteorForms', 'client');
    api.export('FlexiSpecs', ['client', 'server']);
    api.export('FlexiModel', ['client', 'server']);
    api.export('FlexiModels', ['client', 'server']);
    api.export('ngMeteorFleximodel', 'client');
});
