/**
 * @class Ext.Progress
 */
Ext.define('Ext.overrides.Progress', {
    override: 'Ext.Progress',

    requires: ['Ext.fx.Animation'],

    initialize: function() {
        this.callParent();

        this.on('painted', 'onPainted', this);
    },

    onPainted: function() {
      this.syncWidth();
    },

    onResize: function (width) {
        this.syncWidth(width);
    },

    syncWidth: function (width) {
        var me = this;

        if (width == null) {
            width = me.element.getWidth();
        }

        me.backgroundEl.setWidth(width);
        me.textEl.setWidth(width);
    },

    privates: {
        startBarAnimation: function(o) {
            var me = this;

            me.barAnim = new Ext.fx.Animation(Ext.apply(o, {
                element: me.barEl,
                preserveEndState: true,
                callback: function() {
                    delete me.barAnim;
                }
            }));
            Ext.Animator.run(me.barAnim);
        },

        stopBarAnimation: function() {
            var barAnim = this.barAnim;
            if (barAnim) {
                barAnim.destroy();
            }
            this.barAnim = null;
        }
    }
});
