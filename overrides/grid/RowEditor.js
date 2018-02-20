Ext.define('overrides.grid.RowEditor', {
    override: 'Ext.grid.RowEditor',

    useButtonText: true,
    saveBtnIconCls: 'fa fa-check',
    cancelBtnIconCls: 'fa fa-times',

    syncEditorClip: function() {
        // Since the editor is rendered to the grid el, all its visible parts must be clipped when scrolled
        // outside of the grid view area so that it does not overlap the scrollbar or docked items.
        var me = this,
        // Clipping region must be *within* scrollbars, so in the case of locking view, we cannot
        // use the lockingView's el because that *contains* two grids. We must use a union of the
        // two view's constrain regions.
        clipRegion = me.lockable ? me.view.lockedView.getConstrainRegion().union(me.view.normalView.getConstrainRegion()) : me.view.el.getConstrainRegion();        
    
        me.clipTo(clipRegion);
        //We do not need to clip the Save/Cancel buttons. Issue: Save&cancel buttons not shown when inline editing entries 
        //me.floatingButtons.clipTo(clipRegion);
    }
});