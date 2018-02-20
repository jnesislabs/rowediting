/**
 * A menu item that contains a togglable checkbox by default, but that can also be a part of a radio group.
 *
 *     @example
 *     Ext.create('Ext.menu.Menu', {
 *         width: 100,
 *         height: 110,
 *         items: [{
 *             xtype: 'menucheckitem',
 *             text: 'select all'
 *         },{
 *             xtype: 'menucheckitem',
 *             text: 'select specific'
 *         },{
 *             iconCls: 'add16',
 *             text: 'icon item'
 *         },{
 *             text: 'regular item'
 *         }]
 *     });
 */
Ext.define('Ext.menu.CheckItem', {
    extend: 'Ext.menu.Item',
    xtype: 'menucheckitem',

    /**
     * @property {Boolean} isMenuCheckItem
     * `true` in this class to identify an object as an instantiated Menu CheckItem, or subclass thereof.
     */
    isMenuCheckItem: true,

    /**
     * @cfg {String} iconAlign
     * @hide
     * Not supported at this level. Checkbox is on the left, iconAlign is always 'right'
     */
    iconAlign: 'right',

    /**
     * @cfg {Boolean} [hideOnClick=false]
     * Whether to not to hide the owning menu when this item is clicked.
     * Defaults to `false` for checkbox items, and radio group items.
     */
    hideOnClick: false,

    config: {
        /**
         * @cfg {Boolean} [checked=false]
         * True to render the menuitem initially checked.
         */
        checked: false,

        /**
         * @cfg {Function/String} [checkHandler]
         * @param {Ext.menu.CheckItem} This menu CheckItem
         * @param {Boolean} checked The new checked state
         * Alternative for the {@link #checkchange} event.  Gets called with the same parameters.
         * @controllable
         */
        checkHandler: null,

        /**
         * @cfg {Object} [scope]
         * Scope for the {@link #checkHandler} callback.
         */

        /**
         * @cfg {Boolean} [checkChangeDisabled=false]
         * True to prevent the checked item from being toggled. Any submenu will still be accessible.
         */
        checkChangeDisabled: false,

        value: null,

        showCheckbox: null
    },

    classCls: Ext.baseCSSPrefix + 'menucheckitem',

    checkedCls: Ext.baseCSSPrefix + 'checked',

    checkboxIconElCls: Ext.baseCSSPrefix + 'checkbox-icon-el',

    ariaRole: 'menuitemcheckbox',

    defaultBindProperty: 'checked',

    /**
     * @cfg {String} submenuText Text to be announced by screen readers when a check item
     * submenu is focused.
     * @locale
     */
    submenuText: '{0} submenu',

    /**
     * @hide
     * Not supported on CheckItems and RadioItems
     */
    href: null,

    /**
     * @hide
     * Not supported on CheckItems and RadioItems
     */
    target: null,

    /**
     * @event beforecheckchange
     * Fires before a change event. Return false to cancel.
     * @param {Ext.menu.CheckItem} this CheckItem
     * @param {Boolean} checked
     */

    /**
     * @event checkchange
     * Fires after a change event.
     * @param {Ext.menu.CheckItem} this CheckItem
     * @param {Boolean} checked
     */

    element: {
        reference: 'element',
        cls: Ext.baseCSSPrefix + 'unselectable ' +
            // The checkbox always occupies the "left" icon space
            Ext.baseCSSPrefix + 'has-left-icon',
        onmousedown: 'return Ext.doEv(this, event);'
    },

    eventHandlers: {
        change: 'onCheckboxChange',
        mousedown: 'onCheckboxMousedown'
    },

    focusEl: 'checkboxElement',
    ariaEl: 'checkboxElement',

    getTemplate: function() {
        var template = this.callParent(),
            body = template[0];

        body.tag = 'div';
        body.href = null;

        body.children.push({
            // An absolutely positioned transparent checkbox that acts as the focus/aria element
            tag: 'input',
            type: 'checkbox',
            reference: 'checkboxElement',
            cls: Ext.baseCSSPrefix + 'checkbox-el',
            onchange: 'return Ext.doEv(this, event);'
        });

        return template;
    },

    enableFocusable: function() {
        this.mixins.focusable.enableFocusable();

        // Menuitems only go readonly when disabled.
        this.checkboxElement.dom.readOnly = '';
    },

    disableFocusable: function() {
        this.mixins.focusable.disableFocusable();

        // Menu items must be focusable, but not active when disabled.
        this.checkboxElement.dom.readOnly = 'readonly';
    },

    /**
     * Sets the checked state of the item
     * @param {Boolean} checked True to check, false to un-check
     * @param {Boolean} [suppressEvents=false] True to prevent firing the checkchange events.
     */
    setChecked: function(checked, suppressEvents) {
        var me = this,
            isConfiguring = me.isConfiguring;

        // Events and handlers are suppressed during configuration
        if (suppressEvents) {
            me.isConfiguring = true;
        }
        me.callParent([checked]);
        if (suppressEvents) {
            me.isConfiguring = isConfiguring;
        }
    },

    applyChecked: function (checked, oldChecked) {
        // Cast to boolean
        checked = !!checked;

        // Do not fire events if set in configuration
        if (checked !== oldChecked && (this.isConfiguring || this.fireEvent('beforecheckchange', this, checked) !== false)) {
            return checked;
        }
    },

    updateChecked: function (checked) {
        this.checkboxElement.dom.checked = checked;

        // We do not get an event on programmatic check change
        // so call it proramatically.
        this.onCheckChange();
    },

    updateCheckChangeDisabled: function (checkChangeDisabled) {
        this.checkboxElement.dom.readOnly = checkChangeDisabled;
    },

    updateValue: function (value) {
        this.checkboxElement.dom.value = value;
    },

    updateText: function (text) {
        var me = this,
            ariaDom = me.ariaEl.dom;

        me.callParent([text]);

        if (ariaDom && me.getMenu()) {
            ariaDom.setAttribute('aria-label', Ext.String.formatEncode(me.submenuText, text));
        }
    },

    applyShowCheckbox: function (showCheckbox) {
        return !!showCheckbox;
    },

    updateShowCheckbox: function (showCheckbox) {
        this.checkboxElement.setDisplayed(showCheckbox);
    },

    updateIconAlign: function (iconAlign, oldIconAlign) {
        var me = this,
            leftIconElement = me.leftIconElement,
            rightIconElement = me.rightIconElement,
            checkboxIconElCls = me.checkboxIconElCls,
            checkboxIconElement, oldCheckboxIconElement;

        if (iconAlign === 'left') {
            checkboxIconElement = rightIconElement;
            oldCheckboxIconElement = leftIconElement;
        } else {
            checkboxIconElement = leftIconElement;
            oldCheckboxIconElement = rightIconElement;
        }

        checkboxIconElement.addCls(checkboxIconElCls);
        oldCheckboxIconElement.removeCls(checkboxIconElCls);

        me.callParent([iconAlign, oldIconAlign]);
    },

    privates: {
        onSpace: function (e) {
            // Disabled menuitems are still focusable, but must not react
            if (this.getDisabled()) {
                e.preventDefault();
            }
        },

        onClick: function (e) {
            var me = this,
                arrowElement = me.arrowElement,
                result, parentResult, region;

            // Disabled menuitems are still focusable, but must not react
            if (me.getDisabled()) {
                e.preventDefault();
            }

            // Clicking on the checkboxElement is processed natively, and we react to the
            // change event.
            if (e.pointerType !== 'mouse') {
                region = me.bodyElement.getRegion();
                if (me.getMenu()) {
                    region.setWidth(region.getWidth() - arrowElement.getWidth() - arrowElement.getMargin('lr'));
                }

                // When interacting with a menucheckitem via a touch screen the submenu
                // is shown by tapping directly on the arrow.  Tapping anywhere else on
                // the item will simply toggle the checked state.
                if (region.contains(e.getPoint())) {
                    // clicked on the icon or text - veto menu show
                    result = false;
                } else {
                    // clicked on the arrow - allow the menu to be shown, but preventDefault
                    // to stop the checkbox from being toggled
                    e.preventDefault();
                }
            }

            parentResult = me.callParent([e]);

            // Allow either to veto menu showing
            return (result === false) ? result : parentResult;
        },

        onCheckboxMousedown: function(e) {
            // Prevent focus movement away from the checkboxElement on mousedown outside of the checkboxElement.
            // The mouseover will have focused it.
            // Also, checkboxes are not focusable by default on Apple Operating Systems.
            // See http://www.weba11y.com/blog/2014/07/07/keyboard-navigation-in-mac-browsers/
            // So to prevent focus flying to body on mousedown, we prevent default.
            if ((Ext.isApple && !Ext.isChrome) || !this.checkboxElement.contains(e.target)) {
                e.preventDefault();
            }
        },

        onCheckboxChange: function() {
            // Sync widget state in response to the checkbox changing state.
            this.setChecked(this.checkboxElement.dom.checked);
        },

        onCheckChange: function () {
            var me = this,
                checked = this.checkboxElement.dom.checked,
                el = me.el,
                ariaDom = me.ariaEl.dom;

            el.toggleCls(me.checkedCls, !!checked);
            
            if (ariaDom) {
                ariaDom.setAttribute('aria-checked', me.getMenu() ? 'mixed' : checked);
            }

            me.publishState('checked', checked);

            // Do not fire events if set in configuration
            if (!me.isConfiguring) {
                Ext.callback(me.getCheckHandler(), me.scope, [me, checked], 0, me);
                me.fireEvent('checkchange', me, checked);
            }
        },

        syncHasIconCls: function () {
            var me = this;

            me.toggleCls(me.hasRightIconCls, !!(me.getIconCls() || me.getIcon()));
        }
    }
});