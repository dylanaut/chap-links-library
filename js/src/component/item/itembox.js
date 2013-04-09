/**
 * @constructor ItemBox
 * @extends Item
 * @param {Object} data       Object containing parameters start
 *                            content, className.
 * @param {Object} [options]  Options to set initial property values
 *                              {ItemSet} parent
 *                            // TODO: describe available options
 */
function ItemBox (data, options) {
    this.props = {
        dot: {
            left: 0,
            top: 0,
            width: 0,
            height: 0
        },
        line: {
            top: 0,
            left: 0,
            width: 0,
            height: 0
        }
    };

    Item.call(this, data, options);
}

ItemBox.prototype = new Item (null);

// register the ItemBox in the item types
itemTypes['box'] = ItemBox;

/**
 * Select the item
 * @override
 */
ItemBox.prototype.select = function () {
    this.selected = true;
    // TODO: select and unselect
};

/**
 * Unselect the item
 * @override
 */
ItemBox.prototype.unselect = function () {
    this.selected = false;
    // TODO: select and unselect
};

/**
 * Repaint the item
 * @return {Boolean} changed
 */
ItemBox.prototype.repaint = function () {
    // TODO: make an efficient repaint
    var changed = false;
    var dom = this.dom;

    if (this.visible) {
        if (!dom) {
            this._create();
            changed = true;
        }
        dom = this.dom;

        if (dom) {
            if (!this.options && !this.options.parent) {
                throw new Error('Cannot repaint item: no parent attached');
            }
            var parentContainer = this.options.parent.getContainer();
            if (!parentContainer) {
                throw new Error('Cannot repaint time axis: parent has no container element');
            }

            if (!dom.box.parentNode) {
                parentContainer.appendChild(dom.box);
                changed = true;
            }
            if (!dom.line.parentNode) {
                parentContainer.appendChild(dom.line);
                changed = true;
            }
            if (!dom.dot.parentNode) {
                parentContainer.appendChild(dom.dot);
                changed = true;
            }

            // update contents
            if (this.data.content != this.content) {
                this.content = this.data.content;
                if (this.content instanceof Element) {
                    dom.content.innerHTML = '';
                    dom.content.appendChild(this.content);
                }
                else if (this.data.content != undefined) {
                    dom.content.innerHTML = this.content;
                }
                else {
                    throw new Error('Property "content" missing in item ' + this.data.id);
                }
                changed = true;
            }

            // update class
            var className = (this.data.className? ' ' + this.data.className : '') +
                (this.selected ? ' selected' : '');
            if (this.className != className) {
                this.className = className;
                dom.box.className = 'item box' + className;
                dom.line.className = 'item line' + className;
                dom.dot.className  = 'item dot' + className;
                changed = true;
            }
        }
    }
    else {
        // hide when visible
        if (dom) {
            if (dom.box.parentNode) {
                dom.box.parentNode.removeChild(dom.box);
                changed = true;
            }
            if (dom.line.parentNode) {
                dom.line.parentNode.removeChild(dom.line);
                changed = true;
            }
            if (dom.dot.parentNode) {
                dom.dot.parentNode.removeChild(dom.dot);
                changed = true;
            }
        }
    }

    return changed;
};

/**
 * Reflow the item: calculate its actual size and position from the DOM
 * @return {boolean} resized    returns true if the axis is resized
 * @override
 */
ItemBox.prototype.reflow = function () {
    if (this.data.start == undefined) {
        throw new Error('Property "start" missing in item ' + this.data.id);
    }

    var update = util.updateProperty,
        dom = this.dom,
        props = this.props,
        options = this.options,
        start = options.parent._toScreen(this.data.start),
        align = options && options.align,
        orientation = options.orientation,
        changed = 0,
        top,
        left;

    if (dom) {
        changed += update(props.dot, 'height', dom.dot.offsetHeight);
        changed += update(props.dot, 'width', dom.dot.offsetWidth);
        changed += update(props.line, 'width', dom.line.offsetWidth);
        changed += update(props.line, 'width', dom.line.offsetWidth);
        changed += update(this, 'width', dom.box.offsetWidth);
        changed += update(this, 'height', dom.box.offsetHeight);

        if (align == 'right') {
            left = start - this.width;
        }
        else if (align == 'left') {
            left = start;
        }
        else {
            // default or 'center'
            left = start - this.width / 2;
        }
        changed += update(this, 'left', left);

        changed += update(props.line, 'left', start - props.line.width / 2);
        changed += update(props.dot, 'left', start - props.dot.width / 2);
        if (orientation == 'top') {
            top = options.margin.axis;

            changed += update(this, 'top', top);
            changed += update(props.line, 'top', 0);
            changed += update(props.line, 'height', top);
            changed += update(props.dot, 'top', -props.dot.height / 2);
        }
        else {
            // default or 'bottom'
            var parentHeight = options.parent.height;
            top = parentHeight - this.height - options.margin.axis;

            changed += update(this, 'top', top);
            changed += update(props.line, 'top', top + this.height);
            changed += update(props.line, 'height', Math.max(options.margin.axis, 0));
            changed += update(props.dot, 'top', parentHeight - props.dot.height / 2);
        }
    }
    else {
        changed += 1;
    }

    return (changed > 0);
};

/**
 * Create an items DOM
 * @private
 */
ItemBox.prototype._create = function () {
    var dom = this.dom;
    if (!dom) {
        this.dom = dom = {};

        // create the box
        dom.box = document.createElement('DIV');
        // className is updated in repaint()

        // contents box (inside the background box). used for making margins
        dom.content = document.createElement('DIV');
        dom.content.className = 'content';
        dom.box.appendChild(dom.content);

        // line to axis
        dom.line = document.createElement('DIV');
        dom.line.className = 'line';

        // dot on axis
        dom.dot = document.createElement('DIV');
        dom.dot.className = 'dot';
    }
};

/**
 * Reposition the item, recalculate its left, top, and width, using the current
 * range and size of the items itemset
 * @override
 */
ItemBox.prototype.reposition = function () {
    var dom = this.dom,
        props = this.props,
        orientation = this.options.orientation;

    if (dom) {
        var box = dom.box,
            line = dom.line,
            dot = dom.dot;

        box.style.left = this.left + 'px';
        box.style.top = this.top + 'px';

        line.style.left = props.line.left + 'px';
        if (orientation == 'top') {
            line.style.top = 0 + 'px';
            line.style.height = this.top + 'px';
        }
        else {
            // orientation 'bottom'
            line.style.top = props.line.top + 'px';
            line.style.top = (this.top + this.height) + 'px';
            line.style.height = (props.dot.top - this.top - this.height) + 'px';

        }

        dot.style.left = props.dot.left + 'px';
        dot.style.top = props.dot.top + 'px';
    }
};
