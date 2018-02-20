/**
 * This view is an example list of people.
 */
Ext.define('CustomizingRowEditing.view.main.List', {
    extend: 'Ext.grid.Panel',
    xtype: 'mainlist',

    requires: [
        'CustomizingRowEditing.store.Personnel'
    ],

    plugins: {
        rowediting: {
            clicksToMoveEditor: 1,
            autoCancel: false,
            useButtonText: false,
            saveBtnIconCls: 'fa fa-check green-color',
            cancelBtnIconCls: 'fa fa-times red-color'
        }
    },

    title: 'Personnel',

    minHeight: 300,

    bind: {
        store: '{personnels}'
    },

    header: {
        items: [{
            xtype: 'button',
            iconCls: 'x-fa fa-plus-circle',
            handler: 'addContact'
        }]
    },

    columns: [
        { 
            text: 'Name',  
            dataIndex: 'name',
            editor: {
                xtype: 'textfield',
                emptyText: 'Name'
            }
        },
        { 
            text: 'Email', 
            dataIndex: 'email', 
            flex: 1,
            editor: {
                xtype: 'textfield',
                emptyText: 'Email'
            }
        },
        { 
            text: 'Phone', 
            dataIndex: 'phone', 
            flex: 1,
            editor: {
                xtype: 'textfield',
                emptyText: 'Phone'
            }
        }
    ]
});
