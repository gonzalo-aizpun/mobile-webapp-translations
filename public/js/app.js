var app = {};

(function(root) {
    var defaults = {
        el: '#progressBar',
        autostart: false,
        porcentage: 0,
        increment: 2,
        timeIncrease: 100,
        timeClear: 1000
    };

    root.ProgressBar = ProgressBar = function(options) {
        this.options = _.defaults({}, options || {}, defaults);
        this.porcentage = this.options.porcentage;
        this.$el = $(this.options.el);
        
        if (this.options.autostart) {
            this.start();
        }
    };

    _.extend(ProgressBar.prototype, {
        start: function() {
            if (!this.started) {
                this.started = true;
                this.$el.show();
                this.interval = setInterval($.proxy(this.increase, this), this.options.timeIncrease);
                return true;
            }
            this.stop();
        },
        stop: function() {
            this.started = false;
            this.clear();
            this.$el.width('100%');
            setTimeout($.proxy(this.reset, this), this.options.timeClear);
            return true;
        },
        increase: function() {
            if (this.porcentage >= 80) {
                return this.clear();
            }
            this.porcentage = this.porcentage + this.options.increment;
            this.$el.width(this.porcentage + '%');
        },
        reset: function() {
            this.$el.hide();
            this.$el.width('0');
        },
        clear: function() {
            if (!this.interval) {
                return;
            }
            clearInterval(this.interval);
            this.interval = null;
            this.porcentage = this.options.porcentage;
        }
    });
})(app);

(function(root) {
    var defaults = {
        tagName: 'span',
        className: 'highlight',
        caseSensitive: true,
        autostart: true
    };

    root.Highlight = Highlight = function(options) {
        this.options = _.defaults({}, options || {}, defaults);
        this.$el = $(this.options.el);
        
        if (this.options.autostart) {
            this.reset(this.options.pattern);
        }
    }

    function highlight(node, pattern) {
        var skip = 0;
        var pos;
        var el;
        var middlebit;
        var endbit;
        var middleclone;
        var i;

        if (node.nodeType == 3) {
            pos = this.getText(node.data).indexOf(pattern);

            if (pos >= 0) {
                el = document.createElement(this.options.tagName);
                middlebit = node.splitText(pos);
                endbit = middlebit.splitText(pattern.length);
                middleclone = middlebit.cloneNode(true);
                
                el.appendChild(middleclone);
                el.className = this.options.className;
                middlebit.parentNode.replaceChild(el, middlebit);
                skip = 1;
            }
        }
        else if (node.nodeType == 1 && node.childNodes && !/(script|style)/i.test(node.tagName)) {
            for (i = 0; i < node.childNodes.length; ++i) {
                i += highlight.call(this, node.childNodes[i], pattern);
            }
        }
        return skip;
    }

    _.extend(Highlight.prototype, {
        show: function(pattern) {
            if (!this.$el.length || !pattern || !pattern.length) {
                return this;
            }
            var self = this;
            var _pattern = this.getText(pattern);

            this.$el.each(function() {
                highlight.call(self, this, _pattern);
            });
            return this;
        },
        hide: function() {
            var parent;

            this.$el.find([this.options.tagName, this.options.className].join('.')).each(function() {
                parent = this.parentNode;
                //parent.firstChild.nodeName;
                parent.replaceChild(this.firstChild, this);
                parent.normalize();
            }).end();
            return this;
        },
        reset: function(pattern) {
            return this.hide().show(pattern);
        },
        getText: function(text) {
            return (this.options.caseSensitive ? text : text.toUpperCase());
        }
    });
})(app);

Backbone.history.navigate = function(fragment, options) {
    if (!Backbone.History.started) return false;
    if (!options || options === true) options = {trigger: !!options};

    var url = this.root + (fragment = this.getFragment(fragment || ''));

    // Strip the hash for matching.
    fragment = fragment.replace(/#.*$/, '');

    if (this.fragment === fragment && !options.force) return;
    this.fragment = fragment;

    // Don't include a trailing slash on the root.
    if (fragment === '' && url !== '/') url = url.slice(0, -1);

    // If pushState is available, we use it to set the fragment as a real URL.
    if (this._hasPushState) {
        this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

    // If hash changes haven't been explicitly disabled, update the hash
    // fragment to store history.
    } else if (this._wantsHashChange) {
        this._updateHash(this.location, fragment, options.replace);
        if (this.iframe && (fragment !== this.getFragment(this.getHash(this.iframe)))) {
        // Opening and closing the iframe tricks IE7 and earlier to push a
        // history entry on hash-tag change.  When replace is true, we don't
        // want this.
        if(!options.replace) this.iframe.document.open().close();
        this._updateHash(this.iframe.location, fragment, options.replace);
    }

    // If you've told us that you explicitly don't want fallback hashchange-
    // based history, then `navigate` becomes a page refresh.
    } else {
        return this.location.assign(url);
    }
    if (options.trigger) return this.loadUrl(fragment);
};