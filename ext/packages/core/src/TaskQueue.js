/**
 * @private
 * Handle batch read / write of DOMs, currently used in SizeMonitor + PaintMonitor
 */
Ext.define('Ext.TaskQueue', {
    requires: 'Ext.AnimationQueue',

    singleton: true,

    pending: false,

    mode: true, // true for 'read', false for 'write'
    
    //<debug>
    protectedReadQueue: [],
    protectedWriteQueue: [],
    //</debug>
    
    readQueue: [],
    writeQueue: [],
    readRequestId: 0,
    writeRequestId: 0,

    timer: null,

    constructor: function() {
        this.run = Ext.Function.bind(this.run, this);
        
        // Some global things like floated wrapper are persistent and will add tasks/
        // add timers all the time, spoiling resource checks in our unit test suite.
        // To work around that we're implementing a parallel queue where only trusted
        // tasks will go, and fly under the radar of resource checker.
        //<debug>
        this.runProtected = Ext.Function.bind(
            this.run, this, [this.protectedReadQueue, this.protectedWriteQueue, 'runProtected']
        );
        this.runProtected.$skipTimerCheck = true;
        //</debug>
        
        // iOS has a nasty bug which causes pending requestAnimationFrame to not release
        // the callback when the WebView is switched back and forth from / to being background process
        // We use a watchdog timer to workaround this, and restore the pending state correctly if this happens
        // This timer has to be set as an interval from the very beginning and we have to keep it running for
        // as long as the app lives, setting it later doesn't seem to work
        if (Ext.os.is.iOS) {
            //<debug>
            this.watch.$skipTimerCheck = true;
            //</debug>
            Ext.interval(this.watch, 500, this);
        }
    },

    requestRead: function(fn, scope, args) {
        var request = {
                id: ++this.readRequestId,
                fn: fn,
                scope: scope,
                args: args
            };

        //<debug>
        if (arguments[3] === true) {
            this.protectedReadQueue.push(request);
            this.request(true, 'runProtected');
        }
        else {
        //</debug>
            this.readQueue.push(request);
            this.request(true);
        //<debug>
        }
        //</debug>
        
        
        return request.id;
    },
    
    cancelRead: function(id) {
        this.cancelRequest(this.readQueue, id, true);
    },

    requestWrite: function(fn, scope, args) {
        var request = {
                id: ++this.writeRequestId,
                fn: fn,
                scope: scope,
                args: args
            };
        
        //<debug>
        if (arguments[3] === true) {
            this.protectedWriteQueue.push(request);
            this.request(false, 'runProtected');
        }
        else {
        //</debug>
            this.writeQueue.push(request);
            this.request(false);
        //<debug>
        }
        //</debug>
        
        return request.id;
    },
    
    cancelWrite: function(id) {
        this.cancelRequest(this.writeQueue, id, false);
    },

    request: function(mode, method) {
        var me = this;
        
        if (!me.pending) {
            me.pendingTime = Date.now();
            me.pending = true;
            me.mode = mode;
            
            if (mode) {
                me.timer = Ext.defer(me[method] || me.run, 1);
            }
            else {
                me.timer = Ext.Function.requestAnimationFrame(me[method] || me.run);
            }
        }
        
        //<debug>
        // Last one should win
        if (me.mode === mode && me.timer) {
            clearTimeout(me.timer);
            
            if (mode) {
                me.timer = Ext.defer(me[method] || me.run, 1);
            }
            else {
                me.timer = Ext.Function.requestAnimationFrame(me[method] || me.run);
            }
        }
        //</debug>
    },
    
    cancelRequest: function(queue, id, mode) {
        for (var i = 0; i < queue.length; i++) {
            if (queue[i].id === id) {
                queue.splice(i, 1);
                
                break;
            }
        }
        
        if (!queue.length && this.mode === mode && this.timer) {
            clearTimeout(this.timer);
        }
    },

    watch: function() {
        if (this.pending && Date.now() - this.pendingTime >= 500) {
            this.run();
        }
    },

    run: function(readQueue, writeQueue, method) {
        var me = this,
            mode = null,
            queue, tasks, task, fn, scope, args, i, len;
        
        readQueue = readQueue || me.readQueue;
        writeQueue = writeQueue || me.writeQueue;

        me.pending = false;

        me.pending = me.timer = false;
        
        if (me.mode) {
            queue = readQueue;

            if (writeQueue.length > 0) {
                mode = false;
            }
        }
        else {
            queue = writeQueue;

            if (readQueue.length > 0) {
                mode = true;
            }
        }

        tasks = queue.slice();
        queue.length = 0;

        for (i = 0, len = tasks.length; i < len; i++) {
            task = tasks[i];
            
            fn = task.fn;
            scope = task.scope;
            args = task.args;
            
            if (scope && (scope.destroying || scope.destroyed)) {
                continue;
            }
            
            if (typeof fn === 'string') {
                fn = scope[fn];
            }

            if (args) {
                fn.apply(scope, args);
            }
            else {
                fn.call(scope);
            }
        }

        tasks.length = 0;

        if (mode !== null) {
            me.request(mode, method);
        }
    },
    
    clear: function() {
        var me = this,
            timer = me.timer;

        me.readQueue.length = me.writeQueue.length = 0;
        me.pending = me.timer = false;
        me.mode = true;
        
        if (timer) {
            clearTimeout(timer);
            Ext.Function.cancelAnimationFrame(timer);
        }
    }

    //<debug>
    ,privates: {
        flush: function() {
            var me = this;

            while (me.readQueue.length || me.writeQueue.length) {
                clearTimeout(me.timer);
                Ext.Function.cancelAnimationFrame(me.timer);
                me.run();
            }
            me.mode = true;
        }
    }
    //</debug>
});
