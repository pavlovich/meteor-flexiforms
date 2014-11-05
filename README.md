Meteor Flexiforms
=================
> Flexible, Internationalizable, Meta-data-driven, Angular-based Forms for Meteor.

## Quick start
1. Install [Meteor](http://docs.meteor.com/#quickstart) <code>curl https://install.meteor.com | /bin/sh</code>
2. Install [Meteorite](https://github.com/oortcloud/meteorite#installing-meteorite) <code>npm install -g meteorite</code>
3. Create a new meteor app using <code>meteor create myapp</code> or navigate to the root of your existing app.
4. Install meteor-flexiforms <code>mrt add meteor-flexiforms</code>

## Usage
### Table of Contents
- [Advanced Use](http://github.com/pavlovich/meteor-flexiforms#advanced-use)

### Advanced Use
If you would like to take more direct control over the content and presentation of your flexiform, you can manually lay out your form as in the following example:

    <mff-field-group name="Name">
        <mff-field data-id="person.name.firstName"></mff-field>
        <mff-field data-id="person.name.lastName"></mff-field>
        <mff-field data-id="person.birthdate"></mff-field>
        <mff-field data-id="person.blahdate"></mff-field>
        <mff-field data-id="person.age"></mff-field>
        <mff-field data-id="person.livedAbroad"></mff-field>

        <mff-field data-id="person.hair"></mff-field>
        <mff-field data-id="person.gender" ></mff-field>
        <mff-field data-id="person.smoker"></mff-field>
    </mff-field-group>
    <mff-field-group name="Address">
        <mff-field data-id="person.address.street1"></mff-field>
        <mff-field data-id="person.address.street2"></mff-field>
    </mff-field-group>

