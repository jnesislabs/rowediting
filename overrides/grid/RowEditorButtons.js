Ext.define('overrides.grid.RowEditorButtons', {
    override: 'Ext.grid.RowEditorButtons',

    constructor: function(config) {
        var me = this,
            rowEditor = config.rowEditor,
            cssPrefix = Ext.baseCSSPrefix,
            plugin = rowEditor.editingPlugin,
            useButtonText = (plugin.useButtonText !== undefined) ? plugin.useButtonText : rowEditor.useButtonText,
            saveBtnIconCls = (plugin.saveBtnIconCls !== undefined) ? plugin.saveBtnIconCls : rowEditor.saveBtnIconCls,
            cancelBtnIconCls = (plugin.cancelBtnIconCls !== undefined) ? plugin.cancelBtnIconCls : rowEditor.cancelBtnIconCls,
            updateButton = {
                cls: cssPrefix + 'row-editor-update-button',
                itemId: 'update',
                handler: plugin.completeEdit,
                disabled: rowEditor.updateButtonDisabled,
                listeners: {
                    element: 'el',
                    keydown: me.onUpdateKeyDown,
                    scope: me
                }
            },
            cancelButton = {
                cls: cssPrefix + 'row-editor-cancel-button',
                itemId: 'cancel',
                handler: plugin.cancelEdit,
                listeners: {
                    element: 'el',
                    keydown: me.onCancelKeyDown,
                    scope: me
                }
            };

            if(useButtonText===false){
                updateButton.iconCls = saveBtnIconCls;
                cancelButton.iconCls = cancelBtnIconCls;
            } else {
                updateButton.text = rowEditor.saveBtnText;
                cancelButton.text = rowEditor.cancelBtnText;
            }
            

        config = Ext.apply({
            baseCls: cssPrefix + 'grid-row-editor-buttons',
            defaults: {
                xtype: 'button',
                ui: rowEditor.buttonUI,
                scope: plugin,
                flex: 1,
                minWidth: 30,
                height: 20,
                padding: '3px 0'
            },
            items: [updateButton, cancelButton]
        }, config);

        me.callParent([config]);

        me.addClsWithUI(me.position);
    }
});