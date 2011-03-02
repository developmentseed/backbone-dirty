// Overrides Backbone with `Backbone.sync()` overridden for the server-side
// context. Uses `node-dirty` for model persistence. Models are expected to
// have a URL prefixed by their respective collection (e.g. `/{class}/{id}`)
// and Collections retrieve their respective models based on this convention.
module.exports = function(filename) {
    var underscore = require('underscore')._,
        Backbone = require('backbone'),
        dirty = require('node-dirty')(filename),
        loaded = false;

    // Helper function to get a URL from a Model or Collection as a property
    // or as a function.
    var getUrl = function(object) {
        if (object.url instanceof Function) {
            return object.url();
        } else if (typeof object.url === 'string') {
            return object.url;
        }
    };

    // Sync implementation for `node-dirty`.
    var sync = function(method, model, success, error) {
        switch (method) {
        case 'read':
            var data,
                base;
            if (model.id) {
                data = dirty.get(getUrl(model));
                if (data) {
                    success(data);
                } else {
                    error('Model not found.');
                }
            } else {
                data = [];
                base = getUrl(model);
                dirty.forEach(function(key, val) {
                    if (val && key.indexOf(base) === 0 && data.indexOf(val) === -1) {
                        data.push(val);
                    }
                });
                success(data);
            }
            break;
        case 'create':
        case 'update':
            if (_.isEqual(dirty.get(getUrl(model)), model.toJSON())) {
                return success({});
            }
            dirty.set(
                getUrl(model),
                model.toJSON(),
                function(err) {
                    return err ? error(err) : success({});
                }
            );
            break;
        case 'delete':
            if (typeof dirty.get(getUrl(model)) === 'undefined') {
                return success({});
            }
            dirty.rm(
                getUrl(model),
                function(err) {
                    return err ? error(err) : success({});
                }
            );
            break;
        }
    };

    // Set a loaded flag to indicate whether `Backbone.sync()` can begin accessing
    // the db immediately or must wait until the `load` event is emitted.
    dirty.on('load', function() {
        loaded = true;
    });

    // Override Backbone.sync. Defer the sync operation until the database has
    // been fully loaded if necessary.
    Backbone.sync = function(method, model, success, error) {
        if (loaded) {
            sync(method, model, success, error);
        } else {
            dirty.on('load', function() {
                sync(method, model, success, error);
            });
        }
    };

    return dirty;
};

