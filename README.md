Meteor Forms
============
> Flexible, Internationalizable, Meta-data-driven, Angular-based Forms for Meteor.

## Quick start
1. Install [Meteor](http://docs.meteor.com/#quickstart) <code>curl https://install.meteor.com | /bin/sh</code>
2. Install [Meteorite](https://github.com/oortcloud/meteorite#installing-meteorite) <code>npm install -g meteorite</code>
3. Create a new meteor app using <code>meteor create myapp</code> or navigate to the root of your existing app.
4. Install meteor-forms <code>mrt add meteor-forms</code>

## Usage
### Table of Contents
- [Advanced Use](http://github.com/pavlovich/meteor-forms#advanced-use)

### Advanced Use
If you would like to take more direct control over the content and presentation of your flexiform, you can manually lay out your form as in the following example:

    <sgi-field-group name="Name">
        <sgi-field data-id="person.name.firstName"></sgi-field>
        <sgi-field data-id="person.name.lastName"></sgi-field>
        <sgi-field data-id="person.birthdate"></sgi-field>
        <sgi-field data-id="person.blahdate"></sgi-field>
        <sgi-field data-id="person.age"></sgi-field>
        <sgi-field data-id="person.livedAbroad"></sgi-field>

        <sgi-field data-id="person.hair"></sgi-field>
        <sgi-field data-id="person.gender" ></sgi-field>
        <sgi-field data-id="person.smoker"></sgi-field>
    </sgi-field-group>
    <sgi-field-group name="Address">
        <sgi-field data-id="person.address.street1"></sgi-field>
        <sgi-field data-id="person.address.street2"></sgi-field>
    </sgi-field-group>
