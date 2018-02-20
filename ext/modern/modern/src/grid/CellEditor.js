/**
 * This class specializes `Ext.Editor` for the purpose of editing grid cells inline. This
 * class is not instantiated by user code but rather by `Ext.grid.plugin.CellEditing`.
 * @private
 * @since 6.5.0
 */
Ext.define('Ext.grid.CellEditor', {
    extend: 'Ext.Editor',
    xtype: 'celleditor',
    isCellEditor: true,

    floated: false,

    classCls: Ext.baseCSSPrefix + 'celleditor',

    config: {
        /**
         * @cfg {Boolean} autoPin
         * Determines if the row that the cell editor is attached to will pin to the top
         * and bottom when scrolling.
         * If `false` editing will be canceled when cell editor is scrolled off the list.
         */
        autoPin: true
    },

    swallowKeys: false,

    layout: 'fit',

    shadow: false,

    allowBlur: true,

    alignment: 'tl-tl',

    zIndex: 10,

    // Do not use the cell's rendered value
    useBoundValue: false,

    inheritUi: true,

    field: {
        inheritUi: true
    },

    /**
     * Starts editing at the passed {@link Ext.grid.Location location} using the passed value.
     * @param {Ext.grid.Location} location Where to start editing
     * @param {*} [value] The value to place in the editor.
     * @param {Boolean} [doFocus] `true` to focus the editor.
     */
    startEdit: function(location, value, doFocus) {
        var me = this,
            cell, el, row, grid;

        if (location) {
            cell = location.cell;
            el = cell.el;
            value = value != null ? value : location.record.get(cell.dataIndex);

            me.$activeLocation = location;
            me.$activeRow = row = location.row;
            me.$activeGrid = grid = row.getGrid();
            me.editingPlugin.editing = true;
            me.editingPlugin.location = location;
            me.editingPlugin.activeEditor = me;

            // VERY important for focus management.
            // We must have an upward ownership link so that onFocusLeave
            // bubbles correctly.
            // This link must never be severed - it just is updated on each edit.
            me.ownerCmp = cell;

            grid.stickItem(row, { autoPin: me.getAutoPin() });

            // CellEditors are positioned and fitted within the cell using their CSS rules.
            me.render(el);

            me.callParent([el, value, doFocus]);
        }
    },

    onFocusLeave: function(e) {
        // FocusLeave result of destruction. Must not do anything.
        if (!this.editingPlugin.getGrid().destroying) {
            this.completeEdit(false);
        }
    },

    onFocusEnter: function(e) {
        // Force automatic focus reversion to go to our currently active cell.
        if (this.$activeLocation) {
            e.relatedTarget = e.fromElement = this.$activeLocation.getFocusEl('dom');
        }
        this.callParent([e]);
    },

    /**
     * @returns {Ext.grid.Location} The location where editing is active *if* editing is
     * active, else `null`.
     */
    getLocation: function() {
        return this.$activeLocation;
    },

    onSpecialKey: function(field, event) {
        var me = this,
            location = me.$activeLocation,
            record, dataIndex;

        // TAB off updates the record
        // The NavigationModel handles the actual navigation.
        if (event.getKey() === event.TAB) {
            record = location.record;
            dataIndex = location.cell.dataIndex;
            if (record) {
                record.set(dataIndex, me.getValue());
            }
        } else {
            me.callParent([field, event]);
        }
    },

    onEditComplete: function(remainVisible, cancelling) {
        var me = this,
            location = me.$activeLocation,
            value = me.getValue(),
            record, dataIndex, row, grid;

        me.callParent([remainVisible, cancelling]);

        if (location) {
            if (value !== me.startValue) {
                record = location.record;
                dataIndex = location.cell.dataIndex;

                if (record) {
                    record.set(dataIndex, value);
                }
            }

            if (!remainVisible) {
                row = location.row;
                grid = row.getGrid();

                grid.stickItem(row, null);

                me.$stickyVisibility = me.$activeLocation = me.$activeRow = me.$activeGrid = null;
                me.editingPlugin.editing = false;
                me.editingPlugin.location = me.editingPlugin.activeEditor = null;
            }
        }
    },

    // CellEditors are positioned and fitted within the cell using their CSS rules.
    realign: Ext.emptyFn,

    toggleBoundEl: function(visible) {
        var location = this.$activeLocation,
            cell, bodyEl;

        if (location && this.hideEl) {
            cell = location.cell;

            // If the location is still rendered...
            if (cell) {
                bodyEl = cell.bodyElement;
                bodyEl.setVisibility(visible);
            }
        }
    }
});
