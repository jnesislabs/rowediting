/*
 * This file launches the application by asking Ext JS to create
 * and launch() the Application class.
 */
Ext.application({
    extend: 'CustomizingRowEditing.Application',

    name: 'CustomizingRowEditing',

    requires: [
        // This will automatically load all classes in the CustomizingRowEditing namespace
        // so that application classes do not need to require each other.
        'CustomizingRowEditing.*'
    ],

    // The name of the initial view to create.
    mainView: 'CustomizingRowEditing.view.main.Main'
});
