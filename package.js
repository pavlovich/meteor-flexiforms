Package.describe({
  name: 'sgi:flexiforms',
  version: '0.0.2',
  summary: 'Internationalizable, meta-data-driven, angular-based forms for meteor.',
  git: 'https://github.com/pavlovich/meteor-flexiforms',
  documentation: 'README.md'
});

Package.on_use(function (api) {
    api.use('blaze@2.0.4', 'client');
    api.use('templating@1.0.11', 'client');
    api.use('stylus@1.0.6', 'client');
    api.use('wizonesolutions:underscore-string@1.0.0', 'client');
    api.use('sgi:ng-meteor@0.0.1', ['client']);
    api.use('sgi:fleximodel@0.0.2', ['client', 'server']);
    api.use('sgi:ng-datepicker@0.0.1', 'client');

    // Files to load in Client only.
    api.addFiles([
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
