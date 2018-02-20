/**
 * This class is the controller for the main view for the application. It is specified as
 * the "controller" of the Main view class.
 */
Ext.define('CustomizingRowEditing.view.main.MainController', {
    extend: 'Ext.app.ViewController',

    alias: 'controller.main',

    addContact: function (sender, record) {
        //
        var personnel = Ext.create('CustomizingRowEditing.model.Personnel',{});
        this.getViewModel().getStore('personnels').add(personnel);
    }
});

