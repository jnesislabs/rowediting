Ext.define('CustomizingRowEditing.store.Personnel', {
    extend: 'Ext.data.Store',

    alias: 'store.personnel',

    model: 'CustomizingRowEditing.model.Personnel',

    data: { items: []},

    proxy: {
        type: 'memory',
        reader: {
            type: 'json',
            rootProperty: 'items'
        }
    }
});
