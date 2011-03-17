// Provides a `Backbone.sync` or `Model.sync` method for the server-side
// context. Uses `node-dirty` for model persistence. Models are expected to
// have a URL prefixed by their respective collection (e.g. `/{class}/{id}`)
// and Collections retrieve their respective models based on this convention.
var _ = require('underscore')._,
    Backbone = require('backbone'),
    loaded = {},
    dbs = {};

module.exports = function(filename) {
    var dirty = dbs[filename] = dbs[filename] || require('node-dirty')(filename);

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
                base = getUrl(model);
            if (model.id) {
                data = dirty.get(base);
                return data ? success(data) : error('Model not found.');
            } else {
                data = [];
                dirty.forEach(function(key, val) {
                    val && key.indexOf(base) === 0 && data.indexOf(val) === -1 && data.push(val);
                });
                return success(data);
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

    // Set a loaded flag to indicate whether sync can begin accessing
    // the db immediately or must wait until the `load` event is emitted.
    dirty.on('load', function() { loaded[filename] = true });

    return function(method, model, success, error) {
        var deferred = function() { sync(method, model, success, error) };
        loaded[filename] ? deferred() : dirty.on('load', deferred);
    };
};

