/**
 * This class is used to contain grid columns at the top-level of a grid as well as a
 * base class for `Ext.grid.column.Column`.
 * @since 6.5.0
 */
Ext.define('Ext.grid.HeaderContainer', {
    extend: 'Ext.Container',
    xtype: 'headercontainer',

    config: {
        docked: 'top',

        /**
         * A default {@link #ui ui} to use for {@link Ext.grid.Column columns} in this header.
         */
        defaultColumnUI: null,

        /**
         * @cfg {Object[]} [columns]
         * The sub columns within this column/header container.
         */
        columns: null,

        defaultType: 'column',

        layout: {
            type: 'hbox',
            align: 'stretch'
        },

        /**
         * @private
         * Set this to `false` to disable sorting via tap on all column headers
         */
        sortable: true,

        scrollable: {
            x: false,
            y: false
        },

        grid: null,

        /**
         * @private
         * Updated by the grid to inform the header container whether it must account for a vertical scrollbar
         */
        verticalOverflow: null,

        /**
         * @private
         * Passed in from the owning grid's own configuration
         */
        reserveScrollbar: null
    },

    inheritUi: true,

    weighted: true,

    autoSize: null,

    constructor: function(config) {
        this.isRootHeader = !this.isGridColumn;

        // Called things need early access to the property
        if (this.isRootHeader) {
            config.grid._headerContainer = this;
        }
        this.columns = [];
        this.callParent([config]);

        // Must not prevent the updater from running
        if (this.isRootHeader) {
            config.grid._headerContainer = null;
        }
    },

    initialize: function() {
        var me = this;

        me.callParent();

        // This is the top level HeaderContainer
        if (me.isRootHeader) {
            me.setInstanceCls(Ext.baseCSSPrefix + 'headercontainer');

            me.on({
                tap: 'onHeaderTap',
                triggertap: 'onHeaderTriggerTap',
                columnresize: 'onColumnResize',
                show: 'onColumnShow',
                hide: 'onColumnHide',
                sort: 'onColumnSort',
                scope: me,
                delegate: '[isLeafHeader]'
            });

            me.on({
                tap: 'onGroupTap',
                triggertap: 'onGroupTriggerTap',
                show: 'onGroupShow',
                hide: 'onGroupHide',
                add: 'onColumnAdd',
                move: 'onColumnMove',
                remove: 'onColumnRemove',
                scope: me,
                delegate: '[isHeaderGroup]'
            });

            me.on({
                add: 'onColumnAdd',
                move: 'onColumnMove',
                remove: 'onColumnRemove',
                scope: me
            });
        }
    },

    // Find the topmost HeaderContainer
    getRootHeaderCt: function() {
        var grid = this.getGrid();

        return grid && grid.getHeaderContainer();
    },

    getColumnForField: function (fieldName) {
        var columns = this.columns,
            n = columns.length,
            c, i;

        for (i = 0; i < n; ++i) {
            c = columns[i].getColumnForField(fieldName);
            if (c) {
                return c;
            }
        }

        return null;
    },

    /**
     * Returns all the leaf columns, regardless of visibility
     * @param selector
     * @returns {Array}
     */
    getColumns: function(selector) {
        var result = this.columns;

        if (selector) {
            if (typeof selector === 'string') {
                result = Ext.ComponentQuery.query(selector, result);
            } else if (Ext.isFunction(selector)) {
                return Ext.Array.filter(result, selector);
            }
        }
        return result;
    },

    /**
     * Returns all visible leaf columns.
     * @param selector
     * @returns {Array}
     */
    getVisibleColumns: function() {
        var me = this,
            result = me.visibleColumns;

        if (!result) {
            result = me.visibleColumns = Ext.Array.filter(me.columns, me.visibleLeafFilter);
        }
        return result;
    },

    /**
     * When passed a column index, or a column, returns the closet *visible* column to that.
     * If the column at the passed index is visible, that is returned.
     *
     * If it is hidden, either the next visible, or the previous visible column is returned.
     *
     * If called from a group header, returns the visible index of a leaf level header
     * relative to the group header with the same stipulations as outlined above.
     *
     * @param {Number/Ext.grid.column.Column} index Position at which to find the closest
     * visible column, or a column for which to find the closest visible sibling.
     */
    getClosestVisibleHeader: function(index) {
        var result = typeof index === 'number' ? this.getHeaderAtIndex(index) : index;

        if (result && result.hidden) {
            result = result.next(':visible') || result.prev(':visible');
        }
        return result;
    },

    indexOfLeaf: function(column) {
        return this.getVisibleColumns().indexOf(column);
    },

    getAbsoluteColumnIndex: function(column) {
        // this fn assumes that the specified column is already available in rootHeader.columns
        return this.getVisibleColumns().indexOf(column);
    },

    factoryItem: function(item) {
        if (item.isComponent) {
            item.setGrid(this.getGrid());
        } else {
            item = Ext.apply({
                grid: this.getGrid()
            }, item);
        }
        return this.callParent([item]);
    },

    updateColumns: function(columns) {
        var me = this;

        // Only gather the columns array if we are the root header
        if (me.isRootHeader) {
            me.columns = [];
            me.visibleColumns = null;
            me.add(columns);
        }
    },

    beginColumnUpdate: function() {
        var me = this;

        if (!me.isRootHeader) {
            return;
        }
        me.hasBulkUpdate = me.hasBulkUpdate || 0;
        me.hasBulkUpdate++;
        if (me.hasBulkUpdate === 1) {
            me.bulkAdd = [];
        }
    },

    endColumnUpdate: function() {
        var me = this,
            length, i, columns, item;

        if (!me.isRootHeader || !me.hasBulkUpdate) {
            return;
        }
        me.hasBulkUpdate--;

        if (me.hasBulkUpdate === 0) {
            me.columns = me.query('[isLeafHeader]');

            columns = me.bulkAdd;
            length = columns.length;
            for (i = 0; i < length; i++) {
                item = columns[i];
                item.columnIndex = me.columns.indexOf(item.column);
            }
            // we need to sort the columns by their position otherwise the cells will end up in wrong places
            Ext.Array.sort(columns, function (a, b) {
                return a.columnIndex === b.columnIndex ? 0 : (a.columnIndex < b.columnIndex ? -1 : 1);
            });
            for (i = 0; i < length; i++) {
                item = columns[i];
                me.fireEvent('columnadd', me, item.column, item.columnIndex);
            }
            me.bulkAdd = null;
        }
    },

    add: function (items) {
        var ret,
            rootHeaders = this.getRootHeaderCt();

        if (rootHeaders) {
            rootHeaders.beginColumnUpdate();
        }

        ret = this.callParent([items]);

        if (rootHeaders) {
            rootHeaders.endColumnUpdate();
        }

        return ret;
    },

    insert: function(index, item) {
        var ret,
            rootHeaders = this.getRootHeaderCt();

        if (rootHeaders) {
            rootHeaders.beginColumnUpdate();
        }

        ret = this.callParent([index, item]);

        if (rootHeaders) {
            rootHeaders.endColumnUpdate();
        }

        return ret;
    },

    onColumnAdd: function(container, column) {
        var me = this,
            grid = this.getGrid(),
            groupColumns, ln, i, ui;

        if (column.isHeaderGroup) {
            groupColumns = column.getItems().items;

            for (i = 0, ln = groupColumns.length; i < ln; i++) {
                me.onColumnAdd(column, groupColumns[i]);
            }
        } else {
            ui = column.getUi();

            if (ui == null) {
                column.setUi(me.getDefaultColumnUI());
            }

            column.setGrid(grid);

            me.bulkAdd.push({
                column: column
            });
        }
    },

    onColumnMove: function(parent, column, toIdx, fromIdx) {
        var me = this,
            columns = me.columns,
            columnIndex,
            groupColumns, ln, i, groupColumn,
            after, oldIndex;

        // leaf column set will have to be recalculated.
        // Must ask for the absolute column index AFTER this.
        me.visibleColumns = null;

        if (column.isHeaderGroup) {
            columnIndex = me.getAbsoluteColumnIndex(column);
            groupColumns = column.getItems().items;

            for (i = 0, ln = groupColumns.length; i < ln; i++) {
                groupColumn = groupColumns[i];

                if (i === 0) {
                    oldIndex = columns.indexOf(groupColumn);
                    after = oldIndex - columnIndex < 0;
                }

                // Treat the moves as sequential
                if (after) {
                    // |  Group   | c | d     ->     | c | d |   Group   |
                    //    a   b                                  a   b
                    //
                    // We need to fire:
                    // a from 0 -> 3, since b is still in place
                    // b from 0 -> 3, to account for a still in place
                    toIdx = columnIndex + ln - 1;
                    fromIdx = oldIndex;
                } else {
                    // | c | d |   Group   |      ->     |  Group   | c | d
                    //             a   b                    a   b
                    //
                    // We need to fire:
                    // a from 2 -> 0
                    // b from 2 -> 1, to account for a moving
                    fromIdx = oldIndex + i;
                    toIdx = columnIndex + i;
                }
                Ext.Array.move(columns, fromIdx, toIdx);
                me.fireEvent('columnmove', me, groupColumn, column, fromIdx, toIdx);
            }
        } else {
            Ext.Array.move(columns, fromIdx, toIdx);
            me.fireEvent('columnmove', me, column, null, fromIdx, toIdx);
        }
    },

    onColumnRemove: function(parent, column) {
        // leaf column set will have to be recalculated.
        this.visibleColumns = null;

        if (column.isHeaderGroup) {
            if(!column.destroying) {
                var columns = column.getItems().items,
                    ln = columns.length,
                    i;

                for (i = 0; i < ln; i++) {
                    this.onColumnRemove(column, columns[i]);
                }
            }
        } else {
            Ext.Array.remove(this.columns, column);
            this.fireEvent('columnremove', this, column);
        }
    },

    onHeaderTap: function(column, e) {
        var selModel = this.getGrid().getSelectable(),
            ret = this.fireEvent('columntap', this, column, e);

        if (ret !== false) {
            if (selModel.onHeaderTap) {
                selModel.onHeaderTap(this, column, e);
            }
        }
    },

    onGroupTriggerTap: function(column) {
        column.showMenu();
    },

    onHeaderTriggerTap: function(column) {
        column.showMenu();
    },

    onColumnShow: function(column) {
        // leaf column set will have to be recalculated.
        this.visibleColumns = null;
        this.fireEvent('columnshow', this, column);
    },

    onColumnHide: function(column) {
        // leaf column set will have to be recalculated.
        this.visibleColumns = null;
        this.fireEvent('columnhide', this, column);
    },

    onGroupShow: function(group) {
        var columns = group.getInnerItems(),
            ln = columns.length,
            i, column;

        // leaf column set will have to be recalculated.
        this.visibleColumns = null;

        for (i = 0; i < ln; i++) {
            column = columns[i];
            if (!column.isHidden()) {
                this.fireEvent('columnshow', this, column);
            }
        }
    },

    onGroupHide: function(group) {
        var columns = group.getInnerItems(),
            ln = columns.length,
            i, column;

        // leaf column set will have to be recalculated.
        this.visibleColumns = null;

        for (i = 0; i < ln; i++) {
            column = columns[i];
            this.fireEvent('columnhide', this, column);
        }
    },

    onGroupTap: function(column, e) {
        return this.fireEvent('headergrouptap', this, column, e);
    },

    onColumnResize: function(column, width, oldWidth) {
        this.fireEvent('columnresize', this, column, width, oldWidth);
    },

    onColumnSort: function(column, direction, newDirection) {
        if (direction !== null) {
            this.fireEvent('columnsort', this, column, direction, newDirection);
        }
    },

    scrollTo: function(x) {
        this.getScrollable().scrollTo(x);
    },

    updateGrid: function(grid) {
        if (this.isRootHeader) {
            this.parent = grid;
        }
    },

    doDestroy: function() {
        var me = this,
            task = me.spacerTask;

        if (task) {
            task.cancel();
            me.spacerTask = null;
        }
        
        me.setGrid(null);
        me.callParent();
    },

    afterRender: function() {
        this.callParent();
        if (this.isRootHeader) {
            this.onColumnComputedWidthChange();
        }
    },

    privates: {
        columnsResizing: null,

        //\\ TODO: Account for RTL and then non-RTL switching scrollbars on Safari
        updateVerticalOverflow: function() {
            this.syncReserveSpace();
        },

        //\\ TODO: Account for RTL and then non-RTL switching scrollbars on Safari
        updateReserveScrollbar: function() {
            this.syncReserveSpace();
        },

        onColumnComputedWidthChange: function (column, computedWidth) {
            // We are called directly from child columns when their computed width
            // changes.
            //
            // We force all flexed columns to republish their computed width, and
            // then loop through the rows updating all cells which need to change
            // width in one pass.

            var me = this,
                totalColumnWidth = 0,
                changedColumns = me.columnsResizing,
                columns, len, i, c, width;

            if (me.destroying) {
                return;
            }

            if (changedColumns) {
                changedColumns.push(column);
                return;
            }

            // Ensure that when those other flexed/relative sized columns publish
            // their new width, we do not recurse into here.
            me.columnsResizing = changedColumns = [];

            columns = me.getColumns();
            len = columns.length;

            // Collect all columns which are changing.
            // Ensure they update their computed width.
            // Fire all columnresize events in column order.
            for (i = 0; i < len; i++) {
                c = columns[i];

                // This is the one that caused the resize; we know its details.
                if (c === column) {
                    changedColumns.push(c);
                    width = computedWidth;
                }
                // Gather all column sizes, forcing them to re-evaluate their
                // computedWidth. If they change. that will recurse into here
                // and fire tjeor columnresize event, but we will not begin
                // another column width update (due to me.columnsResizing).
                else {
                    width = c.measureWidth();
                    // changedColumns.push(c) will happen if width changes
                }

                // Accumulate column width after column width has been synced.
                totalColumnWidth += width;
            }

            totalColumnWidth = Math.floor(totalColumnWidth);

            me.getGrid().onColumnComputedWidthChange(changedColumns, totalColumnWidth);

            me.columnsResizing = null;
        },

        setRendered: function (rendered) {
            // Either way, rendering, or derendering, column set must
            // be refreshed at next request of columns.
            this.visibleColumns = null;
            this.callParent([rendered]);
        },

        /**
         * @private
         * Synchronize column UI visible sort state with Store's sorters.
         */
        setSortState: function() {
            var grid = this.getGrid(),
                store   = grid.getStore(),
                columns = grid.getColumns(),
                len = columns && columns.length,
                i, header, sorter;

            for (i = 0; i < len; i++) {
                header = columns[i];

                // Access the column's custom sorter in preference to one keyed on the data index.
                sorter = header.getSorter();
                if (sorter) {
                    // If the column was configured with a sorter, we must check that the sorter
                    // is part of the store's sorter collection to update the UI to the correct state.
                    // The store may not actually BE sorted by that sorter.
                    if (!(store.getSorters().contains(sorter) || store.getGrouper() === sorter)) {
                        sorter = null;
                    }
                }

                // Important: A null sorter for this column will *clear* the UI sort indicator.
                header.setSortState(sorter);
            }
        },

        syncReserveSpace: function() {
            var reserve = this.getVerticalOverflow() || this.getReserveScrollbar();
            // use padding, not margin so that the background-color of the header container
            // shows in the reserved space.
            this.el.setStyle('padding-right', reserve ? Ext.getScrollbarSize().width + 'px' : 0);
        },

        visibleLeafFilter: function(c) {
            return c.isLeafHeader && !c.isHidden();
        }
    }
});
