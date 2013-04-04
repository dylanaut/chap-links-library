/**
 * A root panel can hold components. The root panel must be initialized with
 * a DOM element as container.
 * @param {Object} [options]    Available parameters:
 *                              {HTMLElement} container
 *                              {String} [id]
 *                              {String | function} [className]
 *                              {String | Number | function} [left]
 *                              {String | Number | function} [top]
 *                              {String | Number | function} [width]
 *                              {String | Number | function} [height]
 *                              {String | Number | function} [height]
 *                              {Boolean | function} [autoResize]
 * @constructor RootPanel
 * @extends Panel
 */
function RootPanel(options) {
    this.id = util.randomUUID();
    this.options = {
        autoResize: true
    };

    this.listeners = {}; // event listeners

    this.setOptions(options);
}

RootPanel.prototype = new Panel();

// TODO: comment
RootPanel.prototype.setOptions = function (options) {
    Component.prototype.setOptions.call(this, options);

    if (this.options.autoResize) {
        this._watch();
    }
    else {
        this._unwatch();
    }
};

/**
 * Repaint the component
 * @return {Boolean} changed
 */
RootPanel.prototype.repaint = function () {
    var changed = 0,
        update = util.updateProperty,
        asSize = util.option.asSize,
        options = this.options,
        frame = this.frame;
    if (!frame) {
        frame = document.createElement('div');
        frame.className = 'graph panel';

        if (options.className) {
            util.addClassName(frame, util.option.asString(options.className));
        }

        this.frame = frame;
        changed += 1;
    }
    if (!frame.parentNode) {
        if (!this.options.container) {
            throw new Error('Cannot repaint root panel: no container attached');
        }
        this.options.container.appendChild(frame);
        changed += 1;
    }

    changed += update(frame.style, 'top',    asSize(options.top, '0px'));
    changed += update(frame.style, 'left',   asSize(options.left, '0px'));
    changed += update(frame.style, 'width',  asSize(options.width, '100%'));
    changed += update(frame.style, 'height', asSize(options.height, '100%'));

    this._updateEventEmitters();

    return (changed > 0);
};

/**
 * Reflow the component
 * @return {Boolean} resized
 */
RootPanel.prototype.reflow = function () {
    var changed = 0,
        update = util.updateProperty,
        frame = this.frame;

    if (frame) {
        changed += update(this, 'top', frame.offsetTop);
        changed += update(this, 'left', frame.offsetLeft);
        changed += update(this, 'width', frame.offsetWidth);
        changed += update(this, 'height', frame.offsetHeight);
    }
    else {
        changed += 1;
    }

    return (changed > 0);
};

/**
 * Watch for changes in the size of the frame. On resize, the Panel will
 * automatically redraw itself.
 * @private
 */
RootPanel.prototype._watch = function () {
    var me = this;

    this._unwatch();

    var checkSize = function () {
        if (!me.options.autoResize) {
            // stop watching when the option autoResize is changed to false
            me._unwatch();
            return;
        }

        if (me.frame) {
            // check whether the frame is resized
            if ((me.frame.clientWidth != me.width) ||
                    (me.frame.clientHeight != me.height)) {
                me.requestReflow();
            }
        }
    };

    // TODO: automatically cleanup the event listener when the frame is deleted
    util.addEventListener(window, 'resize', checkSize);

    this.watchTimer = setInterval(checkSize, 1000);
};

/**
 * Stop watching for a resize of the frame.
 * @private
 */
RootPanel.prototype._unwatch = function () {
    if (this.watchTimer) {
        clearInterval(this.watchTimer);
        this.watchTimer = undefined;
    }

    // TODO: remove event listener on window.resize
};

/**
 * Event handler
 * @param {String} event       name of the event, for example 'click', 'mousemove'
 * @param {function} callback  callback handler, invoked with the raw HTML Event
 *                             as parameter.
 */
RootPanel.prototype.on = function (event, callback) {
    // register the listener at this component
    var arr = this.listeners[event];
    if (!arr) {
        arr = [];
        this.listeners[event] = arr;
    }
    arr.push(callback);

    this._updateEventEmitters();
};

/**
 * Update the event listeners for all event emitters
 * @private
 */
RootPanel.prototype._updateEventEmitters = function () {
    if (this.listeners) {
        var me = this;
        util.forEach(this.listeners, function (listeners, event) {
            if (!me.emitters) {
                me.emitters = {};
            }
            if (!(event in me.emitters)) {
                // create event
                var frame = me.frame;
                if (frame) {
                    //console.log('Created a listener for event ' + event + ' on component ' + me.id); // TODO: cleanup logging
                    var callback = function(event) {
                        listeners.forEach(function (listener) {
                            // TODO: filter on event target!
                            listener(event);
                        });
                    };
                    me.emitters[event] = callback;
                    util.addEventListener(frame, event, callback);
                }
            }
        });

        // TODO: be able to delete event listeners
        // TODO: be able to move event listeners to a parent when available
    }
};